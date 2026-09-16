const express = require('express');
const router = express.Router();

// POST /api/assistant/chat — assistant IA généraliste (répond aux questions, écrit du code,
// aide à rédiger des documents). Utilise l'API gratuite Google Gemini.
// NÉCESSITE la variable d'environnement GEMINI_API_KEY (clé gratuite à créer sur
// https://aistudio.google.com/apikey — aucune carte bancaire requise pour le niveau gratuit).
//
// Limite honnête : le niveau gratuit de Gemini impose un nombre de requêtes par minute limité
// (variable selon Google, généralement autour de 15/minute pour le modèle "flash"). Au-delà,
// l'IA renverra une erreur temporaire — c'est une limite du fournisseur, pas un bug.
// L'IA peut écrire du code dans n'importe quel langage (en tant que texte), mais ne l'exécute pas.
router.post('/chat', async (req, res) => {
  const { message, historique } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message vide' });
  }
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({
      error: 'Assistant IA non configuré : ajoute GEMINI_API_KEY dans Render → Environment (clé gratuite sur aistudio.google.com/apikey).'
    });
  }
  try {
    // Historique limité aux 10 derniers échanges pour rester dans le niveau gratuit
    const contents = [];
    if (Array.isArray(historique)) {
      for (const h of historique.slice(-10)) {
        contents.push({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: h.texte }] });
      }
    }
    contents.push({ role: 'user', parts: [{ text: message }] });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const reponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [{ text:
            "Tu es l'assistant intégré de l'application de gestion du Collège Tekoulo Centre (Guinée). " +
            "Tu aides le personnel (direction, secrétariat, comptabilité, enseignants...) pour toute question : " +
            "administration scolaire, rédaction de courriers/documents, explications, programmation, calculs. " +
            "Réponds en français, de façon claire et concise, adaptée à un usage professionnel scolaire."
          }]
        }
      })
    });
    const data = await reponse.json();
    if (!reponse.ok) {
      console.error('Erreur Gemini:', data);
      return res.status(502).json({ error: data.error?.message || 'Erreur du service IA (quota gratuit peut-être atteint, réessaie dans une minute).' });
    }
    const texte = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Pas de réponse générée.';
    res.json({ reponse: texte });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur : ' + e.message });
  }
});

module.exports = router;

