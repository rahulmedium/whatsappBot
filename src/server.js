import express from "express";
import verifyWebhook from "./webhook/verifyWebhook.js";
import receiveMessage from "./webhook/receiveMessage.js";

const app = express();
app.use(express.json());

app.get("/webhook", verifyWebhook);
app.post("/webhook", receiveMessage);

app.listen(process.env.PORT, () =>
  console.log("WhatsApp Bot running on", process.env.PORT)
);
