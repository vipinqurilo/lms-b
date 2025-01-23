const CourseSubCategoryModel = require("../model/courseSubCategoryModel");

exports.courseSubCategoryAdd = async (req, res) => {
    try {
        const data = req.body;
        const courseSubCategoryObj = {
            name: data.name,
            courseCategory: data.courseCategory,
        }
        const courseSubCategoryAdd = await CourseSubCategoryModel.create(courseSubCategoryObj);
        if(courseSubCategoryAdd) {
            res.json({
                status:"success",
                message:"course sub category added successfully",
                data:courseSubCategoryAdd
            })
        }else{
            res.json({
                status:"failed",
                message:"course sub category not added",
            })
        }
    } catch (error) {
        res.json({
            status:"failed",
            message:"something went wrong",
            error:error.message
        })
    }
}