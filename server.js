import "dotenv/config";
import express from "express";

const app = express();
app.use(express.json());

const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

app.post("/send", async (req, res) => {
    getPhoneNumbers().catch(console.error);
     sendMenuMessage("918527871394");
//   try {
//     sendMenuMessage("918527871394");
//     const response = await fetch(
//       `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
//       {
//         method: "POST",
//         headers: {
//           "Authorization": `Bearer ${TOKEN}`,
//           "Content-Type": "application/json"
//         },
//         body: JSON.stringify({
//           messaging_product: "whatsapp",
//           to: "918527871394",
//           type: "text",
//           text: { body: "Hello from localhost Node.js 🚀" }
//         })
//       }
//     );

//     const data = await response.json();
//     res.json(data);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
});
async function sendMenuMessage(to) {
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
async function getPhoneNumbers() {
  const url = `https://graph.facebook.com/v19.0/827380553627694/phone_numbers`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${TOKEN}`
    }
  });

  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}
app.listen(3000, () => console.log("Server running on 3000"));
