const CourseModel = require("../model/CourseModel");
const path = require("path");
const { uploadMediaToCloudinary } = require("../upload/cloudinary");
const { default: mongoose } = require("mongoose");
const ReviewModel = require("../model/reviewModel");
const StudentProfileModel = require("../model/studentProfileModel");
const UserModel = require("../model/UserModel");

// Simplified function that returns a default duration
const getVideoDuration = async (videoPath) => {
  try {
    // Return a default duration since we're not using ffmpeg
    return 0;
  } catch (err) {
    console.error("Error:", err);
    return 0;
  }
};

exports.addCourse = async (req, res) => {
  try {
    const data = req.body;
    console.log(data, "data");
    const id = req.user.id;

    const courseVideo = req.files["courseVideo"]
      ? req.files["courseVideo"][0].filename
      : null;
    const courseImage = req.files["courseImage"]
      ? req.files["courseImage"][0].filename
      : null;

    // Set a default duration or get it from the request if provided
    const videoDuration = data.courseDuration || 0;

    const courseObj = {
      courseInstructor: id,
      courseTitle: data.courseTitle,
      courseDescription: data.courseDescription,
      courseCategory: data.courseCategory,
      courseSubCategory: data.courseSubCategory,
      courseFeatures: JSON.parse(data.courseFeatures),
      courseImage: data.courseImage,
      courseVideo: data.courseVideo,
      coursePrice: data.coursePrice,
      courseDuration: videoDuration,
      inActive: false,
      courseContent: JSON.parse(data.courseContent),
      courseLearning: JSON.parse(data.courseLearning),
      courseRequirements: JSON.parse(data.courseRequirements),
      status: "pending",
    };
    console.log(courseObj, " data");

    const courseAdd = await CourseModel.create(courseObj);

    if (courseAdd) {
      res.json({
        status: "success",
        message: "Course added successfully",
        data: courseAdd,
      });
    } else {
      res.json({
        status: "failed",
        message: "Course not added",
      });
    }
  } catch (error) {
    console.log(error.message);
    res.json({
      status: "failed",
      message: "Something went wrong",
      error: error.message,
    });
  }
};

exports.getCourse = async (req, res) => {
  try {
    let course = await CourseModel.find({ inActive: false }, { courseVideo: 0 })
      .limit(6)
      // .sort({ createdAt: -1 })
      .populate("courseSubCategory");
    course.map((item) => {
      item.courseImage = `https://6g2n7ff0-8000.inc1.devtunnels.ms/public/${item.courseImage}`;
      // item.courseVideo = `http://localhost:8000/public/${item.courseVideo}`;
    });
    res.json({
      status: "success",
      message: "course fetched successfully",
      data: course,
    });
  } catch (error) {
    res.json({
      status: "failed",
      message: "something went wrong",
      error: error.message,
    });
  }
};

exports.getSingleCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await CourseModel.findById(id).populate({
      path: "courseInstructor",
      select: "firstName lastName gender profilePhoto",
      populate: {
        path: "teacherProfile",
        select:
          "experience education subjectsTaught languagesSpoken tutionSlots ",
      },
    });

    if (!course) {
      return res.status(404).json({
        status: "failed",
        message: "course not found",
      });
    }

    const totalStudents = await StudentProfileModel.countDocuments({
      "enrolledCourses.courseId": id,
    });

    const totalReviews = await ReviewModel.find({ course: id }).populate({
      path: "student",
      select: "firstName lastName profilePhoto gender",
    });

    const totalCourses = await CourseModel.countDocuments({
      courseInstructor: course?.courseInstructor?._id,
    });

    res.json({
      status: "success",
      message: "course fetched successfully",
      data: {
        course,
        totalStudents,
        totalReviews,
        totalCourses,
      },
    });
  } catch (error) {
    res.json({
      status: "failed",
      message: "something went wrong",
      error: error.message,
    });
  }
};

