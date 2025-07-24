const { instance } = require("../config/razorpay");
const Course = require("../models/Course");
const crypto = require("crypto");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const mongoose = require("mongoose");
const { courseEnrollmentEmail } = require("../mail/templates/courseEnrollmentEmail");
const { paymentSuccessEmail } = require("../mail/templates/paymentSuccessEmail");
const CourseProgress = require("../models/CourseProgress");

// Capture the payment and initiate the Razorpay order
exports.capturePayment = async (req, res) => {
  const { courses } = req.body;
  const userId = req.user.id;

  if (!Array.isArray(courses) || courses.length === 0) {
    return res.status(400).json({ success: false, message: "Please provide at least one Course ID." });
  }

  let total_amount = 0;

  for (const course_id of courses) {
    try {
      const course = await Course.findById(course_id);
      if (!course) {
        return res.status(404).json({ success: false, message: `Course not found with ID ${course_id}` });
      }

      const uid = new mongoose.Types.ObjectId(userId);
      if (Array.isArray(course.studentsEnroled) && course.studentsEnroled.includes(uid)) {
        return res.status(409).json({ success: false, message: "Already enrolled in this course" });
      }

      total_amount += course.price;
    } catch (error) {
      console.error("Error while calculating total amount:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  const options = {
    amount: total_amount * 100,
    currency: "INR",
    receipt: `rcpt_${Math.floor(Math.random() * 1000000)}_${Date.now()}`,
  };

  try {
    const paymentResponse = await instance.orders.create(options);
    console.log("✅ Payment order created:", paymentResponse);
    // return res.status(200).json({ success: true, data: paymentResponse });
    return res.status(200).json({ success: true, order: paymentResponse });

  } catch (error) {
    console.error("❌ Razorpay order creation failed:", error);
    return res.status(500).json({ success: false, message: "Could not initiate order." });
  }
};

// Verify the payment
exports.verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, courses } = req.body;
  const userId = req.user.id;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !Array.isArray(courses) || !userId) {
    return res.status(400).json({ success: false, message: "Incomplete payment data." });
  }

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ success: false, message: "Payment verification failed." });
  }

  await enrollStudents(courses, userId, res);
  return res.status(200).json({ success: true, message: "Payment verified and enrollment successful." });
};

// Send Payment Success Email
exports.sendPaymentSuccessEmail = async (req, res) => {
  const { orderId, paymentId, amount } = req.body;
  const userId = req.user.id;

  if (!orderId || !paymentId || !amount || !userId) {
    return res.status(400).json({ success: false, message: "Missing payment details." });
  }

  try {
    const enrolledStudent = await User.findById(userId);
    await mailSender(
      enrolledStudent.email,
      "Payment Received",
      paymentSuccessEmail(
        `${enrolledStudent.firstName} ${enrolledStudent.lastName}`,
        amount / 100,
        orderId,
        paymentId
      )
    );
    return res.status(200).json({ success: true, message: "Payment email sent successfully." });
  } catch (error) {
    console.error("❌ Email sending error:", error);
    return res.status(500).json({ success: false, message: "Could not send email" });
  }
};

// Enroll the student in the courses
const enrollStudents = async (courses, userId, res) => {
  if (!Array.isArray(courses) || !userId) {
    return res.status(400).json({ success: false, message: "Invalid course or user ID" });
  }

  for (const courseId of courses) {
    try {
      const enrolledCourse = await Course.findByIdAndUpdate(
        courseId,
        { $addToSet: { studentsEnroled: userId } }, // Prevent duplicate entry
        { new: true }
      );

      if (!enrolledCourse) {
        return res.status(404).json({ success: false, message: `Course not found: ${courseId}` });
      }

      const courseProgress = await CourseProgress.create({
        courseID: courseId,
        userId: userId,
        completedVideos: [],
      });

      const enrolledStudent = await User.findByIdAndUpdate(
        userId,
        {
          $addToSet: {
            courses: courseId,
            courseProgress: courseProgress._id,
          },
        },
        { new: true }
      );

      await mailSender(
        enrolledStudent.email,
        `Successfully Enrolled into ${enrolledCourse.courseName}`,
        courseEnrollmentEmail(
          enrolledCourse.courseName,
          `${enrolledStudent.firstName} ${enrolledStudent.lastName}`
        )
      );

      console.log(`✅ Enrolled in ${enrolledCourse.courseName}`);
    } catch (error) {
      console.error(`❌ Enrollment failed for ${courseId}:`, error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }
};
