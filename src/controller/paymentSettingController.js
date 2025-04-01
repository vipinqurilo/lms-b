const PaymentSetting = require("../model/paymentSetting");

exports.createOrUpdatePaymentSettings = async (req, res) => {
  try {
    const { stripe, paypal, payfast } = req.body;

    let paymentSetting = await PaymentSetting.findOne();
    if (paymentSetting) {
      if (stripe) paymentSetting.stripe = stripe;
      if (paypal) paymentSetting.paypal = paypal;
      if (payfast) paymentSetting.payfast = payfast;
    } else {
      paymentSetting = new PaymentSetting({ stripe, paypal, payfast });
    }

    await paymentSetting.save();
    res.status(200).json({
      status: "success",
      message: "Payment settings saved successfully",
      data: paymentSetting,
    });
  } catch (error) {
    res
      .status(500)
      .json({
        status: "failed",
        message: "Server error",
        error: error.message,
      });
  }
};

exports.getPaymentSettings = async (req, res) => {
  try {
    const paymentSetting = await PaymentSetting.findOne();
    if (!paymentSetting) {
      return res
        .status(404)
        .json({ status: "failed", message: "Payment settings not found" });
    }
    res.status(200).json({ status: "success", data: paymentSetting });
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: "Server error",
      error: error.message,
    });
  }
};
