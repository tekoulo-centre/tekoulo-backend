-- Étape 6 — stockage générique compatible avec les clés actuelles du fichier HTML
CREATE TABLE IF NOT EXISTS collections (
  cle TEXT PRIMARY KEY,
  donnees JSONB NOT NULL,
  version INTEGER DEFAULT 1,
  updated_at TIMESTAMP DEFAULT now()
);
