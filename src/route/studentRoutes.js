const { getStudentProfile, getEnrolledCourses, getEnrolledCourseIds } = require("../controller/Profile/studentprofileController");
const { getStudents } = require("../controller/studentController");

const { authMiddleware } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const router=require("express").Router();

router.get("/",authMiddleware,getStudents);
router.get('/profile',authMiddleware,getStudentProfile);
router.get('/enrolled-courses', authMiddleware, getEnrolledCourses);
router.get('/enrolled-course-ids', authMiddleware, getEnrolledCourseIds);

const studentRouter=router;
module.exports=studentRouter;