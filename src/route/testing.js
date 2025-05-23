const express = require("express");
 
const { getTeacherRequests } = require("../controller/Teachers/teacherRequestController");
const { signup, handleCourseRequest, teacherRequest, sendMoney, sendBookingConfirmation, signupUser, verifyEmail } = require("../controller/templatesController");
 
const routereeee = express.Router();
// routereeee.post("/signuptemplate", signup);
routereeee.post("/signupUser", signupUser);
routereeee.post("/verifyptemplate", verifyEmail); 
routereeee.post("/coursepublish", handleCourseRequest);
routereeee.post("/teacherrequest", teacherRequest);  
routereeee.post("/sendpaymentemail", sendMoney);
routereeee.post("/booking-confirmation", sendBookingConfirmation); 

module.exports = routereeee;
