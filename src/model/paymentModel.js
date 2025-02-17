const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Who made the payment
    paymentFor: { type: String, enum: ["Booking", "Course"], required: true }, // Type of payment
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null }, // If for booking
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null }, // If for course
    amount: { type: Number, required: true },
    currency: { type: String, default: "ZAR" },
    status: { type: String, enum: ["Pending", "Completed", "Refunded", "Failed"], default: "Pending" },
    transactionId: { type: String, required: true, unique: true }, // Payment Gateway Transaction ID
    paymentMethod: { type: String, enum: ["Card", "Paypal","Stripe", "Net Banking", "Wallet", "Bank Transfer"], required: true },
    refundStatus: { type: String, enum: ["Not Initiated", "Processing", "Completed"], default: "Not Initiated" },
    refundAmount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
