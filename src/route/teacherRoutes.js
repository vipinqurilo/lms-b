

const { getTeachers } = require("../controller/Teachers/teacherController");
const { createTeacherRequest, editTeacherRequest, getTeacherRequestsById, approvedTeacherRequest, rejectedTeacherRequest, getTeacherRequests } = require("../controller/Teachers/teacherRequestController");
const { authMiddleware } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const router=require("express").Router();

//Teacher
router.get("/",authMiddleware,getTeachers);

//Teacher Requests
router.post("/request",authMiddleware,authorizeRoles("admin,teacher"),createTeacherRequest);
router.put("/request/:requestId",authMiddleware,authorizeRoles("teacher"),editTeacherRequest);
router.get("/request/:requestId",authMiddleware,authorizeRoles("admin,teacher"),getTeacherRequestsById);
router.put("/request/approve/:requestId",authMiddleware,authorizeRoles("admin"),approvedTeacherRequest);
router.put("/request/reject/:requestId",authMiddleware, authorizeRoles("admin"),rejectedTeacherRequest);
router.get("/request/all",authMiddleware, authorizeRoles("admin"),getTeacherRequests);
const teacherRouter=router;
module.exports=teacherRouter;