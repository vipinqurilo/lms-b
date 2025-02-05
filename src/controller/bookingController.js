const BookingModel = require("../model/bookingModel");
const StudentProfileModel = require("../model/studentProfileModel");
const TeacherProfileModel = require("../model/teacherProfileModel");
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
    
    let { search, status, startDate, endDate } = req.query;
    let query = {
      status: "Scheduled",
    };
    if (status && status !== "") query.status = status;
    if (search && search != "")
      query.$or = [
        { "teacher.firstName": { $regex: search, $options: "i" } },
        { "teacher.lastName": { $regex: search, $options: "i" } },
      ];

    // Handle filtering by days and timeSlots

    console.log(query);
    const tutors = await BookingModel.aggregate([
      {
        $lookup: {
          from: "users", // Collection name in MongoDB
          localField: "teacherId",
          foreignField: "_id",
          as: "teacher",
        },
      },
      {
        $unwind: {
          path: "$teacher", // Unwind the subjects array
          preserveNullAndEmptyArrays: true, // Ensure it doesn't drop docs if no subjects are found
        },
      },

      {
        $match: query,
      },
      {
        $project: {
          teacher: {
            password: 0,
          },
        },
      },
    ]);
    res.json({
      success: true,
      data: tutors,
      message: "Bookings found successfully",
    });
  } catch (e) {
    console.log(e);
    res.json({
      success: true,
      message: "Something went Wrong",
      error: e.message,
    });
  }
};

exports.getBookingsForStudent = async (req, res) => {
    try {
      
      let { search, status, startDate, endDate } = req.query;
      let query = {
        status: "Scheduled",
      };
      if (status && status !== "") query.status = status;
      if (search && search != "")
        query.$or = [
          { "teacher.firstName": { $regex: search, $options: "i" } },
          { "teacher.lastName": { $regex: search, $options: "i" } },
        ];
  
      // Handle filtering by days and timeSlots
  
      console.log(query);
      const tutors = await BookingModel.aggregate([
        {
          $lookup: {
            from: "users", // Collection name in MongoDB
            localField: "teacherId",
            foreignField: "_id",
            as: "teacher",
          },
        },
        {
          $unwind: {
            path: "$teacher", // Unwind the subjects array
            preserveNullAndEmptyArrays: true, // Ensure it doesn't drop docs if no subjects are found
          },
        },
  
        {
          $match: query,
        },
        {
          $project: {
            teacher: {
              password: 0,
            },
          },
        },
      ]);
      res.json({
        success: true,
        data: tutors,
        message: "Bookings found successfully",
      });
    } catch (e) {
      console.log(e);
      res.json({
        success: true,
        message: "Something went Wrong",
        error: e.message,
      });
    }
  };