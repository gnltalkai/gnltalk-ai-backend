const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

module.exports = async (req, res) => {
  const deviceId = req.body ? req.body.deviceId : null;
  if (!deviceId) return res.status(400).json({ error: "deviceId manquant" });

  const { data } = await supabase
    .from("message_counts")
    .select("*")
    .eq("device_id", deviceId)
    .single();

  if (!data || data.messages_left <= 0) {
    return res.status(403).json({ error: "Plus de messages disponibles", messagesLeft: 0 });
  }

  const { data: updated } = await supabase
    .from("message_counts")
    .update({ messages_left: data.messages_left - 1 })
    .eq("device_id", deviceId)
    .select()
    .single();

  res.json({ messagesLeft: updated.messages_left });
};
