const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const UserModel = require("../model/UserModel");
const ejs = require("ejs");
const path = require("path");
require("dotenv").config();
const getEmailSettings = require("../utils/emailSetting");




// Function to send a reset password email
// exports.forgotPassword = async (req, res) => {
//     try {
//       const { email } = req.body;
//       const user = await UserModel.findOne({ email });
  
//       if (!user) {
//         return res.status(404).json({ message: "User not found" });
//       }
  
//       // Generate a JWT token (valid for 1 hour)
//       const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1m" });
  
//       // Reset password link
//       const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;
  
//       // Configure email transport
//       const transporter = nodemailer.createTransport({
//         service: "Gmail",
//         auth: {
//           user: process.env.EMAIL_USER,
//           pass: process.env.EMAIL_PASS,
//         },
//       });
  
//       // Email content
//       const mailOptions = {
//         from: process.env.EMAIL_USER,
//         to: email,
//         subject: "Password Reset Request",
//         html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
//       };
  
//       // Send email
//       await transporter.sendMail(mailOptions);
  
//       res.status(200).json({ message: "Reset password link sent to your email" });
//     } catch (error) {
//       res.status(500).json({ message: "Server error", error: error.message });
//     }
//   };


// Function to reset password
// exports.resetPassword = async (req, res) => {
//   try {
//     const { token } = req.params;
//     const { oldPassword, newPassword } = req.body;

//     // Verify token
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const user = await UserModel.findById(decoded.id);

//     if (!user) {
//       return res.status(400).json({ message: "Invalid or expired token" });
//     }

//     // Check if the old password matches
//     const isMatch = await bcrypt.compare(oldPassword, user.password);
//     console.log(isMatch,"pppppp");
//     if (!isMatch) {
//       return res.status(400).json({ message: "Old password is incorrect" });
//     }

//     // Hash new password and update
//     const hashedPassword = await bcrypt.hash(newPassword, 10);
//     user.password = hashedPassword;
//     await user.save();

//     res.status(200).json({ message: "Password updated successfully" });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate a JWT token (valid for 1 hour)
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // Save token to the database
    user.forgotPasswordToken = token;
    user.forgotPasswordUsed = false; // Reset in case of a new request
    await user.save();

    // Reset password link
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    const settings = await getEmailSettings();

    // Get user name or use email as fallback
    const userName = user.firstName || email.split('@')[0];

    // Render the EJS template
    const emailTemplate = await ejs.renderFile(
      path.join(__dirname, "../emailTemplates/verifyEmail.ejs"),
      { 
        userName,
        buttonText: "Reset Password",
        verificationLink: resetLink,
        address: "123 Education Street, Learning City, 12345",
        year: new Date().getFullYear(),
        title: "Password Reset",
        message: "Please click the button below to reset your password. If you did not request a password reset, please ignore this email."
      }
    );

    // Configure email transport
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: settings.smtpUsername || process.env.EMAIL_USER,
        pass: settings.smtpPassword || process.env.EMAIL_PASS,
      },
    });

    // Email content
    const mailOptions = {
      from: settings.smtpUsername || process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request",
      html: emailTemplate,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Reset password link sent to your email" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

 
exports.resetPassword = async (req, res) => {
  try {
      const { token } = req.params;
      const { newPassword, confirmPassword } = req.body;

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await UserModel.findOne({ _id: decoded.id, forgotPasswordToken: token });

      if (!user) {
          return res.status(400).json({ message: "Invalid or expired token" });
      }

      // Check if newPassword and confirmPassword match
      if (newPassword !== confirmPassword) {
          return res.status(400).json({ message: "Passwords do not match" });
      }

      // Update password without hashing
      user.password = newPassword;
      user.forgotPasswordUsed = true;
      user.forgotPasswordToken = ""; // Clear token after use
      await user.save();

      res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
  }
};

  
  