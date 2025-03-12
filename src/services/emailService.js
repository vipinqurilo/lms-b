const nodemailer = require("nodemailer");
const ejs = require("ejs");
const path = require("path");

// Configure Nodemailer transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send email using template
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {Object} options.templateData - Data to be passed to the template
 * @returns {Promise} - Nodemailer send result
 */
const sendTemplatedEmail = async (options) => {
  try {
    console.log(`Preparing email to: ${options.to}`);
    
    const transporter = createTransporter();
    
    const emailTemplate = await ejs.renderFile(
      path.join(__dirname, "../view/template.ejs"),
      { ...options.templateData, recipientEmail: options.to }  // Include the recipient's email in template data
    );
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: options.to,
      subject: options.subject,
      html: emailTemplate,
    };
    
    console.log(`Sending email to: ${options.to}`);
    const result = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to: ${options.to}`);
    return result;
  } catch (error) {
    console.error(`Error sending email to ${options.to}:`, error);
    throw error;
  }
};

/** 
 * Send booking confirmation emails to both student and teacher
 */
const sendBookingConfirmation = async (bookingData) => {
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
    courseImage,
    meetingLink,
    meetingPlatform,
    amount
  } = bookingData;
  console.log(bookingData,'bookingData');
  // Validate required fields
  if (!studentEmail || !studentName || !teacherName || !teacherEmail || !bookingDate || !startTime || !endTime || !courseName || !meetingPlatform || !meetingLink || !amount) {
    throw new Error("Missing required fields for booking confirmation email");
  }

  const defaultData = {
    logoUrl: logoUrl || "https://res.cloudinary.com/daprkakyk/image/upload/v1741260445/luxe/uiiqdcle3kayym5qg1kp.png",
    courseImage: courseImage || "http://res.cloudinary.com/daprkakyk/image/upload/v1741257733/luxe/eqrqi2liqecayk6rwtfh.png",
    bookingDate,
    startTime,
    endTime,
    courseName,
    meetingPlatform,
    meetingLink,
    amount,
    address: "123 Education Street, Learning City, 12345",
    year: new Date().getFullYear(),
    studentEmail,
    teacherEmail,
    socialIcons: [
      { url: "https://example.com/facebook.png", alt: "Facebook" },
      { url: "https://example.com/twitter.png", alt: "Twitter" },
      { url: "https://example.com/instagram.png", alt: "Instagram" }
    ]
  };

  // 1. Send email to Student
  await sendTemplatedEmail({
    to: studentEmail,
    subject: "Booking Confirmation - Your Session is Confirmed",
    templateData: {
      ...defaultData,
      title: "Booking Confirmation",
      studentName,
      teacherName,
      nextStepOne: "Your booking has been confirmed. We look forward to seeing you at the scheduled time.",
      nextStepTwo: "Please arrive 5 minutes before your session starts.",
      buttonText: "View Booking Details"
    }
  });

  // 2. Send email to Teacher
  await sendTemplatedEmail({
    to: teacherEmail,
    subject: "Booking Confirmation - New Session Scheduled",
    templateData: {
      ...defaultData,
      title: "Booking Confirmation",
      studentName,
      teacherName,
      nextStepOne: "A new session has been confirmed. Please be available 5 minutes before the scheduled time.",
      nextStepTwo: "You will get a reminder 15 minutes before the session starts.",
      buttonText: "View Calendar"
    }
  });

  return { success: true, message: "Booking confirmation emails sent successfully" };
};

/**
 * Send booking cancellation emails to both student and teacher
 */
const sendBookingCancellation = async (bookingData) => {
  const {
    studentEmail,
    studentName, 
    teacherName,
    teacherEmail,
    bookingDate,
    startTime,
    endTime,
    courseName,
    cancelledBy,
    cancellationReason,
    logoUrl,
    courseImage,
    meetingPlatform,
    meetingLink,
    amount
  } = bookingData;

  // Validate required fields
  if (!studentEmail || !studentName || !teacherName || !teacherEmail || !bookingDate || !startTime || !endTime || !courseName || !amount) {
    throw new Error("Missing required fields for booking cancellation email");
  }

  const defaultData = {
    logoUrl: logoUrl || "https://res.cloudinary.com/daprkakyk/image/upload/v1741260445/luxe/uiiqdcle3kayym5qg1kp.png",
    courseImage: courseImage || "http://res.cloudinary.com/daprkakyk/image/upload/v1741257733/luxe/eqrqi2liqecayk6rwtfh.png",
    bookingDate,
    startTime,
    endTime,
    courseName,
    address: "123 Education Street, Learning City, 12345",
    year: new Date().getFullYear(),
    cancelledBy,
    cancellationReason: cancellationReason || "No reason provided",
    studentEmail,
    teacherEmail,
    meetingPlatform: meetingPlatform || null,
    meetingLink: meetingLink || null,
    amount,
    socialIcons: [
      { url: "https://example.com/facebook.png", alt: "Facebook" },
      { url: "https://example.com/twitter.png", alt: "Twitter" },
      { url: "https://example.com/instagram.png", alt: "Instagram" }
    ]
  };

  // 1. Send email to Student
  await sendTemplatedEmail({
    to: studentEmail,
    subject: "Booking Cancellation - Session Cancelled",
    templateData: {
      ...defaultData,
      title: "Booking Cancellation",
      studentName, 
      teacherName,
      nextStepOne: `Your booking has been cancelled ${cancelledBy === 'student' ? 'by you' : 'by the teacher'}.`,
      nextStepTwo: "100% refund for the cancelled session will be processed within 7-10 working days.",
      buttonText: "Book Another Session"
    }
  });

  // 2. Send email to Teacher
  await sendTemplatedEmail({
    to: teacherEmail,
    subject: "Booking Cancellation - Session Cancelled",
    templateData: {
      ...defaultData, 
      title: "Booking Cancellation",
      studentName,
      teacherName,
      nextStepOne: `The booking has been cancelled ${cancelledBy === 'teacher' ? 'by you' : 'by the student'}.`,
      nextStepTwo: "The time slot is now available for other bookings.",
      buttonText: "View Calendar"
    }
  });

  return { success: true, message: "Booking cancellation emails sent successfully" };
};

/**
 * Send reschedule request emails to both student and teacher
 */
const sendRescheduleRequest = async (bookingData) => {
  const {
    studentEmail,
    studentName,
    teacherName,
    teacherEmail,
    bookingDate,
    startTime,
    endTime,
    courseName,
    newBookingDate,
    newStartTime,
    newEndTime,
    rescheduleReason,
    requestedBy,
    logoUrl,
    courseImage,
    amount
  } = bookingData;

  // Validate required fields
  if (!studentEmail || !studentName || !teacherName || !teacherEmail || !bookingDate || !startTime || !endTime || !courseName || !newBookingDate || !newStartTime || !newEndTime || !amount) {
    throw new Error("Missing required fields for reschedule request email");
  }

  const defaultData = {
    logoUrl: logoUrl || "https://res.cloudinary.com/daprkakyk/image/upload/v1741260445/luxe/uiiqdcle3kayym5qg1kp.png",
    courseImage: courseImage || "http://res.cloudinary.com/daprkakyk/image/upload/v1741257733/luxe/eqrqi2liqecayk6rwtfh.png",
    bookingDate,
    startTime,
    endTime,
    courseName,
    address: "123 Education Street, Learning City, 12345",
    year: new Date().getFullYear(),
    studentEmail, 
    teacherEmail, 
    socialIcons: [
      { url: "https://example.com/facebook.png", alt: "Facebook" },
      { url: "https://example.com/twitter.png", alt: "Twitter" },
      { url: "https://example.com/instagram.png", alt: "Instagram" }
    ],
    amount
  };

  const requestedByStudent = requestedBy === "student";
  const requester = requestedByStudent ? studentName : teacherName;

  // 1. Send email to Student
  await sendTemplatedEmail({
    to: studentEmail,
    subject: "Reschedule Request - Session Time Change",
    templateData: {
      ...defaultData,
      title: "Reschedule Request",
      studentName,
      teacherName,
      requestedBy,
      nextStepOne: `${requestedBy === 'student' ? 'You have' : `${teacherName} has`} requested to reschedule this session.`,
      nextStepTwo: `Proposed new time: ${newBookingDate} from ${newStartTime} to ${newEndTime}. Reason: ${rescheduleReason}`,
      buttonText: "View Booking Details"
    }
  });

  // 2. Send email to Teacher
  await sendTemplatedEmail({
    to: teacherEmail,
    subject: "Reschedule Request - Session Time Change",
    templateData: {
      ...defaultData, 
      title: "Reschedule Request",
      studentName,
      teacherName,
      requestedBy,
      nextStepOne: `${requestedBy === 'teacher' ? 'You have' : `${studentName} has`} requested to reschedule this session.`,
      nextStepTwo: `Proposed new time: ${newBookingDate} from ${newStartTime} to ${newEndTime}. Reason: ${rescheduleReason}`,
      buttonText: "Accept or Decline"
    }
  });

  return { success: true, message: "Reschedule request emails sent successfully" };
};

/**
 * Send reschedule confirmation emails to both student and teacher
 */
const sendRescheduleConfirmation = async (bookingData) => {
  const {
    studentEmail,
    studentName,
    teacherName,
    teacherEmail,
    oldBookingDate,
    oldStartTime,
    oldEndTime,
    newBookingDate,
    newStartTime,
    newEndTime,
    courseName,
    rescheduleReason,
    requestedBy,
    logoUrl,
    courseImage,
    amount
  } = bookingData;

  // Validate required fields
  if (!studentEmail || !studentName || !teacherName || !teacherEmail || !newBookingDate || !newStartTime || !newEndTime || !courseName || !amount) {
    throw new Error("Missing required fields for reschedule confirmation email");
  }

  const defaultData = {
    logoUrl: logoUrl || "https://res.cloudinary.com/daprkakyk/image/upload/v1741260445/luxe/uiiqdcle3kayym5qg1kp.png",
    courseImage: courseImage || "http://res.cloudinary.com/daprkakyk/image/upload/v1741257733/luxe/eqrqi2liqecayk6rwtfh.png",
    bookingDate: newBookingDate,
    startTime: newStartTime,
    endTime: newEndTime,
    courseName,
    address: "123 Education Street, Learning City, 12345",
    year: new Date().getFullYear(),
    studentEmail, 
    teacherEmail, 
    socialIcons: [
      { url: "https://example.com/facebook.png", alt: "Facebook" },
      { url: "https://example.com/twitter.png", alt: "Twitter" },
      { url: "https://example.com/instagram.png", alt: "Instagram" }
    ],
    amount
  };

  const requestedByStudent = requestedBy === "student";
  const requester = requestedByStudent ? studentName : teacherName;

  // 1. Send email to Student
  await sendTemplatedEmail({
    to: studentEmail,
    subject: "Booking Rescheduled - Your Session Has Been Updated",
    templateData: {
      ...defaultData,
      title: "Booking Reschedule Confirmation",
      studentName,
      teacherName,
      nextStepOne: `Your session has been successfully rescheduled from ${oldBookingDate} (${oldStartTime}-${oldEndTime}) to ${newBookingDate} (${newStartTime}-${newEndTime}).`,
      nextStepTwo: "Please update your calendar with the new session time.",
      buttonText: "View Updated Booking"
    }
  });

  // 2. Send email to Teacher
  await sendTemplatedEmail({
    to: teacherEmail,
    subject: "Booking Rescheduled - Session Has Been Updated",
    templateData: {
      ...defaultData,
      title: "Booking Reschedule Confirmation",
      studentName,
      teacherName,
      nextStepOne: `The session has been successfully rescheduled from ${oldBookingDate} (${oldStartTime}-${oldEndTime}) to ${newBookingDate} (${newStartTime}-${newEndTime}).`,
      nextStepTwo: "Please update your calendar with the new session time.",
      buttonText: "View Updated Booking"
    }
  });

  return { success: true, message: "Reschedule confirmation emails sent successfully" };
};

/**
 * Send reschedule rejection emails to both student and teacher
 */
const sendRescheduleRejection = async (bookingData) => {
  const {
    studentEmail,
    studentName,
    teacherName,
    teacherEmail,
    bookingDate,
    startTime,
    endTime,
    courseName,
    newBookingDate,
    newStartTime,
    newEndTime,
    rescheduleReason,
    rejectionReason,
    requestedBy,
    logoUrl,
    courseImage,
    amount
  } = bookingData;

  // Validate required fields
  if (!studentEmail || !studentName || !teacherName || !teacherEmail || !bookingDate || !startTime || !endTime || !courseName || !amount) {
    throw new Error("Missing required fields for reschedule rejection email");
  }

  const defaultData = {
    logoUrl: logoUrl || "https://res.cloudinary.com/daprkakyk/image/upload/v1741260445/luxe/uiiqdcle3kayym5qg1kp.png",
    courseImage: courseImage || "http://res.cloudinary.com/daprkakyk/image/upload/v1741257733/luxe/eqrqi2liqecayk6rwtfh.png",
    bookingDate,
    startTime,
    endTime,
    courseName,
    address: "123 Education Street, Learning City, 12345",
    year: new Date().getFullYear(),
    studentEmail, 
    teacherEmail, 
    socialIcons: [
      { url: "https://example.com/facebook.png", alt: "Facebook" },
      { url: "https://example.com/twitter.png", alt: "Twitter" },
      { url: "https://example.com/instagram.png", alt: "Instagram" }
    ],
    amount
  };  

  const requestedByStudent = requestedBy === "student";
  const requester = requestedByStudent ? studentName : teacherName;
  const rejector = requestedByStudent ? teacherName : studentName;

  // 1. Send email to Student
  await sendTemplatedEmail({
    to: studentEmail,
    subject: "Reschedule Request Rejected - Booking Cancelled",
    templateData: {
      ...defaultData,
      title: "Reschedule Rejection",
      studentName,
      teacherName,
      requestedBy,
      nextStepOne: requestedBy === 'student' 
        ? `Your reschedule request has been rejected by ${teacherName}. The booking has been cancelled with a full refund.`
        : `${teacherName}'s reschedule request has been rejected. The booking has been cancelled with a 50% refund.`,
      nextStepTwo: `Rejection reason: ${rejectionReason || "No reason provided"}`,
      buttonText: "Book New Session"
    }
  });

  // 2. Send email to Teacher
  await sendTemplatedEmail({
    to: teacherEmail,
    subject: "Reschedule Request Rejected - Booking Cancelled",
    templateData: {
      ...defaultData,
      title: "Reschedule Rejection",
      studentName,
      teacherName,
      requestedBy,
      nextStepOne: requestedBy === 'student' 
        ? `You have rejected ${studentName}'s reschedule request. The booking has been cancelled and student will receive a full refund.`
        : `${studentName} has rejected your reschedule request. The booking has been cancelled and student will receive a 50% refund.`,
      nextStepTwo: `Rejection reason: ${rejectionReason || "No reason provided"}`,
      buttonText: "View Calendar"
    }
  });

  return { success: true, message: "Reschedule rejection emails sent successfully" };
};

