const mongoose = require("mongoose");

const studentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    enrolledCourses: [
      {
        courseId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Course",
          required: true,
          // Adding autopopulate if you want to always populate this field
        },
        completedModule: [{ type: String, required: true }],
        isCompleted: { type: Boolean, default: false },

        // progress: { type: Number, default: 0, min: 0, max: 100 }, // Progress in percentage
      },
    ],
    tutionBookings: [{ type: mongoose.Schema.Types.ObjectId, ref: "Booking" }],
  },
  {
    timestamps: true,
  }
);

// Adding a virtual to handle the populated course data
studentProfileSchema.virtual("enrolledCoursesData", {
  ref: "Course",
  localField: "enrolledCourses.courseId",
  foreignField: "_id",
});

const StudentProfileModel = mongoose.model(
  "StudentProfile",
  studentProfileSchema
);
module.exports = StudentProfileModel;
