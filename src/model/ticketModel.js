const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ["processing", "completed", "open"], default: "open" },
    messages:[
        {
        sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        message: { type: String, required: true },
        resiver:{type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    }]
  },{
    timestamps: true
  });
  
  const TicketModel = mongoose.model("Ticket", ticketSchema);
  module.exports = TicketModel;