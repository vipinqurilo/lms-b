
const { request } = require("../../app");
const { getWalletForUser } = require("../controller/walletController");
const { requestWithdrawal, approveOrRejectWithdrawals, getWtihdrawals } = require("../controller/withdrawalController");
const { authMiddleware } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const router=require("express").Router();
router.post("/request",authMiddleware,requestWithdrawal);
router.put("/:withdrawalId/action",authMiddleware,authorizeRoles("admin"),approveOrRejectWithdrawals);
router.get("/",authMiddleware,getWtihdrawals);
// router.use(authMiddleware,authorizeRoles("admin,teacher"))

const withdrawRouter=router;
module.exports=withdrawRouter;