const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tutorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true },
    review: { type: String, required: true },
    message: { type: String, required: true },
  });
  
  const TutorReviewModel = mongoose.model("TutorReview", reviewSchema);
  module.exports = TutorReviewModel;