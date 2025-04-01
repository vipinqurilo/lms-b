const mongoose = require("mongoose");

const paymentSettingSchema = new mongoose.Schema(
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
    payfast: {
      mode: {
        type: String,
        enum: ["test", "production"],
        required: true,
        default: "test",
        description: "PayFast payment mode",
      },
      merchantId: {
        type: String,
        required: true,
        description: "PayFast Merchant ID",
      },
      merchantKey: {
        type: String,
        required: true,
        description: "PayFast Merchant Key",
      },
      passphrase: {
        type: String,
        required: false,
        description: "PayFast Passphrase (optional in test mode)",
      },
    },
  },
  { timestamps: true }
);

const PaymentSetting = mongoose.model("PaymentSetting", paymentSettingSchema);
module.exports = PaymentSetting;
