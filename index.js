const express = require("express");
const app = express();

const dotenv = require("dotenv");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const cookieParser = require("cookie-parser");
const serverless = require("serverless-http"); // ✅ required for Vercel

// Routes
const userRoutes = require("./routes/User");
const profileRoutes = require("./routes/Profile");
const paymentRoutes = require("./routes/Payments");
const courseRoutes = require("./routes/Course");

const database = require("./config/database");
const { cloudinaryConnect } = require("./config/cloudinary");

// Load env
dotenv.config();

// DB connect
database.connectDB();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://campus-hive-frontend.vercel.app",
    ],
    credentials: true,
  })
);
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp",
  })
);

// Cloudinary
cloudinaryConnect();

// Routes
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/course", courseRoutes);
app.use("/api/v1/payment", paymentRoutes);

app.get("/", (req, res) => {
  return res.json({
    success: true,
    message: "Your serverless Express API is up and running!",
  });
});

// ✅ Export handler for Vercel
module.exports = app;
module.exports.handler = serverless(app); // ✅ This is what Vercel will call
