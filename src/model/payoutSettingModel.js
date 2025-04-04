const mongoose = require("mongoose");

const payoutSettingSchema = new mongoose.Schema(
  {
    stripe: {
      mode: {
        type: String,
        enum: ["test", "production"],
        default: "test",
        description: "Stripe payment mode",
      },
      clientId: {
        type: String,
        description: "Stripe Client ID",
      },
      secret: {
        type: String,
        description: "Stripe Secret Key",
      },
    },
    paypal: {
      mode: {
        type: String,
        enum: ["test", "production"],
        default: "test",
        description: "PayPal payment mode",
      },
      clientId: {
        type: String,
        description: "PayPal Client ID",
      },
      secret: {
        type: String,
        description: "PayPal Secret Key",
      },
    },
    payfast: {
      email: {
        type: String,
        description: "PayFast registered email",
      },
    },
  },
  { timestamps: true }
);

const payoutSetting = mongoose.model("PayoutSetting", payoutSettingSchema);
module.exports = payoutSetting;
