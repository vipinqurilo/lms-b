const { createTeacherRequest, getTeacherRequests, rejectedTeacherRequest, approvedTeacherRequest } = require("../controller/Requests/teacherRequestController");
const { getTutors } = require("../controller/tutorController");
const { authMiddleware } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const router=require("express").Router();
router.get("/",getTutors);
// router.use(authMiddleware,authorizeRoles("admin,teacher"))


const tutorRouter=router;
module.exports=tutorRouter;