const mongoose = require("mongoose")

const orderSchema = new mongoose.Schema({
    orderId:{type:String,required:true},
    studentId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
    course:{type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true},
    sessionId: { type: String },
    amountTotal: { type: Number , required: true},
    currency: { type: String },
    paymentStatus: { type: String },
    paymentIntentId:{type:String,default:null}
},{
    timestamps:true
})

const OrderModel = mongoose.model('order',orderSchema)
module.exports = OrderModel