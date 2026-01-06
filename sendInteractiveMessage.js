import axios from "axios";
import "dotenv/config";

export default async function sendInteractiveMessage(to) {
  try {
    const data = {
      messaging_product: "whatsapp",
      to: to.replace("+", ""), // IMPORTANT
      type: "template",
      template: {
        name: "welcome_message",
        language: {
          code: "en" // MUST MATCH MANAGER
        },
        components: [
          {
            type: "body",
            parameters: [
              {
                type: "text",
                text: "Rahul"
              }
            ]
          }
        ]
      }
    };

    const response = await axios.post(
      `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`,
      data,
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("WhatsApp API Response:", response.data);
    return response.data;
  } catch (err) {
    console.error("WhatsApp API Error:", err.response?.data || err.message);
    throw err;
  }
}
