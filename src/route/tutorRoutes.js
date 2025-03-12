const { getTutors, getAvailabilityCalendarByTeacherId,getDashboard } = require("../controller/tutorController");
const { authMiddleware } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const router=require("express").Router();
router.get("/",getTutors);
router.get("/dashboard",authMiddleware,authorizeRoles("teacher"),  getDashboard);
router.get("/avaiablity-calendar/:teacherId",getAvailabilityCalendarByTeacherId)
// router.use(authMiddleware,authorizeRoles("admin,teacher"))

const tutorRouter=router;
module.exports=tutorRouter; 