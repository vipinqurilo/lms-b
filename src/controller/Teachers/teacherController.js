const TeacherProfileModel = require("../../model/teacherProfileModel");

exports.getTeachers = async (req, res) => {
  try {
    const query = {};
    const { search, startDate, endDate, page = 1, limit = 10 } = req.query;
    if (search && search !== "") {
      query.$or = [
        { "user.firstName": { $regex: search, $options: "i" } },
        { "user.lastName": { $regex: search, $options: "i" } },
      ];
    }

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
    const teachers = await TeacherProfileModel.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $lookup: {
          from: "courses",
          localField: "courses",
          foreignField: "_id",
          as: "courses",
        },
      },
      {
        $lookup: {
          from: "bookings",
          localField: "tutionBookings",
          foreignField: "_id",
          as: "tutionBookings",
        },
      },
      {
        $lookup: {
          from: "tution",
          localField: "courses",
          foreignField: "_id",
          as: "courses",
        },
      },

      {
        $match: query,
      },
      {
        $lookup: {
          from: "tutorreviews",
          localField: "userId",
          foreignField: "tutorId",
          as: "reviews",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "reviews.student",
          foreignField: "_id",
          as: "reviewStudents"
        }
      },
      {
        $addFields: {
          reviews: {
            $map: {
              input: "$reviews",
              as: "review",
              in: {
                _id: "$$review._id",
                rating: "$$review.rating",
                review: "$$review.review",
                message: "$$review.message",
                student: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$reviewStudents",
                        as: "student",
                        cond: { $eq: ["$$student._id", "$$review.student"] }
                      }
                    },
                    0
                  ]
                }
              }
            }
          }
        }
      },
      {
        $unwind: {
          path: "$reviews",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$_id",
          user: { $first: "$user" },
          courses: { $first: "$courses" },
          pendingCourses: { $first: "$pendingCourses" },
          publishedCourses: { $first: "$publishedCourses" },
          unpublishedCourses: { $first: "$unpublishedCourses" },
          totalEnrolledStudents: { $first: "$totalEnrolledStudents" },
          cancelledSessions: { $first: "$cancelledSessions" },
          confirmedSessions: { $first: "$confirmedSessions" },
          rescheuledSessions: { $first: "$rescheuledSessions" },
          completedSessions: { $first: "$completedSessions" },
          totalSessions: { $first: "$totalSessions" },
          scheduledSessions: { $first: "$scheduledSessions" },
          reviews: { $push: "$reviews" },
        },
      },
      {
        $addFields: {
          pendingCourses: {
            $size: {
              $filter: {
                input: "$courses",
                as: "course",
                cond: { $eq: ["$$course.status", "pending"] },
              },
            },
          },
          publishedCourses: {
            $size: {
              $filter: {
                input: "$courses",
                as: "course",
                cond: { $eq: ["$$course.status", "published"] },
              },
            },
          },
          unpublishedCourses: {
            $size: {
              $filter: {
                input: "$courses",
                as: "course",
                cond: { $eq: ["$$course.status", "unpublished"] },
              },
            },
          },
          totalEnrolledStudents: { $sum: "$courses.enrolledStudents" },
          cancelledSessions: {
            $size: {
              $filter: {
                input: "$tutionBookings",
                as: "booking",
                cond: { $eq: ["$$booking.status", "cancelled"] },
              },
            },
          },
          completedSessions: {
            $size: {
              $filter: {
                input: "$tutionBookings",
                as: "booking",
                cond: { $eq: ["$$booking.status", "completed"] },
              },
            },
          },
          totalSessions: { $size: "$tutionBookings" },
          scheduledSessions: {
            $size: {
              $filter: {
                input: "$tutionBookings",
                as: "booking",
                cond: { $eq: ["$$booking.status", "scheduled"] },
              },
            },
          },
          confirmedSessions: {
            $size: {
              $filter: {
                input: "$tutionBookings",
                as: "booking",
                cond: { $eq: ["$$booking.status", "confirmed"] },
              },
            },
          },
          rescheuledSessions: {
            $size: {
              $filter: {
                input: "$tutionBookings",
                as: "booking",
                cond: { $eq: ["$$booking.status", "rescheduled"] },
              },
            },
          },
        },
      },
      {
        $skip: (page - 1) * parseInt(limit),
      },
      {
        $limit: parseInt(limit),
      },

      {
        $project: {
          _id: 1,
          user: {
            _id: 1,
            firstName: 1,
            lastName: 1,
            email: 1,
            profilePhoto: 1,
            gender: 1,
          },
          courses: 1,
          pendingCourses: 1,
          publishedCourses: 1,
          unpublishedCourses: 1,
          totalEnrolledStudents: 1,
          cancelledSessions: 1,
          confirmedSessions: 1,
          rescheuledSessions: 1,
          completedSessions: 1,
          totalSessions: 1,
          scheduledSessions: 1,
          reviews: {
            _id: 1,
            rating: 1,
            review: 1,
            message: 1,
            student: {
              _id: 1,
              firstName: 1,
              lastName: 1,
              profilePhoto: 1
            }
          }
        },
      },
    ]);

    //Counting Total Students
    const countQuery = [
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $match: query,
      },

      {
        $count: "totalTeachers",
      },
    ];
    const totalResult = await TeacherProfileModel.aggregate(countQuery);
    const totalTeachers =
      totalResult.length > 0 ? totalResult[0].totalTeachers : 0;
    res.json({
      success: true,
      data: teachers,
      total: totalTeachers,
      currentPage: page,
      totalPages: Math.ceil(totalTeachers / parseInt(limit)),
      message: "Teachers retrieved successfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to retrieve teachers",
        error: error.message,
      });
  }
};
