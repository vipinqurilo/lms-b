const TutorReviewModel = require("../model/tutorReviewModel");
const TeacherProfileModel = require("../model/teacherProfileModel");
const BookingModel = require("../model/bookingModel");

exports.addReview = async (req, res) => {
    try {
        const data = req.body;
        const objData = {
            tutorId: data.tutorId,
            student: req.user.id,
            review: data.review,
            rating: data.rating,
            message: data.message
        }   

        const addReview = await TutorReviewModel.create(objData);
        if (addReview) {
            // Add review reference to tutor's profile
            await TeacherProfileModel.findOneAndUpdate(
                { _id: data.tutorId },
                { $push: { reviews: addReview._id } }
            );

            const review = await TutorReviewModel.findById(addReview._id).populate("student", "_id userName profilePhoto");
            res.json({
                status: "success",
                message: "Review Added Successfully",
                data: review
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
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        // Get total count of reviews
        const totalReviews = await TutorReviewModel.countDocuments({ student: id });

        // Get paginated reviews
        const reviews = await TutorReviewModel.find({ student: id })
            .populate("tutorId")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.json({
            status: "success",
            message: "Review Fetched Successfully",
            data: {
                reviews,
                total: totalReviews,
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalReviews / limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            status: "failed",
            message: "something went wrong",
            error: error.message
        });
    }
}

exports.updateReview = async (req, res) => {
    try {
        const reviewId = req.params.id;
        const userId = req.user.id;
        const updates = {
            review: req.body.review,
            rating: req.body.rating,
            message: req.body.message
        };

        // Find and update review in one operation
        const updatedReview = await TutorReviewModel.findOneAndUpdate(
            { _id: reviewId, student: userId },
            updates,
            { new: true }
        ).populate('tutorId');

        if (!updatedReview) {
            return res.status(404).json({
                status: "failed",
                message: "Review not found or unauthorized"
            });
        }

        res.json({
            status: "success",
            message: "Review updated successfully",
            data: updatedReview
        });

    } catch (error) {
        res.status(500).json({
            status: "failed",
            message: "Something went wrong",
            error: error.message
        });
    }
}

exports.deleteReview = async (req, res) => {
    try {
        const reviewId = req.params.id;
        const userId = req.user.id;

        // Find and delete review in one operation
        const deletedReview = await TutorReviewModel.findOneAndDelete(
            { _id: reviewId, student: userId }
        );

        if (!deletedReview) {
            return res.status(404).json({
                status: "failed",
                message: "Review not found or unauthorized"
            });
        }

        res.json({
            status: "success",
            message: "Review deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            status: "failed",
            message: "Something went wrong",
            error: error.message
        });
    }
}

exports.getReviewByTutorId = async (req, res) => {
    try {
        const tutorId = req.params.id;
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        // Get total count of reviews
        const totalReviews = await TutorReviewModel.countDocuments({ tutorId });

        // Get paginated reviews
        const reviews = await TutorReviewModel.find({ tutorId })
            .populate('student', 'profilePhoto userName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.json({
            status: "success",
            message: "Review Fetched Successfully",
            data: {
                reviews,
                total: totalReviews,
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalReviews / limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            status: "failed",
            message: "something went wrong",
            error: error.message
        });
    }
}

exports.checkCompletedBooking = async (req, res) => {
    try {
        const studentId = req.user.id;
        const tutorId = req.params.tutorId;
        console.log(studentId, tutorId,'checkCompletedBooking');

        // Check for completed booking between student and tutor
        const completedBooking = await BookingModel.findOne({
            studentId: studentId, 
            teacherId: tutorId,
            status: "completed"
        });

        // Check if student has already reviewed this tutor
        const existingReview = await TutorReviewModel.findOne({
            student: studentId,
            tutorId: tutorId
        });

        console.log(completedBooking,'completedBooking');
        res.json({
            success: true,
            canReview: !!completedBooking && !existingReview,
            message: !completedBooking 
                ? "No completed sessions found with this tutor"
                : existingReview 
                ? "You have already reviewed this tutor"
                : "Student has completed sessions with this tutor"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error.message
        });
    }
};
