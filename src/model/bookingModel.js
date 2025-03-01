const mongoose = require("mongoose");


const bookingSchema=new mongoose.Schema({
    teacherId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
    studentId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
    subjectId:{type:mongoose.Schema.Types.ObjectId,ref:'Subcategory',required:true},
    sessionDate:{type:Date,required:true},
    sessionStartTime:{type:Date,required:true},
    sessionEndTime:{type:Date,required:true},
    sessionDuration:{type:Number,required:true},
    status:{type:String,required:true,enum: ["scheduled", "confirmed","reschedule_in_progress","rescheduled", "cancelled", "completed"], 
        default: "scheduled"},
    amount:{type:Number,required:true},
    paymentId:{type:mongoose.Schema.Types.ObjectId,ref:'Payment',required:true},
    meetingPlatform: { type: String, enum: ["Google Meet", "Zoom"], default: null },
    meetingLink: { type: String, default: null },
    meetingUsername: { type: String, default: null },
    meetingPassword: { type: String, default: null },
    rescheduleRequest: {
      newTime: { type: String },
      reason: { type: String },
      status: {
        type: String,
        enum: ["pending", "accepted", "denied"],
        default: "pending",
      },
    },
    cancellationReason: { type: String },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Booking", bookingSchema);