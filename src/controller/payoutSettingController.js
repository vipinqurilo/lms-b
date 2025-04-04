const PayoutSetting = require("../model/payoutSettingModel");

exports.createOrUpdatePayoutSettings = async (req, res) => {
  try {
    console.log("Request body: ", req.body);
    const { stripe, paypal, payfast } = req.body;

    let payoutSetting = await PayoutSetting.findOne();
    if (payoutSetting) {
      console.log("Updating existing payout setting");
      payoutSetting.stripe = stripe;
      payoutSetting.paypal = paypal;
      payoutSetting.payfast = payfast;
    } else {
      console.log("Creating new payout setting");
      payoutSetting = new PayoutSetting({ stripe, paypal, payfast });
    }

    await payoutSetting.save();
    res.status(200).json({
      status: "success",
      message: "Payout settings saved successfully",
      data: payoutSetting,
    });
  } catch (error) {
    console.error("Error in createOrUpdatePayoutSettings: ", error);
    res
      .status(500)
      .json({
        status: "failed",
        message: "Server error",
        error: error.message,
      });
  }
};

exports.getPayoutSettings = async (req, res) => {
  try {
    const payoutSetting = await PayoutSetting.findOne();
    if (!payoutSetting) {
      return res
        .status(404)
        .json({ status: "failed", message: "Payout settings not found" });
    }
    res.status(200).json({ status: "success", data: payoutSetting });
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: "Server error",
      error: error.message,
    });
  }
};
