const express = require("express");
const { courseCategoryAdd, filterCourseCategory, getAllCourseCategory } = require("../controller/courseCategoryController");

const categoryRouter = express.Router();


categoryRouter.post('/',courseCategoryAdd)
categoryRouter.get('/filter',filterCourseCategory)
categoryRouter.get('/',getAllCourseCategory)


module.exports = categoryRouter;