

const { getTeachers } = require("../controller/Teachers/teacherController");
const { createTeacherRequest, editTeacherRequest, getTeacherRequestsById, approvedTeacherRequest, rejectedTeacherRequest, getTeacherRequests } = require("../controller/Teachers/teacherRequestController");
const { authMiddleware } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const router=require("express").Router();

//Teacher
router.get("/",authMiddleware,getTeachers);

//Teacher Requests
router.post("/request",authMiddleware,authorizeRoles("admin,teacher"),createTeacherRequest);
router.put("/request/:requestId",authorizeRoles("teacher"),editTeacherRequest);
router.get("/request/:requestId",authorizeRoles("admin,teacher"),getTeacherRequestsById);
router.put("/request/approve/:requestId",authorizeRoles("admin"),approvedTeacherRequest);
router.put("/request/reject/:requestId",authorizeRoles("admin"),rejectedTeacherRequest);
router.get("/request/all",authorizeRoles("admin"),getTeacherRequests);
const teacherRouter=router;
module.exports=teacherRouter;