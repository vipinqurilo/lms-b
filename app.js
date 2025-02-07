const express = require("express");
const cors = require("cors");
const courseRouter = require("./src/route/courseRoutes");
const authController = require("./src/route/authRoutes");
const categoryRouter = require("./src/route/categoryRoute");
const languageRouter=require("./src/route/languageRoute");
const requestRouter = require("./src/route/requestRoutes");
const profileRouter = require("./src/route/profileRoute");
const tutorRouter = require("./src/route/tutorRoutes");
const bookingRouter = require("./src/route/bookingRoute");
const subcategoryRouter = require("./src/route/subCategoryRoute");
const wishListRouter = require("./src/route/wishlistRoute");
const orderRouter= require("./src/route/orderRoute");

const app = express();
app.use(express.json());
require('dotenv').config()
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use((req,res,next)=>{
    // console.log(req)
    next();
})
app.use("/public", express.static("public"));

app.use("/api/requests",requestRouter)
app.use("/api/auth",authController);
app.use("/api/course",courseRouter);
app.use("/api/category",categoryRouter);
app.use("/api/languages",languageRouter);
app.use("/api/bookings",bookingRouter);
app.use("/api/profile",profileRouter)
app.use("/api/tutors",tutorRouter);
app.use("/api/subcategory",subcategoryRouter);
app.use("/api/whishlist",wishListRouter);
app.use('/api/order',orderRouter)
module.exports = app;