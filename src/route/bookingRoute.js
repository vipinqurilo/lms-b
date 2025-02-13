const { createBooking, getBookings } = require("../controller/bookingController");
const { authMiddleware } = require("../middleware/authMiddleware");
const router=require("express").Router();

router.use(authMiddleware)
router.post("/",createBooking);
router.get("/",getBookings);

bookingRouter=router
module.exports=bookingRouter;