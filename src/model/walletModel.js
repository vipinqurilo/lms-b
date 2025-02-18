const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    balance: { type: Number, default: 1000 }, 
    transactions: [
        {
            type: { type: String, enum: ["deposit", "withdrawal"], required: true }, 
            amount: { type: Number, required: true },
            description: { type: String, required: true },
            createdAt: { type: Date, default: Date.now },
        },
    ],
});

const walletModel = mongoose.model("Wallet", walletSchema);
module.exports = walletModel;
