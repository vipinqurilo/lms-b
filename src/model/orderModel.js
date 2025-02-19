const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    sessionId: { type: String, default: null },
    amountTotal: { type: Number, required: true },
    currency: { type: String, default: "usd" },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    paymentIntentId: { type: String, default: null },
  },
  { timestamps: true }
);

const OrderModel = mongoose.model("Order", orderSchema);
module.exports = OrderModel;
