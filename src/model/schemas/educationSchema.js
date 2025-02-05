const { default: mongoose } = require("mongoose")

const educationSchema = new mongoose.Schema({
    title: { type: String, required: true },
    institute: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    description: { type: String},
    location: { type: String},
    certificate:{type:String},
  })
module.exports=educationSchema