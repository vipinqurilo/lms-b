const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Who made the payment
    amount: { type: Number, required: true },
    currency: { type: String, default: "R" },
    paymentFor:{type:String,enum:["course","booking"]},
    status: { type: String, enum: ["pending", "succeeded", "refunded", "failed","cancelled","expired"], default: "Pending" },
    sessionId: { type: String, required: true, unique: true },
    transactionId: { type: String }, // Payment Gateway Transaction ID
    paymentMethod: { type: String, enum: ["paypal","stripe", "wallet", "bank_transfer", "payfast"], required: true },
    refundStatus: { type: String, enum: ["not_initiated", "processing", "completed"] },
    refundAmount: { type: Number, default: 0 },
    paymentStatus:{type:String,enum:["paid","unpaid",'failed'],default:"unpaid"},
    metadata:{type:Object,required:true}
    
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
    