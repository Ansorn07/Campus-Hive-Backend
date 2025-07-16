# 🎓 CampusHive - Backend

**CampusHive** is a scalable and robust back-end API powering an intuitive ed-tech platform for modern learning environments. It supports course management, secure user authentication, payment integration, media handling, and more — all developed using the **MERN** stack and deployed on scalable cloud infrastructure.

---
 
## 🚀 Tech Stack

- **Node.js** – JavaScript runtime for building scalable backend services
- **Express.js** – Web framework for building REST APIs
- **MongoDB** – NoSQL database for structured and flexible data
- **Mongoose** – ODM to simplify MongoDB operations
- **Cloudinary** – Media file (image/video) storage and optimization
- **JWT** – Secure authentication tokens
- **Bcrypt** – Password hashing for enhanced security
- **Razorpay** – Payment integration
- **Nodemailer** – Email service for OTPs and password resets

---

## 🏗️ Backend Architecture

- ✅ **Monolithic Architecture**: Built using a single Node.js + Express.js application.
- ✅ **RESTful APIs**: All functionalities exposed through HTTP endpoints using standard methods (GET, POST, PUT, DELETE).
- ✅ **MVC Pattern**: Organized using Controllers, Models, Routes, and Utilities for clean separation of concerns.

---

## 📦 Features & Modules

### 🔐 Authentication & Security
- User Sign-up, Login with JWT
- OTP Email Verification
- Password Reset via Email
- Role-based Access (Student / Instructor)

### 🎓 Course Management
- Create, Update, Delete Courses
- Manage Course Sections, Subsections, and Progress
- Upload and store course media in Cloudinary

### 🧾 Payments
- Razorpay integration for course purchase
- Secure transaction handling and webhook support

### 🌐 Media Management
- Image/Video uploads using Cloudinary
- Quality optimization for performance

---

## 🧠 Sample API Endpoints

| Endpoint                          | Method | Description                            |
|----------------------------------|--------|----------------------------------------|
| `/api/auth/signup`               | POST   | Register a new user                    |
| `/api/auth/login`                | POST   | User login and JWT issuance            |
| `/api/auth/verify-otp`          | POST   | Email verification with OTP            |
| `/api/auth/forgot-password`      | POST   | Trigger password reset email           |
| `/api/courses`                   | GET    | Fetch all courses                      |
| `/api/courses/:id`               | GET    | Fetch course by ID                     |
| `/api/courses`                   | POST   | Create a new course (Instructor only)  |
| `/api/courses/:id`               | PUT    | Update course by ID                    |
| `/api/courses/:id`               | DELETE | Delete a course by ID                  |
| `/api/courses/:id/rate`          | POST   | Add rating to a course                 |

---

## 🌍 Deployment

| Service     | Purpose                    |
|-------------|----------------------------|
| **Railway/Render** | Backend hosting (Node.js + MongoDB) |
| **MongoDB Atlas** | Cloud-hosted database       |
| **Cloudinary**     | Media content hosting       |
| **Vercel**         | Frontend (React) hosting *(see frontend repo)* |

---

## 🗂️ Project Structure

```bash
Campus-Hive-Backend/
├── config/            # DB & cloud configs
├── controllers/       # Business logic
├── middlewares/       # Auth & error handlers
├── models/            # Mongoose models
├── routes/            # API endpoints
├── utils/             # Utility functions
├── .env               # Environment variables
├── .gitignore
└── README.md
