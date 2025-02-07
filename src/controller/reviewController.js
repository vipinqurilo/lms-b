const ReviewModel = require("../model/reviewModel");

exports.addReview = async (req, res) => {
    try {
        const data = req.body;
        const objData = {
            course: data.course,
            student: req.user.id,
            review: data.review,
            rating: data.rating,
            message: data.message
        }

        const addReview = await ReviewModel.create(objData);
        if (addReview) {
            res.json({
                status: "success",
                message: "Review Added Successfully",
                data: addReview
            })
        }else{
            res.json({
                status: "failed",
                message: "Review Not Added",
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

exports.getReview = async (req, res) => {
    try {
        const id = req.user.id;
        const review = await ReviewModel.find({ student: id }).populate("course");
        res.json({
            status: "success",
            message: "Review Fetched Successfully",
            data: review
        })
    } catch (error) {
        res.json({
            status: "failed",
            message: "something went wrong",
            error: error.message
        })
    }
}