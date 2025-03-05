const ReviewModel = require("../model/reviewModel");

exports.addReview = async (req, res) => {
  try {
    const data = req.body;
    const objData = {
      course: data.course,
      student: req.user.id,
      review: data.review,
      rating: data.rating,
      message: data.message,
    };

    const addReview = await ReviewModel.create(objData);
    if (addReview) {
      res.json({
        status: "success",
        message: "Review Added Successfully",
        data: addReview,
      });
    } else {
      res.json({
        status: "failed",
        message: "Review Not Added",
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

exports.getReview = async (req, res) => {
  try {
    const id = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Get total count of reviews
    const totalReviews = await ReviewModel.countDocuments({ student: id });

    // Get paginated reviews
    const reviews = await ReviewModel.find({ student: id })
      .populate("course")
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
        totalPages: Math.ceil(totalReviews / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: "something went wrong",
      error: error.message,
    });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const reviewId = req.params.id;
    const userId = req.user.id;
    const updates = {
      review: req.body.review,
      rating: req.body.rating,
      message: req.body.message,
    };

    // Find review and check ownership
    const review = await ReviewModel.findOne({
      _id: reviewId,
      student: userId,
    });

    if (!review) {
      return res.status(404).json({
        status: "failed",
        message: "Review not found or unauthorized",
      });
    }

    const updatedReview = await ReviewModel.findByIdAndUpdate(
      reviewId,
      updates,
      { new: true }
    ).populate("course");

    res.json({
      status: "success",
      message: "Review updated successfully",
      data: updatedReview,
    });
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: "Something went wrong",
      error: error.message,
    });
  }
};

exports.getTotalReviewsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    console.log(courseId, "course id");

    if (!courseId) {
      return res.status(400).json({ message: "course ID is required." });
    }

    const totalReviews = await ReviewModel.countDocuments({ course: courseId });
    const reviews = await ReviewModel.find({ course: courseId });

    const sumOfRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalReviews > 0 ? sumOfRating / totalReviews : 0;

    res
      .status(200)
      .json({ courseId, totalReviews, sumOfRating, averageRating });
  } catch (error) {
    res
      .status(500)
      .json({ message: "error fetching review data", error: error.message });
  }
};
