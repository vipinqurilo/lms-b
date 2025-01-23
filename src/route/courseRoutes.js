const express = require("express");
const { addCourse } = require("../controller/courseController");
const authController = require("./authRoutes");
const { authMiddleware } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const courseRouter = express.Router();


courseRouter.post('/',authMiddleware,authorizeRoles("student"),addCourse)

module.exports = courseRouter;