/**
 * Send booking scheduled emails to both student and teacher
 * This is sent at the very first stage when a student attempts to book a session
 */
const sendBookingScheduled = async (bookingData) => {
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
    courseImage,
    amount
  } = bookingData;

  // Validate required fields - removed meetingPlatform and meetingLink from required fields
  const missingFields = [];
  if (!studentEmail) missingFields.push('studentEmail');
  if (!studentName) missingFields.push('studentName');
  if (!teacherName) missingFields.push('teacherName');
  if (!teacherEmail) missingFields.push('teacherEmail');
  if (!bookingDate) missingFields.push('bookingDate');
  if (!startTime) missingFields.push('startTime');
  if (!endTime) missingFields.push('endTime');
  if (!courseName) missingFields.push('courseName');
  if (!amount) missingFields.push('amount');

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields for booking scheduled email: ${missingFields.join(', ')}`);
  }

  const defaultData = {
    logoUrl: logoUrl || "https://res.cloudinary.com/daprkakyk/image/upload/v1741260445/luxe/uiiqdcle3kayym5qg1kp.png",
    courseImage: courseImage || "http://res.cloudinary.com/daprkakyk/image/upload/v1741257733/luxe/eqrqi2liqecayk6rwtfh.png",
    bookingDate,
    startTime,
    endTime,
    courseName,
    address: "123 Education Street, Learning City, 12345",
    year: new Date().getFullYear(),
    studentEmail, 
    teacherEmail, 
    socialIcons: [
      { url: "https://example.com/facebook.png", alt: "Facebook" },
      { url: "https://example.com/twitter.png", alt: "Twitter" },
      { url: "https://example.com/instagram.png", alt: "Instagram" }
    ],
    amount
  };

  // 1. Send email to Student
  await sendTemplatedEmail({
    to: studentEmail,
    subject: "Booking Scheduled - Awaiting Teacher Confirmation",
    templateData: {
      ...defaultData,
      title: "Booking Scheduled",
      studentName,
      teacherName,
      nextStepOne: "Your booking request has been scheduled and is awaiting for teacher confirmation.",
      nextStepTwo: "You'll receive a confirmation email once the teacher accepts your booking request.",
      buttonText: "View Booking Details"
    }
  });

  // 2. Send email to Teacher
  await sendTemplatedEmail({
    to: teacherEmail,
    subject: "New Booking Request - Action Required",
    templateData: {
      ...defaultData,
      title: "Booking Scheduled",
      studentName,
      teacherName,
      nextStepOne: "Please confirm or decline this booking session by providing meeting details. ",
      nextStepTwo: "The student will be notified about the confirmation of session.",
      buttonText: "Respond to Request"
    }
  });

  return { success: true, message: "Booking scheduled emails sent successfully" };
};

module.exports = {
  sendBookingConfirmation,
  sendBookingCancellation,
  sendRescheduleRequest,
  sendRescheduleConfirmation,
  sendRescheduleRejection,
  sendBookingScheduled
};
