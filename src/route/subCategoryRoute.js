const express = require("express");
const { courseSubCategoryAdd, filterCourseSubCategory, courseSubCategoryDelete, courseSubCategoryEdit, getAllSubcategories } = require("../controller/courseSubCategoryController");

const subCategoryRouter = express.Router();


subCategoryRouter.post('/',courseSubCategoryAdd);
subCategoryRouter.get('/',getAllSubcategories);
subCategoryRouter.delete('/:id',courseSubCategoryDelete);
subCategoryRouter.put('/:id',courseSubCategoryEdit);
subCategoryRouter.get('/filter',filterCourseSubCategory);


module.exports = subCategoryRouter;