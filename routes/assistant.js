const express = require('express');
const router = express.Router();

router.post('/chat', async (req, res) => {
  const { message, historique } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message vide' });
  }
  if (!process.env.GROQ_API_KEY) {
    return res.status(503).json({
      error: 'Assistant IA non configuré : ajoute GROQ_API_KEY dans Render → Environment (clé gratuite sur console.groq.com/keys).'
    });
  }
  try {
    const messages = [{
      role: 'system',
      content: "Tu es l'assistant intégré de l'application de gestion du Collège Tekoulo Centre (Guinée). " +
        "Tu aides le personnel (direction, secrétariat, comptabilité, enseignants...) pour toute question : " +
        "administration scolaire, rédaction de courriers/documents, explications, programmation, calculs. " +
        "Réponds en français, de façon claire et concise, adaptée à un usage professionnel scolaire."
    }];
    if (Array.isArray(historique)) {
      for (const h of historique.slice(-10)) {
        messages.push({ role: h.role === 'assistant' ? 'assistant' : 'user', content: h.texte });
      }
    }
    messages.push({ role: 'user', content: message });

    const reponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.GROQ_API_KEY,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.5,
      }),
    });
    const data = await reponse.json();
    if (!reponse.ok) {
      console.error('Erreur Groq:', data);
      return res.status(502).json({ error: data.error?.message || 'Erreur du service IA (quota gratuit peut-être atteint, réessaie dans une minute).' });
    }
    const texte = data.choices?.[0]?.message?.content || 'Pas de réponse générée.';
    res.json({ reponse: texte });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur : ' + e.message });
  }
});

module.exports = router;
