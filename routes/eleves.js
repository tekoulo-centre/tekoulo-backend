const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { requireRole } = require('../middleware/auth');

// GET /api/eleves?annee=2025-2026 — liste
router.get('/', async (req, res) => {
  const { annee } = req.query;
  try {
    const { rows } = await pool.query(
      annee
        ? 'SELECT * FROM eleves WHERE annee_scolaire = $1 ORDER BY nom, prenom'
        : 'SELECT * FROM eleves ORDER BY nom, prenom',
      annee ? [annee] : []
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/eleves — création
router.post('/', requireRole('direction', 'secretariat'), async (req, res) => {
  const { matricule, nom, prenom, sexe, classe_id, annee_scolaire } = req.body;
  try {
    const annee = await pool.query('SELECT statut FROM annees_scolaires WHERE code=$1', [annee_scolaire]);
    if (annee.rows[0] && annee.rows[0].statut !== 'active') {
      return res.status(423).json({ error: 'Année scolaire clôturée : lecture seule' });
    }
    const { rows } = await pool.query(
      `INSERT INTO eleves (matricule, nom, prenom, sexe, classe_id, annee_scolaire)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [matricule, nom, prenom, sexe, classe_id, annee_scolaire]
    );
    await pool.query(
      `INSERT INTO audit_log (utilisateur_id, action, objet, objet_id, nouvelle_valeur)
       VALUES ($1,'creation','eleve',$2,$3)`,
      [req.user.id, rows[0].id, JSON.stringify(rows[0])]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Matricule déjà utilisé' });
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/eleves/:id — modification avec détection de conflit par version
router.put('/:id', requireRole('direction', 'secretariat'), async (req, res) => {
  const { id } = req.params;
  const { version, ...champs } = req.body;
  try {
    const current = await pool.query('SELECT * FROM eleves WHERE id=$1', [id]);
    if (!current.rows[0]) return res.status(404).json({ error: 'Élève introuvable' });
    if (version !== undefined && current.rows[0].version !== version) {
      return res.status(409).json({
        error: 'Conflit : cet élève a été modifié entretemps par un autre utilisateur',
        version_serveur: current.rows[0],
      });
    }
    const { rows } = await pool.query(
      `UPDATE eleves SET nom=$1, prenom=$2, sexe=$3, classe_id=$4, version=version+1, updated_at=now()
       WHERE id=$5 RETURNING *`,
      [champs.nom, champs.prenom, champs.sexe, champs.classe_id, id]
    );
    await pool.query(
      `INSERT INTO audit_log (utilisateur_id, action, objet, objet_id, ancienne_valeur, nouvelle_valeur)
       VALUES ($1,'modification','eleve',$2,$3,$4)`,
      [req.user.id, id, JSON.stringify(current.rows[0]), JSON.stringify(rows[0])]
    );
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