exports.getcourseFilter = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await CourseModel.find({
      courseCategory: id,
      inActive: false,
    }).populate("courseSubCategory");
    res.json({
      status: "success",
      message: "course fetched successfully",
      data: course,
    });
  } catch (error) {
    res.json({
      status: "failed",
      message: "something went wrong",
      error: error.message,
    });
  }
};

exports.getCourseInstructor = async (req, res) => {
  try {
    const id = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 10;
    const skip = (pageNumber - 1) * pageSize;

    let query = { courseInstructor: id, inActive: false };
    if (status) {
      query.status = status;
    }

    // Get total course count
    const totalCourses = await CourseModel.countDocuments(query);

    // Fetch courses with pagination
    const courses = await CourseModel.find(query)
      .populate("courseSubCategory")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .exec();

    // Get all course IDs
    const courseIds = courses.map((course) => course._id);

    // Count students enrolled in each course
    const studentEnrollments = await StudentProfileModel.aggregate([
      { $unwind: "$enrolledCourses" },
      { $match: { "enrolledCourses.courseId": { $in: courseIds } } },
      {
        $group: {
          _id: "$enrolledCourses.courseId",
          studentCount: { $sum: 1 },
        },
      },
    ]);

    // Create a mapping of courseId -> student count
    const enrollmentsMap = studentEnrollments.reduce((acc, item) => {
      acc[item._id.toString()] = item.studentCount;
      return acc;
    }, {});

    // Add student count to courses
    const courseData = courses.map((course) => ({
      ...course._doc,
      studentsEnrolled: enrollmentsMap[course._id.toString()] || 0,
    }));

    res.json({
      status: "success",
      message: "Courses fetched successfully",
      data: courseData,
      pagination: {
        totalCourses,
        currentPage: pageNumber,
        totalPages: Math.ceil(totalCourses / pageSize),
        pageSize,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: "Something went wrong",
      error: error.message,
    });
  }
};

exports.getAllCourseByAdmin = async (req, res) => {
  try {
    const { status = "pending", categoryId, page = 1, limit = 10 } = req.query;

    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 10;
    const skip = (pageNumber - 1) * pageSize;

    console.log("Page:", pageNumber, "Limit:", pageSize, "Skip:", skip);

    let query = { status };

    if (categoryId) {
      if (mongoose.Types.ObjectId.isValid(categoryId)) {
        query.courseCategory = new mongoose.Types.ObjectId(categoryId);
      } else {
        return res.status(400).json({
          status: "failed",
          message: "Invalid categoryId",
        });
      }
    }

    // Count total matching documents
    const totalCourses = await CourseModel.countDocuments(query);
    console.log("Total Courses Found:", totalCourses); // Debugging log

    // Fetch paginated courses
    const courses = await CourseModel.find(query)
      .populate({ path: "courseSubCategory", select: "name" })
      .populate({ path: "courseInstructor", select: "" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .exec();

    console.log("Courses Fetched:", courses.length); // Debugging log

    // Get all course IDs
    const courseIds = courses.map((course) => course._id);

    // Count students enrolled in each course
    const studentEnrollments = await StudentProfileModel.aggregate([
      { $unwind: "$enrolledCourses" },
      { $match: { "enrolledCourses.courseId": { $in: courseIds } } },
      {
        $group: {
          _id: "$enrolledCourses.courseId",
          studentCount: { $sum: 1 },
        },
      },
    ]);

    // Create a mapping of courseId -> student count
    const enrollmentsMap = studentEnrollments.reduce((acc, item) => {
      acc[item._id.toString()] = item.studentCount;
      return acc;
    }, {});

    // Fetch reviews and calculate ratings for each course
    const courseWithDetails = await Promise.all(
      courses.map(async (course) => {
        const reviews = await ReviewModel.find(
          { course: course._id },
          "rating"
        );

        const totalReviews = reviews.length;
        const sumOfRatings = reviews.reduce(
          (sum, review) => sum + review.rating,
          0
        );
        const averageRating =
          totalReviews > 0 ? sumOfRatings / totalReviews : 0;

        return {
          ...course.toObject(),
          totalReviews,
          sumOfRatings,
          averageRating: averageRating.toFixed(2),
          reviews,
          studentsEnrolled: enrollmentsMap[course._id.toString()] || 0,
        };
      })
    );

    res.json({
      status: "success",
      message: "Courses fetched successfully",
      data: courseWithDetails,
      pagination: {
        totalCourses,
        currentPage: pageNumber,
        totalPages: Math.ceil(totalCourses / pageSize),
        pageSize,
      },
    });
  } catch (error) {
    console.error("Error:", error.message); // Debugging log
    res.status(500).json({
      status: "failed",
      message: "Something went wrong",
      error: error.message,
    });
  }
};

exports.updateStatusByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updateStatus = await CourseModel.findByIdAndUpdate(
      id,
      { status: status },
      { new: true }
    );
    if (!updateStatus)
      return res.json({ status: "failed", message: "status not updated" });
    res.json({
      status: "success",
      message: "status updated successfully",
      data: updateStatus,
    });
  } catch (error) {
    res.json({
      status: "failed",
      message: "something went wrong",
      error: error.message,
    });
  }
};

exports.addSingleVideo = async (req, res) => {
  try {
    const videoUrl = await uploadMediaToCloudinary(req.file, "video");
    res.json({
      status: "success",
      message: "video uploaded successfully",
      data: videoUrl,
    });
  } catch (error) {
    console.log(error);
  }
};

exports.addSingleImage = async (req, res) => {
  try {
    const imageUrl = await uploadMediaToCloudinary(req.file, "image");
    console.log(imageUrl);
    res.json({
      status: "success",
      message: "image uploaded successfully",
      data: imageUrl,
    });
  } catch (error) {
    console.log(error);
  }
};

exports.updateCourseInstrustor = async (req, res) => {
  try {
    const id = req.user.id;
    const data = req.body;
    const courseId = req.params.id;

    console.log(data, "samosa kd");

    const objData = {
      courseInstructor: id,
      courseTitle: data.courseTitle,
      courseDescription: data.courseDescription,
      courseCategory: data.courseCategory,
      courseSubCategory: data.courseSubCategory,
      courseImage: data.courseImage,
      courseVideo: data.courseVideo,
      coursePrice: data.coursePrice,
      // courseDuration: videoDuration,
      courseContent: data.courseContent,
      courseLearning: data.courseLearning,
      courseRequirements: data.courseRequirements,
      status: "pending",
    };
    
    const updateStatus = await CourseModel.findByIdAndUpdate(courseId, objData, {
      new: true,
      runValidators:true
    });
    if (!updateStatus)
      return res.json({ status: "failed", message: "status not updated" });
    res.json({
      status: "success",
      message: "status updated successfully",
      data: updateStatus,
    });
  } catch (error) {
    console.log(error, "error");
    res.json({
      status: "failed",
      message: "something went wrong",
      error: error.message,
    });
  }
};

exports.paginationCourse = async (req, res) => {
  try {
    let { page, limit } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;

    const skip = (page - 1) * limit;

    const courses = await CourseModel.find()
      .populate("courseCategory")
      .populate("courseSubCategory")
      .populate("courseInstructor")
      .skip(skip)
      .limit(limit);

    const totalCourses = await CourseModel.countDocuments();
    const totalPages = Math.ceil(totalCourses / limit);

    res.json({
      success: true,
      data: courses,
      meta: {
        totalCourses,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const updateStatus = await CourseModel.findByIdAndUpdate(
      id,
      { inActive: true },
      { new: true }
    );
    if (!updateStatus)
      return res.json({ status: "failed", message: "status not updated" });
    res.json({
      status: "success",
      message: "status updated successfully",
      data: updateStatus,
    });
  } catch (error) {
    res.json({
      status: "failed",
      message: "something went wrong",
      error: error.message,
    });
  }
};

exports.filterByStatus = async (req, res) => {
  try {
    console.log(req.params.status);
    const courseSubCategory = await CourseModel.find({
      status: req.params.status,
      inActive: false,
    })
      .populate("courseSubCategory")
      .exec();
    res.json({
      status: "success",
      message: "course sub category fetched successfully",
      data: courseSubCategory,
    });
  } catch (error) {
    res.json({
      status: "failed",
      message: "something went wrong",
      error: error.message,
    });
  }
};

exports.filterHomePage = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const courseSubCategory = await CourseModel.find({
      courseCategory: categoryId,
      inActive: false,
    })
      .populate("courseSubCategory")
      .exec();
    res.json({
      status: "success",
      message: "course sub category fetched successfully",
      data: courseSubCategory,
    });
  } catch (error) {
    res.json({
      status: "failed",
      message: "something went wrong",
      error: error.message,
    });
  }
};

exports.adminDashboardCourses = async (req, res) => {
  try {
    const Courses = await CourseModel.find().limit(10).sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      message: "courses fetched successfully",
      data: Courses,
    });
  } catch (error) {
    res.json({
      status: "failed",
      message: "something went wrong",
      error: error,
    });
  }
};

