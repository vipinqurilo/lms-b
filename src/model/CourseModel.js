const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
    courseTitle:{type:String,required:true},
    courseDescription:{type:String,required:true},
    courseLearning:[{type:String,required:true}],
    courseRequirements:[{type:String,required:true}],
    courseFeatures:[{type:String,required:true}],
    courseCategory:{type:mongoose.Schema.Types.ObjectId,ref:'CourseCategory',required:true},
    courseSubCategory:{type:mongoose.Schema.Types.ObjectId,ref:'CourseSubCategory',required:true},
    courseImage:{type:String,required:true},
    courseVideo:{type:String,required:true},
    coursePrice:{type:Number,required:true},
    isDelete:{type:Boolean,required:true},
    // courseDuration:{type:String,required:true},
    status:{type:String,required:true,enum:["pending","published","unpublished"]},
    courseInstructor:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
    courseContent:[{
        moduleTitle:{type:String,required:true},
        lessons:[{
            lessonTitle:{type:String},
            video:{type:String},
            duration:{type:String}
        }]
    }]
}, { timestamps: true });

const CourseModel = mongoose.model('Course', CourseSchema);
module.exports = CourseModel;