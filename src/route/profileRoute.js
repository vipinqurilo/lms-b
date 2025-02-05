const { changePassword } = require("../controller/authController");
const { editPersonalInfo, getMyProfile, editSocialLinks } = require("../controller/Profile");
const { getTeacherProfile,  editPaymentInfo,  editExperience, editEducation, editLanguages, editSubjects, editAvailabilityCalendar } = require("../controller/profile/teacherProfileController");
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
router.put("/subjects",editSubjects);
router.put("/languages",editLanguages)
router.put("/experience",editExperience);
router.put("/education",editEducation);
router.put("/availablity-calendar",editAvailabilityCalendar);
router.put("/payment-info",editPaymentInfo);
router.put("/social-links",editSocialLinks);
router.patch('/change-password',changePassword);
const profileRouter=router;
module.exports=profileRouter;