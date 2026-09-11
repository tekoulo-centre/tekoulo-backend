const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { requireRole } = require('../middleware/auth');

// GET /api/frais/:eleve_id — situation financière + historique complet des paiements
router.get('/:eleve_id', async (req, res) => {
  try {
    const frais = await pool.query(
      'SELECT * FROM frais_scolarite WHERE eleve_id=$1 ORDER BY annee_scolaire DESC',
      [req.params.eleve_id]
    );
    const result = [];
    for (const f of frais.rows) {
      const paiements = await pool.query(
        'SELECT * FROM paiements WHERE frais_id=$1 AND annule=FALSE ORDER BY date_paiement',
        [f.id]
      );
      const total_paye = paiements.rows.reduce((s, p) => s + Number(p.montant), 0);
      const attendu = Number(f.montant_annuel) - Number(f.exoneration);
      result.push({
        ...f,
        paiements: paiements.rows,
        total_paye,
        montant_attendu: attendu,
        reste: Math.max(0, attendu - total_paye),
        trop_percu: Math.max(0, total_paye - attendu),
      });
    }
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/frais/:frais_id/paiements — enregistrer un paiement
router.post('/:frais_id/paiements', requireRole('direction', 'comptabilite'), async (req, res) => {
  const { montant, date_paiement, mois_couvert, mode_paiement, numero_recu, observation } = req.body;
  if (!montant || Number(montant) <= 0) {
    return res.status(400).json({ error: 'Montant invalide' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO paiements (frais_id, montant, date_paiement, mois_couvert, mode_paiement, numero_recu, observation, caissier_id)
       VALUES ($1,$2,COALESCE($3, CURRENT_DATE),$4,$5,$6,$7,$8) RETURNING *`,
      [req.params.frais_id, montant, date_paiement, mois_couvert, mode_paiement, numero_recu, observation, req.user.id]
    );
    await pool.query(
      `INSERT INTO audit_log (utilisateur_id, action, objet, objet_id, nouvelle_valeur)
       VALUES ($1,'paiement','paiement',$2,$3)`,
      [req.user.id, rows[0].id, JSON.stringify(rows[0])]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/frais/paiements/:id/annuler — annulation tracée au lieu de suppression
router.post('/paiements/:id/annuler', requireRole('direction', 'comptabilite'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE paiements SET annule=TRUE WHERE id=$1 RETURNING *',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Paiement introuvable' });
    await pool.query(
      `INSERT INTO audit_log (utilisateur_id, action, objet, objet_id, ancienne_valeur)
       VALUES ($1,'annulation','paiement',$2,$3)`,
      [req.user.id, rows[0].id, JSON.stringify(rows[0])]
    );
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Calcul du montant attendu réparti par tranches
function calculerTranches(montant_annuel, nb_mois) {
  if (!nb_mois || nb_mois <= 0) return [];
  const mensualite = montant_annuel / nb_mois;
  const premiereTranche = Math.min(6, nb_mois);
  return [
    { tranche: 1, montant: Math.round(mensualite * premiereTranche * 100) / 100 },
    { tranche: 2, montant: Math.round(mensualite * (nb_mois - premiereTranche) * 100) / 100 },
  ];
}

module.exports = router;
