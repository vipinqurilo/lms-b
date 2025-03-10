const express = require("express");
const { sendEmail, loginUser, handleCourseRequest, sendPaymentEmail, sendMoney, sendBookingConfirmation, teacherRequest, signupUser, signup } = require("../controller/testing");
const { getTeacherRequests } = require("../controller/Teachers/teacherRequestController");
 
const routereeee = express.Router();

routereeee.post("/signuptemplate", signup);
routereeee.post("/signupUser", signupUser);
routereeee.post("/coursepublish", handleCourseRequest);
routereeee.post("/teacherrequest", teacherRequest);
routereeee.post("/sendpaymentemail", sendMoney);
routereeee.post("/booking-confirmation", sendBookingConfirmation); // Add this line

module.exports = routereeee;
