const mongoose = require('mongoose');
const initData=require("./data.js");
const Listing = require("../models/listing.js");



let MONGODB_URL="mongodb://127.0.0.1:27017/wanderlust";
// Database connection
 main().then(() => {
    console.log("Database connected successfully");
}).catch((err) => {
    console.error("Database connection error:", err);
});

// Main function to connect to the database
async function main() {
    await mongoose.connect( MONGODB_URL);
    console.log("Connected to MongoDB");
}



// Function to initialize the database with sample database
const initDB=async()=>{
 await Listing.deleteMany({});
 await Listing.insertMany(initData.data);
 console.log("Database initialized with sample data");
}



// call the function to initialize the database
 initDB();