const { createBooking, getBookings, confirmBooking, editBookingMeetingInfo, cancelBooking, rescheduleResponseBooking, rescheduleRequestBooking } = require("../controller/bookingController");
const { authMiddleware } = require("../middleware/authMiddleware");
const router=require("express").Router();

router.use(authMiddleware)
router.post("/",createBooking);
router.get("/",getBookings);
router.put("/:bookingId/confirm",confirmBooking)
router.put("/:bookingId/meetingInfo",editBookingMeetingInfo)
router.put("/:bookingId/cancel",cancelBooking)
router.put("/:bookingId/reschedule-request",rescheduleRequestBooking);
router.put("/:bookingId/reschedule-response",rescheduleResponseBooking)

bookingRouter=router
module.exports=bookingRouter;