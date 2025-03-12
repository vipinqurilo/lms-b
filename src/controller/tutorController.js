const { mongo, default: mongoose } = require("mongoose");
const TeacherProfileModel = require("../model/teacherProfileModel");

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

    // Subject filter
    if (subjects && subjects.length > 0) {
      const subjectIds = subjects.split(",").map((id) => new mongoose.Types.ObjectId(id));
      query.subjectsTaught = { $in: subjectIds };
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
