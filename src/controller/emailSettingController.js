const EmailSetting = require("../model/emailSetting");

exports.createOrUpdateEmailSettings = async (req, res) => {
  try {
    const { smtpHost, port, smtpUsername, smtpPassword } = req.body;

    let emailSetting = await EmailSetting.findOne();
    if (emailSetting) {
      emailSetting.smtpHost = smtpHost;
      emailSetting.port = port;
      emailSetting.smtpUsername = smtpUsername;
      emailSetting.smtpPassword = smtpPassword;
    } else {
      emailSetting = new EmailSetting({
        smtpHost,
        port,
        smtpUsername,
        smtpPassword,
      });
    }

    await emailSetting.save();
    res
      .status(200)
      .json({
        status: "success",
        message: "Email settings saved successfully",
        emailSetting,
      });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getEmailSettings = async (req, res) => {
  try {
    const emailSetting = await EmailSetting.findOne();
    if (!emailSetting) {
      return res
        .status(404)
        .json({ status: "failed", message: "Email settings not found" });
    }
    res
      .status(200)
      .json({
        status: "success",
        message: "email setting fetched successfully",
        data: emailSetting,
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
