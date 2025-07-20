const mongoose = require('mongoose');
require('dotenv').config();

exports.connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL, {
            serverApi: { version: '1' }, // Optional but safe for MongoDB Atlas
        });
        console.log("✅ DB connection successful!");
    } catch (error) {
        console.log("❌ DB Connection Failed");
        console.error(error);
        process.exit(1);
    }
};
