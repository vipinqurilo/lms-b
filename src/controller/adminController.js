const CourseModel = require("../model/CourseModel");
const UserModel = require("../model/UserModel");
const BookingModel = require("../model/bookingModel");
const CategoryModel = require("../model/courseCategoryModel");
const SubCategoryModel = require("../model/courseSubCategoryModel");

exports.getAdminDashboard = async (req, res) => {
  try {
    const totalCourses = await CourseModel.countDocuments();
    const totalTeachers = await UserModel.countDocuments({ role: "teacher" });
    const totalStudents = await UserModel.countDocuments({ role: "student" });
    const totalBooking = await BookingModel.countDocuments();
    const totalCategory = await CategoryModel.countDocuments();
    const totalSubCategory = await SubCategoryModel.countDocuments();

    res.status(200).json({
      status: "success",
      message: "admin dashboard fetched successfully",
      data: {
        totalCourses,
        totalTeachers,
        totalStudents,
        totalBooking,
        totalCategory,
        totalSubCategory,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};
