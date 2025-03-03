 const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const UserModel = require("../model/UserModel");
require("dotenv").config();

// Function to send a reset password email
exports.forgotPassword = async (req, res) => {
    try {
      const { email } = req.body;
      const user = await UserModel.findOne({ email });
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Generate a JWT token (valid for 1 hour)
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
  
      // Reset password link
      const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;
  
      // Configure email transport
      const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
  
      // Email content
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Password Reset Request",
        html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
      };
  
      // Send email
      await transporter.sendMail(mailOptions);
  
      res.status(200).json({ message: "Reset password link sent to your email" });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };


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


  
exports.resetPassword = async (req, res) => {
    try {
      const { token } = req.params
      console.log(token,"rrrrrrr");

      const { newPassword, confirmPassword } = req.body;
  
      console.log(newPassword,"rrrrrrr");
      console.log(confirmPassword,"eeeee");
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await UserModel.findById(decoded.id);
  
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }
  
      // Check if newPassword and confirmPassword match
      if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }
  
      // Update password directly
      user.password = newPassword;
      await user.save();
  
      res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };
  
  