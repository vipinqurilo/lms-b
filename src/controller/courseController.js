const CourseModel = require("../model/CourseModel");

exports.addCourse = async (req, res) => {
    try {
        const data = req.body;
        const courseObj = {
            courseTitle: data.courseTitle,
            courseDescription: data.courseDescription,
            courseCategory: data.courseCategory,
            courseSubCategory: data.courseSubCategory,
            courseImage: data.courseImage,
            courseVideo: data.courseVideo,
            coursePrice: data.coursePrice,
            courseInstructor: data.courseInstructor,
            courseContent: data.courseContent
        }

        const courseAdd = await CourseModel.create(courseObj);
        
        if(courseAdd) {
            res.json({
                status:"success",
                message:"course added successfully",
                data:courseAdd
            })
        }else{
            res.json({
                status:"failed",
                message:"course not added",
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



exports.getCourse = async (req, res) => {
    try {
        const course = await CourseModel.find();
        res.json({
            status:"success",
            message:"course fetched successfully",
            data:course
        })
    } catch (error) {
        res.json({
            status:"failed",
            message:"something went wrong",
            error:error.message
        })
    }
}