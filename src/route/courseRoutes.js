const express = require("express");
const { addCourse, getcourseFilter, getCourse, getSingleCourse, getCourseInstructor, getAllCourseByAdmin, updateStatusByAdmin, addSingleVideo, addSingleImage } = require("../controller/courseController");
const authController = require("./authRoutes");
const { authMiddleware } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const upload = require("../upload/multerConfig");
const courseRouter = express.Router();

const multer = require("multer")
const uploadMulter = multer();
// courseRouter.post('/',authMiddleware,authorizeRoles("instructor"),upload.single("courseVideo"),addCourse)
courseRouter.post('/',upload.fields([
    { name: 'courseVideo', maxCount: 1 },
    { name: 'courseImage', maxCount: 1 },
  ]),addCourse)

courseRouter.get('/filter/:id',getcourseFilter)
courseRouter.get('/front',getCourse)
courseRouter.get('/front/:id',getSingleCourse)
courseRouter.post('/singleVideo',uploadMulter.single("video"),addSingleVideo)
courseRouter.post('/singleImage',uploadMulter.single("courseImage"),addSingleImage)

// instructor routes

courseRouter.get('/instructor/get',authMiddleware,authorizeRoles("instructor"),getCourseInstructor)

// admin 

courseRouter.get('/admin/get',authMiddleware,authorizeRoles("admin"),getAllCourseByAdmin)
courseRouter.put('/admin-status/:id',authMiddleware,authorizeRoles("admin"),updateStatusByAdmin)



module.exports = courseRouter;