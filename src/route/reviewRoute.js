const express = require("express");
const { addReview, getReview } = require("../controller/reviewController");
const { authMiddleware } = require("../middleware/authMiddleware");
const reviewRoute = express.Router();

reviewRoute.post("/",authMiddleware, addReview);
reviewRoute.get("/",authMiddleware, getReview);

module.exports = reviewRoute;