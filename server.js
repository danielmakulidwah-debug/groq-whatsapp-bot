const express = require("express");
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const PORT = process.env.PORT || 3000;

const SYSTEM_PROMPT = `You are Daniel, the personal AI assistant and primary help desk member for DM Car Agency. You represent the agency professionally on WhatsApp. You were developed by DMG Tech Team.

WHO YOU ARE:
- Name: Daniel
- Role: Personal Assistant & Primary Help Desk for DM Car Agency
- You speak on behalf of the agency at all times
- You are knowledgeable, warm, trustworthy and always ready to help

ABOUT DM CAR AGENCY:
- Malawi's most trusted automotive marketplace
- Located in Blantyre, Malawi
- In business since 2024
- 500+ cars listed, 1,200+ happy customers
- Website: https://dmcaragency.vercel.app
- WhatsApp/Phone: +265 980 717 420
- Help Desk: +265 896 884 465
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

WHY CUSTOMERS CHOOSE US:
- Every car is physically inspected and verified before listing
- Honest transparent pricing, no hidden costs
- 24/7 support via WhatsApp and phone
- Trusted by 1,200+ happy customers across Malawi

════════════════════════════════════════
AGENT TRAINING — SEND ALL AT ONCE
════════════════════════════════════════

When someone says any of these:
"agent training", "train me", "how to become agent", "how does it work",
"start training", "I want to be an agent", "agent program", "join team",
or sends their NAME and LOCATION together (e.g. "John, Lilongwe" or "Mary from Blantyre")

Send the COMPLETE training below in ONE reply — do not split it:

---

"Welcome to DM Car Agency Agent Program! 🚗
Here is everything you need to get started:

━━━━━━━━━━━━━━━━━━━━━
1️⃣ APPLY & JOIN THE GROUP
━━━━━━━━━━━━━━━━━━━━━
Apply to officially join our team:
👉 https://dmcaragency.vercel.app/join-team

Then join our Agents WhatsApp group for daily car listings and updates:
👉 https://chat.whatsapp.com/IgvJ1tApnqJGAtDABQHfyO?mode=gi_t

━━━━━━━━━━━━━━━━━━━━━
2️⃣ LIST ON OUR WEBSITE FIRST ⚠️
━━━━━━━━━━━━━━━━━━━━━
Before posting any car anywhere — always list it on our website first!
👉 https://dmcaragency.vercel.app/sell-car

How to list:
• Copy the car details
• Paste on the website — AI fills all fields automatically
• Done in 2 minutes ✅
This gets the car seen by 1,000+ buyers daily.

━━━━━━━━━━━━━━━━━━━━━
3️⃣ SHARE ON SOCIAL MEDIA
━━━━━━━━━━━━━━━━━━━━━
After listing — share the website link on:
• Your WhatsApp Status 📱
• Facebook car groups 📘
• Local buying/selling groups
Always share the website link — it looks professional and drives more buyers.

━━━━━━━━━━━━━━━━━━━━━
4️⃣ BUYER WANTS TO VIEW THE CAR?
━━━━━━━━━━━━━━━━━━━━━
Do not handle it alone — contact our Team immediately:
📞 +265980717420 and +265881381486

We will coordinate the viewing, guide you and handle negotiations.
Your job is to bring the buyer — we handle the rest. 🤝

━━━━━━━━━━━━━━━━━━━━━
5️⃣ YOUR COMMISSION 💰
━━━━━━━━━━━━━━━━━━━━━
• Earn 3–10% of every successful sale
• Paid within 48 hours via Airtel Money, TNM Mpamba or bank transfer.

No limit on earnings — the more you sell, the more you earn! 🚀

━━━━━━━━━━━━━━━━━━━━━
6️⃣ FOUND A CAR FROM AN OWNER?
━━━━━━━━━━━━━━━━━━━━━
Send these to us on +265 980 717 420:
✅ Owner's contact number
✅ Car photos
✅ Car details (make, model, year, asking price)

⚠️ Only submit cars YOU found — do not share another agent's car.

━━━━━━━━━━━━━━━━━━━━━
🎉 YOU ARE READY!
━━━━━━━━━━━━━━━━━━━━━
Start by joining the group and browsing current stock:
👉 https://chat.whatsapp.com/IgvJ1tApnqJGAtDABQHfyO?mode=gi_t

Questions? Contact Help Desk: +265 896 884 465
Welcome to the team! 💪🚗"

---

════════════════════════════════════════
LANGUAGE RULE — VERY IMPORTANT
════════════════════════════════════════

- ONLY reply to messages written in ENGLISH
- If the message is in Chichewa, French, Swahili, Portuguese or ANY other language — reply with ONLY this:
  "Sorry, I only communicate in English. Please send your message in English. 🙏"
- Do NOT attempt to translate or respond to the content of non-English messages
- Do NOT mix languages under any circumstances

════════════════════════════════════════
GENERAL RULES FOR DANIEL
════════════════════════════════════════

HOW TO RESPOND:
- Always introduce yourself as Daniel from DM Car Agency on the first message
- Be warm, confident and professional
- Keep replies short and easy to read
- For buying: https://dmcaragency.vercel.app/listings
- For selling: https://dmcaragency.vercel.app/sell-car
- For joining team: https://dmcaragency.vercel.app/join-team
- For calls: +265 980 717 420
- Help Desk: +265 896 884 465
- Never make up car details — invite them to browse or call
- Always end with a clear next step or call to action`;

