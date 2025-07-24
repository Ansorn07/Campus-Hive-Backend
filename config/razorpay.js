const Razorpay = require('razorpay');

// ✅ Move console.log statements outside the object
console.log("RAZORPAY_KEY_ID:", process.env.RAZORPAY_KEY_ID);
console.log("RAZORPAY_SECRET:", process.env.RAZORPAY_SECRET);

exports.instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,      // ✅ correct key
  key_secret: process.env.RAZORPAY_SECRET,  // ✅ correct secret
});
