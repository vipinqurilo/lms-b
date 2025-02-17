const TeacherProfileModel = require("../model/teacherProfileModel");
const walletModel = require("../model/walletModel");
const withdrawalModel = require("../model/withdrawModel");
const moment=require('moment');
exports.requestWithdrawal = async (req, res) => {
  try {
    const { amount, paymentMethod } = req.body;
    const teacherProfile = await TeacherProfileModel.findOne({
      userId: req.user.id,
    });
    console.log("teacherProfile", teacherProfile);
    if (!teacherProfile)
      return res
        .status(404)
        .json({ success: false, message: "Teacher profile not found" });
    if (!teacherProfile.paymentInfo)
      return res
        .status(404)
        .json({ success: false, message: "Payment info not found" });
    const { paypalEmail, ...bankDetails } = teacherProfile.paymentInfo;
    // Ensure the teacher has enough balance (Assuming wallet system)
    const teacherWallet = await walletModel.findOne({ userId: req.user.id });

    if (!teacherWallet || teacherWallet.balance < amount) {
      return res
        .status(400)
        .json({ success: false, message: "Insufficient balance" });
    }

    // Validate payment method
    if (paymentMethod === "paypal" && !paypalEmail) {
      return res
        .status(400)
        .json({ success: false, message: "PayPal email is required" });
    }
    if (paymentMethod === "bank_transfer" && !bankDetails?.accountNumber) {
      return res
        .status(400)
        .json({ success: false, message: "Bank details are required" });
    }
    const existingWithdrawalRequest=await withdrawalModel.findOne({userId:req.user.id,approvalStatus:"pending"});
    if(existingWithdrawalRequest)
        return res.status(400).json({ success: false, message: "Withdrawal request already submitted" });
    // Create withdrawal request
    const withdrawal = new withdrawalModel({
      userId: req.user.id,
      amount,
      paymentMethod,
      paypalEmail: paymentMethod === "paypal" ? paypalEmail : undefined,
      bankDetails: paymentMethod === "bank_transfer" ? bankDetails : undefined,
      approvalStatus: "pending",
    });

    await withdrawal.save();

    res.json({ success: true, message: "Withdrawal request submitted",data:withdrawal });
  } catch (error) {
    console.log(error, "error");
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.getWtihdrawals = async (req, res) => {
  try {
    const {search, approvalStatus, payoutStatus, startDate, endDate, teacherId,page=1,limit=10 } =
      req.query;
    const skip=(page-1)*limit;
    //Approval Status
    const query={}
    if (approvalStatus && approvalStatus !== "")
      query.approvalStatus = approvalStatus;
    //Payout Status
    if (payoutStatus && payoutStatus !== "") query.payoutStatus = payoutStatus;
   
    // Date range filtering
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(moment( startDate ).format('YYYY-MM-DD[T00:00:00.000Z]'))
        if (endDate) query.createdAt.$lte = new Date(moment( endDate ).format('YYYY-MM-DD[T23:59:59.000Z]'))
    }
    //By Particular Teacher
    if (teacherId && teacherId !== "")
      query.teacherId = new mongoose.Types.ObjectId(teacherId);
    const withdrawals = await withdrawalModel.aggregate([
      {
        $match: query,
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      ...(search ? [{
        $match: {
            $or: req.user.role === 'admin' ? [
                { "user.firstName": { $regex: search, $options: "i" } },
                { "user.lastName": { $regex: search, $options: "i" } },
                { "user.email": { $regex: search, $options: "i" } },
            ] :[
              { "approvalStatus": { $regex: search, $options: "i" } },
              { "payoutStatus": { $regex: search, $options: "i" } },
            ]
        }
    }] : []),
     {
        $skip: skip,
     },
     {
        $limit: limit,
     },
     {
        $project:{
            _id:1,
            userId:1,
            amount:1,
            paymentMethod:1,
            paypalEmail:1,
            bankDetails:1,
            approvalStatus:1,
            payoutStatus:1,
            createdAt:1,
            user:{
                _id:1,
                firstName:1,
                lastName:1,
                email:1,
                profilePhoto:1
            }
        }
     }
     
    ]);
    const countDocuments=await withdrawalModel.countDocuments(query);
    res.json({
      success: true,
      message: "Withdrawals Fetched succesfully",
      data: withdrawals,
      total:countDocuments,
      currentPage:page,
      totalPages:Math.ceil(countDocuments/limit)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.approveOrRejectWithdrawals = async (req, res) => {
  try {
    const { action,rejectionReason} = req.body;
    const withdrawal = await withdrawalModel.findById(req.params.withdrawalId);
    if (!withdrawal) {
      return res
        .status(404)
        .json({ success: false, message: "Withdrawal request not found" });
    }

    if (withdrawal.approvalStatus !== "pending") {
      return res
        .status(400)
        .json({ success: false, message: "Request already processed" });
    }

    let wallet = await walletModel.findOne({ teacherId: withdrawal.teacherId });
    if (!wallet || wallet.balance < withdrawal.amount) {
      return res
        .status(400)
        .json({ success: false, message: "Insufficient wallet balance" });
    }

    if (action === "approve") {
      withdrawal.approvalStatus = "approved";
      wallet.balance -= withdrawal.amount;
      await withdrawal.save();
      await wallet.save();

      if (withdrawal.paymentMethod === "paypal") {
        // await processPayPalPayment(withdrawal.paypalEmail, withdrawal.amount);
      }
      if (withdrawal.paymentMethod === "bank_transfer") {
        // await processBankTransfer(withdrawal.paypalEmail, withdrawal.amount);
      }
      return res.json({
        success: true,
        message: "Withdrawal approved and processed",
      });
    } else {
      withdrawal.approvalStatus = "rejected";
      withdrawal.rejectionReason=rejectionReason
      await withdrawal.save();
      return res.json({ success: true, message: "Withdrawal rejected" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
