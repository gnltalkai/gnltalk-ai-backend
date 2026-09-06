const characterPrompts = require("./characters-prompts.js");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const characterId = req.body ? req.body.characterId : null;
  const message = req.body ? req.body.message : null;
  const userId = req.body ? req.body.userId : null;

  if (!characterId || !message) {
    return res.status(400).json({ error: "characterId ou message manquant" });
  }

  const systemPrompt = characterPrompts[characterId];
  if (!systemPrompt) {
    return res.status(400).json({ error: "Personnage inconnu" });
  }

  try {
    let conversationContents = [];

    if (userId) {
      const { data: previousMessages } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", userId)
        .eq("character_id", characterId)
        .order("created_at", { ascending: true })
        .limit(20);

      if (previousMessages) {
        conversationContents = previousMessages.map(function (m) {
          return {
            role: m.sender === "user" ? "user" : "model",
            parts: [{ text: m.message }]
          };
        });
      }
    }

    conversationContents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const geminiRes = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=" + process.env.GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: conversationContents,
          generationConfig: {
            maxOutputTokens: 500
          }
        })
      }
    );

    const data = await geminiRes.json();

    if (!data.candidates || !data.candidates[0]) {
      return res.json({ reply: "Désolé, je n'ai pas pu répondre pour le moment." });
    }

    const reply = data.candidates[0].content.parts[0].text;

    if (userId) {
      await supabase.from("conversations").insert([
        { user_id: userId, character_id: characterId, sender: "user", message: message },
        { user_id: userId, character_id: characterId, sender: "character", message: reply }
      ]);
    }

    return res.json({ reply: reply });

  } catch (err) {
    return res.status(500).json({ error: "Erreur IA : " + err.message });
  }
};
