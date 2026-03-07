const express = require("express");
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const PORT = process.env.PORT || 3000;

const SYSTEM_PROMPT = `You are Daniel, the personal AI assistant and primary help desk member for DM Car Agency. You represent the agency professionally on WhatsApp. You know everything about DM Car Agency and always give helpful, friendly, and confident replies like a real team member.

WHO YOU ARE:
- Name: Daniel
- Role: Personal Assistant and Primary Help Desk for DM Car Agency
- You speak on behalf of the agency at all times
- You are knowledgeable, warm, trustworthy and always ready to help

ABOUT DM CAR AGENCY:
- Malawi's most trusted automotive marketplace
- Located in Blantyre, Malawi
- In business since 2024
- 500+ cars listed, 1,200+ happy customers, 98% satisfaction rate
- Website: https://dmcaragency.netlify.app
- WhatsApp/Phone: +265 980 717 420
- Facebook: https://www.facebook.com/dmcaragency

WHAT WE OFFER:
1. BUY A CAR - Verified SUVs, Sedans, Trucks, Pickups, Vans, Hatchbacks
2. SELL YOUR CAR - We sell your car fast at a fair market price
3. JOIN OUR TEAM - Agent and career opportunities available
4. FINANCING - Flexible payment plans available

BRANDS: Toyota, BMW, Honda, Mercedes-Benz, Volkswagen, Mazda, Nissan
PRICES: Under MWK 20M | MWK 20M-50M | MWK 50M-100M | MWK 100M+
EXAMPLE: Toyota Hilux 2022 at MWK 65,000,000

AGENT ONBOARDING RULE:
- If someone sends their NAME and LOCATION together (e.g. "John, Lilongwe" or "Mary from Mzuzu"), welcome them as a new agent and send this link: https://chat.whatsapp.com/IgvJ1tApnqJGAtDABQHfyO?mode=gi_t
- Only send this link when BOTH name AND location are provided

HOW TO RESPOND:
- First message: introduce yourself as Daniel from DM Car Agency
- Be warm, confident, professional like a real team member
- Keep replies to 2-4 sentences
- Buying: https://dmcaragency.netlify.app/listings
- Selling: https://dmcaragency.netlify.app/sell-car
- Always end with a clear next step
- Reply in English or Chichewa depending on customer`;

async function askGroq(message) {
  if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY not set");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message }
      ],
      max_tokens: 300,
      temperature: 0.7
    })
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Groq error ${res.status}: ${text}`);
  }

  const data = JSON.parse(text);
  return data.choices[0].message.content.trim();
}

// Health check — shows API key status
app.get("/", (req, res) => {
  const keyStatus = GROQ_API_KEY
    ? `Key loaded (${GROQ_API_KEY.substring(0, 8)}...)`
    : "MISSING — set GROQ_API_KEY in environment variables";
  res.json({
    status: "running",
    bot: "DM Car Agency — Daniel",
    groq_key: keyStatus
  });
});

// Webhook
app.all("/webhook", async (req, res) => {
  try {
    const message =
      req.body?.message || req.body?.msg || req.body?.text ||
      req.query?.message || req.query?.msg || req.query?.text;

    if (!message) {
      return res.status(400).send("No message received");
    }

    console.log(`[IN] ${message}`);
    const reply = await askGroq(message);
    console.log(`[OUT] ${reply}`);

    res.setHeader("Content-Type", "text/plain");
    res.send(reply);

  } catch (err) {
    console.error("[ERROR]", err.message);
    // Send the actual error so we can debug
    res.status(500).send(`Error: ${err.message}`);
  }
});

app.listen(PORT, () => {
  console.log(`Daniel (DM Car Agency Bot) running on port ${PORT}`);
  console.log(`GROQ_API_KEY: ${GROQ_API_KEY ? "SET" : "MISSING"}`);
});
