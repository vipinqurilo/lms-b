const CourseCategoryModel = require("../model/courseCategoryModel");

exports.courseCategoryAdd = async (req, res) => {
    try {
        const data = req.body;
        const courseCategoryObj = {
            name: data.name,
        }
        const courseCategoryAdd = await CourseCategoryModel.create(courseCategoryObj);
        if (courseCategoryAdd) {
            res.json({
                status: "success",
                message: "course category added successfully",
                data: courseCategoryAdd
            })
        } else {
            res.json({
                status: "failed",
                message: "course category not added",
            })
        }
    } catch (error) {
        res.json({
            status: "failed",
            message: "something went wrong",
            error: error.message
        })
    }
}


exports.filterCourseCategory = async (req, res) => {
    try {
        const courseSubCategory = await CourseCategoryModel.find({}).populate("courseSubCategory","name").exec();
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

