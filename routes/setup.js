const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const pool = require('../db/pool');

router.post('/initialiser-base', async (req, res) => {
  const { secret } = req.body;
  if (!secret || secret !== process.env.SETUP_SECRET) {
    return res.status(403).json({ error: 'Secret de démarrage incorrect' });
  }
  const fichiers = ['schema.sql', 'schema_etape5.sql', 'schema_etape6.sql'];
  const resultats = [];
  try {
    for (const nom of fichiers) {
      const cheminFichier = path.join(__dirname, '..', 'db', nom);
      if (!fs.existsSync(cheminFichier)) { resultats.push(`${nom} : introuvable, ignoré`); continue; }
      const sql = fs.readFileSync(cheminFichier, 'utf8');
      await pool.query(sql);
      resultats.push(`${nom} : exécuté avec succès`);
    }
    res.json({ ok: true, resultats });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur SQL : ' + e.message, resultats });
  }
});

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

// POST /api/setup/reinitialiser-admin — dépannage : (re)crée ou réinitialise le mot de passe
// d'un compte chef_etablissement, protégé uniquement par SETUP_SECRET. Utile si le premier
// mot de passe a été mal saisi/oublié. À utiliser seulement pendant la mise en route.
router.post('/reinitialiser-admin', async (req, res) => {
  const { nom_utilisateur, mot_de_passe, secret } = req.body;
  if (!secret || secret !== process.env.SETUP_SECRET) {
    return res.status(403).json({ error: 'Secret de démarrage incorrect' });
  }
  if (!nom_utilisateur || !mot_de_passe || mot_de_passe.length < 6) {
    return res.status(400).json({ error: 'Identifiant et mot de passe (6 caractères min.) requis' });
  }
  try {
    const hash = await bcrypt.hash(mot_de_passe, 10);
    const { rows } = await pool.query(
      `INSERT INTO utilisateurs (nom_utilisateur, mot_de_passe_hash, role, actif)
       VALUES ($1,$2,'chef_etablissement', TRUE)
       ON CONFLICT (nom_utilisateur) DO UPDATE SET mot_de_passe_hash=$2, actif=TRUE
       RETURNING id, nom_utilisateur, role`,
      [nom_utilisateur, hash]
    );
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
