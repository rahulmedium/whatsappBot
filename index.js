import express from "express";
import axios from "axios";
import fs from "fs";
import "dotenv/config";

const app = express();
app.use(express.json());

const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.PHONE_NUMBER_ID;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// ---------------------------
// CRM JSON File
// ---------------------------
const CRM_FILE = "./crm.json";

// Load CRM data from file if exists
let crm = {};
if (fs.existsSync(CRM_FILE)) {
  const data = fs.readFileSync(CRM_FILE, "utf-8");
  crm = JSON.parse(data);
}

// Helper: Save CRM to file
function saveCRM() {
  fs.writeFileSync(CRM_FILE, JSON.stringify(crm, null, 2));
}

// ---------------------------
// Send Text
// ---------------------------
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

// ---------------------------
// Send Buttons
// ---------------------------
async function sendButtons(to) {
  await axios.post(
    `https://graph.facebook.com/v19.0/${PHONE_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: "Welcome to Nirala Life 🌿\nPlease choose a service:" },
        action: {
          buttons: [
            { type: "reply", reply: { id: "YOGA", title: "Yoga 🧘" } },
            { type: "reply", reply: { id: "DIET", title: "Diet 🥗" } },
            { type: "reply", reply: { id: "CONSULT", title: "Consult 💬" } },
          ],
        },
      },
    },
    { headers: { Authorization: `Bearer ${TOKEN}` } }
  );
}

// ---------------------------
// Send Template
// ---------------------------
async function sendTemplate(to) {
  await axios.post(
    `https://graph.facebook.com/v19.0/${PHONE_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: { name: "welcome_message", language: { code: "en" } },
    },
    { headers: { Authorization: `Bearer ${TOKEN}` } }
  );
}

// ---------------------------
// Webhook Verification
// ---------------------------
app.get("/webhook", (req, res) => {
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (token === VERIFY_TOKEN) return res.status(200).send(challenge);
  res.sendStatus(403);
});

// ---------------------------
// Webhook: Receive Messages
// ---------------------------
app.post("/webhook", async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const messages = changes?.value?.messages?.[0];

    if (!messages) return res.sendStatus(200);

    const phone = messages.from;

    // Initialize user in CRM
    if (!crm[phone]) crm[phone] = { state: "NEW", selectedService: null, lastMessage: "" };

    // ---------------------------
    // BUTTON CLICK
    // ---------------------------
    if (messages.type === "interactive" && messages.interactive.type === "button_reply") {
      const buttonId = messages.interactive.button_reply.id;
      crm[phone].selectedService = buttonId;
      crm[phone].state = "SERVICE_SELECTED";
      crm[phone].lastMessage = buttonId;
      saveCRM();

      if (buttonId === "YOGA")
        await sendText(phone, "🧘 Great! Our Yoga plans start at ₹999. Reply BOOK to continue.");
      if (buttonId === "DIET")
        await sendText(phone, "🥗 Diet plans customized for diabetes & weight gain. Reply BOOK to continue.");
      if (buttonId === "CONSULT")
        await sendText(phone, "💬 Our consultant will contact you shortly.");

      return res.sendStatus(200);
    }

    // ---------------------------
    // TEXT MESSAGE
    // ---------------------------
    if (messages.type === "text") {
      const text = messages.text.body.toLowerCase();
      crm[phone].lastMessage = text;
      saveCRM();

      if (crm[phone].state === "NEW") {
        await sendButtons(phone);
        crm[phone].state = "MENU_SENT";
        saveCRM();
      } else if (crm[phone].state === "SERVICE_SELECTED" && text.includes("book")) {
        await sendText(phone, `✅ Your booking for ${crm[phone].selectedService} is confirmed!`);
        crm[phone].state = "BOOKED";
        saveCRM();
      } else {
        await sendText(phone, "Please choose a service from the menu:");
        await sendButtons(phone);
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook Error:", err);
    res.sendStatus(500);
  }
});

// ---------------------------
// Send Template (manual trigger)
// ---------------------------
app.post("/send", async (req, res) => {
  const { phone } = req.body;
  try {
    await sendTemplate(phone);
    res.json({ success: true });
  } catch (err) {
    console.error("Send Template Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(3001, () => console.log("WhatsApp Bot running on port 3001"));
