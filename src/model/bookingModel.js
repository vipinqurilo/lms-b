const mongoose=require('mongoose');

const bookingSchema=new mongoose.Schema({
    teacherId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
    studentId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
    subject:{type:mongoose.Schema.Types.ObjectId,ref:'Subcategory',required:true},
    scheduledDate:{type:Date,required:true},
    sessionStartTime:{type:Date,required:true},
    sessionEndTime:{type:Date,required:true},
    sessionDuration:{type:Number,required:true},
    status:{type:String,required:true,enum: ["Scheduled", "Confirmed", "Cancelled", "Completed"], 
        default: "Scheduled"},
    paymentId:{type:mongoose.Schema.Types.ObjectId,ref:'Payment',required:true},
},{timestamps:true})
module.exports=mongoose.model('Booking',bookingSchema);