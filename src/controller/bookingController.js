const BookingModel = require("../model/bookingModel");
const StudentProfileModel = require("../model/studentProfileModel");
const TeacherProfileModel = require("../model/teacherProfileModel");
const mongoose=require('mongoose')
const moment=require('moment');
const bookingModel = require("../model/bookingModel");
const paymentModel = require("../model/paymentModel");
exports.createBooking = async (req, res) => {
  try {
    const data = req.body;
    const { studentId, teacherId } = data;
    const newBooking = await BookingModel.create(data);
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
      res.json({
        success: true,
        message: "Booking created successfully",
        data: newBooking,
      });
    } else {
      res.json({
        success: false,
        message: "Booking not created ",
      });
    }
  } catch (error) {
    res.json({
      status: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};


exports.getBookings = async (req, res) => {
  try {
      const { role, id:userId } = req.user; // Extract user role and ID
      console.log(role,userId);
      let { status, startDate, endDate,teacherId, search, page = 1, limit = 10 } = req.query;
      console.log(status,startDate,endDate,search)
      page = parseInt(page);

      limit = parseInt(limit);
      const skip = (page - 1) * limit;

      let query = {};
      //Filter with Teacher Id
      if (teacherId) {
          query.teacherId = new mongoose.Types.ObjectId(teacherId);
      } 
      // Role-based filtering
      if (role === 'teacher') {
          query.teacherId = new mongoose.Types.ObjectId(userId);
      } else if (role === 'student') {
          query.studentId = new mongoose.Types.ObjectId(userId);
      }

      // Status filtering
      if (status) {
          query.status = status;
      }

      // Date range filtering
      if (startDate || endDate) {
          query.scheduledDate = {};
          if (startDate) query.scheduledDate.$gte = new Date(moment( startDate ).format('YYYY-MM-DD[T00:00:00.000Z]'))
          if (endDate) query.scheduledDate.$lte = new Date(moment( endDate ).format('YYYY-MM-DD[T00:00:00.000Z]'))
      }
      console.log(query);
      const booking=await BookingModel.find(query);
      console.log(booking)
      // Aggregation pipeline
      const bookings = await BookingModel.aggregate([
          { $match: query },

          // Lookup student details
          {
              $lookup: {
                  from: "users",
                  localField: "studentId",
                  foreignField: "_id",
                  as: "student"
              }
          },
          { $unwind: "$student" },

          // // Lookup teacher details
          {
              $lookup: {
                  from: "users",
                  localField: "teacherId",
                  foreignField: "_id",
                  as: "teacher"
              }
          },
          { $unwind: "$teacher" },

          // // Lookup subject details
          {
              $lookup: {
                  from: "coursesubcategories",
                  localField: "subjectId",
                  foreignField: "_id",
                  as: "subject"
              }
          },
          { $unwind: "$subject" },

          // Search filtering (search by student for teacher & search by teacher for student)
          ...(search ? [{
              $match: {
                  $or: role === 'teacher' ? [
                      { "student.firstName": { $regex: search, $options: "i" } },
                      { "student.lastName": { $regex: search, $options: "i" } }
                  ] :role==='student'? [
                      { "teacher.firstName": { $regex: search, $options: "i" } },
                      { "teacher.lastName": { $regex: search, $options: "i" } }
                  ]:[
                    { "student.firstName": { $regex: search, $options: "i" } },
                    { "student.lastName": { $regex: search, $options: "i" } },
                    { "teacher.firstName": { $regex: search, $options: "i" } },
                    { "teacher.lastName": { $regex: search, $options: "i" } }
                  ]
              }
          }] : []),

          // Project only necessary fields
          {
              $project: {
                  _id: 1,
                  status: 1,
                  "scheduledDate": 1,
                  "sessionStartTime": 1,
                  "sessionEndTime": 1,
                  "sessionDuration":1,
                  "subject.name":1,
                  "student._id": 1,
                  "student.firstName": 1,
                  "student.lastName": 1,
                  "student.profilePhoto":1,
                  "student.email": 1,
                  "student.profilePhoto":1,
                  "teacher.firstName": 1,
                  "teacher.lastName": 1,
                  "teacher.email": 1,
                  "teacher.profilePhoto":1,
                  "subject.name": 1,
                  "rescheduleRequest":1,
                  "meetingLink":1,
                  "meetingPlatform":1,
              }
          },

          // Sort by timeSlot (earliest bookings first)
          { $sort: { scheduledDate: 1 } },

          // // Pagination
          { $skip: skip },
          { $limit: limit }
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
                as: "student"
            }
        },
        { $unwind: "$student" },
    
        // Lookup teacher details
        {
            $lookup: {
                from: "users",
                localField: "teacherId",
                foreignField: "_id",
                as: "teacher"
            }
        },
        { $unwind: "$teacher" },
    
        // Lookup subject details
        {
            $lookup: {
                from: "coursesubcategories",
                localField: "subjectId",
                foreignField: "_id",
                as: "subject"
            }
        },
        { $unwind: "$subject" },
    
        // Search filtering (same as your aggregation pipeline)
        ...(search ? [{
            $match: {
                $or: role === 'teacher' ? [
                    { "student.firstName": { $regex: search, $options: "i" } },
                    { "student.lastName": { $regex: search, $options: "i" } }
                ] : role === 'student' ? [
                    { "teacher.firstName": { $regex: search, $options: "i" } },
                    { "teacher.lastName": { $regex: search, $options: "i" } }
                ] : [
                    { "student.firstName": { $regex: search, $options: "i" } },
                    { "student.lastName": { $regex: search, $options: "i" } },
                    { "teacher.firstName": { $regex: search, $options: "i" } },
                    { "teacher.lastName": { $regex: search, $options: "i" } }
                ]
            }
        }] : []),
    
        // Count total matched records
        { $count: "totalBookings" }
    ];
    
    const totalResult = await BookingModel.aggregate(countQuery);
    const totalBookings = totalResult.length > 0 ? totalResult[0].totalBookings : 0;
      res.json({
          success: true,
          data: bookings,
          total: totalBookings,
          currentPage: page,
          totalPages: Math.ceil(totalBookings / limit),
          message: "Bookings retrieved successfully"
      });

  } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, message: "Something went wrong", error: error.message });
  }
};

