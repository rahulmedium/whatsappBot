import express from "express";
import axios from "axios";
import fs from "fs";
import path from "path";
import "dotenv/config";

const app = express();
app.use(express.json());

// ---------------------------
// ENV
// ---------------------------
const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.PHONE_NUMBER_ID;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// ---------------------------
// CRM JSON (SAFE)
// ---------------------------
const CRM_FILE = path.resolve("./crm.json");
let crm = {};

// Load CRM safely
function loadCRM() {
  try {
    if (!fs.existsSync(CRM_FILE)) {
      fs.writeFileSync(CRM_FILE, "{}", "utf-8");
      crm = {};
      return;
    }

    const data = fs.readFileSync(CRM_FILE, "utf-8").trim();
    crm = data ? JSON.parse(data) : {};
  } catch (err) {
    console.error("CRM load error → reset", err.message);
    crm = {};
    fs.writeFileSync(CRM_FILE, "{}", "utf-8");
  }
}

// Save CRM safely
function saveCRM() {
  try {
    fs.writeFileSync(CRM_FILE, JSON.stringify(crm, null, 2), "utf-8");
  } catch (err) {
    console.error("CRM save error:", err.message);
  }
}

loadCRM();

// ---------------------------
// SEND TEXT
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
    {
      headers: { Authorization: `Bearer ${TOKEN}` },
    }
  );
}

// ---------------------------
// SEND BUTTONS
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
        body: {
          text: "Welcome to Nirala Life 🌿\nPlease choose a service:",
        },
        action: {
          buttons: [
            { type: "reply", reply: { id: "YOGA", title: "Yoga 🧘" } },
            { type: "reply", reply: { id: "DIET", title: "Diet 🥗" } },
            { type: "reply", reply: { id: "CONSULT", title: "Consult 💬" } },
          ],
        },
      },
    },
    {
      headers: { Authorization: `Bearer ${TOKEN}` },
    }
  );
}

// ---------------------------
// SEND TEMPLATE
// ---------------------------
async function sendTemplate(to) {
  await axios.post(
    `https://graph.facebook.com/v19.0/${PHONE_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: "welcome_message",
        language: { code: "en" },
      },
    },
    {
      headers: { Authorization: `Bearer ${TOKEN}` },
    }
  );
}

// ---------------------------
// WEBHOOK VERIFY
// ---------------------------
app.get("/webhook", (req, res) => {
  console.log("VERIFY QUERY:", req.query);

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ WEBHOOK VERIFIED SUCCESSFULLY");
    return res.status(200).send(challenge);
  }

  console.log("❌ WEBHOOK VERIFICATION FAILED");
  res.sendStatus(403);
});


// ---------------------------
// WEBHOOK RECEIVE
// ---------------------------
app.post("/webhook", async (req, res) => {
  console.log("📩 INCOMING WEBHOOK:", JSON.stringify(req.body, null, 2));
  try {
    const msg =
      req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!msg) return res.sendStatus(200);

    const phone = msg.from;

    // Init CRM user
    if (!crm[phone]) {
      crm[phone] = {
        state: "NEW",
        selectedService: null,
        lastMessage: "",
      };
    }

    // ---------------------------
    // BUTTON REPLY
    // ---------------------------
    if (
      msg.type === "interactive" &&
      msg.interactive.type === "button_reply"
    ) {
      const buttonId = msg.interactive.button_reply.id;

      crm[phone].selectedService = buttonId;
      crm[phone].state = "SERVICE_SELECTED";
      crm[phone].lastMessage = buttonId;
      saveCRM();

      if (buttonId === "YOGA")
        await sendText(
          phone,
          "🧘 Yoga plans start at ₹999.\nReply BOOK to continue."
        );

      if (buttonId === "DIET")
        await sendText(
          phone,
          "🥗 Customized Diet plans for diabetes & weight gain.\nReply BOOK to continue."
        );

      if (buttonId === "CONSULT")
        await sendText(
          phone,
          "💬 Our consultant will contact you shortly."
        );

      return res.sendStatus(200);
    }

    // ---------------------------
    // TEXT MESSAGE
    // ---------------------------
    if (msg.type === "text") {
      const text = msg.text.body.toLowerCase();
      crm[phone].lastMessage = text;

      if (crm[phone].state === "NEW") {
        await sendButtons(phone);
        crm[phone].state = "MENU_SENT";
      } else if (
        crm[phone].state === "SERVICE_SELECTED" &&
        text.includes("book")
      ) {
        await sendText(
          phone,
          `✅ Booking confirmed for ${crm[phone].selectedService}`
        );
        crm[phone].state = "BOOKED";
      } else {
        await sendText(phone, "Please choose from the menu:");
        await sendButtons(phone);
      }

      saveCRM();
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook error:", err);
    res.sendStatus(500);
  }
});

// ---------------------------
// MANUAL TEMPLATE TRIGGER
// ---------------------------
app.post("/send", async (req, res) => {
  try {
    await sendTemplate(req.body.phone);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ---------------------------
app.listen(3001, () =>
  console.log("✅ WhatsApp Bot running on port 3001")
);
