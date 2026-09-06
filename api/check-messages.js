const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

module.exports = async (req, res) => {res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  const deviceId = req.body ? req.body.deviceId : null;
  if (!deviceId) return res.status(400).json({ error: "deviceId manquant" });

  let { data } = await supabase
    .from("message_counts")
    .select("*")
    .eq("device_id", deviceId)
    .single();

  if (!data) {
    const { data: newRow } = await supabase
      .from("message_counts")
      .insert({ device_id: deviceId, messages_left: 20 })
      .select()
      .single();
    data = newRow;
  }

  res.json({ messagesLeft: data.messages_left });
};
