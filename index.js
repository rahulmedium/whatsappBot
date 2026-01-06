import express from "express";
import axios from "axios";
import fs from "fs";
import path from "path";
import "dotenv/config";

const app = express();
app.use(express.json());

// ENV
const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.PHONE_NUMBER_ID;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// CRM FILE
const CRM_FILE = path.resolve("./crm.json");

// ---------- SAFE LOAD CRM ----------
let crm = {};
try {
  if (!fs.existsSync(CRM_FILE)) fs.writeFileSync(CRM_FILE, "{}");
  crm = JSON.parse(fs.readFileSync(CRM_FILE, "utf-8") || "{}");
} catch {
  crm = {};
}

// ---------- SAVE CRM ----------
function saveCRM() {
  fs.writeFileSync(CRM_FILE, JSON.stringify(crm, null, 2), "utf-8");
}

// ---------- SEND TEXT ----------
async function sendText(to, body) {
  await axios.post(
    `https://graph.facebook.com/v19.0/${PHONE_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body },
    },
    { headers: { Authorization: `Bearer ${TOKEN}` } }
  );
}

// ---------- SEND BUTTON MENU ----------
async function sendMenu(to) {
  await axios.post(
    `https://graph.facebook.com/v19.0/${PHONE_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: {
          text: "🌿 Welcome to Nirala Life\nChoose a service:",
        },
        action: {
          buttons: [
            { type: "reply", reply: { id: "YOGA", title: "🧘 Yoga" } },
            { type: "reply", reply: { id: "DIET", title: "🥗 Diet" } },
            { type: "reply", reply: { id: "CONSULT", title: "💬 Consult" } },
          ],
        },
      },
    },
    { headers: { Authorization: `Bearer ${TOKEN}` } }
  );
}

// ---------- WEBHOOK VERIFY ----------
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook Verified");
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// ---------- WEBHOOK RECEIVE ----------
app.post("/webhook", async (req, res) => {
  try {
    console.log("📩 RAW WEBHOOK:", JSON.stringify(req.body, null, 2));

    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    if (!message) {
      console.log("ℹ️ No message in webhook");
      return res.sendStatus(200);
    }

    const phone = message.from;
    console.log("📞 From:", phone);
    console.log("📨 Type:", message.type);

    // INIT USER
    if (!crm[phone]) {
      crm[phone] = {
        state: "NEW",
        service: null,
        lastSeen: Date.now(),
      };
      saveCRM();
      console.log("👤 New user created");
    }

    // ---------- BUTTON CLICK ----------
    if (
      message.type === "interactive" &&
      message.interactive?.type === "button_reply"
    ) {
      const id = message.interactive.button_reply.id;
      console.log("🔘 Button clicked:", id);

      crm[phone].service = id;
      crm[phone].state = "SERVICE_SELECTED";
      saveCRM();

      if (id === "YOGA") await sendText(phone, "🧘 Yoga plans start at ₹999.\nReply BOOK");
      if (id === "DIET") await sendText(phone, "🥗 Diet plans for diabetes.\nReply BOOK");
      if (id === "CONSULT") await sendText(phone, "💬 Our expert will contact you.");

      return res.sendStatus(200);
    }

    // ---------- TEXT MESSAGE ----------
    if (message.type === "text") {
      const text = message.text.body;
      console.log("💬 Text received:", text);

      const hours = (Date.now() - crm[phone].lastSeen) / 36e5;
      crm[phone].lastSeen = Date.now();

      console.log("⏱️ Hours since last message:", hours.toFixed(2));

      if (hours > 24) {
        console.log("⌛ Session expired");
        await sendMenu(phone);
        crm[phone].state = "MENU";
        saveCRM();
        return res.sendStatus(200);
      }

      if (crm[phone].state === "NEW") {
        console.log("📋 Sending menu");
        await sendMenu(phone);
        crm[phone].state = "MENU";
      } else if (text.toLowerCase().includes("book")) {
        console.log("✅ Booking confirmed");
        await sendText(phone, `✅ Booking confirmed for ${crm[phone].service}`);
        crm[phone].state = "BOOKED";
      } else {
        console.log("🔁 Resending menu");
        await sendMenu(phone);
      }

      saveCRM();
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ WEBHOOK ERROR:", err.response?.data || err.message);
    res.sendStatus(500);
  }
});

// ---------- MANUAL SEND API (CRM / POSTMAN) ----------
app.post("/send", async (req, res) => {
  try {
    const { phone, type, message } = req.body;

    if (!phone) {
      return res.status(400).json({ error: "phone is required" });
    }

    // INIT USER IF NOT EXISTS
    if (!crm[phone]) {
      crm[phone] = {
        state: "MANUAL",
        service: null,
        lastSeen: Date.now(),
      };
    }

    // SEND LOGIC
    if (type === "menu") {
      await sendMenu(phone);
    } else {
      await sendText(phone, message || "Hello 👋");
    }

    crm[phone].lastSeen = Date.now();
    saveCRM();

    res.json({
      success: true,
      sent_to: phone,
      type: type || "text",
    });
  } catch (err) {
    console.error("Send API Error:", err.response?.data || err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(3001, () =>
  console.log("🚀 WhatsApp Bot running on port 3001")
);
