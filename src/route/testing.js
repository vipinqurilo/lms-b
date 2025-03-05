const express = require("express");
const { sendEmail, loginUser, handleCourseRequest, sendPaymentEmail, sendMoney } = require("../controller/testing");
 
const routereeee = express.Router();

routereeee.post("/send", sendEmail);
routereeee.post("/loginsend", loginUser);
routereeee.post("/coursepublish", handleCourseRequest);
routereeee.post("/sendpaymentemail", sendMoney);


module.exports = routereeee;
