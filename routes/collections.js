const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { requireRole } = require('../middleware/auth');

function fusionnerTableaux(serveur, client, idField) {
  if (!Array.isArray(serveur) || !Array.isArray(client)) return client;
  const parId = new Map();
  for (const item of serveur) parId.set(item[idField], item);
  for (const item of client) {
    const existant = parId.get(item[idField]);
    if (!existant) { parId.set(item[idField], item); continue; }
    const majClient = item.__maj ? new Date(item.__maj).getTime() : 0;
    const majServeur = existant.__maj ? new Date(existant.__maj).getTime() : 0;
    parId.set(item[idField], majClient >= majServeur ? item : existant);
  }
  return Array.from(parId.values());
}

router.get('/:cle', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM collections WHERE cle=$1', [req.params.cle]);
  if (!rows[0]) return res.json({ donnees: null, version: 0 });
  res.json(rows[0]);
});

router.put('/:cle', requireRole('direction', 'secretariat', 'comptabilite', 'enseignant'), async (req, res) => {
  const { donnees, id_field } = req.body;
  try {
    const actuel = await pool.query('SELECT * FROM collections WHERE cle=$1', [req.params.cle]);
    let donneesFinales = donnees;
    if (actuel.rows[0] && id_field && Array.isArray(donnees)) {
      donneesFinales = fusionnerTableaux(actuel.rows[0].donnees, donnees, id_field);
    }
    const { rows } = await pool.query(
      `INSERT INTO collections (cle, donnees, version, updated_at) VALUES ($1,$2,1,now())
       ON CONFLICT (cle) DO UPDATE SET donnees=$2, version=collections.version+1, updated_at=now()
       RETURNING *`,
      [req.params.cle, JSON.stringify(donneesFinales)]
    );
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
