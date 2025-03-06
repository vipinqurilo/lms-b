const mongoose = require('mongoose');

const settlementHistorySchema = new mongoose.Schema({
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  weekStartDate: { type: Date, required: true },
  weekEndDate: { type: Date, required: true },
  settledDate: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('SettlementHistory', settlementHistorySchema);