exports.confirmBooking = async (req, res) => {
    try {
        const userId=req.user.id;
        const bookingId=req.params.bookingId;
        const { meetingPlatform, meetingLink, meetingUsername, meetingPassword } = req.body;
        console.log(req.body,userId,bookingId);
        const booking = await bookingModel.findOne({_id:bookingId,teacherId:userId});
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.status !== "scheduled") {
            return res.status(400).json({ message: "Booking cannot be confirmed" });
        }

        booking.meetingPlatform = meetingPlatform;
        booking.meetingLink = meetingLink;
        booking.meetingUsername = meetingUsername;
        booking.meetingPassword = meetingPassword;
        booking.status = "confirmed";

        await booking.save();

        res.status(200).json({ message: "Booking confirmed successfully", booking });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

exports.editBookingMeetingInfo = async (req, res) => {
    try {
        const userId=req.user.id;
        const bookingId=req.params.bookingId;
        const { meetingPlatform, meetingLink, meetingUsername, meetingPassword } = req.body;

        const booking = await bookingModel.findById({_id:bookingId,teacherId:userId});
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.status !== "confirmed") {
            return res.status(400).json({ message: "Meeting details for Booking can only be updated for confirmed bookings" });
        }

        booking.meetingPlatform = meetingPlatform || booking.meetingPlatform;
        booking.meetingLink = meetingLink || booking.meetingLink;
        booking.meetingUsername = meetingUsername || booking.meetingUsername;
        booking.meetingPassword = meetingPassword || booking.meetingPassword;

        await booking.save();

        res.status(200).json({ message: "Meeting details updated successfully", booking });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

exports.cancelBooking = async (req, res) => {
    try {
        const userId=req.user.id;
        const bookingId=req.params.bookingId;
        const { cancellationReason } = req.body;
        if(!cancellationReason)
            res.status(400).json({success:false,message:"Cancellation reaon is required"});
        const query={
            _id:bookingId
        }
        if(req.user.role=='student')
            query.studentId=userId;
        if(req.user.role=="teacher")
            query.teacherId=userId;
        const booking = await bookingModel.findOne(query);
        if (!booking) {
            return res.status(404).json({success:false, message: "Booking not found" });
        }
        if (booking.status === "cancelled") {
            return res.status(400).json({succes:false, message: "Booking is already cancelled" });
        }

        const currentTime = new Date();
        const sessionStartTime = new Date(booking.sessionStartTime);
        const timeDifference = (sessionStartTime - currentTime) / (1000 * 60 * 60); // Convert to hours

        let refundAmount = 0;
        console.log(timeDifference,"time")
        if (String(userId) === String(booking.studentId)) { // Student cancels
            if (timeDifference >= 24) {
                refundAmount = 100; // Full refund
            } else {
               return  res.json({
                    success:false,
                    message:"You can't cancel meeting which scheudled today"
                })
            }
        } else if (String(userId) === String(booking.teacherId)) { // Tutor cancels
            refundAmount = 100; // Full refund
        } else {
            return res.status(403).json({success:false, message: "Unauthorized to cancel this booking" });
        }

        // Update Booking Status
        booking.status = "cancelled";
        booking.cancelledBy = userId;
        booking.cancellationReason = cancellationReason;
        await booking.save();

        // Process Refund (If Applicable)
        if (refundAmount === 100) {
            await paymentModel.findByIdAndUpdate(booking.paymentId, { status: "Refunded" });
        }

        res.status(200).json({
            success:true,
            message: "Booking cancelled successfully",
            data:booking
        });

    } catch (error) {
        console.log(error,"error")
        res.status(500).json({ success:false,message: "Server error", error });
    }
};
exports.rescheduleRequestBooking=async (req, res) => {
    try {
        const {bookingId}=req.params;
        const {  newTime, reason } = req.body;

        const booking = await bookingModel.findById(bookingId);
        if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

        // Ensure only the teacher can request reschedule
        if (req.user.id.toString() !== booking.teacherId.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }
     
        if(booking.status=="reschedule_in_progress"||booking.status=="rescheduled")
            return res.status(400).json({success:false,message:"Booking either in progress or already scheduled"})
       
        if(booking.status!=="scheduled")
            return res.status(400).json({success:false,message:"Booking is either cancelled or completed or confirmed"})
        // Update Booking with Reschedule Request
        booking.rescheduleRequest = {
            newTime,
            reason,
            status: "pending"
        };
        booking.status = "reschedule_in_progress";

        await booking.save();

        res.json({ success: true, message: "Reschedule request sent to student",data:booking });

        // ✅ Notify the student (Use WebSocket, Email, or Push Notification)

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

exports.rescheduleResponseBooking=async (req, res) => {
    try {
        const {bookingId}=req.params
        const { action } = req.body; // action: "accept" or "deny"

        const booking = await bookingModel.findById(bookingId);
        if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

        // Ensure only the student can respond
        if (req.user.id.toString() !== booking.studentId.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        if (booking.rescheduleRequest.status !== "pending") {
            return res.status(400).json({ success: false, message: "Reschedule request already processed" });
        }

        if (action === "accept") {
            // Update booking with new schedule
            booking.scheduleTime = booking.rescheduleRequest.newTime;
            booking.status = "rescheduled";
            booking.rescheduleRequest.status = "accepted";
        } else {
            // Deny the request
            booking.status = "cancelled"; // Keep original booking
            booking.rescheduleRequest.status = "denied";
            //Process Refund
            // refundForBooking();
        }

        await booking.save();

        res.json({ success: true, message: `Reschedule request ${action}ed successfully`,data:booking });

        // ✅ Notify the teacher about the decision (WebSocket, Email, etc.)

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}