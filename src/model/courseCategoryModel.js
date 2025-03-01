const mongoose = require('mongoose');

const CourseCategorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    courseSubCategory: { 
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CourseSubCategory' }], 
        default: [], 
        required: true 
      },
    deletedAt:{type:Date, default:null}
    }, { timestamps: true });

const CourseCategoryModel = mongoose.model('CourseCategory', CourseCategorySchema);
module.exports = CourseCategoryModel;

