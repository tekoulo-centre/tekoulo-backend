// Tekoulo Centre — Backend API
// Point d'entrée principal
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const pool = require('./db/pool');
const bcrypt = require('bcrypt');
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

app.use('/a
