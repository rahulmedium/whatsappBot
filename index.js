import express from "express";
import axios from "axios";
import fs from "fs";
import path from "path";
import "dotenv/config";

const app = express();
app.use(express.json());

// ENV
const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.PHONE_NUMBER_ID;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// CRM FILE
const CRM_FILE = path.resolve("./crm.json");

// ---------- SAFE LOAD CRM ----------
let crm = {};
try {
  if (!fs.existsSync(CRM_FILE)) fs.writeFileSync(CRM_FILE, "{}");
  crm = JSON.parse(fs.readFileSync(CRM_FILE, "utf-8") || "{}");
} catch {
  crm = {};
}

// ---------- SAVE CRM ----------
function saveCRM() {
  fs.writeFileSync(CRM_FILE, JSON.stringify(crm, null, 2), "utf-8");
}

// ---------- SEND TEXT ----------
async function sendText(to, body) {
  await axios.post(
    `https://graph.facebook.com/v19.0/${PHONE_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body },
    },
    { headers: { Authorization: `Bearer ${TOKEN}` } }
  );
}

// ---------- SEND BUTTON MENU ----------
async function sendMenu(to) {
  await axios.post(
    `https://graph.facebook.com/v19.0/${PHONE_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: {
          text: "🌿 Welcome to Nirala Life\nChoose a service:",
        },
        action: {
          buttons: [
            { type: "reply", reply: { id: "YOGA", title: "🧘 Yoga" } },
            { type: "reply", reply: { id: "DIET", title: "🥗 Diet" } },
            { type: "reply", reply: { id: "CONSULT", title: "💬 Consult" } },
          ],
        },
      },
    },
    { headers: { Authorization: `Bearer ${TOKEN}` } }
  );
}

// ---------- WEBHOOK VERIFY ----------
app.get("/webhook",(req,res)=>{
   let mode=req.query["hub.mode"];
   let challange=req.query["hub.challenge"];
   let token=req.query["hub.verify_token"];


    if(mode && token){

        if(mode==="subscribe" && token===mytoken){
            res.status(200).send(challange);
        }else{
            res.status(403);
        }

    }

});

app.post("/webhook",(req,res)=>{ //i want some 

    let body_param=req.body;

    console.log(JSON.stringify(body_param,null,2));

    if(body_param.object){
        console.log("inside body param");
        if(body_param.entry && 
            body_param.entry[0].changes && 
            body_param.entry[0].changes[0].value.messages && 
            body_param.entry[0].changes[0].value.messages[0]  
            ){
               let phon_no_id=body_param.entry[0].changes[0].value.metadata.phone_number_id;
               let from = body_param.entry[0].changes[0].value.messages[0].from; 
               let msg_body = body_param.entry[0].changes[0].value.messages[0].text.body;

               console.log("phone number "+phon_no_id);
               console.log("from "+from);
               console.log("boady param "+msg_body);

               axios({
                   method:"POST",
                   url:"https://graph.facebook.com/v13.0/"+phon_no_id+"/messages?access_token="+token,
                   data:{
                       messaging_product:"whatsapp",
                       to:from,
                       text:{
                           body:"Hi.. I'm Prasath, your message is "+msg_body
                       }
                   },
                   headers:{
                       "Content-Type":"application/json"
                   }

               });

               res.sendStatus(200);
            }else{
                res.sendStatus(404);
            }

    }

});

app.get("/",(req,res)=>{
    res.status(200).send("hello this is webhook setup");
});

// ---------- MANUAL SEND API (CRM / POSTMAN) ----------
app.post("/send", async (req, res) => {
  try {
    const { phone, type, message } = req.body;

    if (!phone) {
      return res.status(400).json({ error: "phone is required" });
    }

    // INIT USER IF NOT EXISTS
    if (!crm[phone]) {
      crm[phone] = {
        state: "MANUAL",
        service: null,
        lastSeen: Date.now(),
      };
    }

    // SEND LOGIC
    if (type === "menu") {
      await sendMenu(phone);
    } else {
      await sendText(phone, message || "Hello 👋");
    }

    crm[phone].lastSeen = Date.now();
    saveCRM();

    res.json({
      success: true,
      sent_to: phone,
      type: type || "text",
    });
  } catch (err) {
    console.error("Send API Error:", err.response?.data || err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(3001, () =>
  console.log("🚀 WhatsApp Bot running on port 3001")
);
