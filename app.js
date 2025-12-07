require("dotenv").config();
console.log("RAZORPAY KEY:", process.env.RAZORPAY_KEY_ID);
console.log("EMAIL:", process.env.EMAIL_USER);
console.log("PASS:", process.env.EMAIL_PASS ? "✅ Loaded" : "❌ Not Loaded");

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const ejs = require("ejs");
const path = require("path");
const methodOverride = require("method-override");
app.use(methodOverride("_method"));
const ejsMate = require("ejs-mate");
app.use(express.json());
const Razorpay = require("razorpay");
const crypto = require("crypto");

// Razorpay setup
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const Listing = require("./models/listing");
const sendReceipt = require("./utils/sendReceipt");

let MONGODB_URL = "mongodb://127.0.0.1:27017/wanderlust";

// Database connection
main()
  .then(() => {
    console.log("Database connected successfully");
  })
  .catch((err) => {
    console.error("Database connection error:", err);
  });

async function main() {
  await mongoose.connect(MONGODB_URL);
  console.log("Connected to MongoDB");
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
app.use(express.urlencoded({ extended: true }));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "public")));

// new route
app.get("/listings/new", (req, res) => {
  res.render("listings/new.ejs");
});

// payment page
app.get("/listings/:id/payment", async (req, res) => {
  const listing = await Listing.findById(req.params.id);

  if (!listing) {
    return res.status(404).send("Listing not found");
  }

  res.render("listings/payment", { listing });
});

// show route
app.get("/listings/:id", async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/show.ejs", { listing });
});

// create route
app.post("/listings", async (req, res) => {
  let { title, description, image, price, location, country } = req.body;

  const newListing = new Listing({
    title,
    description,
    image: {
      url: image
    },
    price,
    location,
    country
  });

  await newListing.save();
  res.redirect(`/listings/${newListing._id}`);
  console.log(newListing);
});

// edit route
app.get("/listings/:id/edit", async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/edit.ejs", { listing });
});

// update route
app.put("/listings/:id", async (req, res) => {
  const { id } = req.params;
  const { title, description, image, price, location, country } = req.body.listing;

  await Listing.findByIdAndUpdate(id, {
    title,
    description,
    image: { url: image },
    price,
    location,
    country
  });

  res.redirect(`/listings/${id}`);
});

// delete route
app.delete("/listings/:id", async (req, res) => {
  const { id } = req.params;
  await Listing.findByIdAndDelete(id);
  res.redirect("/listings");
});


// ✅ FIXED PAYMENT CREATE ORDER ROUTE
app.post("/payment/create-order", async (req, res) => {
  try {
    const { amount, listingId } = req.body;

    console.log("Payment request:", req.body);

    const order = await razorpay.orders.create({
   
      amount: amount * 100,
      currency: "INR",
      receipt: `rcpt_${listingId.slice(0, 8)}_${Date.now().toString().slice(-6)}`
    });

    res.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID
    });

  } catch (error) {
    console.error("❌ Razorpay Error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// send mail receipt
// send mail receipt
app.post("/payment/payment-success", async (req, res) => {
  console.log("✅ payment-success route hit:", req.body);

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      email,
      title,
      amount,
      location
    } = req.body;

    // ✅ PAYMENT SIGNATURE VERIFICATION (ADDED)
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.log("❌ Signature verification failed");
      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }

    console.log("✅ Signature verified successfully");

    // ✅ Continue your existing logic
    const bookingData = {
      hotel: title,
      location: location,
      amount: amount,
      paymentId: razorpay_payment_id
    };

    await sendReceipt(email, bookingData);
    console.log("✅ Email sending function called");

    res.json({ success: true, message: "Receipt email sent!" });

  } catch (err) {
    console.log("❌ Error sending email:", err);
    res.status(500).json({ success: false });
  }
});

// app.post("/payment/payment-success", async (req, res) => {
//   console.log("✅ payment-success route hit:", req.body);

//   try {
//     const { email, paymentId, title, amount, location } = req.body;

//     const bookingData = {
//       hotel: title,
//       location: location,
//       amount: amount,
//       paymentId: paymentId
//     };

//     await sendReceipt(email, bookingData);
//     console.log("✅ Email sending function called");

//     res.json({ success: true, message: "Receipt email sent!" });

//   } catch (err) {
//     console.log("❌ Error sending email:", err);
//     res.status(500).json({ success: false });
//   }
// });

// test email route
app.get("/test-email", async (req, res) => {
  try {
    await sendReceipt("YOUR_REAL_EMAIL@gmail.com", {
      hotel: "Test Hotel",
      location: "Goa",
      amount: 1000,
      paymentId: "TEST123"
    });

    res.send("✅ Test email sent");
  } catch (err) {
    console.log("❌ Mail error:", err);
    res.send("❌ Email failed, check console");
  }
});

// home
app.get("/", (req, res) => {
  res.send("Welcome to Wanderlust Application");
});

// listings index
app.get("/listings", async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { listings: allListings });
});

// server
app.listen(8080, () => {
  console.log("Server is running on port 8080");
});
