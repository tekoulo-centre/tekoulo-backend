const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../db/pool');
const { requireRole } = require('../middleware/auth');

// GET /api/utilisateurs — liste (direction uniquement)
router.get('/', requireRole('direction'), async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, nom_utilisateur, role, actif, created_at FROM utilisateurs ORDER BY created_at'
  );
  res.json(rows);
});

// POST /api/utilisateurs — création d'un compte (direction uniquement)
// Rôles possibles : direction, secretariat, comptabilite, enseignant, consultation
router.post('/', requireRole('direction'), async (req, res) => {
  const { nom_utilisateur, mot_de_passe, role } = req.body;
  const rolesValides = ['direction', 'secretariat', 'comptabilite', 'enseignant', 'consultation'];
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

// PUT /api/utilisateurs/:id/desactiver — révocation d'accès (départ d'un employé)
router.put('/:id/desactiver', requireRole('direction'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE utilisateurs SET actif=FALSE WHERE id=$1 RETURNING id, nom_utilisateur, role, actif',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
