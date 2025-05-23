const express = require("express");
const { addReview, getReview, updateReview, deleteReview, getReviewByTutorId, checkCompletedBooking } = require("../controller/tutorReviewController");
const { authMiddleware } = require("../middleware/authMiddleware");
const tutorReviewRoute = express.Router();

tutorReviewRoute.post("/",authMiddleware, addReview);
tutorReviewRoute.get("/",authMiddleware, getReview);
tutorReviewRoute.patch("/:id",authMiddleware, updateReview);
tutorReviewRoute.delete("/:id",authMiddleware, deleteReview);
tutorReviewRoute.get('/check-completed-booking/:tutorId', authMiddleware, checkCompletedBooking);
tutorReviewRoute.get('/:id',authMiddleware, getReviewByTutorId);

module.exports = tutorReviewRoute;