import axios from "axios";
import "dotenv/config";

// export default async function sendMessage(to, body) {
//   try {
//     const response = await axios.post(
//       `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`,
//       {
//         messaging_product: "whatsapp",
//         to,
//         text: { body }
//       },
//       {
//         headers: {
//           "Authorization": `Bearer ${process.env.WHATSAPP_TOKEN}`,
//           "Content-Type": "application/json"
//         }
//       }
//     );
//     return response.data;
//   } catch (err) {
//     console.error("WhatsApp API Error:", err.response?.data || err.message);
//     throw err;
//   }
// }
const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
export default async function sendMessage(to) {
  console.log("Sending menu message to:", to);
  const message = `🙏 Welcome to Nirala Life 🌿

1️⃣ Online Yoga Training
2️⃣ Health & Diet Consultation
3️⃣ Fees & Timings
4️⃣ Talk to Human`;

  const response = await fetch(
    `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to,
        type: "text",
        text: {
          body: message
        }
      })
    }
  );

  const data = await response.json();
  console.log(data);
}