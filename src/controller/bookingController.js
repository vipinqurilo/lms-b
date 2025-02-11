const BookingModel = require("../model/bookingModel");
const StudentProfileModel = require("../model/studentProfileModel");
const TeacherProfileModel = require("../model/teacherProfileModel");
const mongoose=require('mongoose')
const moment=require('moment');
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
                  "student.firstName": 1,
                  "student.lastName": 1,
                  "student.profilePhoto":1,
                  "student.email": 1,
                  "student.profilePhoto":1,
                  "teacher.firstName": 1,
                  "teacher.lastName": 1,
                  "teacher.email": 1,
                  "subject.name": 1
              }
          },

          // Sort by timeSlot (earliest bookings first)
          { $sort: { scheduledDate: 1 } },

          // // Pagination
          { $skip: skip },
          { $limit: limit }
      ]);
      console.log(bookings.length,"book")
      // Total count for pagination
      const totalBookings = await BookingModel.countDocuments(query);

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
