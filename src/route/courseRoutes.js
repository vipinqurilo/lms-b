const express = require("express");
const { addCourse, getcourseFilter, getCourse, getSingleCourse, getCourseInstructor, getAllCourseByAdmin, updateStatusByAdmin, addSingleVideo, addSingleImage, updateCourseInstrustor, deleteCourse, filterByStatus } = require("../controller/courseController");
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
  ]),authMiddleware,authorizeRoles("instructor"),addCourse)

courseRouter.get('/filter/:id',getcourseFilter)
courseRouter.get('/front',getCourse)
courseRouter.get('/front/:id',getSingleCourse)
courseRouter.post('/singleVideo',uploadMulter.single("video"),addSingleVideo)
courseRouter.post('/singleImage',uploadMulter.single("courseImage"),addSingleImage)

// instructor routes

courseRouter.get('/instructor/get',authMiddleware,authorizeRoles("instructor"),getCourseInstructor)
courseRouter.put('/instructor/:id',authMiddleware,authorizeRoles("instructor"),updateCourseInstrustor)
courseRouter.delete('/instructor/:id',authMiddleware,authorizeRoles("instructor"),deleteCourse)
courseRouter.get('/instructor/filter/:status',authMiddleware,authorizeRoles("instructor"),filterByStatus)

// admin 

courseRouter.get('/admin/get',authMiddleware,authorizeRoles("admin"),getAllCourseByAdmin)
courseRouter.put('/admin-status/:id',authMiddleware,authorizeRoles("admin"),updateStatusByAdmin)



module.exports = courseRouter;