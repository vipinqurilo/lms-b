const express = require("express");
const cors = require("cors");
const courseRouter = require("./src/route/courseRoutes");
const authController = require("./src/route/authRoutes");
const categoryRouter = require("./src/route/categoryRoute");
const languageRouter = require("./src/route/languageRoute");
const requestRouter = require("./src/route/requestRoutes");
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
const earningRouter = require("./src/route/earningRoutes");
const saleRouter = require("./src/route/saleRoutes");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
require("dotenv").config();
const corsOption = {
  origin: "*",
  optionsSuccessStatus: 200,
};
app.use(cors(corsOption));
app.use((req, res, next) => {
  // console.log(req)
  next();
});
app.use("/public", express.static("public"));

app.use("/api/requests", requestRouter);
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
app.use("/api/wallet", walletRouter);
app.use("/api/withdrawals", withdrawRouter);
app.use("/api/students", studentRouter);
app.use("/api/teachers", teacherRouter);

//Payment Routes

app.use("/api/payment", paymentRouter);

//Order Routes
app.use("/api/order",orderRouter);

//Earning Routes
app.use("/api/earnings",earningRouter)

//Sales Routes 
app.use("/api/sales",saleRouter)
module.exports = app;
