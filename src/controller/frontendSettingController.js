const FrontendSetting = require("../model/frontendSetting");

exports.createOrUpdateFrontendSetting = async (req, res) => {
  try {
    const { logo, description, contactDetails, socialLinks } = req.body;

    let settings = await FrontendSetting.findOne();
    if (settings) {
      settings.logo = logo;
      settings.description = description;
      settings.contactDetails = contactDetails;
      settings.socialLinks = socialLinks;
    } else {
      settings = new FrontendSetting({
        logo,
        description,
        contactDetails,
        socialLinks,
      });
    }

    await settings.save();
    res
      .status(200)
      .json({
        status: "success",
        message: "Frontend settings updated successfully",
        settings,
      });
  } catch (error) {
    res.status(500).json({ status: "failed", message: error.message });
  }
};

exports.getFrontendSetting = async (req, res) => {
  try {
    const settings = await FrontendSetting.findOne();
    if (!settings) {
      return res
        .status(404)
        .json({ success: false, message: "Frontend settings not found" });
    }
    res.status(200).json({ status: "success", settings });
  } catch (error) {
    res.status(500).json({ status: "failed", message: error.message });
  }
};