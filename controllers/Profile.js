const User = require('../models/User');
const Profile = require("../models/Profile");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
const CourseProgress = require("../models/CourseProgress");
const Course = require("../models/Course");
const { convertSecondsToDuration } = require("../utils/secToDuration");

// --------------------------------------
// UPDATE PROFILE
// --------------------------------------
exports.updateProfile = async (req, res) => {
    try {
        const { dateOfBirth = "", gender, about = "", contactNumber } = req.body;
        const userId = req.user.id;

        if (!contactNumber || !gender) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required',
            });
        }

        const userDetails = await User.findById(userId);
        const profileId = userDetails.additionalDetails;

        const updatedProfile = await Profile.findByIdAndUpdate(
            profileId,
            { dateOfBirth, gender, about, contactNumber },
            { new: true }
        );

        const updatedUserDetails = await User.findById(userId)
            .populate("additionalDetails")
            .exec();

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            updatedUserDetails
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            error: error.message,
        });
    }
};

// --------------------------------------
// DELETE ACCOUNT
// --------------------------------------
exports.deleteAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        const userDetails = await User.findById(userId);

        await Profile.findByIdAndDelete({ _id: userDetails.additionalDetails });
        // TODO: Unenroll user from all enrolled courses

        await User.findByIdAndDelete({ _id: userId });

        return res.status(200).json({
            success: true,
            message: 'User deleted successfully',
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete user',
            error: error.message,
        });
    }
};

// --------------------------------------
// GET USER DETAILS
// --------------------------------------
exports.getAllUserDetails = async (req, res) => {
    try {
        const id = req.user.id;
        const userDetails = await User.findById(id)
            .populate("additionalDetails")
            .exec();

        return res.status(200).json({
            success: true,
            message: 'User data fetched successfully',
            userDetails,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// --------------------------------------
// UPDATE DISPLAY PICTURE
// --------------------------------------
exports.updateDisplayPicture = async (req, res) => {
    try {
        const displayPicture = req.files.displayPicture;
        const userId = req.user.id;

        const image = await uploadImageToCloudinary(
            displayPicture,
            process.env.FOLDER_NAME,
            1000,
            1000
        );

        const updatedProfile = await User.findByIdAndUpdate(
            { _id: userId },
            { image: image.secure_url },
            { new: true }
        );

        res.send({
            success: true,
            message: `Image updated successfully`,
            data: updatedProfile,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// --------------------------------------
// GET ENROLLED COURSES
// --------------------------------------
exports.getEnrolledCourses = async (req, res) => {
    try {
        const userId = req.user.id;

        let userDetails = await User.findOne({ _id: userId })
            .populate({
                path: "courses",
                populate: {
                    path: "courseContent",
                    populate: {
                        path: "subSection",
                    },
                },
            })
            .exec();

        if (!userDetails) {
            return res.status(400).json({
                success: false,
                message: `Could not find user with id: ${userId}`,
            });
        }

        userDetails = userDetails.toObject();
        for (let course of userDetails.courses) {
            let totalDurationInSeconds = 0;
            let subsectionLength = 0;

            for (let content of course.courseContent) {
                const subSections = content.subSection || [];
                totalDurationInSeconds += subSections.reduce(
                    (acc, curr) => acc + parseInt(curr.timeDuration || 0),
                    0
                );
                subsectionLength += subSections.length;
            }

            course.totalDuration = convertSecondsToDuration(totalDurationInSeconds);

            const courseProgress = await CourseProgress.findOne({
                courseID: course._id,
                userId: userId,
            });

            const completedCount = courseProgress?.completedVideos.length || 0;

            course.progressPercentage =
                subsectionLength === 0
                    ? 100
                    : Math.round((completedCount / subsectionLength) * 10000) / 100;
        }

        return res.status(200).json({
            success: true,
            data: userDetails.courses,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// --------------------------------------
// INSTRUCTOR DASHBOARD
// --------------------------------------
exports.instructorDashboard = async (req, res) => {
    try {
        const courseDetails = await Course.find({ instructor: req.user.id });

        const courseData = courseDetails.map((course) => {
            const totalStudentsEnrolled = course.studentsEnrolled.length;
            const totalAmountGenerated = totalStudentsEnrolled * course.price;

            return {
                _id: course._id,
                courseName: course.courseName,
                courseDescription: course.courseDescription,
                totalStudentsEnrolled,
                totalAmountGenerated,
            };
        });

        res.status(200).json({ courses: courseData });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
