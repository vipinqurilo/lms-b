const express = require("express");
const cors = require("cors");
const courseRouter = require("./src/route/courseRoutes");
const authController = require("./src/route/authRoutes");
const categoryRouter = require("./src/route/categoryRoute");
// const bookingRouter = require("./src/route/bookingRoute");
const languageRouter=require("./src/route/languageRoute");
const requestRouter = require("./src/route/requestRoutes");
const profileRouter = require("./src/route/profileRoute");
const tutorRouter = require("./src/route/tutorRoutes");
const bookingRouter = require("./src/route/bookingRoute");
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use((req,res,next)=>{
    // console.log(req)
    next();
})
app.use("/api/requests",requestRouter)
app.use("/api/auth",authController);
app.use("/api/course",courseRouter);
app.use("/api/category",categoryRouter);
app.use("/api/languages",languageRouter);
app.use("/api/bookings",bookingRouter);
app.use("/api/profile",profileRouter)
app.use("/api/tutors",tutorRouter);
module.exports = app;