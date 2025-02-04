const express = require("express");
const { courseSubCategoryAdd, filterCourseSubCategory } = require("../controller/courseSubCategoryController");

const subCategoryRouter = express.Router();


subCategoryRouter.post('/',courseSubCategoryAdd)
subCategoryRouter.get('/filter',filterCourseSubCategory)


module.exports = subCategoryRouter;