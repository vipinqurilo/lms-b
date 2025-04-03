const bodyParser = require("body-parser");
const { createBookingPayment, verifyStripePayment, createCoursePayment } = require("../controller/Payments/stripeController");
const { getStudents } = require("../controller/studentController");
const paypalController = require("../controller/Payments/paypalController");
const payfastController = require("../controller/Payments/payfastController");
const { authMiddleware } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const router = require("express").Router();

router.post("/stripe/booking", authMiddleware, createBookingPayment);
router.post("/stripe/course", authMiddleware, createCoursePayment);

// Paypal Routes
router.post("/paypal/booking", authMiddleware, paypalController.createBookingPayment);
router.post("/paypal/booking/capture", authMiddleware, paypalController.captureBookingPayment);

// PayFast Routes
router.post("/payfast/booking", authMiddleware, payfastController.createBookingCheckout);
router.post("/payfast/course", authMiddleware, payfastController.createCourseCheckout);
router.post("/payfast/notify", payfastController.handlePayFastIPN);
router.get("/payfast/verify", payfastController.verifyPayment);
// router.post("/payfast/notify", bodyParser.json(), payfastController.handleNotification);
// router.get("/payfast/notify", payfastController.handleNotification);
// router.post("/payfast/verify", payfastController.verifyPayment);

// Webhook For handling Payment Status
router.post("/stripe/webhook", bodyParser.raw({ type: "application/json" }), verifyStripePayment);

const paymentRouter = router;
module.exports = paymentRouter;