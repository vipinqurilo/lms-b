const { getTutors } = require("../controller/tutorController");
const { getUsers, updateUserStatus } = require("../controller/userController");
const { authMiddleware } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const router=require("express").Router();
router.use(authMiddleware)
router.get("/",authorizeRoles("admin"),getUsers);
router.patch("/:userId/user-status",authorizeRoles("admin"),updateUserStatus);


const userRoutes=router;
module.exports=userRoutes;