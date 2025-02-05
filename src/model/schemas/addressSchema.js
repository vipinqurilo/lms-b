const { default: mongoose } = require("mongoose");

const addressSchema=new mongoose.Schema(
    {
        type: { type: String, enum: ["Home", "Work"], required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        country: { type: String, required: true }
    }
)
module.exports=addressSchema;