exports.moduleMarkedAsCompleted = async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId, moduleId } = req.body;

    // Find the course to check if it exists
    const course = await CourseModel.findById(courseId);
    if (!course) {
      return res
        .status(404)
        .json({ status: "failed", message: "Course not found" });
    }

    const instructorId = course.courseInstructor;
    const instructor = await UserModel.findById(instructorId);
    const instructorName = instructor.firstName + " " + instructor.lastName;

    console.log(instructorName, "instructor name");

    const user = await UserModel.findById(userId);
    const studentName = user.firstName + " " + user.lastName;

    const moduleExists = course.courseContent.some(
      (module) => module._id.toString() === moduleId
    );

    if (!moduleExists) {
      return res.status(400).json({
        status: "failed",
        message: "Module not found",
      });
    }

    // Find the student profile and update the enrolledCourses array
    const studentProfile = await StudentProfileModel.findOne({ userId });

    if (!studentProfile) {
      return res
        .status(404)
        .json({ status: "failed", message: "Student profile not found" });
    }

    const enrolledCourse = studentProfile.enrolledCourses.find(
      (course) => course.courseId.toString() === courseId
    );

    if (!enrolledCourse) {
      return res.status(400).json({
        status: "failed",
        message: "Student is not enrolled in this course",
      });
    }

    if (!enrolledCourse.completedModule.includes(moduleId)) {
      enrolledCourse.completedModule.push(moduleId);
    }

    const totalModules = course.courseContent.length;

    enrolledCourse.progress = Math.min(
      Math.round((enrolledCourse.completedModule.length / totalModules) * 100),
      100
    );

    // enrolledCourse.isCompleted = enrolledCourse.progress === 100;

    if (enrolledCourse.progress === 100) {
      enrolledCourse.isCompleted = true;
      enrolledCourse.certificate = {
        _id: new mongoose.Types.ObjectId(),
        studentName: studentName,
        instructorName: instructorName,
        courseTitle: course.courseTitle,
        completionDate: new Date().toISOString(),
      };
    }

    await studentProfile.save();

    res.status(200).json({
      status: "success",
      message: `${
        enrolledCourse.progress === 100 ? "Course" : "Module"
      } marked as completed`,
      progress: enrolledCourse.progress,
      isCompleted: enrolledCourse.isCompleted,
      certificate: enrolledCourse.certificate || null,
    });
  } catch (error) {
    console.error("Error marking module as completed:", error);
    res.status(500).json({
      status: "failed",
      message: "Internal server error",
    });
  }
};
