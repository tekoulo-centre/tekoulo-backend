// Tekoulo Centre — Backend API
// Point d'entrée principal
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const app = express();

app.use(helmet({ contentSecurityPolicy: false })); // CSP désactivée pour laisser fonctionner la page admin.html
app.use(cors());
app.use(express.json({ limit: '10mb' })); // 10mb pour les photos en base64 pendant la migration
app.use(express.static(path.join(__dirname, 'public'))); // sert public/admin.html sur /admin.html

// Limite les tentatives de connexion (protection brute-force sur le mot de passe) — étape 9
const limiteurLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' },
});
// Limite générale anti-abus sur le reste de l'API
const limiteurGeneral = rateLimit({ windowMs: 60 * 1000, max: 120 });

const authRoutes = require('./routes/auth');
const elevesRoutes = require('./routes/eleves');
const fraisRoutes = require('./routes/frais');
const notesRoutes = require('./routes/notes');
const syncRoutes = require('./routes/sync');
const collectionsRoutes = require('./routes/collections');
const utilisateursRoutes = require('./routes/utilisateurs');
const setupRoutes = require('./routes/setup');
const assistantRoutes = require('./routes/assistant');
const { authMiddleware } = require('./middleware/auth');

app.use('/api/auth', limiteurLogin, authRoutes);
app.use('/api/eleves', limiteurGeneral, authMiddleware, elevesRoutes);
app.use('/api/frais', limiteurGeneral, authMiddleware, fraisRoutes);
app.use('/api/notes', limiteurGeneral, authMiddleware, notesRoutes);
app.use('/api/sync', limiteurGeneral, authMiddleware, syncRoutes);
app.use('/api/collections', limiteurGeneral, authMiddleware, collectionsRoutes);
app.use('/api/utilisateurs', limiteurGeneral, authMiddleware, utilisateursRoutes);
app.use('/api/setup', limiteurLogin, setupRoutes);
// Limite dédiée à l'assistant IA (plus stricte : évite d'épuiser le quota gratuit Gemini trop vite)
const limiteurAssistant = rateLimit({ windowMs: 60 * 1000, max: 12 });
app.use('/api/assistant', limiteurAssistant, authMiddleware, assistantRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Tekoulo API démarrée sur le port ${PORT}`));
