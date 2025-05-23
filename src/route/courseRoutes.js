const express = require("express");
const {
  addCourse,
  getcourseFilter,
  getCourse,
  getSingleCourse,
  getCourseInstructor,
  getAllCourseByAdmin,
  updateStatusByAdmin,
  addSingleVideo,
  addSingleImage,
  updateCourseInstructor,
  deleteCourse,
  filterByStatus,
  filterHomePage,
  paginationCourse,
  updateCourseInstrustor,
  moduleMarkedAsCompleted,
} = require("../controller/courseController");
const authController = require("./authRoutes");
const { authMiddleware } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const upload = require("../upload/multerConfig"); 
const courseRouter = express.Router();

const multer = require("multer");
const { uploadPDF } = require("../upload/cloudinary");
const uploadPdfMulter = require("../middleware/upload");
const { getAdminDashboard } = require("../controller/adminController");
const uploadMulter = multer();
// courseRouter.post('/',authMiddleware,authorizeRoles("instructor"),upload.single("courseVideo"),addCourse)
courseRouter.post(
  "/",
  upload.fields([
    { name: "courseVideo", maxCount: 1 },
    { name: "courseImage", maxCount: 1 },
  ]),
  authMiddleware,
  authorizeRoles("teacher"),  
  addCourse
);

courseRouter.get("/filter/:id", getcourseFilter);
courseRouter.get("/front", getCourse);
courseRouter.get("/front/:id", getSingleCourse);
courseRouter.post("/singleVideo", uploadMulter.single("video"), addSingleVideo);
courseRouter.post(
  "/singleImage",
  uploadMulter.single("courseImage"),
  addSingleImage
);
courseRouter.post("/upload/pdf",uploadPdfMulter.single("pdf"),uploadPDF)
courseRouter.get("/home/:categoryId", filterHomePage);
courseRouter.post("/module-status",authMiddleware,authorizeRoles("student"),moduleMarkedAsCompleted)

// instructor routes

courseRouter.get('/instructor/get',authMiddleware,authorizeRoles("teacher"),getCourseInstructor)
courseRouter.put('/instructor/:id',authMiddleware,authorizeRoles("teacher"),updateCourseInstrustor)
courseRouter.post('/instructor/pagination',authMiddleware,authorizeRoles("teacher"),paginationCourse)

courseRouter.delete(
  "/instructor/:id",
  authMiddleware,
  authorizeRoles("teacher"),
  deleteCourse
);
courseRouter.get(
  "/instructor/filter/:status",
  authMiddleware,
  authorizeRoles("teacher"),
  filterByStatus
);

// admin
courseRouter.get("/admin/get", getAllCourseByAdmin);
courseRouter.put(
  "/admin-status/:id",
  authMiddleware,
  authorizeRoles("admin"),
  updateStatusByAdmin
);
courseRouter.get("/admin-dashboard",authMiddleware,authorizeRoles("admin"),getAdminDashboard);

module.exports = courseRouter;
