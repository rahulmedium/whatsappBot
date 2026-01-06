import axios from "axios";

export default async function sendButtons(to) {
  await axios.post(
    `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: {
          text: "Welcome to Nirala Life 🌿\nChoose a service:"
        },
        action: {
          buttons: [
            { type: "reply", reply: { id: "YOGA", title: "Yoga 🧘‍♂️" } },
            { type: "reply", reply: { id: "DIET", title: "Diet 🥗" } },
            { type: "reply", reply: { id: "CONSULT", title: "Consult 💬" } }
          ]
        }
      }
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`
      }
    }
  );
}
