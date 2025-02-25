const mongoose = require("mongoose");

const studentProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    enrolledCourses: [
      {
        courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
        progress: { type: Number, default: 0, min: 0, max: 100 }, 
      }
    ],
    tutionBookings: [{ type: mongoose.Schema.Types.ObjectId, ref: "Booking" }],
  },
  {
    timestamps: true,
  }
);

const StudentProfileModel = mongoose.model("StudentProfile", studentProfileSchema);
module.exports = StudentProfileModel;
 