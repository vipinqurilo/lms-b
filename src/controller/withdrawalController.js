const TeacherProfileModel = require("../model/teacherProfileModel");
const walletModel = require("../model/walletModel");
const withdrawalModel = require("../model/withdrawModel");
const moment = require("moment");
const mongoose = require("mongoose");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const processPayoutPayfast = require("../utils/processPayoutPayfast");

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
    const existingWithdrawalRequest = await withdrawalModel.findOne({
      userId: req.user.id,
      approvalStatus: "pending",
    });
    if (existingWithdrawalRequest)
      return res.status(400).json({
        success: false,
        message: "Withdrawal request already submitted",
      });
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

    res.json({
      success: true,
      message: "Withdrawal request submitted",
      data: withdrawal,
    });
  } catch (error) {
    console.log(error, "error");
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getWtihdrawals = async (req, res) => {
  try {
    const {
      search,
      approvalStatus,
      teacherId,
      payoutStatus,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.query;
    const skip = (page - 1) * limit;
    //Approval Status
    const query = {};
    if (req.user.role == "teacher")
      query.userId = new mongoose.Types.ObjectId(req.user.id);
    if (req.user.role == "admin" && teacherId && teacherId !== "")
      query.userId = new mongoose.Types.ObjectId(teacherId);
    if (approvalStatus && approvalStatus !== "")
      query.approvalStatus = approvalStatus;
    //Payout Status
    if (payoutStatus && payoutStatus !== "") query.payoutStatus = payoutStatus;

    // Date range filtering
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate)
        query.createdAt.$gte = new Date(
          moment(startDate).format("YYYY-MM-DD[T00:00:00.000Z]")
        );
      if (endDate)
        query.createdAt.$lte = new Date(
          moment(endDate).format("YYYY-MM-DD[T23:59:59.000Z]")
        );
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
      ...(search
        ? [
            {
              $match: {
                $or:
                  req.user.role === "admin"
                    ? [
                        { "user.firstName": { $regex: search, $options: "i" } },
                        { "user.lastName": { $regex: search, $options: "i" } },
                        { "user.email": { $regex: search, $options: "i" } },
                      ]
                    : [
                        { approvalStatus: { $regex: search, $options: "i" } },
                        { payoutStatus: { $regex: search, $options: "i" } },
                      ],
              },
            },
          ]
        : []),
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          amount: 1,
          paymentMethod: 1,
          paypalEmail: 1,
          bankDetails: 1,
          approvalStatus: 1,
          payoutStatus: 1,
          createdAt: 1,
          user: {
            _id: 1,
            firstName: 1,
            lastName: 1,
            email: 1,
            profilePhoto: 1,
          },
        },
      },
    ]);
    const countDocuments = await withdrawalModel.countDocuments(query);
    res.json({
      success: true,
      message: "Withdrawals Fetched succesfully",
      data: withdrawals,
      total: countDocuments,
      currentPage: page,
      totalPages: Math.ceil(countDocuments / limit),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

async function checkBalance() {
  const balance = await stripe.balance.retrieve();
  console.log(JSON.stringify(balance, null, 2));
}

// checkBalance();

async function finBankAccount() {
  const accounts = await stripe.accounts.listExternalAccounts(
    "acct_1R25YOPTF4roHIXv", // Your connected account ID
    { object: "bank_account" }
  );

  console.log(accounts);
}
// finBankAccount();

async function retreiveInfo() {
  const account = await stripe.accounts.retrieve("acct_1R25YOPTF4roHIXv");
  console.log(account.payouts_enabled); // Should be true
  console.log(account.requirements);
  console.log(account.capabilities);
}
retreiveInfo();

async function processStripeBankTransfer({
  stripeBankAccountId,
  amount,
  stripeAccountId,
}) {
  try {
    const transfer = await stripe.transfers.create({
      amount: 100,
      currency: "zar",
      destination: stripeAccountId,
    });

    const payout = await stripe.payouts.create(
      {
        amount: Math.round(amount * 100),
        currency: "zar",
        destination: stripeAccountId,
        method: "standard",
      },
      {
        stripeAccount: stripeAccountId,
      }
    );

    console.log("Stripe Payout:", payout);

    if (payout.status === "paid") {
      console.log("Payout completed");
      return { success: true, message: "Payout completed" };
    } else {
      return {
        success: false,
        message: `Payout failed with status: ${payout.status}`,
      };
    }
  } catch (error) {
    console.error("Stripe Payout Error:", error);
    return { success: false, message: error.message };
  }
}

exports.approveOrRejectWithdrawals = async (req, res) => {
  try {
    const { action, rejectionReason } = req.body;

    console.log(action, rejectionReason);
    const withdrawal = await withdrawalModel.findById(req.params.withdrawalId);
    const userId = withdrawal.userId;
    const teacherProfile = await TeacherProfileModel.findOne({ userId });

    if (!teacherProfile)
      return res
        .status(404)
        .json({ success: false, message: "Teacher profile not found" });

    const paymentInfo = teacherProfile.paymentInfo;

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
      // withdrawal.approvalStatus = "approved";
      // wallet.balance -= withdrawal.amount;
      // withdrawal.payoutStatus = "processing";
      // await withdrawal.save();
      // await wallet.save();

      if (withdrawal.paymentMethod === "paypal") {
        // await processPayPalPayment(withdrawal.paypalEmail, withdrawal.amount);
      }
      if (withdrawal.paymentMethod === "payfast") {
        const payout = await processPayoutPayfast(
          withdrawal.payfastEmail,
          withdrawal.amount,
          "Withdrawal Payout"
        );

        if (payout.success) {
          withdrawal.payoutStatus = "success";
        } else {
          withdrawal.payoutStatus = "failed";
        }

        await withdrawal.save();
      }
      if (withdrawal.paymentMethod === "bank_transfer") {
        // await processBankTransfer(withdrawal.paypalEmail, withdrawal.amount);
        const stripePayout = await processStripeBankTransfer({
          stripeBankAccountId: paymentInfo.stripeBankAccountId,
          amount: 100,
          stripeAccountId: teacherProfile.stripeAccountId,
        });

        if (stripePayout.success) {
          withdrawal.payoutStatus = "completed";
        } else {
          withdrawal.payoutStatus = "failed";
        }

        await withdrawal.save();
      }
      return res.json({
        success: true,
        message: "Withdrawal approved successfully",
      });
    } else {
      withdrawal.approvalStatus = "rejected";
      withdrawal.rejectionReason = rejectionReason;
      await withdrawal.save();
      return res.json({ success: true, message: "Withdrawal rejected" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
