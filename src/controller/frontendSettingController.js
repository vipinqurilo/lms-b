const FrontendSetting = require("../model/frontendSetting");

exports.createOrUpdateFrontendSetting = async (req, res) => {
  try {
    const {
      logo,
      description,
      contactDetails,
      socialLinks,
      title,
      favicon,
      favtitle,
    } = req.body;

    let settings = await FrontendSetting.findOne();
    if (settings) {
      settings.logo = logo;
      settings.description = description;
      settings.title = title;
      settings.contactDetails = contactDetails;
      settings.socialLinks = socialLinks;
      settings.favicon = favicon;
      settings.favtitle = favtitle;
    } else {
      settings = new FrontendSetting({
        logo,
        description,
        title,
        contactDetails,
        socialLinks,
        favicon,
        favtitle,
      });
    }

    await settings.save();
    res.status(200).json({
      status: "success",
      message: "Frontend settings updated successfully",
      data: settings,
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
    res.status(200).json({ status: "success", data: settings });
  } catch (error) {
    res.status(500).json({ status: "failed", message: error.message });
  }
};
