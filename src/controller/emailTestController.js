const emailService = require("../services/emailService");

/**
 * Test controller for sending booking confirmation emails
 */
exports.testBookingConfirmation = async (req, res) => {
  try {
    const {
      studentEmail = "nethead321@gmail.com",
      studentName,
      teacherName,
      teacherEmail = "sakshi04002@gmail.com",
      bookingDate,
      startTime,
      endTime,
      courseName,
      logoUrl,
      courseImage,
      meetingPlatform = "Zoom",
      meetingLink = "https://zoom.us/j/123456789",
      amount = 2500
    } = req.body;

    console.log('Received test email request for student:', studentEmail, 'and teacher:', teacherEmail);

    // Validate required fields
    if (!studentEmail || !studentName || !teacherName || !teacherEmail || !bookingDate || !startTime || !endTime || !courseName || !meetingPlatform || !meetingLink || !amount) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const result = await emailService.sendBookingConfirmation({
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
      meetingPlatform,
      meetingLink,
      amount
    });

    return res.status(200).json({
      success: true,
      message: "Booking confirmation emails sent successfully to both student and teacher",
      result
    });
  } catch (error) {
    console.error("Error sending test booking confirmation:", error);
    res.status(500).json({ success: false, message: "Failed to send booking confirmation", error: error.message });
  }
};

/**
 * Test controller for sending booking cancellation emails
 */
exports.testBookingCancellation = async (req, res) => {
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
      cancelledBy = "teacher", 
      cancellationReason = "Schedule conflict", 
      logoUrl,
      courseImage,
      amount = 2500
    } = req.body;

    console.log('Received test booking cancellation email request for student:', studentEmail, 'and teacher:', teacherEmail);

    // Validate required fields
    if (!studentEmail || !studentName || !teacherName || !teacherEmail || !bookingDate || !startTime || !endTime || !courseName || !amount) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const result = await emailService.sendBookingCancellation({
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
      amount
    });

    return res.status(200).json({
      success: true,
      message: "Booking cancellation emails sent successfully to both student and teacher",
      result
    });
  } catch (error) {
    console.error("Error sending test booking cancellation:", error);
    res.status(500).json({ success: false, message: "Failed to send booking cancellation", error: error.message });
  }
};

/**
 * Test controller for sending reschedule request emails
 */
exports.testRescheduleRequest = async (req, res) => {
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
      newBookingDate,
      newStartTime,
      newEndTime,
      rescheduleReason = "Schedule conflict", 
      requestedBy = "student", 
      logoUrl,
      courseImage,
      amount = 2500
    } = req.body;

    console.log('Received test reschedule request email for student:', studentEmail, 'and teacher:', teacherEmail);

    // Validate required fields
    if (!studentEmail || !studentName || !teacherName || !teacherEmail || !bookingDate || !startTime || !endTime || !courseName || !newBookingDate || !newStartTime || !newEndTime || !amount) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const result = await emailService.sendRescheduleRequest({
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
    });

    return res.status(200).json({
      success: true,
      message: "Reschedule request emails sent successfully to both student and teacher",
      result
    });
  } catch (error) {
    console.error("Error sending test reschedule request:", error);
    res.status(500).json({ success: false, message: "Failed to send reschedule request", error: error.message });
  }
};

/**
 * Test controller for sending reschedule confirmation emails
 */
exports.testRescheduleConfirmation = async (req, res) => {
  try {
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
      rescheduleReason = "Schedule conflict", 
      requestedBy = "student", 
      logoUrl,
      courseImage,
      amount = 2500
    } = req.body;

    console.log('Received test reschedule confirmation email for student:', studentEmail, 'and teacher:', teacherEmail);

    // Validate required fields
    if (!studentEmail || !studentName || !teacherName || !teacherEmail || !oldBookingDate || !oldStartTime || !oldEndTime || !newBookingDate || !newStartTime || !newEndTime || !courseName || !amount) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const result = await emailService.sendRescheduleConfirmation({
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
    });

    return res.status(200).json({
      success: true,
      message: "Reschedule confirmation emails sent successfully to both student and teacher",
      result
    });
  } catch (error) {
    console.error("Error sending test reschedule confirmation:", error);
    res.status(500).json({ success: false, message: "Failed to send reschedule confirmation", error: error.message });
  }
};

/**
 * Test controller for sending reschedule rejection emails
 */
exports.testRescheduleRejection = async (req, res) => {
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
      newBookingDate,
      newStartTime,
      newEndTime,
      rescheduleReason = "Schedule conflict", 
      rejectionReason = "Not available at the requested time", 
      requestedBy = "student", 
      logoUrl,
      courseImage,
      amount = 2500
    } = req.body;

    console.log('Received test reschedule rejection email for student:', studentEmail, 'and teacher:', teacherEmail);

    // Validate required fields
    if (!studentEmail || !studentName || !teacherName || !teacherEmail || !bookingDate || !startTime || !endTime || !courseName || !newBookingDate || !newStartTime || !newEndTime || !amount) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const result = await emailService.sendRescheduleRejection({
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
    });

    return res.status(200).json({
      success: true,
      message: "Reschedule rejection emails sent successfully to both student and teacher",
      result
    });
  } catch (error) {
    console.error("Error sending test reschedule rejection:", error);
    res.status(500).json({ success: false, message: "Failed to send reschedule rejection", error: error.message });
  }
};

/**
 * Test controller for sending booking scheduled emails
 */
exports.testBookingScheduled = async (req, res) => {
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
      courseImage,
      meetingPlatform,
      meetingLink,
      amount = 2500
    } = req.body;

    console.log('Received test booking scheduled email request for student:', studentEmail, 'and teacher:', teacherEmail);

    // Validate required fields
    if (!studentEmail || !studentName || !teacherName || !teacherEmail || !bookingDate || !startTime || !endTime || !courseName || !amount) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const result = await emailService.sendBookingScheduled({
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
      meetingPlatform,
      meetingLink,
      amount
    });

    return res.status(200).json({
      success: true,
      message: "Booking scheduled emails sent successfully to both student and teacher",
      result
    });
  } catch (error) {
    console.error("Error sending test booking scheduled:", error);
    res.status(500).json({ success: false, message: "Failed to send booking scheduled emails", error: error.message });
  }
};
