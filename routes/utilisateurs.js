const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../db/pool');
const { requireRole } = require('../middleware/auth');

// GET /api/utilisateurs — liste (chef d'établissement uniquement)
router.get('/', requireRole('chef_etablissement'), async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, nom_utilisateur, role, actif, created_at FROM utilisateurs ORDER BY created_at'
  );
  res.json(rows);
});

// POST /api/utilisateurs — création d'un compte (chef d'établissement uniquement)
router.post('/', requireRole('chef_etablissement'), async (req, res) => {
  const { nom_utilisateur, mot_de_passe, role } = req.body;
  const rolesValides = ['chef_etablissement', 'directeur_etudes', 'comptable', 'charge_orientation', 'enseignant', 'secretaire', 'bibliothecaire', 'surveillant_general'];
  if (!nom_utilisateur || !mot_de_passe || !rolesValides.includes(role)) {
    return res.status(400).json({ error: 'Champs invalides' });
  }
  try {
    const hash = await bcrypt.hash(mot_de_passe, 10);
    const { rows } = await pool.query(
      `INSERT INTO utilisateurs (nom_utilisateur, mot_de_passe_hash, role)
       VALUES ($1,$2,$3) RETURNING id, nom_utilisateur, role, actif`,
      [nom_utilisateur, hash, role]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Ce nom d\u2019utilisateur existe déjà' });
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/utilisateurs/:id/desactiver — révocation d'accès
router.put('/:id/desactiver', requireRole('chef_etablissement'), async (req, res) => {
  const { rows } = await pool.query(
    'UPDATE utilisateurs SET actif=FALSE WHERE id=$1 RETURNING id, nom_utilisateur, actif',
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable' });
  res.json(rows[0]);
});

// PUT /api/utilisateurs/:id/mot-de-passe — réinitialisation par la direction
router.put('/:id/mot-de-passe', requireRole('chef_etablissement'), async (req, res) => {
  const { nouveau_mot_de_passe } = req.body;
  if (!nouveau_mot_de_passe || nouveau_mot_de_passe.length < 6) {
    return res.status(400).json({ error: 'Mot de passe trop court (6 caractères minimum)' });
  }
  const hash = await bcrypt.hash(nouveau_mot_de_passe, 10);
  const { rows } = await pool.query(
    'UPDATE utilisateurs SET mot_de_passe_hash=$1 WHERE id=$2 RETURNING id, nom_utilisateur',
    [hash, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable' });
  res.json({ ok: true });
});

module.exports = router;
