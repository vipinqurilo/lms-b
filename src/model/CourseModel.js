const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
    courseTitle:{type:String,required:true},
    courseDescription:{type:String,required:true},
    courseCategory:{type:mongoose.Schema.Types.ObjectId,ref:'CourseCategory',required:true},
    courseSubCategory:{type:mongoose.Schema.Types.ObjectId,ref:'CourseSubCategory',required:true},
    courseImage:{type:String,required:true},
    courseVideo:{type:String,required:true},
    coursePrice:{type:Number,required:true},
    courseInstructor:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
    courseContent:[{
        title:{type:String,required:true},
        description:{type:String},
    }]
}, { timestamps: true });

const CourseModel = mongoose.model('Course', CourseSchema);
module.exports = CourseModel;