const mongoose = require("mongoose")

const OrderSchema = new mongoose.Schema({
    sessionId: { type: String },
    amountTotal: { type: Number },
    currency: { type: String },
    paymentStatus: { type: String },
    paymentIntentId:{type:String,default:null}
  });
  
  const stripeModel = mongoose.model("paymentStatus", OrderSchema);
  module.exports = stripeModel