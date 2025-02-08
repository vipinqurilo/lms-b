const express = require("express");
const { courseSubCategoryAdd, filterCourseSubCategory, courseSubCategoryDelete, courseSubCategoryEdit } = require("../controller/courseSubCategoryController");

const subCategoryRouter = express.Router();


subCategoryRouter.post('/',courseSubCategoryAdd);
subCategoryRouter.delete('/:id',courseSubCategoryDelete);
subCategoryRouter.put('/:id',courseSubCategoryEdit);
subCategoryRouter.get('/filter',filterCourseSubCategory);


module.exports = subCategoryRouter;