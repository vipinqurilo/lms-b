const nodemailer = require("nodemailer");
const ejs = require("ejs");
const path = require("path");
require("dotenv").config();

const sendEmail = async (req, res) => {
  try {
    const { to, subject, name, message } = req.body;

    // Render the EJS template
    const emailTemplate = await ejs.renderFile(
      path.join(__dirname, "../emailTemplates/signup.ejs"),
      { name, message }
    );

    // Configure Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html: emailTemplate,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ success: false, message: "Failed to send email" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    // Render the EJS template for login email
    const emailTemplate = await ejs.renderFile(
      path.join(__dirname, "../emailTemplates/login.ejs"),
      { name: email.split("@")[0] } // Extract username from email
    );

    // Configure Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Login Successful",
      html: emailTemplate,
    };

    await transporter.sendMail(mailOptions);

    return res
      .status(200)
      .json({ success: true, message: "Login successful, email sent!" });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const handleCourseRequest = async (req, res) => {
  try {
    const { email, courseName, status, reason } = req.body;

    if (!email || !courseName || !status) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    // Render the EJS template
    const emailTemplate = await ejs.renderFile(
      path.join(__dirname, "../emailTemplates/coursePublish.ejs"),
      { courseName, reason, status }
    );

    // Configure Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject:
        status === "approved"
          ? "Course Published Successfully"
          : "Course Rejected",
      html: emailTemplate,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      message: `Course ${
        status === "approved" ? "approved" : "rejected"
      } email sent successfully.`,
    });
  } catch (error) {
    console.error("Error handling course request:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};




const sendMoney = async (req, res) => {
    try {
      const { teacherEmail, teacherName, amount } = req.body;
  
      if (!teacherEmail || !teacherName || !amount) {
        return res
          .status(400)
          .json({ success: false, message: "All fields are required" });
      }
  
      // Render the EJS template for payment settlement email
      const emailTemplate = await ejs.renderFile(
        path.join(__dirname, "../emailTemplates/settlement.ejs"),
        { teacherName, amount }
      );
  
      // Configure Nodemailer transporter
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
  
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: teacherEmail,
        subject: "Payment Settlement Confirmation",
        html: emailTemplate,
      };
  
      await transporter.sendMail(mailOptions);
  
      return res
        .status(200)
        .json({ success: true, message: `₹${amount} sent successfully to ${teacherEmail}` });
    } catch (error) {
      console.error("Error during payment settlement:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  };
module.exports = {
  sendEmail,
  loginUser,
  handleCourseRequest,
  sendMoney,
};
