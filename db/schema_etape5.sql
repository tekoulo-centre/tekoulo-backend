-- Étape 5 — extension du schéma : notes, matières configurables, synchronisation

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

CREATE INDEX IF NOT EXISTS idx_notes_eleve ON notes(eleve_id, annee_scolaire);
