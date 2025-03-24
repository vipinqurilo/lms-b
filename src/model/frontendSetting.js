const mongoose = require("mongoose");

const frontendSettingSchema = new mongoose.Schema(
  {
    logo: { type: String, required: true },
    description: { type: String, required: true },
    title:{type:String,required:true},
    contactDetails: [
      {
        type: {
          type: String,
          enum: ["location", "email", "phone"],
          required: true,
        },
        title: { type: String, required: true },
        value: { type: String, required: true },
        image: { type: String },
      },
    ],

    socialLinks: [
      {
        id: { type: String, required: true },
        platform: { type: String, required: true },
        link: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("FrontendSetting", frontendSettingSchema);
