const { createBooking, getBookings } = require("../controller/bookingController");
const router=require("express").Router();


router.post("/",createBooking);
router.get("/",getBookings);
bookingRouter=router
module.exports=bookingRouter;