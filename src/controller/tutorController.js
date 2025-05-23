const { mongo, default: mongoose } = require("mongoose");
const TeacherProfileModel = require("../model/teacherProfileModel");
const CourseModel = require("../model/CourseModel");
const BookingModel = require("../model/bookingModel");
const studentModel = require("../model/studentProfileModel");
const CalendarModel = require("../model/calenderModel");

exports.getTutors = async (req, res) => {
  try {                         

    let { search, subjects, days, timeRanges, gender, minPrice, maxPrice, sortByRating } = req.query;
    
    if (!(days && days.length > 0)) days = "sun,mon,tue,wed,thu,fri,sat";


    let query = {};

    // Search filter
    if (search && search !== "") {
      query.$or = [
        { "user.firstName": { $regex: search, $options: "i" } },
        { "user.lastName": { $regex: search, $options: "i" } },
      ];

    }
    let subjectsTaughtQuery={};
    // Subject filter
    if (subjects && subjects.length > 0) {
      const subjectIds = subjects.split(",").map((id) => new mongoose.Types.ObjectId(id));
      subjectsTaughtQuery = { $in: subjectIds };
    }


    // Gender filter (default: both male & female)
    if (gender && ["male", "female"].includes(gender.toLowerCase())) {
      query["user.gender"] = gender.toLowerCase();
    }

    // Price range filter
    let priceFilter = {};
    if (minPrice) priceFilter.$gte = parseFloat(minPrice);
    if (maxPrice) priceFilter.$lte = parseFloat(maxPrice);
    if (Object.keys(priceFilter).length > 0) {
      query["subjectsTaught.pricePerHour"] = priceFilter;

    }

    console.log("Query:", query);

    let tutors = await TeacherProfileModel.aggregate([
     ... (subjects?
        [{
        $match:{subjectsTaught:subjectsTaughtQuery}}]:[]
        ),
      {
        $lookup: {
          from: "calendars",
          localField: "calendar",
          foreignField: "_id",
          as: "calendar",
        },
      },
      {
        $lookup: {
          from: "languages",
          localField: "languagesSpoken",
          foreignField: "_id",
          as: "languagesSpoken",
        },
      },
      {
        $lookup: {
          from: "coursesubcategories",
          localField: "subjectsTaught",
          foreignField: "_id",
          as: "subjectsTaught",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },

      { $unwind: "$user" },
      { $unwind: "$calendar" },
      {
        $lookup: {
          from: "tutorreviews",
          localField: "reviews",
          foreignField: "_id",
          as: "reviews"
        }

      },
      {
        $lookup: {
          from: "users",
          let: { reviews: "$reviews" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ["$_id", "$$reviews.student"]
                }
              }
            },
            {
              $project: {
                _id: 1,
                firstName: 1,
                lastName: 1,
                profilePhoto: 1
              }
            }
          ],
          as: "studentDetails"
          }
      },
      { $match: query },
      {
        $project: {
          user: {
            _id: 1,
            email: 1,
            firstName: 1,
            lastName: 1,
            gender: 1,
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

          rating: 1, // Assuming a rating field exists
          reviews: {
            $map: {
              input: "$reviews",
              as: "review",
              in: {
                _id: "$$review._id",
                rating: "$$review.rating",
                review: "$$review.review",
                message: "$$review.message",
                createdAt: "$$review.createdAt",
                student: {
                  $let: {
                    vars: {
                      studentInfo: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$studentDetails",
                              as: "student",
                              cond: { $eq: ["$$student._id", "$$review.student"] }
                            }
                          },
                          0
                        ]
                      }
                    },
                    in: {
                      _id: "$$studentInfo._id",
                      userName: { $concat: ["$$studentInfo.firstName", " ", "$$studentInfo.lastName"] },
                      profilePhoto: "$$studentInfo.profilePhoto"
                    }
                  }
                }
              }
            }
          }

        },
      },
    ]);

    // Sort tutors by rating if specified
    if (sortByRating) {
      if (sortByRating === "high-to-low") {
        tutors.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      } else if (sortByRating === "low-to-high") {
        tutors.sort((a, b) => (a.rating || 0) - (b.rating || 0));
      }
    }
    console.log(tutors,"tutors")
    res.json({
      success: true,
      data: tutors,
      message: "Tutors found successfully",
    });
  } catch (e) {
    console.error(e);
    res.json({
      success: false,
      message: "Something went wrong",
      error: e.message,
    });
  }
};

exports.getAvailabilityCalendarByTeacherId=async(req,res)=>{
  try {
      const userId=req.params.teacherId;
      const teacherCalendar=await CalendarModel.findOne({userId});
      if(!teacherCalendar)
          return res.json({success:false,message:"Availablity Calendar not found"})
      res.json({  
          success:true,
          message:"Availablity Calendar fetched successfully",
          data:teacherCalendar
      })
  } catch (error) {
      console.log(error);
      res.json({
          success:false,
          message:"Something went wrong",
          error:error.message
      })
  }
}

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

