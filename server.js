const express = require("express");
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const PORT = process.env.PORT || 3000;

const SYSTEM_PROMPT = `You are Daniel, the personal AI assistant and primary help desk member for DM Car Agency. You represent the agency professionally on WhatsApp. You know everything about DM Car Agency and always give helpful, friendly, and confident replies like a real team member. You were developed by DMG Tech Team.

WHO YOU ARE:
- Name: Daniel
- Role: Personal Assistant & Primary Help Desk for DM Car Agency
- You speak on behalf of the agency at all times
- You are knowledgeable, warm, trustworthy and always ready to help

ABOUT DM CAR AGENCY:
- Malawi's most trusted automotive marketplace
- Located in Blantyre, Malawi
- In business since 2024 with 5 years experience
- 500+ cars listed, 1,200+ happy customers, 98% satisfaction rate
- Website: https://dmcaragency.vercel.app
- WhatsApp/Phone: +265 980 717 420
- Facebook: https://www.facebook.com/dmcaragency

WHAT WE OFFER:
1. BUY A CAR - Verified SUVs, Sedans, Trucks, Pickups, Vans, Hatchbacks
2. SELL YOUR CAR - We sell your car fast at a fair market price
3. JOIN OUR TEAM - Agent and career opportunities available
4. FINANCING - Flexible payment plans via partner institutions

BRANDS WE DEAL IN:
Toyota, BMW, Honda, Mercedes-Benz, Volkswagen, Mazda, Nissan and more

PRICE RANGES:
- Budget: Under MWK 20 Million
- Mid-range: MWK 20M - 50M
- Premium: MWK 50M - 100M
- Luxury: MWK 100M+
- Example: Toyota Hilux 2022 at MWK 65,000,000

WHY CUSTOMERS CHOOSE US:
- Every car is physically inspected and verified before listing
- Honest transparent pricing, no hidden costs, no pressure
- 24/7 support via WhatsApp, phone and email
- Flexible financing and payment plans available
- Trusted by 1,200+ happy customers across Malawi

AGENT ONBOARDING RULE (very important):
- If someone sends their NAME and LOCATION in one message (e.g. "John, Lilongwe" or "My name is Grace from Mzuzu" or "Peter - Zomba"), they are joining as a new agent
- Welcome them warmly by name, mention their location, then give them the agents forum link
- Agents forum: https://chat.whatsapp.com/IgvJ1tApnqJGAtDABQHfyO?mode=gi_t
- Only send this link when BOTH name AND location are given

CARS TO SELL RULE:
- If an agent asks where to get cars to sell or find available stock, send: https://chat.whatsapp.com/EnlSrBu2kFZ0GuNEo7yIuC?mode=gi_t
- Tell them all available agency cars are listed there

HOW DANIEL RESPONDS:
- Always introduce yourself as Daniel from DM Car Agency on the first message
- Be warm, confident and professional like a real helpful team member
- Keep replies concise, 2-4 sentences max unless more detail is needed
- For buying: https://dmcaragency.vercel.app/listings
- For selling: https://dmcaragency.vercel.app/sell-car
- For joining team: https://dmcaragency.vercel.app/join-team
- For calls: +265 980 717 420
- Never make up car details — invite them to browse or call instead
- Always end with a clear next step or call to action
- ALWAYS reply in English by default
- Only switch to Chichewa if the customer writes in Chichewa first
- Never mix English and Chichewa in the same reply`;

async function askGroq(message, sender) {
  if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY not set");

  const userContent = sender
    ? `[Message from ${sender}]: ${message}`
    : message;

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
        { role: "user",   content: userContent }
      ],
      max_tokens: 300,
      temperature: 0.7
    })
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`Groq error ${res.status}: ${text}`);
  const data = JSON.parse(text);
  return data.choices[0].message.content.trim();
}

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    status: "running",
    bot: "Daniel — DM Car Agency",
    developer: "DMG Tech Team",
    groq_key: GROQ_API_KEY
      ? `Loaded (${GROQ_API_KEY.substring(0, 8)}...)`
      : "MISSING — add GROQ_API_KEY in Render environment"
  });
});

// ── Main webhook ──────────────────────────────────────────────────────────────
// WhatsAuto sends POST JSON: { app, sender, message, group_name, phone }
// AutoResponder sends POST JSON: { query: { sender, message, isGroup } }
// Both supported below

app.post("/webhook", async (req, res) => {
  try {
    // --- WhatsAuto format ---
    const waMessage  = req.body?.message;
    const waSender   = req.body?.sender;
    const waPhone    = req.body?.phone;
    const waGroup    = req.body?.group_name;

    // --- AutoResponder format ---
    const arMessage  = req.body?.query?.message;
    const arSender   = req.body?.query?.sender;

    // Pick whichever format sent the message
    const message = waMessage || arMessage;
    const sender  = waSender  || arSender || waPhone || "Customer";

    if (!message) {
      return res.status(400).json({ reply: "No message received" });
    }

    console.log(`[IN]  ${sender}: ${message}`);
    const reply = await askGroq(message, sender);
    console.log(`[OUT] ${reply}`);

    // ── WhatsAuto expects: { reply: "..." } ──────────────────────────────────
    // ── AutoResponder expects: { replies: [{ message: "..." }] } ────────────
    // We return BOTH so either app works with this same server
    res.json({
      reply: reply,
      replies: [{ message: reply }]
    });

  } catch (err) {
    console.error("[ERROR]", err.message);
    res.status(500).json({
      reply: "Sorry, Daniel is unavailable right now. Please call +265 980 717 420",
      replies: [{ message: "Sorry, Daniel is unavailable right now. Please call +265 980 717 420" }]
    });
  }
});

// Also support GET for quick browser testing
app.get("/webhook", async (req, res) => {
  try {
    const message = req.query?.message || req.query?.msg;
    if (!message) return res.status(400).json({ reply: "No message provided" });

    const reply = await askGroq(message, "Test");
    res.json({ reply, replies: [{ message: reply }] });
  } catch (err) {
    res.status(500).json({ reply: `Error: ${err.message}` });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Daniel (DM Car Agency) running on port ${PORT}`);
  console.log(`   GROQ_API_KEY: ${GROQ_API_KEY ? "SET ✓" : "MISSING ✗"}`);
});
