const express = require('express');
const QRCode = require('qrcode');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser')
app.use(cors({
    origin: 'https://ludo-lifee.vercel.app/'
}));

app.use(bodyParser.json());

const orderId = 'ORD-239231';
var amount = 0;

const generateQR = async (upiString) => {
    try {
        const qr = await QRCode.toDataURL(upiString);
        return qr;
    }
    catch (err) {
        console.error(err);
    }
}

app.post('/QR', async (req, res) => {
  const amount = parseInt(req.body.Amount);
  const userId = req.body.userId;
  if (!userId || isNaN(amount) || amount < 250 || amount > 100000) {
    return res.status(400).json({ error: 'Invalid user ID or amount (250-100000)' });
  }

  const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const upiString = `upi://pay?pa=7378160677-2@axl&pn=Irfan&am=${amount}&cu=INR&tr=${transactionId}`;
  const qr = await generateQR(upiString);

  const paymentRequest = {
    transactionId,
    userId,
    amount,
    status: 'pending',
    screenshot: null,
    createdAt: Date.now(),
    expiresAt: Date.now() + 5 * 60 * 1000,
  };

  paymentRequests.push(paymentRequest);
  await saveData(PAYMENTS_FILE_PATH, paymentRequest);

  io.to(userId).emit('paymentRequestCreated', paymentRequest);

  res.status(200).json({ qr, transactionId, expiresAt: paymentRequest.expiresAt });
});

app.listen(3000);