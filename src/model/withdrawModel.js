const mongoose = require("mongoose");

const withdrawalSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["paypal", "bank_transfer"], required: true },
    paypalEmail: { type: String },  // Required if PayPal
    bankDetails: {
        accountName: String,
        accountNumber: String,
        bankName: String,
        ifscCode: String,
    },
    approvalStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    rejectionReason: { type: String },  
    payoutId: { type: String },
    payoutStatus: { type: String, enum: ["not_initiated","processing","success", "failed"] },
    createdAt: { type: Date, default: Date.now },
});

const withdrawalModel = mongoose.model("Withdrawal", withdrawalSchema);
module.exports = withdrawalModel;
