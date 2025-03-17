const BookingModel = require("../model/bookingModel");
const StudentProfileModel = require("../model/studentProfileModel");
const TeacherProfileModel = require("../model/teacherProfileModel");
const mongoose = require("mongoose");
const moment = require("moment");
const bookingModel = require("../model/bookingModel");
const paymentModel = require("../model/paymentModel");
const UserModel = require("../model/UserModel");
const CourseSubCategoryModel = require("../model/courseSubCategoryModel");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const emailService = require("../services/emailService");
exports.createBooking = async (req, res) => {
  try {
        const { sessionId } = req.body;

        // Step 1: Retrieve Payment Details from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (!session || session.payment_status != "paid") {
            return res.status(400).json({ message: "Payment not verified" });
        }
        console.log(session,"session");
        
        //Update Payment Details
        const payment=await paymentModel.findOneAndUpdate(
          {sessionId:session.id},
          {transactionId:session.payment_intent,status:"succeeded",paymentStatus:"paid"}
        )

        //Find Exsiting Booking wiht payment ID
      const existingBooking=await BookingModel.findOne({
        paymentId:payment?._id
      })
      const teacher=await UserModel.findOne({
        _id:session.metadata.teacherId
      })
      
      // Fetch subject information safely
      let courseName = "Course";
      try {
        const subject = await CourseSubCategoryModel.findById(session.metadata.subjectId);
        if (subject) {
          courseName = subject.name;
        }
      } catch (subjectError) {
        console.error("Error fetching subject:", subjectError);
      }
      
      const sessionTitle = `${courseName} (${session.metadata.sessionDuration} Minutes)`;
      
    if(existingBooking){
      return res.json({
        success: true,
        message: "Booking already created",
        data:{
          sessionTitle: sessionTitle,
          teacherName: teacher.firstName + teacher.lastName,
          transactionId: session.payment_intent,
          sessionDate: session.metadata.sessionDate,
          sessionStartDate: session.metadata.sessionStartTime,
        }
      });
    }
    console.log(payment,"payment")
     const { teacherId, studentId, subjectId, amount, sessionStartTime, sessionEndTime, sessionDuration, meetingLink, meetingPlatform } = session.metadata;
     const newBookingObj={
      teacherId,
      studentId,
      subjectId,
      amount,
      sessionDate: session.metadata.sessionDate,
      sessionStartTime: session.metadata.sessionStartTime,
      sessionEndTime: session.metadata.sessionEndTime,
      sessionDuration: session.metadata.sessionDuration,
      status:"scheduled",
      paymentId:payment?._id
     }
     
    const newBooking = await BookingModel.create(newBookingObj)
    if (newBooking) {
      const studentProfile = await StudentProfileModel.findOne({
        userId: studentId,
      });
      const teacherProfile = await TeacherProfileModel.findOne({
        userId: teacherId,
      });
      studentProfile?.tutionBookings.push(newBooking._id);
      await studentProfile?.save();
      teacherProfile?.tutionBookings.push(newBooking._id);
      await teacherProfile?.save();
      
      // Get student and teacher details for email
      const student = await UserModel.findById(studentId);
      const teacher = await UserModel.findById(teacherId);
      
      // Format dates for email
      const formattedDate = moment(session.metadata.sessionDate).format('MMMM D, YYYY');
      const formattedStartTime = moment(session.metadata.sessionStartTime).format('h:mm A');
      const formattedEndTime = moment(session.metadata.sessionEndTime).format('h:mm A');
      
      // Send booking scheduled emails (not confirmation yet)
      try {
        await emailService.sendBookingScheduled({
          studentEmail: student.email,
          studentName: student.firstName + ' ' + student.lastName,
          teacherName: teacher.firstName + ' ' + teacher.lastName,
          teacherEmail: teacher.email,
          bookingDate: formattedDate,
          startTime: formattedStartTime,
          endTime: formattedEndTime,
          courseName: sessionTitle,
          amount: amount
        });
        console.log("Booking scheduled emails sent successfully");
      } catch (emailError) {
        console.error("Error sending booking scheduled emails:", emailError);
      }
      
      res.json({
        success: true,
        message: "Booking created successfully",
        data:{
          sessionTitle: sessionTitle,
          teacherName: teacher.firstName + teacher.lastName,
          transactionId: session.payment_intent,
          sessionDate: session.metadata.sessionDate,
          sessionStartDate: session.metadata.sessionStartTime
        }
      });
    } else {
      res.json({
        success: false,
        message: "Booking not created ",
      
      });
    }
  } catch (error) {
    console.log(error)
    res.json({
      successs: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

exports.getBookings = async (req, res) => { 
  try {
    const { role, id: userId } = req.user; // Extract user role and ID
    console.log(role, userId);
    let {
      status,
      startDate,
      endDate,
      teacherId,
      search,
      page = 1,
      limit = 10,
    } = req.query;
    console.log(teacherId,role,status, startDate, endDate, search);
    page = parseInt(page);

    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    let query = {};
    //Filter with Teacher Id
    if (teacherId) {
      query.teacherId = new mongoose.Types.ObjectId(teacherId);
    }
    // Role-based filtering
    if (role === "teacher") {
      query.teacherId = new mongoose.Types.ObjectId(userId);
    } else if (role === "student") {
      query.studentId = new mongoose.Types.ObjectId(userId);
    }

    // Status filtering
    if (status) {
      query.status = status;
    }

    // Date range filtering
    if (startDate || endDate) {
      query.sessionDate = {};
      if (startDate)
        query.sessionDate.$gte = new Date(
          moment(startDate).format("YYYY-MM-DD[T00:00:00.000Z]")
        );
      if (endDate)
        query.sessionDate.$lte = new Date(
          moment(endDate).format("YYYY-MM-DD[T00:00:00.000Z]")
        );
    }
    console.log(query);
    const booking = await BookingModel.find(query);
    console.log(booking);
    // Aggregation pipeline
    const bookings = await BookingModel.aggregate([
      { $match: query },

      // Lookup student details
      {
        $lookup: {
          from: "users",
          localField: "studentId",
          foreignField: "_id",
          as: "student",
        },
      },
      { $unwind: "$student" },

      // // Lookup teacher details
      {
        $lookup: {
          from: "users",
          localField: "teacherId",
          foreignField: "_id",
          as: "teacher",
        },
      },
      { $unwind: "$teacher" }, 

      // // Lookup subject details
      {
        $lookup: {
          from: "coursesubcategories",
          localField: "subjectId",
          foreignField: "_id",
          as: "subject",
        },
      },
      { $unwind: "$subject" },

      // Search filtering (search by student for teacher & search by teacher for student)
      ...(search
        ? [
            {
              $match: {
                $or:
                  role === "teacher"
                    ? [
                        {
                          "student.firstName": {
                            $regex: search,
                            $options: "i",
                          },
                        },
                        {
                          "student.lastName": { $regex: search, $options: "i" },
                        },
                      ]
                    : role === "student"
                    ? [
                        {
                          "teacher.firstName": {
                            $regex: search,
                            $options: "i",
                          },
                        },
                        {
                          "teacher.lastName": { $regex: search, $options: "i" },
                        },
                      ]
                    : [
                        {
                          "student.firstName": {
                            $regex: search,
                            $options: "i",
                          },
                        },
                        {
                          "student.lastName": { $regex: search, $options: "i" },
                        },
                        {
                          "teacher.firstName": {
                            $regex: search,
                            $options: "i",
                          },
                        },
                        {
                          "teacher.lastName": { $regex: search, $options: "i" },
                        },
                      ],
              },
            },
          ]
        : []),

      // Project only necessary fields
      {
        $project: {
          _id: 1,
          status: 1,
          sessionDate: 1,
          sessionStartTime: 1,
          sessionEndTime: 1,
          sessionDuration: 1,
          "subject.name": 1,
          "student._id": 1,
          "student.firstName": 1,
          "student.lastName": 1,
          "student.profilePhoto": 1,
          "student.email": 1,
          "student.profilePhoto": 1,
          "teacher._id": 1,
          "teacher.firstName": 1,
          "teacher.lastName": 1,
          "teacher.email": 1,
          "teacher.profilePhoto": 1,
          "subject.name": 1,
          rescheduleRequest: 1,
          meetingLink: 1,
          meetingPlatform: 1,
        },
      },

      // Add lookup for rescheduleBy user details
      {
        $lookup: {
          from: "users",
          let: { rescheduleBy: "$rescheduleRequest.rescheduleBy" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$rescheduleBy"] }
              }
            },
            {
              $project: {
                _id: 1,
                firstName: 1,
                lastName: 1,
                email: 1,
                profilePhoto: 1,
                role: 1
              }
            }
          ],
          as: "rescheduleRequest.rescheduleByUser"
        }
      },

      // Unwind rescheduleByUser if it exists
      {
        $addFields: {
          "rescheduleRequest.rescheduleByUser": {
            $arrayElemAt: ["$rescheduleRequest.rescheduleByUser", 0]
          }
        }
      },

      // Sort by timeSlot (earliest bookings first)
      { $sort: { sessionDate: 1 } },

      // // Pagination
      { $skip: skip },
      { $limit: limit },
    ]);

    // Total count for pagination
    const countQuery = [
      { $match: query },

      // Lookup student details
      {
        $lookup: {
          from: "users",
          localField: "studentId",
          foreignField: "_id",
          as: "student",
        },
      },
      { $unwind: "$student" },

      // Lookup teacher details
      {
        $lookup: {
          from: "users",
          localField: "teacherId",
          foreignField: "_id",
          as: "teacher",
        },
      },
      { $unwind: "$teacher" },

      // Lookup subject details
      {
        $lookup: {
          from: "coursesubcategories",
          localField: "subjectId",
          foreignField: "_id",
          as: "subject",
        },
      },
      { $unwind: "$subject" },

      // Add lookup for rescheduleBy user details
      {
        $lookup: {
          from: "users",
          let: { rescheduleBy: "$rescheduleRequest.rescheduleBy" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$rescheduleBy"] }
              }
            },
            {
              $project: {
                _id: 1,
                firstName: 1,
                lastName: 1,
                email: 1,
                profilePhoto: 1,
                role: 1
              }
            }
          ],
          as: "rescheduleRequest.rescheduleByUser"
        }
      },

      // Unwind rescheduleByUser if it exists
      {
        $addFields: {
          "rescheduleRequest.rescheduleByUser": {
            $arrayElemAt: ["$rescheduleRequest.rescheduleByUser", 0]
          }
        }
      },

      // Search filtering (same as before)
      ...(search
        ? [
            {
              $match: {
                $or:
                  role === "teacher"
                    ? [
                        {
                          "student.firstName": {
                            $regex: search,
                            $options: "i",
                          },
                        },
                        {
                          "student.lastName": { $regex: search, $options: "i" },
                        },
                      ]
                    : role === "student"
                    ? [
                        {
                          "teacher.firstName": {
                            $regex: search,
                            $options: "i",
                          },
                        },
                        {
                          "teacher.lastName": { $regex: search, $options: "i" },
                        },
                      ]
                    : [
                        {
                          "student.firstName": {
                            $regex: search,
                            $options: "i",
                          },
                        },
                        {
                          "student.lastName": { $regex: search, $options: "i" },
                        },
                        {
                          "teacher.firstName": {
                            $regex: search,
                            $options: "i",
                          },
                        },
                        {
                          "teacher.lastName": { $regex: search, $options: "i" },
                        },
                      ],
              },
            },
          ]
        : []),

      // Count total matched records
      { $count: "totalBookings" },
    ];

    const totalResult = await BookingModel.aggregate(countQuery);
    const totalBookings =
      totalResult.length > 0 ? totalResult[0].totalBookings : 0;
    res.json({
      success: true,
      data: bookings,
      total: totalBookings,
      currentPage: page,
      totalPages: Math.ceil(totalBookings / limit),
      message: "Bookings retrieved successfully",
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({
        success: false,
        message: "Something went wrong",
        error: error.message,
      });
  }
};
//Get Booking for Tutor 
exports.getBookingsForTutor = async (req, res) => {
  try {
    let {
      startDate,
      endDate,
      teacherId,
    } = req.query;
    console.log(teacherId, startDate, endDate,"getBookingForTutor");
  
    let query = {status:{$ne:"cancelled"}};
    //Filter with Teacher Id
    if (teacherId) {
      query.teacherId = new mongoose.Types.ObjectId(teacherId);
    }

    // Date range filtering
    if (startDate || endDate) {
      query.sessionDate = {};
      if (startDate)
        query.sessionDate.$gte = new Date(
          moment(startDate).format("YYYY-MM-DD[T00:00:00.000Z]")
        );
      if (endDate)
        query.sessionDate.$lte = new Date(
          moment(endDate).format("YYYY-MM-DD[T00:00:00.000Z]")
        );
    }
    console.log(query);
   
    const bookings = await BookingModel.aggregate([
      { $match: query },

      // Lookup student details
      {
        $lookup: {
          from: "users",
          localField: "studentId",
          foreignField: "_id",
          as: "student",
        },
      },
      { $unwind: "$student" },

      // // Lookup teacher details
      {
        $lookup: {
          from: "users",
          localField: "teacherId",
          foreignField: "_id",
          as: "teacher",
        },
      },
      { $unwind: "$teacher" },

      // // Lookup subject details
      {
        $lookup: {
          from: "coursesubcategories",
          localField: "subjectId",
          foreignField: "_id",
          as: "subject",
        },
      },
      { $unwind: "$subject" },

      // Project only necessary fields
      {
        $project: {
          _id: 1,
          status: 1,
          sessionDate: 1,
          sessionStartTime: 1,
          sessionEndTime: 1,
          sessionDuration: 1,
          // "subject.name": 1,
          // "student._id": 1,
          // "student.firstName": 1,
          // "student.lastName": 1,
          // "student.profilePhoto": 1,
          // "student.email": 1,
          // "student.profilePhoto": 1,
          // "teacher.firstName": 1,
          // "teacher.lastName": 1,
          // "teacher.email": 1,
          // "teacher.profilePhoto": 1,
          // "subject.name": 1,
          // rescheduleRequest: 1,
          // meetingLink: 1,
          // meetingPlatform: 1,
        },
      },

      // Sort by timeSlot (earliest bookings first)
      { $sort: { sessionDate: 1 } },

    ]);

    res.json({
      success: true,
      data: bookings,
      message: "Bookings retrieved successfully",
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({
        success: false,
        message: "Something went wrong",
        error: error.message,
      });
  }
};
exports.confirmBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookingId = req.params.bookingId;
    const { meetingPlatform, meetingLink, meetingUsername, meetingPassword } =
      req.body;
      const booking = await bookingModel.findOne({
        _id: bookingId,
        teacherId: userId,
      });
      console.log(booking, userId, bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== "scheduled" && booking.status !== "rescheduled") {
      return res.status(400).json({ message: "Booking cannot be confirmed" });
    }

    booking.meetingPlatform = meetingPlatform;
    booking.meetingLink = meetingLink;
    booking.meetingUsername = meetingUsername;
    booking.meetingPassword = meetingPassword;
    booking.status = "confirmed";

    await booking.save();

    // Get student and teacher details for email
    const student = await UserModel.findById(booking.studentId);
    const teacher = await UserModel.findById(booking.teacherId);
    
    // Format dates for email
    const formattedDate = moment(booking.sessionDate).format('MMMM D, YYYY');
    const formattedStartTime = moment(booking.sessionStartTime).format('h:mm A');
    const formattedEndTime = moment(booking.sessionEndTime).format('h:mm A');
    
    // Get subject information
    let courseName = "Course";
    try {
      const subject = await CourseSubCategoryModel.findById(booking.subjectId);
      if (subject) {
        courseName = subject.name;
      }
    } catch (subjectError) {
      console.error("Error fetching subject:", subjectError);
    }
    
    const sessionTitle = `${courseName} (${booking.sessionDuration} Minutes)`;
    
    // Send booking confirmation emails
    try {
      await emailService.sendBookingConfirmation({
        studentEmail: student.email,
        studentName: student.firstName + ' ' + student.lastName,
        teacherName: teacher.firstName + ' ' + teacher.lastName,
        teacherEmail: teacher.email,
        bookingDate: formattedDate,
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        courseName: sessionTitle,
        meetingPlatform: booking.meetingPlatform,
        meetingLink: booking.meetingLink,
        amount: booking.amount
      });
      console.log("Booking confirmation emails sent successfully");
    } catch (emailError) {
      console.error("Error sending booking confirmation emails:", emailError);
      // Continue with the response even if email sending fails
    }

    res
      .status(200)
      .json({ message: "Booking confirmed successfully", booking });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

exports.editBookingMeetingInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookingId = req.params.bookingId;
    const { meetingPlatform, meetingLink, meetingUsername, meetingPassword } =
      req.body;

    const booking = await bookingModel.findById({
      _id: bookingId,
      teacherId: userId,
    });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== "confirmed") {
      return res
        .status(400)
        .json({
          message:
            "Meeting details for Booking can only be updated for confirmed bookings",
        });
    }

    const oldMeetingPlatform = booking.meetingPlatform;
    const oldMeetingLink = booking.meetingLink;

    booking.meetingPlatform = meetingPlatform || booking.meetingPlatform;
    booking.meetingLink = meetingLink || booking.meetingLink;
    booking.meetingUsername = meetingUsername || booking.meetingUsername;
    booking.meetingPassword = meetingPassword || booking.meetingPassword;

    await booking.save();

    // Only send an email if the platform or link has changed
    if (oldMeetingPlatform !== booking.meetingPlatform || oldMeetingLink !== booking.meetingLink) {
      // Get student and teacher details for email
      const student = await UserModel.findById(booking.studentId);
      const teacher = await UserModel.findById(booking.teacherId);
      
      // Format dates for email
      const formattedDate = moment(booking.sessionDate).format('MMMM D, YYYY');
      const formattedStartTime = moment(booking.sessionStartTime).format('h:mm A');
      const formattedEndTime = moment(booking.sessionEndTime).format('h:mm A');
      
      // Get subject information
      let courseName = "Course";
      try {
        const subject = await CourseSubCategoryModel.findById(booking.subjectId);
        if (subject) {
          courseName = subject.name;
        }
      } catch (subjectError) {
        console.error("Error fetching subject:", subjectError);
      }
      
      const sessionTitle = `${courseName} (${booking.sessionDuration} Minutes)`;
      
      // Send updated meeting info emails
      try {
        await emailService.sendBookingConfirmation({
          studentEmail: student.email,
          studentName: student.firstName + ' ' + student.lastName,
          teacherName: teacher.firstName + ' ' + teacher.lastName,
          teacherEmail: teacher.email,
          bookingDate: formattedDate,
          startTime: formattedStartTime,
          endTime: formattedEndTime,
          courseName: sessionTitle,
          meetingPlatform: booking.meetingPlatform,
          meetingLink: booking.meetingLink,
          amount: booking.amount
        });
        console.log("Meeting update emails sent successfully");
      } catch (emailError) {
        console.error("Error sending meeting update emails:", emailError);
      }
    }

    res
      .status(200)
      .json({ message: "Meeting details updated successfully", booking });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookingId = req.params.bookingId;
    const { cancellationReason } = req.body;
    if (!cancellationReason)
      res
        .status(400)
        .json({ success: false, message: "Cancellation reaon is required" });
    const query = {
      _id: bookingId,
    };
    if (req.user.role == "student") query.studentId = userId;
    if (req.user.role == "teacher") query.teacherId = userId;
    const booking = await bookingModel.findOne(query);
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }
    if (booking.status === "cancelled") {
      return res
        .status(400)
        .json({
          succes: false,
          message: "Booking is already cancelled",
        });
    }

    const currentTime = new Date();
    const sessionStartTime = new Date(booking.sessionStartTime);
    const timeDifference = (sessionStartTime - currentTime) / (1000 * 60 * 60); // Convert to hours

    let refundAmount = 0;
    console.log(timeDifference, "time");
    if (String(userId) === String(booking.studentId)) {
      // Student cancels
      if (timeDifference >= 24) {
        refundAmount = 100; // Full refund
      } else {
        return res.json({
          success: false,
          message: "You can't cancel meeting which scheudled today",
        });
      }
    } else if (String(userId) === String(booking.teacherId)) {
      // Tutor cancels
      refundAmount = 100; // Full refund
    } else {
      return res
        .status(403)
        .json({
          success: false,
          message: "Unauthorized to cancel this booking",
        });
    }

    // Update Booking Status
    booking.status = "cancelled";
    booking.cancelledBy = userId;
    booking.cancellationReason = cancellationReason;
    await booking.save();

    // Process Refund (If Applicable)
    if (refundAmount === 100) {
      await paymentModel.findByIdAndUpdate(booking.paymentId, {
        status: "Refunded",
      });
    }

    // Get student and teacher details for email
    const student = await UserModel.findById(booking.studentId);
    const teacher = await UserModel.findById(booking.teacherId);
    
    // Format dates for email
    const formattedDate = moment(booking.sessionDate).format('MMMM D, YYYY');
    const formattedStartTime = moment(booking.sessionStartTime).format('h:mm A');
    const formattedEndTime = moment(booking.sessionEndTime).format('h:mm A');
    
    // Get subject information
    let courseName = "Course";
    try {
      const subject = await CourseSubCategoryModel.findById(booking.subjectId);
      if (subject) {
        courseName = subject.name;
      }
    } catch (subjectError) {
      console.error("Error fetching subject:", subjectError);
    }
    
    const sessionTitle = `${courseName} (${booking.sessionDuration} Minutes)`;
    
    // Send booking cancellation emails
    try {
      await emailService.sendBookingCancellation({
        studentEmail: student.email,
        studentName: student.firstName + ' ' + student.lastName,
        teacherName: teacher.firstName + ' ' + teacher.lastName,
        teacherEmail: teacher.email,
        bookingDate: formattedDate,
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        courseName: sessionTitle,
        cancelledBy: req.user.role, // 'student' or 'teacher'
        cancellationReason,
        amount: booking.amount
      });        
      console.log("Booking cancellation emails sent successfully");
    } catch (emailError) {
      console.error("Error sending booking cancellation emails:", emailError);
      // Continue with the response even if email sending fails
    }

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      data: booking,
    });
  } catch (error) {
    console.log(error, "error");
    res.status(500).json({ success: false, message: "Server error", error });
  }
};     
exports.rescheduleRequestBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { newTime, reason } = req.body;

    const booking = await bookingModel.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    // Allow both teacher and student to request reschedule
    const isTeacher = req.user.id.toString() === booking.teacherId.toString();
    const isStudent = req.user.id.toString() === booking.studentId.toString();
    
    if (!isTeacher && !isStudent) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    if ( booking.status === "rescheduled") {
      return res.status(400).json({
        success: false,
        message: "Booking already rescheduled",
      });
    }

    if (booking.status !== "scheduled") {
      return res.status(400).json({
        success: false,
        message: "Booking is either cancelled or completed or confirmed",
      });
    }

    // Update Booking with Reschedule Request
    booking.rescheduleRequest = {
      newTime,
      reason,
      status: "pending",
      rescheduleBy: req.user.id // Store the User ObjectId instead of "teacher"/"student" string
    };

    await booking.save();

    // Get the user data to include as rescheduleByUser
    const rescheduleByUser = await UserModel.findById(req.user.id, {
      _id: 1,
      firstName: 1,
      lastName: 1,
      email: 1,
      profilePhoto: 1,
      role: 1
    });

    // Add the user data to the booking object for the response
    booking._doc.rescheduleRequest.rescheduleByUser = rescheduleByUser;

    // Get student and teacher details for email
    const student = await UserModel.findById(booking.studentId);
    const teacher = await UserModel.findById(booking.teacherId);
    
    // Parse the new time to get date and time components
    const newTimeObj = new Date(newTime);
    const newBookingDate = moment(newTimeObj).format('MMMM D, YYYY');
    const newStartTime = moment(newTimeObj).format('h:mm A');
    
    // Calculate end time (assuming same duration as original booking)
    const originalStartTime = new Date(booking.sessionStartTime);
    const originalEndTime = new Date(booking.sessionEndTime);
    const durationMs = originalEndTime - originalStartTime;
    const newEndTimeObj = new Date(newTimeObj.getTime() + durationMs);
    const newEndTime = moment(newEndTimeObj).format('h:mm A');
    
    // Format original dates for email
    const formattedDate = moment(booking.sessionDate).format('MMMM D, YYYY');
    const formattedStartTime = moment(booking.sessionStartTime).format('h:mm A');
    const formattedEndTime = moment(booking.sessionEndTime).format('h:mm A');
    
    // Get subject information
    let courseName = "Course";
    try {
      const subject = await CourseSubCategoryModel.findById(booking.subjectId);
      if (subject) {
        courseName = subject.name;
      }
    } catch (subjectError) {
      console.error("Error fetching subject:", subjectError);
    }
    
    const sessionTitle = `${courseName} (${booking.sessionDuration} Minutes)`;
    
    // Send reschedule request emails
    try {
      await emailService.sendRescheduleRequest({
        studentEmail: student.email,
        studentName: student.firstName + ' ' + student.lastName,
        teacherName: teacher.firstName + ' ' + teacher.lastName,
        teacherEmail: teacher.email,
        bookingDate: formattedDate,
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        courseName: sessionTitle,
        newBookingDate,
        newStartTime,
        newEndTime,
        rescheduleReason: reason,
        requestedBy: isTeacher ? "teacher" : "student",
        amount: booking.amount
      });
      console.log("Reschedule request emails sent successfully");
    } catch (emailError) {
      console.error("Error sending reschedule request emails:", emailError);
    }

    res.json({
      success: true,
      message: "Reschedule request sent successfully",
      data: booking,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.rescheduleResponseBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { action } = req.body; // action: "accept" or "deny"

    const booking = await bookingModel.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
    console.log(booking, "booking.rescheduleRequest");
    // Check if there's a pending reschedule request
    if (booking.rescheduleRequest.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Reschedule request already processed",
      });
    }

    // Determine who should respond to the request
    const requestedById = booking.rescheduleRequest.rescheduleBy.toString();
    const responderId = req.user.id.toString();
    
    // If request was made by student, teacher should respond and vice versa
    const isValidResponder = (
      (requestedById === booking.studentId.toString() && responderId === booking.teacherId.toString()) ||
      (requestedById === booking.teacherId.toString() && responderId === booking.studentId.toString())
    ); 
 
    if (!isValidResponder) { 
      return res.status(403).json({ 
        success: false, 
        message: "Unauthorized. Only the other party can respond to the reschedule request" 
      });
    }

    // Rest of the existing code remains the same
    if (action === "accept") {
      const newTimeObj = new Date(booking.rescheduleRequest.newTime);
      booking.sessionStartTime = newTimeObj;
      
      const originalDuration = booking.sessionEndTime - booking.sessionStartTime;
      booking.sessionEndTime = new Date(newTimeObj.getTime() + originalDuration);
      
      booking.sessionDate = moment(newTimeObj).startOf('day').toDate();
      
      booking.status = "rescheduled";
      booking.rescheduleRequest.status = "accepted";
    } else {
      booking.status = "scheduled"; // Changed from 'cancelled' to 'scheduled' to keep original booking active
      booking.rescheduleRequest.status = "denied";
    }

    await booking.save();

    // Populate the rescheduleBy user data before sending response
    await booking.populate('rescheduleRequest.rescheduleBy', '_id firstName lastName email role');

    // Get student and teacher details for email
    const student = await UserModel.findById(booking.studentId);
    const teacher = await UserModel.findById(booking.teacherId);
    
    // Parse the new time to get date and time components
    const newTimeObj = new Date(booking.rescheduleRequest.newTime);
    const newBookingDate = moment(newTimeObj).format('MMMM D, YYYY');
    const newStartTime = moment(newTimeObj).format('h:mm A');
    
    // Calculate end time (assuming same duration as original booking)
    const originalStartTime = new Date(booking.sessionStartTime);
    const originalEndTime = new Date(booking.sessionEndTime);
    const durationMs = originalEndTime - originalStartTime;
    const newEndTimeObj = new Date(newTimeObj.getTime() + durationMs);
    const newEndTime = moment(newEndTimeObj).format('h:mm A');
    
    // Format original dates for email
    const formattedDate = moment(booking.sessionDate).format('MMMM D, YYYY');
    const formattedStartTime = moment(booking.sessionStartTime).format('h:mm A');
    const formattedEndTime = moment(booking.sessionEndTime).format('h:mm A');
    
    // Get subject information
    let courseName = "Course";
    try {
      const subject = await CourseSubCategoryModel.findById(booking.subjectId);
      if (subject) {
        courseName = subject.name;
      }
    } catch (subjectError) {
      console.error("Error fetching subject:", subjectError);
    }
    
    const sessionTitle = `${courseName} (${booking.sessionDuration} Minutes)`;
    
    // Send appropriate emails based on the action
    try {
      if (action === "accept") {
        await emailService.sendRescheduleConfirmation({
          studentEmail: student.email,
          studentName: student.firstName + ' ' + student.lastName,
          teacherName: teacher.firstName + ' ' + teacher.lastName,
          teacherEmail: teacher.email,
          oldBookingDate: formattedDate,
          oldStartTime: formattedStartTime,
          oldEndTime: formattedEndTime,
          newBookingDate,
          newStartTime,
          newEndTime,
          courseName: sessionTitle,
          rescheduleReason: booking.rescheduleRequest.reason,
          requestedBy: requestedById === booking.teacherId.toString() ? "teacher" : "student",
          amount: booking.amount
        });
      } else {
        await emailService.sendRescheduleRejection({
          studentEmail: student.email,
          studentName: student.firstName + ' ' + student.lastName,
          teacherName: teacher.firstName + ' ' + teacher.lastName,
          teacherEmail: teacher.email,
          bookingDate: formattedDate,
          startTime: formattedStartTime,
          endTime: formattedEndTime,
          newBookingDate,
          newStartTime,
          newEndTime,
          courseName: sessionTitle,
          rescheduleReason: booking.rescheduleRequest.reason,
          rejectionReason: req.body.rejectionReason || "No reason provided",
          requestedBy: requestedById === booking.teacherId.toString() ? "teacher" : "student",
          amount: booking.amount
        });
      }
    } catch (emailError) {
      console.error(`Error sending ${action === "accept" ? "confirmation" : "rejection"} emails:`, emailError);
    }

    res.json({
      success: true,
      message: `Reschedule request ${action}ed successfully`,
      data: booking,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}; 

exports.addPayment = async (req, res) => {
  try {
    // Get payment details from request
    const { 
      studentId, 
      teacherId, 
      subjectId, 
      amount, 
      sessionDate, 
      sessionStartTime, 
      sessionEndTime, 
      sessionDuration,
      paymentSessionId
    } = req.body;

    // Create payment record
    const payment = await paymentModel.create({
      studentId,
      teacherId,
      amount,
      sessionId: paymentSessionId,
      status: "pending",
      paymentStatus: "pending"
    });

    // Create booking in scheduled state
    const bookingObj = {
      teacherId,
      studentId,
      subjectId,
      amount,
      sessionDate,
      sessionStartTime,
      sessionEndTime,
      sessionDuration,
      status: "scheduled",
      paymentId: payment._id
    };
    
    const booking = await BookingModel.create(bookingObj);
    
    // Get student and teacher details for email
    const student = await UserModel.findById(studentId);
    const teacher = await UserModel.findById(teacherId);
    
    // Format dates for email
    const formattedDate = moment(sessionDate).format('MMMM D, YYYY');
    const formattedStartTime = moment(sessionStartTime).format('h:mm A');
    const formattedEndTime = moment(sessionEndTime).format('h:mm A');
    
    // Get subject information
    let courseName = "Course";
    try {
      const subject = await CourseSubCategoryModel.findById(subjectId);
      if (subject) {
        courseName = subject.name;
      }
    } catch (subjectError) {
      console.error("Error fetching subject:", subjectError);
    }
    
    const sessionTitle = `${courseName} (${sessionDuration} Minutes)`;
    
    // Send booking scheduled emails
    try {
      await emailService.sendBookingScheduled({
        studentEmail: student.email,
        studentName: student.firstName + ' ' + student.lastName,
        teacherName: teacher.firstName + ' ' + teacher.lastName,
        teacherEmail: teacher.email,
        bookingDate: formattedDate,
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        courseName: sessionTitle,
        amount
      });
      console.log("Booking scheduled emails sent successfully");
    } catch (emailError) {
      console.error("Error sending booking scheduled emails:", emailError);
    }

    return res.status(200).json({
      success: true,
      message: "Payment and booking created successfully",
      data: {
        booking,
        payment
      }
    });
  } catch (error) {
    console.error("Error in addPayment:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating payment and booking",
      error: error.message
    });
  }
};
 