const mongoose = require('mongoose');

const CourseSubCategorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    pricePerHour: { type: Number, required: true },
    courseCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'CourseCategory', required: true }
}, { timestamps: true });

const CourseSubCategoryModel = mongoose.model('CourseSubCategory', CourseSubCategorySchema);
module.exports = CourseSubCategoryModel;