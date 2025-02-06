const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    rating: { type: Number, required: true },
    review: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },   
  });
  
  const ReviewModel = mongoose.model("Review", reviewSchema);
  module.exports = ReviewModel;