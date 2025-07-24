const OTP = require('../models/OTP');
const User = require('../models/User');
const otpGenerator = require('otp-generator');
const bcrypt = require('bcrypt');
const Profile = require('../models/Profile');
const jwt = require('jsonwebtoken');
const mailSender = require("../utils/mailSender");
const { passwordUpdated } = require("../mail/templates/passwordUpdate");
require('dotenv').config();

// ================== SEND OTP ===================
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    console.log("Email in sendOtp controller", email);
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(401).json({
        success: false,
        message: "Email already exists"
      });
    }

    let otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    let result = await OTP.findOne({ otp });

    while (result) {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });
      result = await OTP.findOne({ otp });
    }

    console.log("OTP generated:", otp);

    const createdOtp = await OTP.create({ email, otp });

    return res.status(200).json({
      success: true,
      message: "OTP created!",
      createdOtp,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================== SIGNUP ===================
exports.signUp = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      accountType,
      otp,
      contactNumber,
    } = req.body;

    if (!firstName || !lastName || !email || !password || !confirmPassword || !otp) {
      return res.status(403).json({
        success: false,
        message: "Fill all details",
      });
    }

    if (password !== confirmPassword) {
      return res.status(403).json({
        success: false,
        message: "Passwords don't match",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(401).json({
        success: false,
        message: "Email already exists",
      });
    }

    const recentOtp = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1);
    console.log("Otp in signup page is:", recentOtp[0]?.otp);

    if (recentOtp.length === 0) {
      return res.status(400).json({
        success: false,
        message: "OTP Not Found",
      });
    } else if (otp !== recentOtp[0].otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    const hashedPwd = await bcrypt.hash(password, 10);
    const approved = accountType === "Instructor" ? false : true;

    const profileDetails = await Profile.create({
      gender: null,
      dateOfBirth: null,
      about: null,
      contactNumer: null,
    });

    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPwd,
      accountType,
      approved,
      additionalDetails: profileDetails._id,
      image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
    });

    console.log("User created successfully");

    return res.status(200).json({
      success: true,
      message: "User is registered Successfully",
      newUser,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "User cannot be registered. Please try again",
    });
  }
};

// ================== LOGIN ===================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email or Password empty',
      });
    }

    const existingUser = await User.findOne({ email }).populate("additionalDetails").exec();
    if (!existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email not registered',
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, existingUser.password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Password is incorrect',
      });
    }

    const payload = {
      email,
      accountType: existingUser.accountType,
      id: existingUser._id,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "2h" });

    existingUser.toObject();
    existingUser.token = token;
    existingUser.password = undefined;

    const options = {
      httpOnly: true,
      secure: true,         // ✅ HTTPS-only cookie
      sameSite: "None",     // ✅ required for cross-origin
      expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    };

    return res.cookie("token", token, options).status(200).json({
      success: true,
      message: "Login successful",
      token,
      existingUser,
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: 'Login Failure, please try again',
    });
  }
};

// ================== CHANGE PASSWORD ===================
exports.changePassword = async (req, res) => {
  try {
    const userDetails = await User.findById(req.user.id);
    const { oldPassword, newPassword } = req.body;

    const isPasswordMatch = await bcrypt.compare(oldPassword, userDetails.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ success: false, message: "The password is incorrect" });
    }

    const encryptedPassword = await bcrypt.hash(newPassword, 10);
    const updatedUserDetails = await User.findByIdAndUpdate(
      req.user.id,
      { password: encryptedPassword },
      { new: true }
    );

    try {
      const emailResponse = await mailSender(
        updatedUserDetails.email,
        passwordUpdated(
          updatedUserDetails.email,
          `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
        )
      );
      console.log("Email sent successfully:", emailResponse.response);
    } catch (error) {
      console.error("Error occurred while sending email:", error);
      return res.status(500).json({
        success: false,
        message: "Error occurred while sending email",
        error: error.message,
      });
    }

    return res.status(200).json({ success: true, message: "Password updated successfully" });

  } catch (error) {
    console.error("Error occurred while updating password:", error);
    return res.status(500).json({
      success: false,
      message: "Error occurred while updating password",
      error: error.message,
    });
  }
};
