
const { getWalletForUser } = require("../controller/walletController");
const { authMiddleware } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const router=require("express").Router();
router.get("/",authMiddleware,getWalletForUser);
// router.use(authMiddleware,authorizeRoles("admin,teacher"))


const walletRouter=router;
module.exports=walletRouter;