const nodemailer = require("nodemailer");
const ejs = require("ejs");
const path = require("path");
require("dotenv").config();
const getEmailSettings = require("../utils/emailSetting");
 


const signup = async (req, res) => {
  try {
    const {  teacherEmail, courseName, teacherName, title1, status, startDate,  endDate,  title, userName , bookingDate,nextStepOne ,buttonText  ,year,nextStepTwo ,publishDate ,startTime ,endTime ,address,TotalEarnings,Commission,NetEarnings} = req.body;

    
    const emailTemplate = await ejs.renderFile(
      path.join(__dirname, "../emailTemplates/signup.ejs"),
      { teacherEmail, courseName, teacherName, status, userName, startDate, endDate ,title ,title1 ,nextStepOne ,bookingDate ,year, buttonText ,address  ,nextStepTwo ,publishDate ,startTime ,endTime ,TotalEarnings,Commission,NetEarnings}
    );
    const settings = await getEmailSettings();

    // Configure Nodemailer transportera
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: settings.smtpUsername || process.env.EMAIL_USER,
        pass: settings.smtpPassword || process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: settings.smtpUsername || process.env.EMAIL_USER,
      to: teacherEmail,
      subject: "Signup Confirmation",
      html: emailTemplate,
    };

    await transporter.sendMail(mailOptions);

    return res
      .status(200)
      .json({ success: true, message: ` sent successfully to ${teacherEmail}` });
  } catch (error) {
    console.error("Error during payment settlement:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const {  teacherEmail, courseName, teacherName, title1, status, startDate,  endDate,  title, userName ,email, bookingDate,nextStepOne ,buttonText  ,year,nextStepTwo ,publishDate ,startTime ,endTime ,address,TotalEarnings,Commission,NetEarnings } = req.body;

    
    const emailTemplate = await ejs.renderFile(
      path.join(__dirname, "../emailTemplates/verifyEmail.ejs"),
      { teacherEmail, courseName, teacherName, status, userName, startDate, endDate ,title ,title1 ,nextStepOne ,bookingDate ,year, buttonText ,address  ,nextStepTwo ,publishDate ,startTime ,endTime ,TotalEarnings,email ,Commission,NetEarnings}
    );
    const settings = await getEmailSettings();

    // Configure Nodemailer transportera
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: settings.smtpUsername || process.env.EMAIL_USER,
        pass: settings.smtpPassword || process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: settings.smtpUsername || process.env.EMAIL_USER,
      to: email,
      subject: "Verification Email",
      html: emailTemplate,
    };

    await transporter.sendMail(mailOptions);

    return res
      .status(200)
      .json({ success: true, message: ` sent successfully to ${email}` });
  } catch (error) {
     
    res.status(500).json({ success: false, message: "Server error" });
  }
};





