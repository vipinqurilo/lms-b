const { changePassword } = require("../controller/authController");
const { editPersonalInfo, getMyProfile, editSocialLinks } = require("../controller/Profile");
const { getTeacherProfile,  editPaymentInfo,  editExperience, editEducation, editLanguages, editSubjects, editAvailabilityCalendar, getAvailabilityCalendar } = require("../controller/profile/teacherProfileController");
const { createTeacherRequest, getTeacherRequests, rejectedTeacherRequest, approvedTeacherRequest } = require("../controller/Requests/teacherRequestController");
const router=require("express").Router();

const { authMiddleware } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
router.get("/teacher/:teacherId",getTeacherProfile)
router.use(authMiddleware)

//User Personal Info and Profile
router.get("/",getMyProfile);
router.put("/personal-info",editPersonalInfo);

//Teacher Account Settings
router.put("/subjects",authorizeRoles("teacher"),editSubjects);
router.put("/languages",authorizeRoles("teacher"),editLanguages)
router.put("/experience",authorizeRoles("teacher"),editExperience);
router.put("/education",authorizeRoles("teacher"),editEducation);
router.put("/availablity-calendar",authorizeRoles("teacher"),editAvailabilityCalendar);
router.get("/availablity-calendar",authorizeRoles("teacher"),getAvailabilityCalendar);
router.put("/payment-info",authorizeRoles("teacher"),editPaymentInfo);
router.put("/social-links",authorizeRoles("teacher,student,teacher"),editSocialLinks);
router.patch('/change-password',changePassword);
const profileRouter=router;
module.exports=profileRouter;