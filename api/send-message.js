const characterPrompts = require("./characters-prompts.js");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { characterId, message } = req.body || {};

  if (!characterId || !message) {
    return res.status(400).json({ error: "characterId ou message manquant" });
  }

  const systemPrompt = characterPrompts[characterId];
  if (!systemPrompt) {
    return res.status(400).json({ error: "Personnage inconnu" });
  }

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: [
            {
              role: "user",
              parts: [{ text: message }]
            }
          ],
          generationConfig: {
            maxOutputTokens: 120
          }
        })
      }
    );

    const data = await geminiRes.json();

    if (!data.candidates || !data.candidates[0]) {
      return res.json({ reply: "Désolé, je n'ai pas pu répondre pour le moment." });
    }

    const reply = data.candidates[0].content.parts[0].text;

    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: "Erreur IA : " + err.message });
  }
};
