const jwt = require("jsonwebtoken");

// AUTH MIDDLEWARE
exports.auth = async (req, res, next) => {
  try {
    // Extract token either from cookie or Authorization header
    const rawToken =
      req.cookies?.token || req.get("Authorization")?.replace("Bearer ", "");

    console.log("🛡️ Raw Token Received:", rawToken);

    if (!rawToken) {
      return res.status(401).json({
        success: false,
        message: "Token is missing",
      });
    }

    // Check if secret is loaded
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("❌ JWT_SECRET is missing in environment variables.");
      return res.status(500).json({
        success: false,
        message: "Server error: JWT secret not set",
      });
    }

    try {
      const payload = jwt.verify(rawToken, secret);
      console.log("✅ Token verified, payload:", payload);
      req.user = payload;
      next();
    } catch (err) {
      console.error("❌ Invalid token error:", err.message);
      return res.status(401).json({
        success: false,
        message: "Invalid token.",
      });
    }
  } catch (err) {
    console.error("⚠️ Auth Middleware Error:", err.message);
    return res.status(401).json({
      success: false,
      message: "Error in validating token",
    });
  }
};

// ROLE GUARDS
exports.isStudent = async (req, res, next) => {
  try {
    if (req.user?.accountType !== "Student") {
      return res.status(401).json({
        success: false,
        message: "This is a protected route for Students only",
      });
    }
    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "User role cannot be verified, please try again",
    });
  }
};

exports.isInstructor = async (req, res, next) => {
  try {
    if (req.user?.accountType !== "Instructor") {
      return res.status(401).json({
        success: false,
        message: "This is a protected route for Instructors only",
      });
    }
    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "User role cannot be verified, please try again",
    });
  }
};

exports.isAdmin = async (req, res, next) => {
  try {
    if (req.user?.accountType !== "Admin") {
      return res.status(401).json({
        success: false,
        message: "This is a protected route for Admins only",
      });
    }
    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "User role cannot be verified, please try again",
    });
  }
};
