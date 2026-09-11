const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { nom_utilisateur, mot_de_passe } = req.body;
  if (!nom_utilisateur || !mot_de_passe) {
    return res.status(400).json({ error: 'Identifiants manquants' });
  }
  try {
    const { rows } = await pool.query(
      'SELECT * FROM utilisateurs WHERE nom_utilisateur = $1 AND actif = TRUE',
      [nom_utilisateur]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Identifiants incorrects' });

    const ok = await bcrypt.compare(mot_de_passe, user.mot_de_passe_hash);
    if (!ok) return res.status(401).json({ error: 'Identifiants incorrects' });

    const token = jwt.sign(
      { id: user.id, nom_utilisateur: user.nom_utilisateur, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({ token, role: user.role, nom_utilisateur: user.nom_utilisateur });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
