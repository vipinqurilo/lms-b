const express = require("express");
const { courseCategoryAdd, filterCourseCategory } = require("../controller/courseCategoryController");

const categoryRouter = express.Router();


categoryRouter.post('/',courseCategoryAdd)
categoryRouter.get('/filter',filterCourseCategory)


module.exports = categoryRouter;