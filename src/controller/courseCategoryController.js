const CourseCategoryModel = require("../model/courseCategoryModel");

exports.courseCategoryAdd = async (req, res) => {
  try {
    const data = req.body;
    const courseCategoryObj = {
      name: data.name,
    };
    const courseCategoryAdd = await CourseCategoryModel.create(
      courseCategoryObj
    );
    if (courseCategoryAdd) {
      res.json({
        status: "success",
        message: "course category added successfully",
        data: courseCategoryAdd,
      });
    } else {
      res.json({
        status: "failed",
        message: "course category not added",
      });
    }
  } catch (error) {
    res.json({
      status: "failed",
      message: "something went wrong",
      error: error.message,
    });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCategory = await CourseCategoryModel.findByIdAndUpdate(
      id,
      { deletedAt: new Date() },
      { new: true }
    );

    if (!deletedCategory) {
      return res.status(404).json({
        status: "failed",
        message: "course category not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "course category deleted successfully",
      data: deletedCategory,
    });
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: "something went wrong",
      error: error.message,
    });
  }
};

exports.editCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, courseSubCategory } = req.body;

    const updatedCategory = await CourseCategoryModel.findByIdAndUpdate(
      id,
      { name, courseSubCategory },
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({
        status: "failed",
        message: "course category not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "course category updated successfully",
      data: updatedCategory,
    });
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: "something went wrong",
      error: error.message,
    });
  }
};

exports.filterCourseCategory = async (req, res) => {
  try {
    const courseSubCategory = await CourseCategoryModel.find({
      deletedAt: null,
    })
      .populate("courseSubCategory", "name")
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

exports.getAllCourseCategory = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const totalDocuments = await CourseCategoryModel.countDocuments({
      deletedAt: null,
    });
    const courseSubCategory = await CourseCategoryModel.find({
      deletedAt: null,
    })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      status: "success",
      message: "course category fetched successfully",
      data: courseSubCategory,
      pagination: {
        totalDocuments,
        totalPages: Math.ceil(totalDocuments / limit),
        currentPage: page,
        limit,
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
