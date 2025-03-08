const express = require("express");
const { sendEmail, loginUser, handleCourseRequest, sendPaymentEmail, sendMoney, sendBookingConfirmation } = require("../controller/testing");
 
const routereeee = express.Router();

routereeee.post("/send", sendEmail);
routereeee.post("/loginsend", loginUser);
routereeee.post("/coursepublish", handleCourseRequest);
routereeee.post("/sendpaymentemail", sendMoney);
routereeee.post("/booking-confirmation", sendBookingConfirmation); // Add this line

module.exports = routereeee;
