const EmailSettingModal = require("../model/emailSetting");

async function getEmailSettings() {
  const settings = await EmailSettingModal.findOne().sort({ createdAt: -1 });
  if (!settings) throw new Error("SMTP settings not configured");
  return settings;
}

module.exports = getEmailSettings;
