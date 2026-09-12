// Tekoulo Centre — Backend API
// Point d'entrée principal
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const limiteurLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' },
});
const limiteurGeneral = rateLimit({ windowMs: 60 * 1000, max: 120 });

const authRoutes = require('./routes/auth');
const elevesRoutes = require('./routes/eleves');
const fraisRoutes = require('./routes/frais');
const notesRoutes = require('./routes/notes');
const syncRoutes = require('./routes/sync');
const collectionsRoutes = require('./routes/collections');
const utilisateursRoutes = require('./routes/utilisateurs');
const { authMiddleware } = require('./middleware/auth');

app.use('/api/auth', limiteurLogin, authRoutes);
app.use('/api/eleves', limiteurGeneral, authMiddleware, elevesRoutes);
app.use('/api/frais', limiteurGeneral, authMiddleware, fraisRoutes);
app.use('/api/notes', limiteurGeneral, authMiddleware, notesRoutes);
app.use('/api/sync', limiteurGeneral, authMiddleware, syncRoutes);
app.use('/api/collections', limiteurGeneral, authMiddleware, collectionsRoutes);
app.use('/api/utilisateurs', limiteurGeneral, authMiddleware, utilisateursRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Tekoulo API démarrée sur le port ${PORT}`));
