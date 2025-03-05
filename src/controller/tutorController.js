const { mongo, default: mongoose } = require("mongoose");
const TeacherProfileModel = require("../model/teacherProfileModel");
const CourseModel = require("../model/CourseModel");
const BookingModel = require("../model/bookingModel");
const studentModel = require("../model/studentProfileModel");

exports.getTutors = async (req, res) => {
  try {
    let { search, subjects, days, timeRanges } = req.query;
    if (!(days && days.length > 0)) days = "sun,mon,tue,wed,thu,fri,sat";

    console.log(search);
    let query = {};
    if (search && search != "")
      query.$or = [
        { "user.firstName": { $regex: search, $options: "i" } },
        { "user.lastName": { $regex: search, $options: "i" } },
      ];
    if (subjects && subjects.length > 0) {
      const subjectIds = subjects
        .split(",")
        .map((id) => new mongoose.mongo.ObjectId(id));
      query.subjectsTaught = { $in: subjectIds };
    }
    // Handle filtering by days and timeSlots
    if (days && days.length > 0 && timeRanges && timeRanges.length > 0) {
      const daysArray = days.split(","); // Convert comma-separated days (e.g., 'mon,tue') to an array
      const timeRangesArray = timeRanges.split(","); // Convert comma-separated timeRanges (e.g., '0-4,8-12') to an array

      // Loop through each day and time range to match availability
      //   query["calendar.availability"] = {
      //     $elemMatch: {
      //       day: { $in: daysArray }, // Match any of the requested days
      //       slots: {
      //         $elemMatch: {
      //           $or: timeRangesArray.map((range) => {
      //             const [start, end] = range.split("-").map(Number); // Split time range into start and end
      //             const startIndex = start * 2; // 2 slots per hour
      //             const endIndex = end * 2; // 2 slots per hour

      //             return {
      //               $slice: [startIndex, endIndex - startIndex], // Match slots in the requested time range
      //               $in: [true], // At least one slot in the range must be available
      //             };
      //           }),
      //         },
      //       },
      //     },
      //   };
    }
    console.log(query);
    const tutors = await TeacherProfileModel.aggregate([
      {
        $lookup: {
          from: "calendars", // Collection name in MongoDB
          localField: "calendar",
          foreignField: "_id",
          as: "calendar",
        },
      },
      {
        $lookup: {
          from: "languages", // Collection name in MongoDB
          localField: "languagesSpoken",
          foreignField: "_id",
          as: "languagesSpoken",
        },
      },
      {
        $lookup: {
          from: "coursesubcategories", // Collection name in MongoDB
          localField: "subjectsTaught",
          foreignField: "_id",
          as: "subjectsTaught",
        },
      },
      {
        $lookup: {
          from: "users", // Collection name in MongoDB
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },

      {
        $unwind: {
          path: "$user", // Unwind the subjects array
        },
      },

      {
        $unwind: {
          path: "$calendar", // Unwind the subjects array
        },
      },
      {
        $match: query,
      },
      {
        $project: {
          user: {
            _id: 1,
            email: 1,
            firstName: 1,
            lastName: 1,
            gender: 1,
            subjectsTaught: 1,
            languagesSpoken: 1,
            profilePhoto: 1,
            country: 1,
            phone: 1,
            bio: 1,
          },
          createdAt: 1,
          subjectsTaught: {
            name: 1,
            pricePerHour: 1,
            _id: 1,
          },
          languagesSpoken: {
            name: 1,
            _id: 1,
          },
          calendar: {
            availability: 1,
          },
          tutionSlots: 1,
        },
      },
    ]);
    res.json({
      success: true,
      data: tutors,
      message: "Tutors found successfully",
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

exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    const totalCourses = await CourseModel.countDocuments({
      courseInstructor: userId,
    });
    const publishedCourses = await CourseModel.countDocuments({
      courseInstructor: userId,
      status: "published",
    });
    const inactiveCourses = await CourseModel.countDocuments({
      courseInstructor: userId,
    });
    const totalBookings = await BookingModel.countDocuments({
      teacherId: userId,
    });
    const totalEearnings = await BookingModel.aggregate([
      {
        $match: {
          teacherId: userId,
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    const instructor_courses = await CourseModel.find({
      courseInstructor: userId,
    }).select("_id");

    const courseIds = instructor_courses.map((course) => course._id);

    const students = await studentModel.aggregate([
      {
        $match: {
          "enrolledCourses.courseId": { $in: courseIds },
        },
      },
      {
        $group: {
          _id: "$userId",
          studentProfile: { $first: "$$ROOT" },
        },
      },
      {
        $replaceRoot: { newRoot: "$studentProfile" },
      },
    ]);

    res.json({
      status: "success",
      message: "Dashboard fetched successfully",
      data: {
        students: students.length,
        totalCourses,
        publishedCourses,
        inactiveCourses,
        totalBookings,
        totalEearnings:
          totalEearnings.length > 0 ? totalEearnings[0].totalAmount : 0,
      },
    });
  } catch (error) {
    res.json({
      status: "failed",
      message: "something went wrong",
    });
  }
};
