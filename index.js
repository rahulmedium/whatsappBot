import express from "express";
import axios from "axios";
import {services} from "./services.js";
import userState from "./userState.js";
import sendMessage from "./sendMessage.js";
const app = express();
app.use(express.json());

const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.PHONE_NUMBER_ID;

// Verify webhook
app.get("/webhook", (req, res) => {
  if (req.query["hub.verify_token"] === process.env.VERIFY_TOKEN) {
    return res.send(req.query["hub.challenge"]);
  }
  res.sendStatus(403);
});

// Receive messages
app.post("/webhook", async (req, res) => {
  const msg = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!msg) return res.sendStatus(200);

  const from = msg.from;
  const text = msg.text?.body?.trim();

  const state = userState.get(from);
  

  if (!state) {
    userState.set(from, "WAITING_SERVICE");
    return sendMessage1(from,
`🙏 Welcome to Nirala Life
Please choose a service:
1️⃣ Yoga
2️⃣ Diet Plan
3️⃣ Consultation`);
  }

  if (state === "WAITING_SERVICE" && services[text]) {
    userState.set(from, "DONE");
    return sendMessage1(from, services[text].reply);
  }

  return sendMessage1(from, "❌ Please reply with 1, 2 or 3");
});

async function sendMessage1(to, body) {
  await axios.post(
    `https://graph.facebook.com/v19.0/${PHONE_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body }
    },
    {
      headers: { Authorization: `Bearer ${TOKEN}` }
    }
  );
}
app.post("/send", async (req, res) => {
  const { phone } = req.body;

  await sendMessage(
    phone,
`🙏 Welcome to Nirala Life
Please choose a service:
1️⃣ Yoga
2️⃣ Diet Plan
3️⃣ Consultation`
  );

  res.json({ success: true });
});

app.listen(3001, () => console.log("Bot running on 3001"));
