const mongoose = require("mongoose");

const payoutSettingSchema = new mongoose.Schema(
  {
    stripe: {
      mode: {
        type: String,
        enum: ["test", "production"],
        required: true,
        default: "test",
        description: "Stripe payment mode",
      },
      clientId: {
        type: String,
        required: true,
        description: "Stripe Client ID",
      },
      secret: {
        type: String,
        required: true,
        description: "Stripe Secret Key",
      },
    },
    paypal: {
      mode: {
        type: String,
        enum: ["test", "production"],
        required: true,
        default: "test",
        description: "PayPal payment mode",
      },
      clientId: {
        type: String,
        required: true,
        description: "PayPal Client ID",
      },
      secret: {
        type: String,
        required: true,
        description: "PayPal Secret Key",
      },
    },
  },
  { timestamps: true }
);

const payoutSetting = mongoose.model("PayoutSetting", payoutSettingSchema);
module.exports = payoutSetting;
