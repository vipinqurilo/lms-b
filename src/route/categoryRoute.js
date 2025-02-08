const express = require("express");
const {
  courseCategoryAdd,
  filterCourseCategory,
  getAllCourseCategory,
  deleteCategory,
  editCategory
} = require("../controller/courseCategoryController");

const categoryRouter = express.Router();

categoryRouter.post("/", courseCategoryAdd);
categoryRouter.get("/filter", filterCourseCategory);
categoryRouter.get("/", getAllCourseCategory);
categoryRouter.delete("/:id", deleteCategory);
categoryRouter.put("/:id", editCategory);

module.exports = categoryRouter;
