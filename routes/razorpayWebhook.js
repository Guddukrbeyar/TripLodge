const express = require("express");
const crypto = require("crypto");
const sendReceipt = require("../utils/sendReceipt");

const router = express.Router();

router.post("/razorpay-webhook", (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  const body = req.rawBody; // we’ll set this in app.js

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(body)
    .digest("hex");

  const razorpaySignature = req.headers["x-razorpay-signature"];

  if (expectedSignature !== razorpaySignature) {
    console.log("❌ Invalid webhook signature");
    return res.status(400).json({ status: "invalid signature" });
  }

  const event = req.body;

  if (event.event === "payment.captured") {
    const payment = event.payload.payment.entity;

    const userEmail = payment.email; // Razorpay sends email here

    // For now, static demo booking data. Replace with real DB data later.
    const bookingData = {
      hotelName: "Luxury Beach Resort",
      location: "Goa",
      checkIn: "2025-12-25",
      checkOut: "2025-12-27",
      guests: "2 Adults",
      amount: payment.amount / 100, // Razorpay stores in paise
      paymentId: payment.id,
    };

    sendReceipt(userEmail, bookingData);
  }

  res.json({ status: "ok" });
});

module.exports = router;
