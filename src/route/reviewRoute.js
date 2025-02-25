const express = require("express");
const { addReview, getReview, updateReview } = require("../controller/reviewController");
const { authMiddleware } = require("../middleware/authMiddleware");
const reviewRoute = express.Router();

reviewRoute.post("/",authMiddleware, addReview);
reviewRoute.get("/",authMiddleware, getReview);
reviewRoute.patch("/:id",authMiddleware, updateReview);

module.exports = reviewRoute;