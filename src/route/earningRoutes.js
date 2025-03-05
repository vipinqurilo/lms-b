const { getCourseEarnings, getTutoringEarnings } = require("../controller/earningController");
const { authMiddleware } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const router=require("express").Router();


router.get("/tution-sessions",authMiddleware,authorizeRoles("teacher"),getTutoringEarnings);
router.get("/course-purchases", authMiddleware,authorizeRoles("teacher"), getCourseEarnings);
// router.post("/settlements", authMiddleware, getSettlements);



const earningRouter=router;
module.exports=earningRouter;