const { getCourseEarnings, getTutoringEarnings } = require("../controller/earningController");
const { getWalletForUser, getWalletTransactions, addTransaction } = require("../controller/walletController");
const { authMiddleware } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const router=require("express").Router();
router.get("/tution-sessions",authMiddleware,getTutoringEarnings);
router.get("/course-purchases", authMiddleware, getCourseEarnings);
// router.post("/settlements", authMiddleware, getSettlements);
// router.use(authMiddleware,authorizeRoles("admin,teacher"))


const earningRouter=router;
module.exports=earningRouter;