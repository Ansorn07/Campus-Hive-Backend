const express = require("express");
const router = express.Router();

// Controllers
const {
  deleteAccount,
  updateProfile,
  getAllUserDetails,
  updateDisplayPicture,
  getEnrolledCourses,
  instructorDashboard,
} = require("../controllers/Profile");

// Middlewares
const { auth, isInstructor } = require("../middlewares/auth");

// --------------------------------------
// Profile Routes (Protected)
// --------------------------------------

// Delete user account
router.delete("/deleteProfile", auth, deleteAccount);

// Update profile details
router.put("/updateProfile", auth, updateProfile);

// Get user details
router.get("/getUserDetails", auth, getAllUserDetails);

// Update profile picture
router.put("/updateDisplayPicture", auth, updateDisplayPicture);

// Get all enrolled courses for a student
router.get("/getEnrolledCourses", auth, getEnrolledCourses);

// Instructor dashboard data
router.get("/instructorDashboard", auth, isInstructor, instructorDashboard);

module.exports = router;
