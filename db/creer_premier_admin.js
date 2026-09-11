// Exécuter une seule fois après le déploiement : node db/creer_premier_admin.js <nom_utilisateur> <mot_de_passe>
// Crée le tout premier compte "direction" pour pouvoir ensuite créer les autres depuis l'application.
require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('./pool');

async function main() {
  const nom_utilisateur = process.argv[2] || 'direction';
  const mot_de_passe = process.argv[3];
  if (!mot_de_passe) {
    console.error('Utilisation : node db/creer_premier_admin.js <nom_utilisateur> <mot_de_passe>');
    process.exit(1);
  }
  const hash = await bcrypt.hash(mot_de_passe, 10);
  await pool.query(
    `INSERT INTO utilisateurs (nom_utilisateur, mot_de_passe_hash, role)
     VALUES ($1,$2,'direction')
     ON CONFLICT (nom_utilisateur) DO UPDATE SET mot_de_passe_hash=$2`,
    [nom_utilisateur, hash]
  );
  console.log(`Compte "${nom_utilisateur}" (rôle direction) créé/mis à jour.`);
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
