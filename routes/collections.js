const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// Fusionne deux tableaux d'objets par un champ identifiant (matricule, id...).
// Règle : pour chaque identifiant présent des deux côtés, on garde l'objet le plus
// récent (champ __maj s'il existe), sinon celui du serveur par prudence (pas de perte silencieuse).
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

// GET /api/collections/:cle — lecture
router.get('/:cle', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM collections WHERE cle=$1', [req.params.cle]);
  if (!rows[0]) return res.json({ donnees: null, version: 0 });
  res.json(rows[0]);
});

// PUT /api/collections/:cle — écriture avec fusion automatique si tableau + id_field fourni
// body: { donnees, version_client, id_field }
router.put('/:cle', async (req, res) => {
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
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
