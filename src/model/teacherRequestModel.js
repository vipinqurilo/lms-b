const mongoose = require("mongoose");
const educationSchema = require("./schemas/educationSchema");
const experienceSchema = require("./schemas/experienceSchema");

const teacherRequestSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
     personalInfo:{
        firstName: { type: String, required: true },
        lastName:{ type: String, required: true },
        gender: { type: String, required: true },
        phone:{
            countryCode: { type: String },
            number: { type: String }
        },
        idProof:{type:String,required:true}
    },
    profilePhoto:{type:String,required:true},
    bio:{type:String,required:true},
    experience: [experienceSchema],
    education:[educationSchema],
    subjectsTaught: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subcategory", required: true }],
    languagesSpoken: [{ type: mongoose.Schema.Types.ObjectId, ref: "Language", required: true }],
    approvalStatus:{type:String,enum: ["In Review", "Approved", "Rejected"], default: "In Review"},
    reason:{type:String}
  },{
    timestamps:true
  });
  
  const TeachRequestModel = mongoose.model("TeacherRequest", teacherRequestSchema);
  module.exports = TeachRequestModel;
  