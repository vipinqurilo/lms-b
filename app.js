const express = require("express");
const cors = require("cors");
const courseRouter = require("./src/route/courseRoutes");
const authController = require("./src/route/authRoutes");
const categoryRouter = require("./src/route/categoryRoute");
const subCategoryRouter = require("./src/route/subCategoryRoute");

const app = express();
app.use(express.json());
require('dotenv').config()
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use("/public", express.static("public"));

app.use("/api/auth",authController);
app.use("/api/course",courseRouter);
app.use("/api/category",categoryRouter);
app.use("/api/subcategory",subCategoryRouter);

module.exports = app;