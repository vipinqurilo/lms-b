const CourseCategoryModel = require("../model/courseCategoryModel");
const CourseSubCategoryModel = require("../model/courseSubCategoryModel");

exports.courseSubCategoryAdd = async (req, res) => {
    try {
        const { name,pricePerHour, courseCategory } = req.body;

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
            pricePerHour:pricePerHour||100,
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


exports.filterCourseSubCategory = async (req, res) => {
    try {
        const courseSubCategory = await CourseSubCategoryModel.find({})
        .populate("courseCategory") 
        .exec();

        res.json({
            status:"success",
            message:"course sub category fetched successfully",
            data:courseSubCategory
        })
    } catch (error) {
        res.json({
            status:"failed",
            message:"something went wrong",
            error:error.message
        })
    }
}
