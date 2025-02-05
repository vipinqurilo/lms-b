const mongoose = require("mongoose");
const studentProfileSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
    tutionBookings:[{type:mongoose.Schema.Types.ObjectId,ref:"Booking"}],
  },{
    timestamps: true
  });
  
  const StudentProfileModel = mongoose.model("StudentProfile",studentProfileSchema);
  module.exports = StudentProfileModel;
  