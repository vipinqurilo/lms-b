const mongoose = require("mongoose");

const earningSchema = new mongoose.Schema({
    course : { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    teacher : { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount : { type: Number, required: true },
    date : { type: Date, default: Date.now },
    type: { type: String, enum: ["tutor", "course",], required: true }
},{
    timestamps: true
})

const EarningModel = mongoose.model('Earning', earningSchema);
module.exports = EarningModel