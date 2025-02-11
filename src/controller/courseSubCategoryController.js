const CourseCategoryModel = require("../model/courseCategoryModel");
const CourseSubCategoryModel = require("../model/courseSubCategoryModel");

exports.courseSubCategoryAdd = async (req, res) => {
  try {
    const { name, courseCategory } = req.body;

    // Ensure the category exists
    let findCategory = await CourseCategoryModel.findById(courseCategory);
    if (!findCategory) {
      return res.json({
        status: "failed",
        message: "Course category not found",
      });
    }

    // Create the subcategory first to get its ID
    const courseSubCategoryAdd = await CourseSubCategoryModel.create({
      name,
      courseCategory,
    });

    // Push the ObjectId (not the entire object)
    findCategory.courseSubCategory.push(courseSubCategoryAdd._id);
    await findCategory.save(); // Wait for save completion

    res.json({
      status: "success",
      message: "Course subcategory added successfully",
      data: courseSubCategoryAdd,
    });
  } catch (error) {
    res.json({
      status: "failed",
      message: "Something went wrong",
      error: error.message,
    });
  }
};

exports.courseSubCategoryDelete = async (req, res) => {
  try {
    const { id } = req.params;

    const subCategory = await CourseSubCategoryModel.findById(id);
    if (!subCategory) {
      return res.json({
        status: "failed",
        message: "Course subcategory not found",
      });
    }

    await CourseSubCategoryModel.findByIdAndUpdate(id, {
      deletedAt: new Date(),
    });

    await CourseCategoryModel.findByIdAndUpdate(subCategory.courseCategory, {
      $pull: { courseSubCategory: id },
    });

    res.json({
      status: "succss",
      message: "course subcategory deleted successfully",
    });
  } catch (error) {
    res.json({
      status: "failed",
      message: "something went wrong",
      error: error.message,
    });
  }
};

exports.filterCourseSubCategory = async (req, res) => {
  try {
    const courseSubCategory = await CourseSubCategoryModel.find({
      deletedAt: null,
    })
      .populate("courseCategory")
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

exports.courseSubCategoryEdit = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, courseCategory } = req.body;

    let subCategory = await CourseSubCategoryModel.findById(id);
    if (!subCategory) {
      return res.json({
        status: "failed",
        message: "course subcategory not found",
      });
    }

    if (
      courseCategory &&
      courseCategory !== subCategory.courseCategory.toString()
    ) {
      await CourseCategoryModel.findByIdAndUpdate(subCategory.courseCategory, {
        $pull: { courseSubCategory: id },
      });

      await CourseCategoryModel.findByIdAndUpdate(courseCategory, {
        $push: { courseSubCategory: id },
      });

      subCategory.courseCategory = courseCategory;
    }
    if (name) subCategory.name = name;

    await subCategory.save();
    res.json({
      status: "success",
      message: "course subcategory updated successfull",
      data: subCategory,
    });
  } catch (error) {
    res.json({
      status: "failed",
      message: "something went wrong",
      error: error.message,
    });
  }
};

exports.getAllSubcategories = async (req, res) => {
  try {
    const subcategories = await CourseSubCategoryModel.find({
      deletedAt: null,
    }).populate("courseCategory");
    if (!subcategories || subcategories.length === 0) {
      return res.status(404).json({
        message: "No subcategories found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "subcategories fetched successfully",
      data: subcategories,
    });
  } catch (error) {
    res.status(500).json({
      status: "failed",
      error: error.message,
    });
  }
};
