const mongoose = require("mongoose");
const experienceSchema = require("./schemas/experienceSchema");
const educationSchema = require("./schemas/educationSchema");
const teacherProfileSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    experience: [experienceSchema],
    education:[educationSchema],
    subjectsTaught: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subcategory", required: true }],//Array of subjects (subcategories)
    languagesSpoken: [{ type: mongoose.Schema.Types.ObjectId, ref: "Language", required: true }],
    tutionSlots: {
      type: [Number],
      enum: [15, 30, 45, 60],
      default: [30, 60]
    },
    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
    tutionBookings:[{ type: mongoose.Schema.Types.ObjectId, ref: "Booking" }],
    paymentInfo: {
        bankName: { type: String },
        accountNumber: { type: String },
        accountHolderName: { type: String },
        ifscCode: { type: String },
        bankAddress: { type: String },
        paypalEmail: { type: String }
    },
    calendar: { type: mongoose.Schema.Types.ObjectId, ref: "Calendar" },
  },{
    timestamps: true
  });
  
  const TeacherProfileModel = mongoose.model("TeacherProfile", teacherProfileSchema);
  module.exports = TeacherProfileModel;
  