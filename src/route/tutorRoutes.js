const { createTeacherRequest, getTeacherRequests, rejectedTeacherRequest, approvedTeacherRequest } = require("../controller/Teachers/teacherRequestController");
const { getTutors, getDashboard } = require("../controller/tutorController");
const { authMiddleware } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const router=require("express").Router();
router.get("/",getTutors);
router.get("/dashboard",authMiddleware,authorizeRoles("teacher"),  getDashboard);
// router.use(authMiddleware,authorizeRoles("admin,teacher"))

const tutorRouter=router;
module.exports=tutorRouter;