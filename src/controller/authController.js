const UserModel = require("../model/UserModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { isValidPassword, getPasswordHash } = require("../utils/password");
const StudentProfileModel = require("../model/studentProfileModel");
exports.registerUser = async (req, res) => {
  try {
    let newUser;
    const data = req.body;
    const userObj = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      role: data.role,
    };
    if (data.role == "teacher") {
      userObj.userStatus = "pending";
      newUser = await UserModel.create(userObj);
    } else if (data.role == "student") {
      newUser = await UserModel.create(userObj);
      const studentProfile = await StudentProfileModel.create({
        userId: newUser._id,
      });
      newUser.studentProfile = studentProfile._id;
      await newUser.save();
    } else {
      newUser = await UserModel.create(userObj);
    }
    const token = jwt.sign(
      { email: newUser.email, role: newUser.role, id: newUser._id },
      process.env.JWT_SECRET
    );
    res.json({
      status: "success",
      message: "User Registered successfully",
      data: {
        _id: newUser._id,
        email: newUser.email,
        role: newUser.role,
        userStatus: newUser.userStatus,
      },
      token: token,
    });
  } catch (error) {
    console.log(error, "error");
    res.json({
      status: "error",
      message: "something went wrong",
      error: error.message,
    });
  }
};

exports.userLogin = async (req, res) => {
  try {
    const data = req.body;
    console.log(data);
    const user = await UserModel.findOne({ email: data.email });
    const match = isValidPassword(data.password, user.password);
    if (match) {
      if (user.userStatus == "inactive") {
        return res.json({
          status: "failed",
          message: "user is inactive",
        });
      }
      const token = jwt.sign(
        { email: user.email, role: user.role, id: user._id },
        process.env.JWT_SECRET
      );
      res.json({
        status: "success",
        message: "login successfully",
        data: {
          _id: user._id,
          email: user.email,
          role: user.role,
          userStatus: user.userStatus,
        },
        token: token,
      });
    } else {
      res.json({
        status: "failed",
        message: "password not matched",
      });
    }
  } catch (error) {
    console.log(error);
    res.json({
      status: "failed",
      message: "something went wrong",
      error: error.message,
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;
    const user = await UserModel.findById(userId);
    if (!user) return res.json({ success: false, messge: "User not found" });

    const isValid = isValidPassword(oldPassword, user.password);
    if (!isValid)
      return res
        .status(400)
        .json({ success: false, message: "Password is incorrect" });
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    res.json({
      success: "true",
      message: "Password has been updated sucessfully",
    });
  } catch (e) {
    console.log(e);
    res.json({
      success: "false",
      message: "Something went Wrong",
      error: e.message,
    });
  }
};

exports.validateToken = async (req, res) => {
  const user = await UserModel.findById(req.user.id).select(
    "email role _id userStatus firstName lastName"
  );
  const { userStatus, role, email, firstName, lastName, _id } = user;
  const userData = {
    _id,
    name: firstName + lastName,
    userStatus,
    role,
    email,
  };
  return res.json({
    success: true,
    message: "Token validated successfully",
    data: userData,
  });
};
