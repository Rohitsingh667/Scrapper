const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config(); 

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(bodyParser.json());

const CASHFREE_PG_BASE_URL = "https://sandbox.cashfree.com/pg";
const CASHFREE_PAYOUT_URL = "https://payout-gamma.cashfree.com/payout/v1";

const CASHFREE_PG_CLIENT_ID = process.env.CASHFREE_PG_CLIENT_ID;
const CASHFREE_PG_SECRET = process.env.CASHFREE_PG_SECRET;
const CASHFREE_PAYOUT_CLIENT_ID = process.env.CASHFREE_PAYOUT_CLIENT_ID;
const CASHFREE_PAYOUT_SECRET = process.env.CASHFREE_PAYOUT_SECRET;

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const publicKeyPath = path.join(__dirname, "keys", "accountId_1285836_public_key.pem");
const publicKey = fs.readFileSync(publicKeyPath, "utf8");

function generateCfSignature(clientId) {
  const timestamp = Math.floor(Date.now() / 1000).toString(); 
  const payload = `${clientId}.${timestamp}`;
  const buffer = Buffer.from(payload, "utf8");
  const encrypted = crypto.publicEncrypt(publicKey, buffer);

  return encrypted.toString("base64");
}

let payoutToken = null;
const fetchPayoutToken = async () => {
  try {
    const signature = generateCfSignature(CASHFREE_PAYOUT_CLIENT_ID); 

    const response = await axios.post(`${CASHFREE_PAYOUT_URL}/authorize`, null, {
      headers: {
        "X-Client-Id": CASHFREE_PAYOUT_CLIENT_ID,
        "X-Client-Secret": CASHFREE_PAYOUT_SECRET,
        "X-Cf-Signature": signature 
      }
    });

    console.log("API Response:", response.data);

    if (response.data && response.data.data && response.data.data.token) {
      payoutToken = response.data.data.token;
      console.log("✅ Payout token fetched:", payoutToken);
    } else {
      console.error("❌ No token found in response");
    }
  } catch (error) {
    console.error("❌ Error fetching payout token:", error.response?.data || error.message);
  }
};


fetchPayoutToken(); 
app.post('/api/create-payment-link', async (req, res) => {
  const { amount, name, phone, description } = req.body;

  if (!name || !phone || !amount) {
    return res.status(400).json({ success: false, message: "Missing name, phone or amount." });
  }

  try {
    const response = await axios.post(`${CASHFREE_PG_BASE_URL}/links`, {
      customer_details: {
        customer_name: name,
        customer_email: "buyer@example.com", 
        customer_phone: phone
      },
      link_amount: amount / 100,
      link_currency: "INR",
      link_purpose: description || "Product purchase",
      link_notify: {
        send_sms: true,
        send_email: false
      },
      link_id: `link_${Date.now()}`
    }, {
      headers: {
        "x-client-id": CASHFREE_PG_CLIENT_ID,
        "x-client-secret": CASHFREE_PG_SECRET,
        "x-api-version": "2022-09-01",
        "Content-Type": "application/json"
      }
    });

    const { link_url: paymentLink, link_id: paymentId } = response.data;
    res.json({ success: true, paymentLink, paymentId });
  } catch (error) {
    console.error("❌ Error creating payment link:", error.response?.data || error.message);
    res.status(500).json({ success: false, message: error.response?.data?.message || error.message });
  }
});


app.post('/api/verify-payment', async (req, res) => {
  const { paymentId } = req.body;

  try {
    const response = await axios.get(`${CASHFREE_PG_BASE_URL}/links/${paymentId}`, {
      headers: {
        "x-client-id": CASHFREE_PG_CLIENT_ID,
        "x-client-secret": CASHFREE_PG_SECRET,
        "x-api-version": "2022-09-01"
      }
    });

    const status = response.data.link_status;
    if (status === 'PAID') {
      res.json({ success: true });
    } else {
      res.json({ success: false, status });
    }
  } catch (error) {
    console.error("❌ Error verifying payment:", error.response?.data || error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});


app.post('/api/initiate-transfer', async (req, res) => {
  const { upi, amount } = req.body;

  try {
    const response = await axios.post(`${CASHFREE_PAYOUT_URL}/requestTransfer`, {
      bene_details: {
        transferMode: "upi",
        upi: upi
      },
      amount: amount / 100,
      transferId: `transfer_${Date.now()}`
    }, {
      headers: {
        Authorization: `Bearer ${payoutToken}`,
        "Content-Type": "application/json"
      }
    });

    res.json({ success: true, payout: response.data });
  } catch (error) {
    console.error("❌ Error during payout:", error.response?.data || error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
