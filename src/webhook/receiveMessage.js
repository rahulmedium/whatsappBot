import sendText from "../whatsapp/sendText.js";
import sendButtons from "../whatsapp/sendButtons.js";

export default async function receiveMessage(req, res) {
  try {
    const msg = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!msg) return res.sendStatus(200);

    const phone = msg.from;

    // TEXT MESSAGE
    if (msg.type === "text") {
      const text = msg.text.body.toLowerCase();
      console.log("Text received:", text);

      // First message → show menu
      await sendButtons(phone);
    }

    // BUTTON CLICK
    if (msg.type === "interactive") {
      const buttonId = msg.interactive.button_reply.id;
      console.log("Button clicked:", buttonId);

      if (buttonId === "YOGA") {
        await sendText(phone, "🧘 Yoga plans start at ₹999.\nReply BOOK to continue.");
      }

      if (buttonId === "DIET") {
        await sendText(phone, "🥗 Diet plans customized for diabetes.\nReply BOOK to continue.");
      }

      if (buttonId === "CONSULT") {
        await sendText(phone, "💬 Our consultant will call you shortly.");
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook error:", err);
    res.sendStatus(500);
  }
}
