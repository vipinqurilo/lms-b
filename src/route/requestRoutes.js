const { createTeacherRequest, getTeacherRequests, rejectedTeacherRequest, approvedTeacherRequest } = require("../controller/Requests/teacherRequestController");
const { authMiddleware } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router=require("express").Router();

router.use(authMiddleware)
//Teacher Requests
router.post("/teacher",authorizeRoles("admin,teacher"),createTeacherRequest);
// router.put("/teacher/:requestId",updateTeacherRequest);
router.put("/teacher/approve/:requestId",authorizeRoles("admin"),approvedTeacherRequest);
router.put("/teacher/reject/:requestId",authorizeRoles("admin"),rejectedTeacherRequest);
router.get("/teachers",authorizeRoles("admin"),getTeacherRequests);

const requestRouter=router;
module.exports=requestRouter;