const express = require("express");
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── CONFIG ──────────────────────────────────────────────────────────────────
const GROQ_API_KEY = process.env.GROQ_API_KEY || "YOUR_GROQ_API_KEY_HERE";
const GROQ_MODEL   = process.env.GROQ_MODEL   || "llama3-8b-8192";
const SYSTEM_PROMPT = process.env.SYSTEM_PROMPT ||
  "You are a helpful WhatsApp assistant. Reply concisely and naturally, like a real person texting. Keep replies short (1-3 sentences) unless the question needs detail.";
const PORT = process.env.PORT || 3000;
// ────────────────────────────────────────────────────────────────────────────

async function askGroq(userMessage) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: userMessage   },
      ],
      max_tokens: 300,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Groq WhatsApp Bot is running 🤖" });
});

// ── Main webhook ─────────────────────────────────────────────────────────────
// AutoResponder for WA sends:  POST /webhook  with body: { message: "..." }
// or as query param:           GET  /webhook?message=hello
// Both are supported below.

app.all("/webhook", async (req, res) => {
  try {
    // Accept message from body (JSON or form) or query string
    const incoming =
      req.body?.message ||
      req.body?.msg     ||
      req.body?.text    ||
      req.query?.message ||
      req.query?.msg    ||
      req.query?.text;

    if (!incoming) {
      return res.status(400).json({ error: "No message provided" });
    }

    console.log(`[IN]  ${incoming}`);
    const reply = await askGroq(incoming);
    console.log(`[OUT] ${reply}`);

    // AutoResponder expects plain text response
    res.setHeader("Content-Type", "text/plain");
    res.send(reply);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send("Sorry, I couldn't process that right now.");
  }
});

app.listen(PORT, () => {
  console.log(`✅ Groq WhatsApp Bot running on port ${PORT}`);
  console.log(`   Webhook URL: http://localhost:${PORT}/webhook`);
});
