import express from "express";
import "dotenv/config";
import axios from "axios";
import {services} from "./services.js";
import userState from "./userState.js";
import sendMessage from "./sendMessage.js";
import sendInteractiveMessage from "./sendInteractiveMessage.js";
const app = express();
app.use(express.json());

const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.PHONE_NUMBER_ID;

// Verify webhook
app.get("/webhook", (req, res) => {
  console.log("Received verify token:", req.query["hub.verify_token"]);
  console.log("Expected verify token:", process.env.VERIFY_TOKEN);

  if (req.query["hub.verify_token"] === process.env.VERIFY_TOKEN) {
    return res.send(req.query["hub.challenge"]);
  }
  res.sendStatus(403);
});

// Receive messages
app.post("/webhook", (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const messages = changes?.value?.messages?.[0];

    if (messages?.button) {
      const pressedId = messages.button.payload; // yoga, diet, consult
      console.log("User pressed:", pressedId);

      // Example: send a follow-up message based on selection
      const phone = messages.from;
      let replyMessage = "";

      if (pressedId === "yoga") replyMessage = "🧘 Great! Our Yoga services are listed here...";
      if (pressedId === "diet") replyMessage = "🥗 Awesome! Our Diet Plans are customized...";
      if (pressedId === "consult") replyMessage = "💬 Sure! Connect with our consultants here...";

      // Send follow-up
      sendInteractiveMessage(phone, replyMessage); // Or create a simple sendTextMessage function
    }

    res.sendStatus(200); // Respond to WhatsApp
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
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

  try {
    await sendInteractiveMessage(phone);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
// app.post("/send", async (req, res) => {
//   const { phone } = req.body;
//   console.log("Sending menu to:", phone);

//   await sendMessage(phone);

//   res.json({ success: true });
// });

app.listen(3001, () => console.log("Bot running on 3001"));
