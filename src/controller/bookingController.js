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
    const { sessionId, mode } = req.body;
    console.log("Creating booking with sessionId:", sessionId);

    // Check if it's a PayFast payment (booking_ prefix)
    if ( mode === "payfast") {
      // Find the payment record
      const payment = await paymentModel.findOne({ sessionId });
      console.log("Found payment record:", payment);
      
      if (!payment) {
        console.error("Payment record not found for sessionId:", sessionId);
        return res.status(400).json({ 
          success: false,
          message: "Payment record not found" 
        });
      }

      // For PayFast, consider 'succeeded' as valid state
      if (payment.paymentStatus !== "paid") {
        console.error("Payment not in succeeded state:", payment.paymentStatus);
        return res.status(400).json({ 
          success: false,
          message: "Payment not verified" 
        });
      }

      // Find existing booking with payment ID
      const existingBooking = await BookingModel.findOne({
        paymentId: payment._id
      });
      console.log("Existing booking check:", existingBooking ? "Found" : "Not found");

      if (existingBooking) {
        return res.json({
          success: true,
          message: "Booking already created",
          data: existingBooking
        });
      }

      const metadata = payment.metadata;
      // Get teacher details from metadata
      const teacherId = metadata.teacherId || payment.teacherId || payment.custom_str2;
      if (!teacherId) {
        console.error("Teacher ID not found in payment record");
        return res.status(400).json({
          success: false,
          message: "Teacher ID not found in payment record"
        });
      }
      console.log("Teacher ID:", teacherId);
      
      const teacher = await UserModel.findById(teacherId);
      if (!teacher) {
        console.error("Teacher not found for ID:", teacherId);
        return res.status(400).json({
          success: false,
          message: "Teacher not found"
        });
      }
      console.log("Teacher found:", teacher.firstName, teacher.lastName);

      // Get student details from metadata
      const studentId = metadata.studentId || payment.studentId || payment.userId || payment.custom_str1;
      if (!studentId) {
        console.error("Student ID not found in payment record");
        return res.status(400).json({
          success: false,
          message: "Student ID not found in payment record"
        });
      }
      console.log("Student ID:", studentId);

      // Get subject ID from metadata
      const subjectId = metadata.subjectId || payment.subjectId || payment.custom_str4;
      if (!subjectId) {
        console.error("Subject ID not found in payment record");
        return res.status(400).json({
          success: false,
          message: "Subject ID not found in payment record"
        });
      }
      console.log("Subject ID:", subjectId);

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

      // Create booking object from metadata (similar to Stripe approach)
      const bookingData = {
        teacherId,
        studentId,
        subjectId,
        amount: metadata.amount || payment.amount,
        sessionDate: new Date(metadata.sessionDate),
        sessionStartTime: new Date(metadata.sessionStartTime),
        sessionEndTime: new Date(metadata.sessionEndTime),
        sessionDuration: metadata.sessionDuration,
        status: "scheduled",
        paymentId: payment._id
      };

      // Validate all required fields are present
      const requiredFields = ['teacherId', 'studentId', 'subjectId', 'sessionDate', 'sessionStartTime', 'sessionEndTime', 'sessionDuration'];
      const missingFields = requiredFields.filter(field => !bookingData[field]);
      
      if (missingFields.length > 0) {
        console.error("Missing required fields for booking:", missingFields);
        console.error("Payment data:", payment);
        console.error("Metadata:", metadata);
        return res.status(400).json({
          success: false,
          message: `Missing required booking fields: ${missingFields.join(', ')}`
        });
      }

      console.log("Creating booking with data:", bookingData);
      const newBooking = await BookingModel.create(bookingData);
      console.log("Booking created:", newBooking);

      // Update payment status to mark it as used
      // await paymentModel.findByIdAndUpdate(payment._id, {
      //   status: "succeeded",
      //   paymentStatus: "paid"
      // });

      // Get student details for email
      const student = await UserModel.findById(studentId);
      if (!student) {
        console.error("Student not found for ID:", studentId);
      }

      // Add booking to student and teacher profiles 
      try {
        // Find student and teacher profiles
        const studentProfile = await StudentProfileModel.findOne({
          userId: studentId,
        });
        const teacherProfile = await TeacherProfileModel.findOne({
          userId: teacherId,
        });
        
        // Add the booking to their bookings lists
        if (studentProfile) {
          studentProfile.tutionBookings.push(newBooking._id);
          await studentProfile.save();
        }
        
        if (teacherProfile) {
          teacherProfile.tutionBookings.push(newBooking._id);
          await teacherProfile.save();
        }
      } catch (error) {
        console.error("Error updating profiles with booking:", error);
        // Continue even if this fails
      }

      // Send booking confirmation emails
      try {
        if (student && teacher) {
          await emailService.sendBookingScheduled({
            studentEmail: student.email,
            studentName: student.firstName + ' ' + student.lastName,
            teacherName: teacher.firstName + ' ' + teacher.lastName,
            teacherEmail: teacher.email,
            bookingDate: moment(bookingData.sessionDate).format('MMMM D, YYYY'),
            startTime: moment(bookingData.sessionStartTime).format('h:mm A'),
            endTime: moment(bookingData.sessionEndTime).format('h:mm A'),
            courseName: `${courseName} (${bookingData.sessionDuration} Minutes)`,
            amount: bookingData.amount
          });
          console.log("Booking confirmation emails sent successfully");
        }
      } catch (emailError) {
        console.error("Error sending booking confirmation emails:", emailError);
      }

      return res.json({
        success: true,
        message: "Booking created successfully",
        data: {
          sessionTitle: `${courseName} (${bookingData.sessionDuration} Minutes)`,
          teacherName: teacher.firstName + teacher.lastName,
          sessionDate: bookingData.sessionDate,
          sessionStartDate: bookingData.sessionStartTime,
          ...newBooking.toObject()
        }
      });
    } else {
      // ===== STRIPE PAYMENT (Original unchanged code) =====
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
    }
  } catch (error) {
    console.error("Error in createBooking:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message
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
    
    // Role-based filtering - skip for admin role
    if (role === "teacher") {
      query.teacherId = new mongoose.Types.ObjectId(userId);
    } else if (role === "student") {
      query.studentId = new mongoose.Types.ObjectId(userId);
    }
    // Note: If role is admin, we don't apply any role-based filtering, so they get all bookings

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

    // Fetch the updated booking with populated fields to match getBookings response format
    const updatedBooking = await BookingModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(bookingId) } },
      
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

      // Add lookup for rescheduleBy user details (if exists)
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
          meetingUsername: 1,
          meetingPassword: 1,
        },
      }
    ]);

    res.status(200).json({ 
      success: true,
      message: "Booking confirmed successfully", 
      data: updatedBooking[0] || booking 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
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

    // Fetch the updated booking with populated fields to match getBookings response format
    const updatedBooking = await BookingModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(bookingId) } },
      
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

      // Add lookup for rescheduleBy user details (if exists)
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
          meetingUsername: 1,
          meetingPassword: 1,
        },
      }
    ]);

    res.status(200).json({ 
      success: true,
      message: "Meeting details updated successfully", 
      data: updatedBooking[0] || booking 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
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

    // Fetch the updated booking with populated fields to match getBookings response format
    const updatedBooking = await BookingModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(bookingId) } },
      
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

      // Add lookup for rescheduleBy user details (if exists)
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
          cancellationReason: 1,
          cancelledBy: 1
        },
      }
    ]);

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      data: updatedBooking[0] || booking,
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

    // Check if booking has already been rescheduled before
    if (booking.hasBeenRescheduled) {
      return res.status(400).json({
        success: false,
        message: "This booking has already been rescheduled once and cannot be rescheduled again",
      });
    }

    if (booking.status === "rescheduled") {
      return res.status(400).json({
        success: false,
        message: "Booking already rescheduled",
      });
    }

    if (booking.status !== "scheduled" && booking.status !== "confirmed") {
      return res.status(400).json({
        success: false,
        message: "Booking is either cancelled or completed",
      });
    }

    // Update Booking with Reschedule Request
    booking.rescheduleRequest = {
      newTime,
      reason,
      status: "pending",
      rescheduleBy: req.user.id,
      adminResponse: {
        status: "pending"
      },
      partyResponse: {
        status: "pending"
      }
    };

    await booking.save();

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
    
    // Send reschedule request emails to both other party and admin
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

    // Fetch the updated booking with populated fields to match getBookings response format
    const updatedBooking = await BookingModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(bookingId) } },
      
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
          hasBeenRescheduled: 1
        },
      }
    ]);

    res.json({
      success: true,
      message: "Reschedule request sent successfully",
      data: updatedBooking[0] || booking,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.rescheduleResponseBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { action, reason } = req.body; // action: "accept" or "deny"

    const booking = await bookingModel.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    // Check if there's a pending reschedule request
    if (booking.rescheduleRequest.status !== "pending" && 
        booking.rescheduleRequest.status !== "accepted_by_party") {
      return res.status(400).json({
        success: false,
        message: "Reschedule request already processed",
      });
    }

    const isAdmin = req.user.role === "admin";
    
    if (!isAdmin) {
      // Handle party response (student/teacher)
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

      // Update party response
      booking.rescheduleRequest.partyResponse = {
        status: action === "accept" ? "accepted" : "denied",
        respondedBy: req.user.id,
        responseDate: new Date(),
        reason: reason || null
      };

      if (action === "accept") {
        booking.rescheduleRequest.status = "accepted_by_party";
      } else {
        booking.rescheduleRequest.status = "denied";
      }

    } else {
      // Handle admin response
      if (booking.rescheduleRequest.partyResponse.status !== "accepted") {
        return res.status(400).json({
          success: false,
          message: "Cannot process admin approval before party approval"
        });
      }

      booking.rescheduleRequest.adminResponse = {
        status: action === "accept" ? "accepted" : "denied",
        respondedBy: req.user.id,
        responseDate: new Date(),
        reason: reason || null
      };

      if (action === "accept") {
        // Update booking details with new time
        const newTimeObj = new Date(booking.rescheduleRequest.newTime);
        booking.sessionStartTime = newTimeObj;
        
        const originalDuration = booking.sessionEndTime - booking.sessionStartTime;
        booking.sessionEndTime = new Date(newTimeObj.getTime() + originalDuration);
        
        booking.sessionDate = moment(newTimeObj).startOf('day').toDate();
        
        booking.status = "rescheduled";
        booking.hasBeenRescheduled = true;
        booking.rescheduleRequest.status = "completed";
      } else {
        booking.status = "scheduled";
        booking.rescheduleRequest.status = "denied";
      }
    }

    await booking.save();

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
    
    // Send appropriate emails based on the action and who responded
    try {
      if (!isAdmin) {
        // Party response emails
        if (action === "accept") {
          await emailService.sendReschedulePartyAccepted({
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
            rejectionReason: reason || "No reason provided",
            requestedBy: booking.rescheduleRequest.rescheduleBy.toString() === booking.teacherId.toString() ? "teacher" : "student",
            amount: booking.amount
          });
        }
      } else {
        // Admin response emails
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
            requestedBy: booking.rescheduleRequest.rescheduleBy.toString() === booking.teacherId.toString() ? "teacher" : "student",
            amount: booking.amount
          });
        } else {
          await emailService.sendRescheduleAdminRejection({
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
            rejectionReason: reason || "No reason provided",
            amount: booking.amount
          });
        }
      }
    } catch (emailError) {
      console.error(`Error sending ${action === "accept" ? "confirmation" : "rejection"} emails:`, emailError);
    }

    // Fetch the updated booking with populated fields to match getBookings response format
    const updatedBooking = await BookingModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(bookingId) } },
      
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
          hasBeenRescheduled: 1
        },
      }
    ]);

    res.json({
      success: true,
      message: `Reschedule request ${action}ed successfully`,
      data: updatedBooking[0] || booking,
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
  