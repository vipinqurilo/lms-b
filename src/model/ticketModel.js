const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: String, required: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseCategory",
      required: true,
    },
    description: { type: String, required: true },
    status: { type: String, enum: ["close", "open"], default: "open" },
    messages: [
      {
        sender: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        message: { type: String, required: true },
        receiver: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    attachments: {
      type: [{ type: String }],
      validate: {
        validator: function (val) {
          return val.length <= 4; 
        },
        message: "You can upload a maximum of 4 attachments.",
      },
    },
  },
  {
    timestamps: true,
  }
);

const TicketModel = mongoose.model("Ticket", ticketSchema);
module.exports = TicketModel;
