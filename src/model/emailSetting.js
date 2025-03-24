const mongoose = require("mongoose");

const emailSettingSchema = new mongoose.Schema({
  smtpHost: {
    type: String,
    required: true,
    match: /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    description: "SMTP server hostname",
  },
  port: {
    type: Number,
    required: true,
    min: 1,
    max: 65535,
    description: "SMTP server port number",
  },
  smtpUsername: {
    type: String,
    required: true,
    description: "SMTP authentication username",
  },
  smtpPassword: {
    type: String,
    required: true,
    minlength: 8,
    description: "SMTP authentication password",
  },
}, { timestamps: true });

const EmailSetting = mongoose.model("EmailSetting", emailSettingSchema);
module.exports = EmailSetting;
