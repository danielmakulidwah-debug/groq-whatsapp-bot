const express = require("express");
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── CONFIG ──────────────────────────────────────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "YOUR_GEMINI_API_KEY_HERE";
const GEMINI_MODEL   = process.env.GEMINI_MODEL   || "gemini-1.5-flash";
const PORT           = process.env.PORT            || 3000;
// ────────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a friendly and professional WhatsApp sales assistant for DM Car Agency — Malawi's most trusted automotive marketplace, based in Blantyre, Malawi.

ABOUT DM CAR AGENCY:
- Located in Blantyre, Malawi
- In business since 2024 (5 years of experience)
- Over 500 cars listed, 1,200+ happy customers, 98% satisfaction rate
- Website: https://dmcaragency.netlify.app/
- Phone/WhatsApp: +265 980 717 420
- Email: info@dmcaragency.com
- Facebook: https://www.facebook.com/dmcaragency

SERVICES:
1. BUY A CAR — Browse verified inventory including SUVs, Sedans, Trucks/Pickups, Vans, Hatchbacks
2. SELL YOUR CAR — List your car for sale through the agency
3. JOIN THE TEAM — Career opportunities available

POPULAR BRANDS IN STOCK: Toyota, BMW, Honda, Mercedes-Benz, Volkswagen, Mazda, Nissan
PRICE RANGES: Under MWK 20M | MWK 20M–50M | MWK 50M–100M | MWK 100M+
FEATURED EXAMPLE: Toyota Hilux 2022 — MWK 65,000,000

KEY SELLING POINTS:
- Verified Listings: Every vehicle is physically inspected and documented before listing
- Transparent Pricing: Honest market valuations, no hidden costs or pressure tactics
- 24/7 Support: Available on WhatsApp, phone or email anytime
- Flexible Financing: Partners with leading financial institutions for payment plans

TESTIMONIALS (use to build trust):
- James Mwale bought a Toyota Fortuner: "Found my dream car within a week. Incredibly professional!"
- Tina Chirwa sold her Honda Civic: "Sold in record time at a fair price. Very transparent!"
- Peter Banda bought a BMW X5: "Best car dealership in Malawi — period!"

HOW TO RESPOND:
- Be warm, friendly and professional — like a helpful car dealer texting on WhatsApp
- Keep replies concise (2-4 sentences) unless they ask for details
- Always encourage them to browse inventory, call, or visit WhatsApp: +265 980 717 420
- If they ask about a specific car, invite them to check listings at https://dmcaragency.netlify.app/listings
- If they want to sell a car, direct them to https://dmcaragency.netlify.app/sell-car
- If they ask about prices, give the price range and suggest they contact for exact quotes
- Always end with a helpful next step or call to action
- Never make up specific car details — instead invite them to browse or call
- Respond in the same language the customer uses (English or Chichewa)`;

async function askGemini(userMessage, conversationHistory = []) {
  const contents = [];
  for (const turn of conversationHistory) {
    contents.push({ role: "user",  parts: [{ text: turn.user  }] });
    contents.push({ role: "model", parts: [{ text: turn.model }] });
  }
  contents.push({ role: "user", parts: [{ text: userMessage }] });

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { maxOutputTokens: 300, temperature: 0.7 },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text.trim();
}

// Parse AutoResponder conversation history format
function parseAutoResponderHistory(raw) {
  const lines = raw.split("\n").map(l => l.trim()).filter(Boolean);
  const history = [];
  let i = 0;
  while (i < lines.length - 1) {
    if (lines[i].startsWith("1::") && lines[i+1].startsWith("2::")) {
      history.push({
        user:  lines[i].replace(/^1::\s*/, ""),
        model: lines[i+1].replace(/^2::\s*/, ""),
      });
      i += 2;
    } else { i++; }
  }
  const lastLine = lines[lines.length - 1];
  const currentMessage = lastLine.startsWith("1::") ? lastLine.replace(/^1::\s*/, "") : lastLine;
  return { history, currentMessage };
}

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "DM Car Agency WhatsApp Bot is running 🚗" });
});

// ── Main webhook ──────────────────────────────────────────────────────────────
app.all("/webhook", async (req, res) => {
  try {
    const raw =
      req.body?.message || req.body?.msg || req.body?.text ||
      req.query?.message || req.query?.msg || req.query?.text;

    if (!raw) return res.status(400).json({ error: "No message provided" });

    let currentMessage = raw;
    let history = [];

    if (raw.includes("1::") || raw.includes("2::")) {
      const parsed = parseAutoResponderHistory(raw);
      currentMessage = parsed.currentMessage;
      history = parsed.history;
    }

    console.log(`[IN]  ${currentMessage}`);
    const reply = await askGemini(currentMessage, history);
    console.log(`[OUT] ${reply}`);

    res.setHeader("Content-Type", "text/plain");
    res.send(reply);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send("Apologies, I'm having trouble right now. Please call us at +265 980 717 420 or visit dmcaragency.netlify.app");
  }
});

app.listen(PORT, () => {
  console.log(`✅ DM Car Agency Bot running on port ${PORT}`);
  console.log(`   Webhook: http://localhost:${PORT}/webhook`);
});
                                                            } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send("Sorry, I couldn't process that right now.");
  }
});

app.listen(PORT, () => {
  console.log(`✅ Groq WhatsApp Bot running on port ${PORT}`);
  console.log(`   Webhook URL: http://localhost:${PORT}/webhook`);
});
