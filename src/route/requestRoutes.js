const { createTeacherRequest, getTeacherRequests, rejectedTeacherRequest, approvedTeacherRequest } = require("../controller/Requests/teacherRequestController");
const { authMiddleware } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router=require("express").Router();

router.use(authMiddleware,authorizeRoles("admin,teacher"))
//Teacher Requests
router.post("/teacher",createTeacherRequest);
// router.put("/teacher/:requestId",updateTeacherRequest);
router.put("/teacher/approve/:requestId",approvedTeacherRequest);
router.put("/teacher/reject/:requestId",rejectedTeacherRequest);
router.get("/teachers",getTeacherRequests);

const requestRouter=router;
module.exports=requestRouter;