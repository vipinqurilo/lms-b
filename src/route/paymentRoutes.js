const bodyParser = require("body-parser");
const { createBookingPayment, verifyStripePayment } = require("../controller/Payments/stripeController");
const { getStudents } = require("../controller/studentController");

const { authMiddleware } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const router=require("express").Router();

router.post("/stripe/booking",authMiddleware,createBookingPayment);
router.post("/stripe/webhook",bodyParser.raw({ type: "application/json" }),verifyStripePayment)
const paymentRouter=router;
module.exports=paymentRouter;