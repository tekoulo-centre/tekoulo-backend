const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { requireRole } = require('../middleware/auth');

// GET /api/notes/matieres?annee=2025-2026 — matières configurables
router.get('/matieres', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM matieres WHERE annee_scolaire=$1 AND actif=TRUE ORDER BY nom',
    [req.query.annee]
  );
  res.json(rows);
});

router.post('/matieres', requireRole('direction'), async (req, res) => {
  const { nom, coefficient, annee_scolaire } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO matieres (nom, coefficient, annee_scolaire) VALUES ($1,$2,$3) RETURNING *',
    [nom, coefficient, annee_scolaire]
  );
  res.status(201).json(rows[0]);
});

// POST /api/notes — enregistrer/mettre à jour une note (verrouillage si clôturée)
router.post('/', requireRole('direction', 'enseignant'), async (req, res) => {
  const { eleve_id, matiere_id, annee_scolaire, semestre, valeur } = req.body;
  try {
    const existante = await pool.query(
      'SELECT * FROM notes WHERE eleve_id=$1 AND matiere_id=$2 AND annee_scolaire=$3 AND semestre=$4',
      [eleve_id, matiere_id, annee_scolaire, semestre]
    );
    if (existante.rows[0] && existante.rows[0].verrouille) {
      return res.status(423).json({ error: 'Note verrouillée : la période est clôturée' });
    }
    const { rows } = await pool.query(
      `INSERT INTO notes (eleve_id, matiere_id, annee_scolaire, semestre, valeur)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (eleve_id, matiere_id, annee_scolaire, semestre)
       DO UPDATE SET valeur=$5, version=notes.version+1, updated_at=now()
       RETURNING *`,
      [eleve_id, matiere_id, annee_scolaire, semestre, valeur]
    );
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/notes/verrouiller — clôture officielle d'un semestre
router.post('/verrouiller', requireRole('direction'), async (req, res) => {
  const { annee_scolaire, semestre } = req.body;
  await pool.query(
    'UPDATE notes SET verrouille=TRUE WHERE annee_scolaire=$1 AND semestre=$2',
    [annee_scolaire, semestre]
  );
  res.json({ ok: true });
});

// GET /api/notes/bulletin/:eleve_id — moyenne + rang
// Règle : une matière NON saisie est EXCLUE du calcul (ne compte pas comme 0).
router.get('/bulletin/:eleve_id', async (req, res) => {
  const { annee, semestre } = req.query;
  try {
    const notesRes = await pool.query(
      `SELECT n.valeur, m.coefficient FROM notes n
       JOIN matieres m ON m.id = n.matiere_id
       WHERE n.eleve_id=$1 AND n.annee_scolaire=$2 AND n.semestre=$3 AND n.valeur IS NOT NULL`,
      [req.params.eleve_id, annee, semestre]
    );
    if (notesRes.rows.length === 0) {
      return res.json({ moyenne: null, coefficient_total_saisi: 0, matieres_manquantes: true });
    }
    let somme = 0, coefTotal = 0;
    for (const n of notesRes.rows) {
      somme += Number(n.valeur) * Number(n.coefficient);
      coefTotal += Number(n.coefficient);
    }
    const moyenne = Math.round((somme / coefTotal) * 100) / 100;
    res.json({ moyenne, coefficient_total_saisi: coefTotal, matieres_saisies: notesRes.rows.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/notes/classement?annee=&semestre=&classe_id= — rangs avec ex-aequo gérés
router.get('/classement', async (req, res) => {
  const { annee, semestre, classe_id } = req.query;
  try {
    const eleves = await pool.query(
      'SELECT id, nom, prenom FROM eleves WHERE classe_id=$1 AND annee_scolaire=$2 AND actif=TRUE',
      [classe_id, annee]
    );
    const moyennes = [];
    for (const e of eleves.rows) {
      const notesRes = await pool.query(
        `SELECT n.valeur, m.coefficient FROM notes n
         JOIN matieres m ON m.id = n.matiere_id
         WHERE n.eleve_id=$1 AND n.annee_scolaire=$2 AND n.semestre=$3 AND n.valeur IS NOT NULL`,
        [e.id, annee, semestre]
      );
      if (notesRes.rows.length === 0) { moyennes.push({ ...e, moyenne: null }); continue; }
      let somme = 0, coefTotal = 0;
      for (const n of notesRes.rows) { somme += Number(n.valeur) * Number(n.coefficient); coefTotal += Number(n.coefficient); }
      moyennes.push({ ...e, moyenne: Math.round((somme / coefTotal) * 100) / 100 });
    }
    const classes = moyennes.filter(m => m.moyenne !== null).sort((a, b) => b.moyenne - a.moyenne);
    const sansNote = moyennes.filter(m => m.moyenne === null);
    const resultats = [];
    for (let i = 0; i < classes.length; i++) {
      if (i > 0 && classes[i].moyenne === classes[i - 1].moyenne) {
        resultats.push({ ...classes[i], rang: resultats[i - 1].rang });
      } else {
        resultats.push({ ...classes[i], rang: i + 1 });
      }
    }
    res.json([...resultats, ...sansNote.map(s => ({ ...s, rang: null }))]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
