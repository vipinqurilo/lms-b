
const { getCourseSalesData, getTutionsSalesData } = require("../controller/salesController");
const { authMiddleware } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const router=require("express").Router();

router.get("/tution-sessions",authMiddleware,authorizeRoles("admin"),getTutionsSalesData);
router.get("/course-purchases", authMiddleware,authorizeRoles("admin"), getCourseSalesData);


const saleRouter=router;
module.exports=saleRouter;