const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../db/pool');

router.post('/premier-compte', async (req, res) => {
  const { nom_utilisateur, mot_de_passe, secret } = req.body;
  if (!secret || secret !== process.env.SETUP_SECRET) {
    return res.status(403).json({ error: 'Secret de démarrage incorrect' });
  }
  try {
    const existant = await pool.query('SELECT COUNT(*) FROM utilisateurs');
    if (Number(existant.rows[0].count) > 0) {
      return res.status(403).json({ error: 'Un compte existe déjà — cette route ne sert qu\u2019une seule fois' });
    }
    if (!nom_utilisateur || !mot_de_passe || mot_de_passe.length < 6) {
      return res.status(400).json({ error: 'Identifiant et mot de passe (6 caractères min.) requis' });
    }
    const hash = await bcrypt.hash(mot_de_passe, 10);
    const { rows } = await pool.query(
      `INSERT INTO utilisateurs (nom_utilisateur, mot_de_passe_hash, role)
       VALUES ($1,$2,'chef_etablissement') RETURNING id, nom_utilisateur, role`,
      [nom_utilisateur, hash]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
