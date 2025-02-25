const express = require("express");
const { addReview, getReview, updateReview } = require("../controller/tutorReviewController");
const { authMiddleware } = require("../middleware/authMiddleware");
const tutorReviewRoute = express.Router();

tutorReviewRoute.post("/",authMiddleware, addReview);
tutorReviewRoute.get("/",authMiddleware, getReview);
tutorReviewRoute.patch("/:id",authMiddleware, updateReview);


module.exports = tutorReviewRoute;