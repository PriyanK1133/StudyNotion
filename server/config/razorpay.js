const Razorpay = require('razorpay');
require('dotenv').config();  //express js automatic config kari le

exports.instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY,
    key_secret: process.env.RAZORPAY_SECRET,
})