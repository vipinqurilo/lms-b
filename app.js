const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const courseRouter = require("./src/route/courseRoutes");
const authController = require("./src/route/authRoutes");
const categoryRouter = require("./src/route/categoryRoute");
const languageRouter = require("./src/route/languageRoute");
const profileRouter = require("./src/route/profileRoute"); 
const tutorRouter = require("./src/route/tutorRoutes");
const bookingRouter = require("./src/route/bookingRoute");
const subcategoryRouter = require("./src/route/subCategoryRoute");
const wishListRouter = require("./src/route/wishlistRoute");
const orderRouter = require("./src/route/orderRoute");
const reviewRoute = require("./src/route/reviewRoute");
const ticketRouter = require("./src/route/ticketRoute");
const userRoutes = require("./src/route/userRoutes");
const stripeRoute = require("./src/route/stripe");
const walletRouter = require("./src/route/walletRoutes");
const withdrawRouter = require("./src/route/withdrawRoute");
const studentRouter = require("./src/route/studentRoutes");
const teacherRouter = require("./src/route/teacherRoutes");
const paymentRouter = require("./src/route/paymentRoutes");
const tutorReviewRoute = require("./src/route/tutorReviewRoute");
const adminRoute = require("./src/route/adminRoute");
const emailTestRoutes = require("./src/routes/emailTestRoutes");

const passwordRouter = require("./src/route/forgotPasswordRoutes");
const routereeee = require("./src/route/testing");

const earningRouter = require("./src/route/earningRoutes");
const saleRouter = require("./src/route/saleRoutes");

const frontendSettingRouter = require("./src/route/frontendSettingRoute");
const emailSettingRouter = require("./src/route/emailSettingRoute");
const paymentSettingRouter = require("./src/route/paymentSettingRoute");
const payoutSettingRouter = require("./src/route/payoutSettingRoute");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "src", "view"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());  
require("dotenv").config();
const corsOption = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOption));


app.use((req, res, next) => {
  // console.log(req)
  next();
});
app.use(express.static("public"));

app.use("/api/auth", authController);
app.use("/api/course", courseRouter);
app.use("/api/category", categoryRouter);
app.use("/api/languages", languageRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/profile", profileRouter);
app.use("/api/tutors", tutorRouter);
app.use("/api/subcategory", subcategoryRouter);
app.use("/api/whishlist", wishListRouter);
app.use("/api/order", orderRouter);
app.use("/api/review", reviewRoute);
app.use("/api/tutorReview", tutorReviewRoute);
app.use("/api/ticket", ticketRouter);
app.use("/api/users", userRoutes);
app.use("/api/stripe", stripeRoute);
app.use("/api/wallet", walletRouter);
app.use("/api/withdrawals", withdrawRouter);
app.use("/api/students", studentRouter);
app.use("/api/teachers", teacherRouter);
app.use("/api/forgotpassword", passwordRouter);
app.use("/api/email", routereeee);
app.use("/api/email-test", emailTestRoutes);
app.use("/api/frontend-settings", frontendSettingRouter);
app.use("/api/email-settings", emailSettingRouter);
app.use("/api/payment-settings", paymentSettingRouter);
app.use("/api/payout-settings", payoutSettingRouter);

app.get("/template", (req, res) => {
  const templateData = {
    logoUrl: "https://res.cloudinary.com/daprkakyk/image/upload/v1741260445/luxe/uiiqdcle3kayym5qg1kp.png",
    title: "Verification Email",
    courseImage: "http://res.cloudinary.com/daprkakyk/image/upload/v1742284693/luxe/nuud24kdorki4v1ry2jl.png",
    studentName: "Diana",
    teacherName: "John Doe",
    bookingDate: "Monday, January 15, 2024",
    startTime: "10:00 AM",
    endTime: "11:00 AM",
    courseName: "Introduction to Mathematics",
    nextStepOne: "You will receive a meeting link 15 minutes before the session.",
    nextStepTwo: "Please ensure you have a stable internet connection and required materials ready.",
    buttonText: "View Booking Details",
    address: "Address - 65 Rz- London, United Kingdom Nd-",
    year: new Date().getFullYear(),
    recipientEmail: "nethead321@gmail.com", // Student email from memory
    studentEmail: "nethead321@gmail.com", // Student email from memory
    teacherEmail: "sakshi04002@gmail.com", // Teacher email from memory
    meetingPlatform: "Zoom",
    meetingLink: "https://zoom.us/j/example" // Example meeting link
  };
  res.render("template", templateData);
});

app.get("/login", (req, res) => {
  res.render("login");


});

app.use("/api/admin", adminRoute);

app.use("/api/payment", paymentRouter);

app.use("/api/order", orderRouter);

app.use("/api/earnings", earningRouter);

app.use("/api/sales", saleRouter);

module.exports = app;
