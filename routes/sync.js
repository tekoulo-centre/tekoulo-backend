const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// POST /api/sync/push — un appareil pousse ses opérations faites hors-ligne
router.post('/push', async (req, res) => {
  const { operations } = req.body;
  if (!Array.isArray(operations)) return res.status(400).json({ error: 'Format invalide' });

  const resultats = [];
  for (const op of operations) {
    try {
      const deja = await pool.query('SELECT * FROM sync_operations WHERE client_op_id=$1', [op.client_op_id]);
      if (deja.rows[0]) {
        resultats.push({ client_op_id: op.client_op_id, statut: 'deja_appliquee' });
        continue;
      }

      let statut = 'appliquee';
      let donneesServeur = null;

      if (op.entite === 'note' && op.operation === 'modification') {
        const actuelle = await pool.query('SELECT * FROM notes WHERE id=$1', [op.entite_id]);
        if (actuelle.rows[0] && op.version_client && actuelle.rows[0].version !== op.version_client) {
          statut = 'conflit';
          donneesServeur = actuelle.rows[0];
        } else {
          await pool.query(
            'UPDATE notes SET valeur=$1, version=version+1, updated_at=now() WHERE id=$2',
            [op.donnees.valeur, op.entite_id]
          );
        }
      }

      await pool.query(
        `INSERT INTO sync_operations (client_op_id, utilisateur_id, entite, entite_id, operation, donnees, version_client, statut)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [op.client_op_id, req.user?.id || null, op.entite, op.entite_id, op.operation, op.donnees, op.version_client, statut]
      );

      resultats.push({ client_op_id: op.client_op_id, statut, donnees_serveur: donneesServeur });
    } catch (e) {
      console.error(e);
      resultats.push({ client_op_id: op.client_op_id, statut: 'rejetee', erreur: 'Erreur serveur' });
    }
  }
  res.json({ resultats });
});

// GET /api/sync/pull?depuis=ISO_TIMESTAMP&annee=... — récupère les changements d'autres appareils
router.get('/pull', async (req, res) => {
  const { depuis, annee } = req.query;
  try {
    const eleves = await pool.query(
      'SELECT * FROM eleves WHERE updated_at > $1 AND annee_scolaire=$2',
      [depuis || '1970-01-01', annee]
    );
    const notes = await pool.query(
      'SELECT * FROM notes WHERE updated_at > $1 AND annee_scolaire=$2',
      [depuis || '1970-01-01', annee]
    );
    res.json({ eleves: eleves.rows, notes: notes.rows, horodatage_serveur: new Date().toISOString() });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
