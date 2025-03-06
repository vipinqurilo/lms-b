const bodyParser = require("body-parser");
const { createBookingPayment, verifyStripePayment, createCoursePayment } = require("../controller/Payments/stripeController");
const { getStudents } = require("../controller/studentController");
const paypalController=require("../controller/Payments/paypalController");
const { authMiddleware } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const router=require("express").Router();

router.post("/stripe/booking",authMiddleware,createBookingPayment);
router.post("/stripe/course",authMiddleware,createCoursePayment);

//Paypal Routes
router.post("/paypal/booking",authMiddleware,paypalController.createBookingPayment);
router.post("paypal/booking/capture",authMiddleware,paypalController.captureBookingPayment);
//Webhook For handling Payment Status
router.post("/stripe/webhook",bodyParser.raw({ type: "application/json" }),verifyStripePayment)
const paymentRouter=router;
module.exports=paymentRouter;