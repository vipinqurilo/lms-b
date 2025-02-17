const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    balance: { type: Number, default: 1000 }, 
    transactions: [
        {
            type: { type: String, enum: ["deposit", "withdrawal"], required: true }, 
            status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
            paymentMethod: { type: String, enum: ["paypal", "bank_transfer"] },
            referenceId: { type: String }, 
            createdAt: { type: Date, default: Date.now },
        },
    ],
});

const walletModel = mongoose.model("Wallet", walletSchema);
module.exports = walletModel;
