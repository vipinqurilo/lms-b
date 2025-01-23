const express = require("express");
const cors = require("cors");
const courseRouter = require("./src/route/courseRoutes");
const authController = require("./src/route/authRoutes");
const categoryRouter = require("./src/route/categoryRoute");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use("/api/auth",authController);
app.use("/api/course",courseRouter);
app.use("/api/category",categoryRouter);

module.exports = app;