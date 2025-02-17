const mongoose = require("mongoose");

const CourseSubCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    courseCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseCategory",
      required: true,
    },
    deletedAt: { type: Date, default: null },
    pricePerHour: { type: Number, required: true,default:100 },
}, { timestamps: true });

const CourseSubCategoryModel = mongoose.model(
  "CourseSubCategory",
  CourseSubCategorySchema
);
module.exports = CourseSubCategoryModel;