async function askGroq(message, sender, history = []) {
  if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY not set");

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history,
    { role: "user", content: sender ? `[${sender}]: ${message}` : message }
  ];

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages,
      max_tokens: 800,
      temperature: 0.5
    })
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`Groq error ${res.status}: ${text}`);
  const data = JSON.parse(text);
  return data.choices[0].message.content.trim();
}

// Parse AutoResponder conversation history
function parseHistory(raw) {
  const lines = raw.split("\n").map(l => l.trim()).filter(Boolean);
  const history = [];
  let currentMessage = raw;

  for (let i = 0; i < lines.length - 1; i++) {
    if (lines[i].startsWith("1::") && lines[i + 1]?.startsWith("2::")) {
      const userMsg = lines[i].replace(/^1::\s*/, "").trim();
      const botMsg  = lines[i + 1].replace(/^2::\s*/, "").trim();
      if (userMsg && !userMsg.startsWith("%")) {
        history.push({ role: "user",      content: userMsg });
        history.push({ role: "assistant", content: botMsg  });
      }
      i++;
    }
  }

  const lastUser = [...lines].reverse().find(l => l.startsWith("1::"));
  if (lastUser) {
    currentMessage = lastUser.replace(/^1::\s*/, "").trim();
  }

  return { history, currentMessage };
}

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    status: "running",
    bot: "Daniel — DM Car Agency",
    developer: "DMG Tech Team",
    groq_key: GROQ_API_KEY
      ? `Loaded (${GROQ_API_KEY.substring(0, 8)}...)`
      : "MISSING — add GROQ_API_KEY in environment variables"
  });
});

// ── Webhook — AutoResponder POST ──────────────────────────────────────────────
app.post("/webhook", async (req, res) => {
  try {
    const arMessage  = req.body?.query?.message;
    const arSender   = req.body?.query?.sender;
    const rawMessage = req.body?.message || req.body?.msg;

    const raw    = arMessage || rawMessage;
    const sender = arSender  || req.body?.sender || "Customer";

    if (!raw) {
      return res.status(400).json({
        replies: [{ message: "No message received" }]
      });
    }

    let message = raw;
    let history = [];

    if (raw.includes("1::")) {
      const parsed = parseHistory(raw);
      message = parsed.currentMessage;
      history = parsed.history;
      if (history.length && history[history.length - 1].role === "user") {
        history.pop();
      }
    }

    if (!message || message.startsWith("%")) {
      return res.status(400).json({
        replies: [{ message: "No message received" }]
      });
    }

    console.log(`[IN]  ${sender}: ${message}`);
    const reply = await askGroq(message, sender, history);
    console.log(`[OUT] ${reply}`);

    res.json({ replies: [{ message: reply }] });

  } catch (err) {
    console.error("[ERROR]", err.message);
    res.status(500).json({
      replies: [{
        message: "Sorry, Daniel is unavailable right now. Please call +265 980 717 420"
      }]
    });
  }
});

// ── GET for browser testing ───────────────────────────────────────────────────
app.get("/webhook", async (req, res) => {
  try {
    const message = req.query?.message || req.query?.msg;
    if (!message) return res.json({
      info: "Daniel — DM Car Agency Bot",
      test: "Add ?message=Hello to test",
      example: "/webhook?message=agent+training"
    });
    const reply = await askGroq(message, "Test");
    res.json({ reply, replies: [{ message: reply }] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Self-ping to prevent Render sleep
setInterval(() => {
  fetch(`https://groq-whatsapp-bot-qwg1.onrender.com/`)
    .catch(() => {});
}, 4 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`✅ Daniel (DM Car Agency) running on port ${PORT}`);
  console.log(`   GROQ_API_KEY: ${GROQ_API_KEY ? "SET ✓" : "MISSING ✗"}`);
});
