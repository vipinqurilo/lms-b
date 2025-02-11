const { default: mongoose } = require("mongoose")

const experienceSchema = new mongoose.Schema({
    title: { type: String, required: true },
    company: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    location: { type: String,required:true },
    description: { type: String },
    certificate:{type:String},
  })
module.exports=experienceSchema