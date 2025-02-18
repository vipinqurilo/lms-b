const { getWalletForUser, getWalletTransactions, addTransaction } = require("../controller/walletController");
const { authMiddleware } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const router=require("express").Router();
router.get("/",authMiddleware,getWalletForUser);
router.get("/transactions", authMiddleware, getWalletTransactions);
router.post("/transaction", authMiddleware, addTransaction);
// router.use(authMiddleware,authorizeRoles("admin,teacher"))


const walletRouter=router;
module.exports=walletRouter;