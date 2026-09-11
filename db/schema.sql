-- Tekoulo Centre — Schéma de base (source de vérité unique)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS annees_scolaires (
  code TEXT PRIMARY KEY,
  statut TEXT NOT NULL CHECK (statut IN ('active','cloturee','archivee')) DEFAULT 'active',
  cloturee_le TIMESTAMP
);

CREATE TABLE IF NOT EXISTS utilisateurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom_utilisateur TEXT UNIQUE NOT NULL,
  mot_de_passe_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('direction','secretariat','comptabilite','enseignant','consultation')),
  actif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  annee_scolaire TEXT REFERENCES annees_scolaires(code)
);

CREATE TABLE IF NOT EXISTS eleves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matricule TEXT UNIQUE NOT NULL,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  sexe TEXT,
  classe_id UUID REFERENCES classes(id),
  annee_scolaire TEXT REFERENCES annees_scolaires(code),
  actif BOOLEAN DEFAULT TRUE,
  photo_url TEXT,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS frais_scolarite (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id UUID REFERENCES eleves(id) ON DELETE CASCADE,
  annee_scolaire TEXT REFERENCES annees_scolaires(code),
  montant_annuel NUMERIC NOT NULL,
  nb_mois INTEGER NOT NULL,
  exoneration NUMERIC DEFAULT 0,
  version INTEGER DEFAULT 1,
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(eleve_id, annee_scolaire)
);

CREATE TABLE IF NOT EXISTS paiements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  frais_id UUID REFERENCES frais_scolarite(id) ON DELETE CASCADE,
  date_paiement DATE NOT NULL DEFAULT CURRENT_DATE,
  mois_couvert TEXT,
  montant NUMERIC NOT NULL,
  mode_paiement TEXT,
  numero_recu TEXT,
  caissier_id UUID REFERENCES utilisateurs(id),
  observation TEXT,
  annule BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  utilisateur_id UUID REFERENCES utilisateurs(id),
  action TEXT NOT NULL,
  objet TEXT,
  objet_id UUID,
  ancienne_valeur JSONB,
  nouvelle_valeur JSONB,
  created_at TIMESTAMP DEFAULT now()
);

-- Matières/coefficients configurables par année
CREATE TABLE IF NOT EXISTS matieres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  annee_scolaire TEXT REFERENCES annees_scolaires(code),
  nom TEXT NOT NULL,
  coefficient NUMERIC NOT NULL,
  actif BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id UUID REFERENCES eleves(id) ON DELETE CASCADE,
  matiere_id UUID REFERENCES matieres(id),
  annee_scolaire TEXT REFERENCES annees_scolaires(code),
  semestre INTEGER NOT NULL CHECK (semestre IN (1,2)),
  valeur NUMERIC CHECK (valeur >= 0 AND valeur <= 20),
  verrouille BOOLEAN DEFAULT FALSE,
  version INTEGER DEFAULT 1,
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(eleve_id, matiere_id, annee_scolaire, semestre)
);

-- File de synchronisation hors-ligne
CREATE TABLE IF NOT EXISTS sync_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_op_id TEXT NOT NULL,
  utilisateur_id UUID REFERENCES utilisateurs(id),
  entite TEXT NOT NULL,
  entite_id UUID,
  operation TEXT NOT NULL CHECK (operation IN ('creation','modification','suppression')),
  donnees JSONB,
  version_client INTEGER,
  statut TEXT DEFAULT 'appliquee' CHECK (statut IN ('appliquee','conflit','rejetee')),
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(client_op_id)
);

-- Magasin clé-valeur générique, pont avec le frontend HTML existant
-- (clés du type 'eleves__2025-2026', 'notes__2025-2026', 'parametres', 'years'...)
CREATE TABLE IF NOT EXISTS collections (
  cle TEXT PRIMARY KEY,
  donnees JSONB NOT NULL,
  version INTEGER DEFAULT 1,
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eleves_annee ON eleves(annee_scolaire);
CREATE INDEX IF NOT EXISTS idx_frais_eleve ON frais_scolarite(eleve_id);
CREATE INDEX IF NOT EXISTS idx_paiements_frais ON paiements(frais_id);
CREATE INDEX IF NOT EXISTS idx_notes_eleve ON notes(eleve_id, annee_scolaire);
