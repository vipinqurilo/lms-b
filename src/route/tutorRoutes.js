const { getTutors, getAvailabilityCalendarByTeacherId } = require("../controller/tutorController");
const router=require("express").Router();
router.get("/",getTutors);
router.get("/avaiablity-calendar/:teacherId",getAvailabilityCalendarByTeacherId)
// router.use(authMiddleware,authorizeRoles("admin,teacher"))


const tutorRouter=router;
module.exports=tutorRouter;