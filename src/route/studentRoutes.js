const { getStudents } = require("../controller/studentController");

const { authMiddleware } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const router=require("express").Router();

router.get("/",authMiddleware,getStudents);

const studentRouter=router;
module.exports=studentRouter;