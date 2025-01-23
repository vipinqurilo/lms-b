const mongoose = require('mongoose');

const CourseCategorySchema = new mongoose.Schema({
    name: { type: String, required: true },
}, { timestamps: true });

const CourseCategoryModel = mongoose.model('CourseCategory', CourseCategorySchema);
module.exports = CourseCategoryModel;