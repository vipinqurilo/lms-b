const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['credit', 'debit'], required: true },
  description: { type: String },
  weekStartDate: { type: Date, required: true }, // Start date of settlement week
  weekEndDate: { type: Date, required: true },   // End date of settlement week
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