const signupUser = async (req, res) => {
  try {
    const { email ,title ,userName, nextStepTwo,  nextStepOne ,buttonText, address ,year ,teacherName  , welcomeTittle} = req.body;

    console.log(userName,"pppp")
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    // Render the EJS template for login email
    const emailTemplate = await ejs.renderFile(
      path.join(__dirname, "../view/login.ejs"),
      { name: email.split("@")[0] ,title ,userName ,nextStepTwo,nextStepOne ,buttonText ,address ,year ,teacherName , welcomeTittle} // Extract username from email
    );
    const settings = await getEmailSettings();

    // Configure Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail", 
      auth: {
        user: settings.smtpUsername || process.env.EMAIL_USER,
        pass: settings.smtpPassword || process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: settings.smtpUsername || process.env.EMAIL_USER,
      to: email,
      subject: "Signup Confirmation",
      html: emailTemplate,
    };

    await transporter.sendMail(mailOptions);

    return res
      .status(200)
      .json({ success: true, message: "Signup Confirmation, email sent!" });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const handleCourseRequest = async (req, res) => {
  try {
    const { email, courseName, teacherName, status,  title ,nextStepOne ,reason ,nextStepTwo ,publishDate ,category , } = req.body;

    console.log(email)
    // if (!email || !courseName || !status || !teacherName || !title || !nextStepOne || !nextStepTwo) {
    //   return res
    //     .status(400)
    //     .json({ success: false, message: "Missing required fields" });
    // }

    // Render the EJS template


    const emailTemplate = await ejs.renderFile(
      path.join(__dirname, "../emailTemplates/coursePublish.ejs"),
      { courseName,  status ,teacherName  ,title ,nextStepOne ,nextStepTwo ,reason ,publishDate ,category , }
    );
    const settings = await getEmailSettings();

    // Configure Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: settings.smtpUsername || process.env.EMAIL_USER,
        pass: settings.smtpPassword || process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from:settings.smtpUsername || process.env.EMAIL_USER,
      to: email,
      subject:
        status === "approved"
          ? "Course Published Request"
          : "Course Published  Request",
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




const teacherRequest = async (req, res) => {
  try {
    const { email, courseName, teacherName, status,  title ,nextStepOne  ,nextStepTwo ,subject ,date ,endTime ,number} = req.body;

    console.log(number)
    
    const emailTemplate = await ejs.renderFile(
      path.join(__dirname, "../emailTemplates/teacherRequest.ejs"),
      { courseName,  status ,teacherName  ,title ,nextStepOne ,nextStepTwo ,subject ,date ,endTime ,number ,email}
    );

    // Configure Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: settings.smtpUsername || process.env.EMAIL_USER,
        pass: settings.smtpPassword || process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from:settings.smtpUsername || process.env.EMAIL_USER,
      to: email,
      subject:
        status === "approved"
          ? "Teacher Request"
          : "Teacher Request",
      html: emailTemplate,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      message: `Teacher ${
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
      const {  teacherEmail, courseName, teacherName, title1, status, startDate,  endDate,  title, studentName , bookingDate,nextStepOne ,buttonText  ,year,nextStepTwo ,publishDate ,startTime ,endTime ,address,TotalEarnings,Commission,NetEarnings} = req.body;
  
      // if (!teacherEmail || !teacherName || !amount) {
      //   return res
      //     .status(400)
      //     .json({ success: false, message: "All fields are required" });
      // }
  
      // Render the EJS template for payment settlement email
      const emailTemplate = await ejs.renderFile(
        path.join(__dirname, "../emailTemplates/settlement.ejs"),
        { teacherEmail, courseName, teacherName, status, studentName, startDate, endDate ,title ,title1 ,nextStepOne ,bookingDate ,year, buttonText ,address  ,nextStepTwo ,publishDate ,startTime ,endTime ,TotalEarnings,Commission,NetEarnings}
      );
      const settings = await getEmailSettings();

      // Configure Nodemailer transporter
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user:settings.smtpUsername || process.env.EMAIL_USER,
          pass:settings.smtpPassword || process.env.EMAIL_PASS,
        },
      });
  
      const mailOptions = {
        from:settings.smtpUsername || process.env.EMAIL_USER,
        to: teacherEmail,
        subject: "Payment Settlement Confirmation",
        html: emailTemplate,
      };
  
      await transporter.sendMail(mailOptions);
  
      return res
        .status(200)
        .json({ success: true, message: ` sent successfully to ${teacherEmail}` });
    } catch (error) {
      console.error("Error during payment settlement:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
};

const sendBookingConfirmation = async (req, res) => {
  try {
    const {
      studentEmail,
      studentName,
      teacherName,
      teacherEmail,
      bookingDate,
      startTime,
      endTime,
      courseName,
      logoUrl,
      courseImage
    } = req.body;

    console.log('Received email request for student:', studentEmail, 'and teacher:', teacherEmail);

    // Validate required fields
    if (!studentEmail || !studentName || !teacherName || !teacherEmail || !bookingDate || !startTime || !endTime || !courseName) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }
    const settings = await getEmailSettings();

    // Configure Nodemailer transporter
    console.log('Configuring email transporter...');
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user:settings.smtpUsername || process.env.EMAIL_USER,
        pass:settings.smtpPassword || process.env.EMAIL_PASS,
      },
    });

    // 1. Send email to Student
    console.log('Attempting to render student email template...');
    const studentEmailTemplate = await ejs.renderFile(
      path.join(__dirname, "../view/template.ejs"),
      {
        logoUrl: logoUrl || "https://your-default-logo-url.com",
        title: "Booking Confirmation",
        courseImage: courseImage || "https://your-default-course-image.com",
        studentName,
        teacherName,
        bookingDate,
        startTime,
        endTime,
        courseName,
        nextStepOne: "Prepare any necessary materials for your session",
        nextStepTwo: "Check your email for the meeting link before the session",
        buttonText: "View Booking Details",
        address: "123 Education Street, Learning City, 12345",
        year: new Date().getFullYear(),
        socialIcons: [ 
          { url: "https://example.com/facebook.png", alt: "Facebook" },
          { url: "https://example.com/twitter.png", alt: "Twitter" },
          { url: "https://example.com/instagram.png", alt: "Instagram" }
        ]
      }
    );
    console.log('Student email template rendered successfully');

    const studentMailOptions = {
      from:settings.smtpUsername || process.env.EMAIL_USER,
      to: studentEmail,
      subject: "Booking Confirmation - Your Session is Confirmed!",
      html: studentEmailTemplate,
    };

    console.log('Attempting to send email to student...');
    await transporter.sendMail(studentMailOptions);
    console.log('Email sent successfully to student');

    // 2. Send email to Teacher
    console.log('Attempting to render teacher email template...');
    const teacherEmailTemplate = await ejs.renderFile(
      path.join(__dirname, "../view/template.ejs"),
      {
        logoUrl: logoUrl || "https://your-default-logo-url.com",
        title: "New Booking Notification",
        courseImage: courseImage || "https://your-default-course-image.com",
        studentName,
        teacherName,
        bookingDate,
        startTime,
        endTime,
        courseName,
        nextStepOne: "Prepare your session materials and resources",
        nextStepTwo: "Send the meeting link to the student before the session",
        buttonText: "View Booking Details",
        address: "123 Education Street, Learning City, 12345",
        year: new Date().getFullYear(),
        socialIcons: [
          { url: "https://example.com/facebook.png", alt: "Facebook" },
          { url: "https://example.com/twitter.png", alt: "Twitter" },
          { url: "https://example.com/instagram.png", alt: "Instagram" }
        ]
      }
    );
    console.log('Teacher email template rendered successfully');

    const teacherMailOptions = {
      from:settings.smtpUsername || process.env.EMAIL_USER,
      to: teacherEmail,
      subject: "New Booking Alert - Session Scheduled!",
      html: teacherEmailTemplate,
    };

    console.log('Attempting to send email to teacher...');
    await transporter.sendMail(teacherMailOptions);
    console.log('Email sent successfully to teacher');

    return res.status(200).json({
      success: true,
      message: "Booking confirmation emails sent successfully to both student and teacher"
    });
  } catch (error) {
    console.error("Error sending booking confirmation:", error);
    // More detailed error logging
    if (error.code === 'ENOENT') {
      console.error('Template file not found');
    } else if (error.code === 'EAUTH') {
      console.error('Email authentication failed');
    }
    res.status(500).json({ success: false, message: "Failed to send booking confirmation" });
  }
};

module.exports = {
  signup,
  signupUser,
  handleCourseRequest,
  sendMoney,
  sendBookingConfirmation, // Add this line
  teacherRequest,
  verifyEmail
};
