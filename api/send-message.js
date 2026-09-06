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
