import axios from "axios";
import "dotenv/config";

export default async function sendInteractiveMessage(to) {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        type: "interactive",
        interactive: {
          type: "button",
          body: {
            text: "🙏 Welcome to Nirala Life\nPlease choose a service:"
          },
          action: {
            buttons: [
              { type: "reply", reply: { id: "yoga", title: "1️⃣ Yoga" } },
              { type: "reply", reply: { id: "diet", title: "2️⃣ Diet Plan" } },
              { type: "reply", reply: { id: "consult", title: "3️⃣ Consultation" } }
            ]
          }
        }
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    return response.data;
  } catch (err) {
    console.error("WhatsApp Interactive API Error:", err.response?.data || err.message);
    throw err;
  }
}
