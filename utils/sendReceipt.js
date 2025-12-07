const nodemailer = require("nodemailer");

const sendReceipt = async (email, bookingData) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Wanderlust" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "✅ Booking Confirmed - Wanderlust Receipt",
      html: `
        <h2>Thank you for booking with Wanderlust 🏨</h2>
        <p>Your booking details:</p>

        <table border="1" cellpadding="8">
          <tr><td><b>Hotel</b></td><td>${bookingData.hotel}</td></tr>
          <tr><td><b>Location</b></td><td>${bookingData.location}</td></tr>
          <tr><td><b>Amount Paid</b></td><td>₹${bookingData.amount}</td></tr>
          <tr><td><b>Payment ID</b></td><td>${bookingData.paymentId}</td></tr>
        </table>

        <p>Thanks for booking with us! 🏨✨</p>
        <p>– Wanderlust Team</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully to", email);
  } catch (err) {
    console.error("❌ Email sending error:", err);
  }
};

module.exports = sendReceipt;
