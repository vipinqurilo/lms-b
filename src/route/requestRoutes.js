const { createTeacherRequest, getTeacherRequests, rejectedTeacherRequest, approvedTeacherRequest, editTeacherRequest, getTeacherRequestsById } = require("../controller/Teachers/teacherRequestController");
const { authMiddleware } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router=require("express").Router()

router.use(authMiddleware)
//Teacher Requests
router.post("/teacher",authMiddleware, authorizeRoles("admin,teacher"),createTeacherRequest);
router.put("/teacher/:requestId",authMiddleware,authorizeRoles("teacher"),editTeacherRequest);
router.get("/teacher/:requestId",authMiddleware,authorizeRoles("admin,teacher"),getTeacherRequestsById);
// router.put("/teacher/:requestId",updateTeacherRequest);
router.put("/teacher/approve/:requestId",authMiddleware,authorizeRoles("admin"),approvedTeacherRequest);
router.put("/teacher/reject/:requestId",authMiddleware,authorizeRoles("admin"),rejectedTeacherRequest);
router.get("/teachers",authMiddleware,authorizeRoles("admin"),getTeacherRequests);

const requestRouter=router;
module.exports=requestRouter;