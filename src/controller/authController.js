const UserModel = require("../model/UserModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const { isValidPassword, getPasswordHash } = require("../utils/password");
const { generateUsername } = require("../utils/username");
const StudentProfileModel = require("../model/studentProfileModel");
const getEmailSettings = require("../utils/emailSetting");


// exports.registerUser = async (req, res) => {
//   try {
//     let newUser;
//     const data = req.body;
//     const userObj = {
//       firstName: data.firstName,
//       lastName: data.lastName,
//       email: data.email,
//       password: data.password,
//       role: data.role,
//     };
//     const existingUserWithEmail=await UserModel.findOne({email:userObj.email});
//     if(existingUserWithEmail)
//       return res.status(400).json({status:"failed",message:"Email already registered"})
//     // const existingUserWithPhone=await UserModel.findOne({phone:userObj.phone});
//     // if(!existingUserWithPhone)
//     //   return res.status(400).json({status:"failed",message:"Mobile already registered"})
//     if (data.role == "teacher") {
//       userObj.userStatus = "pending";
//       newUser = await UserModel.create(userObj);
//     } else if (data.role == "student") {
//       newUser = await UserModel.create(userObj);
//       const studentProfile = await StudentProfileModel.create({
//         userId: newUser._id,
//       });
//       newUser.studentProfile = studentProfile._id;
//       await newUser.save();
//     } else {
//       newUser = await UserModel.create(userObj);
//     }
//     const token = jwt.sign(
//       { email: newUser.email, role: newUser.role, id: newUser._id },
//       process.env.JWT_SECRET
//     );
//     res.status(201).json({
//       status: "success",
//       message: "User Registered successfully",
//       data: {
//         _id: newUser._id,
//         email: newUser.email,
//         role: newUser.role,
//         userStatus: newUser.userStatus,
//       },
//       token: token,
//     });
//   } catch (error) {
//     console.log(error, "error");
//     res.status(500).json({
//       status: "error",
//       message: "something went wrong",
//       error: error.message,
//     });
//   }
// };


let transporter;

(async () => {
  const settings = await getEmailSettings();

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: settings.smtpUsername || process.env.EMAIL_USER,
      pass: settings.smtpPassword || process.env.EMAIL_PASS,
    },
  });

  // If you want to export the transporter after it's initialized
  module.exports = transporter;
})();


exports.registerUser = async (req, res) => {
  try {
    const data = req.body;


    let userName = '';
    
    if (data.role !== "teacher") {
      userName = generateUsername(data.firstName);
    }

    const userObj = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      role: data.role,
      verificationToken: jwt.sign({ email: data.email }, process.env.JWT_SECRET, { expiresIn: "1m" }),
      isVerified: false,
      userName: userName,
    };

    // Generate username for non-teachers
    if (data.role !== "teacher") {
      const randomNumber = Math.floor(1000 + Math.random() * 9000);
      userObj.userName = `${data.firstName.toLowerCase()}${randomNumber}`;
      userObj.firstName = data.firstName;
      userObj.lastName = data.lastName;
    }

    // Check if email already exists
    const existingUser = await UserModel.findOne({ email: userObj.email });
    if (existingUser) {
      return res.status(400).json({
        status: "failed",
        message: "Email already registered",
      });
    }

    if (data.role === "teacher") {
      userObj.userStatus = "pending";
    }

    let newUser = await UserModel.create(userObj);

    // If role is student, create student profile
    if (data.role === "student") {
      const studentProfile = await StudentProfileModel.create({
        userId: newUser._id,
      });
      newUser.studentProfile = studentProfile._id;
      await newUser.save();
    }


    // Send verification email
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${newUser.verificationToken}`;
    await transporter.sendMail({
      from: settings.smtpUsername || process.env.EMAIL_USER,
      to: newUser.email,
      subject: "Verify Your Email",
      html: `<p>Click the link below to verify your email:</p>
             <a href="${verificationLink}">Verify Email</a>`
    });


    const token = jwt.sign(
      { email: newUser.email, role: newUser.role, id: newUser._id },
      process.env.JWT_SECRET
    );

    res.cookie("token", token, {

      samesite: "none",
      secure: process.env.COOKIE_SECURE,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      http: true,
    });

    res.status(201).json({
      status: "success",
      message: "User registered successfully. Please verify your email.",
      data: {
        _id: newUser._id,
        email: newUser.email,
        role: newUser.role,
        userName: newUser.userName,

        userStatus: newUser.userStatus,
        name:!newUser.firstName?`${newUser.role.toUpperCase()}`:`${newUser.firstName} ${newUser.lastName||""}`
      },
      token: token,
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({
      status: "error",
      message: "Something went wrong",
      error: error.message,
    });
  }
};

async function sendVerificationEmail(user) {
  const settings = await getEmailSettings();
  const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${user.verificationToken}`;
  await transporter.sendMail({
    from:settings.smtpUsername || process.env.EMAIL_USER,
    to: user.email,
    subject: "Verify Your Email",
    html: `<p>Click the link below to verify your email:</p>
           <a href="${verificationLink}">Verify Email</a>`
  });
}

// Function to resend verification email
// exports.resendVerificationEmail = async (req, res) => { 
//   try {
//     const { email } = req.body;
//     console.log(email, "resendVerificationEmail");
//     const user = await UserModel.findOne({ email });

//     if (!user) {
//       return res.status(404).json({
//         status: "failed",
//         message: "User not found",
//       });
//     }

//     if (user.isVerified) {
//       return res.status(400).json({
//         status: "failed",
//         message: "User is already verified",
//       });
//     }

//     // Generate new verification token
//     user.verificationToken = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: "1d" });
//     await user.save();

//     // Send verification email
//     await sendVerificationEmail(user);

//     res.status(200).json({
//       status: "success",
//       message: "Verification email sent again successfully.",
//     });
//   } catch (error) {
//     console.error("Error resending verification email:", error);
//     res.status(500).json({
//       status: "error",
//       message: "Something went wrong",
//       error: error.message,
//     });
//   }
// };


exports.resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    console.log(email, "resendVerificationEmail");
    
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        status: "failed",
        message: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        status: "failed",
        message: "User is already verified",
      });
    }

    // Check if the existing verification token is still valid
    if (user.verificationToken) {
      try {
        const decoded = jwt.verify(user.verificationToken, process.env.JWT_SECRET);
        return res.status(400).json({
          status: "failed",
          message: "Verification email has already been sent. Please check your email.",
        });
      } catch (err) {
        if (err.name !== "TokenExpiredError") {
          return res.status(500).json({
            status: "error",
            message: "Something went wrong while verifying token",
          });
        }
      }
    }

    // Generate a new verification token since the old one is expired or missing
    user.verificationToken = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: "1m" });
    await user.save();

    // Send verification email
    await sendVerificationEmail(user);

    res.status(200).json({
      status: "success",
      message: "Verification email sent again successfully.",
    });
  } catch (error) {
    console.error("Error resending verification email:", error);
    res.status(500).json({
      status: "error",
      message: "Something went wrong",
      error: error.message,
    });
  }
};





exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    console.log(token, "opppoo");

    if (!token) {
      return res.status(400).json({ message: "Verification token is required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded, "popooopoo");

    if (!decoded) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const user = await UserModel.findOne({ email: decoded.email, verificationToken: token });
    console.log(user, "popooopoo");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    user.isVerified = true;
    user.verificationToken = "";
    await user.save();

    return res.json({ message: "Email verified successfully!" });
  } catch (error) {
    console.error("Error verifying email:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};




exports.userLogin = async (req, res) => {
  try {
    const data = req.body;
    const user = await UserModel.findOne({ email: data.email });
    console.log(data,user, "user");

    if (!user) {
      return res.status(404).json({
        status: "failed",
        message: "user not found",
      });
    }

        // Check if the user is verified
        if (!user.isVerified) {
          return res.status(403).json({
            status: "failed",
            message: "User is not verified. Please verify your account before logging in.",
          });
        }

 
   
    const match = isValidPassword(data.password, user.password);

    if (match) {
      if (user.userStatus == "inactive") {
        return res.status(401).json({
          status: "failed",
          message: "user is inactive",
        });
      }
      const token = jwt.sign(
        { email: user.email, role: user.role, id: user._id },
        process.env.JWT_SECRET
      );

      res.cookie("token", token, {

        samesite: "none",
        secure: process.env.COOKIE_SECURE,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        http: true,
      });

      return res.json({
        status: "success",
        message: "Login successfully",
        data: {
          _id: user._id,
          email: user.email,
          role: user.role,
          name: user.firstName + " " + user.lastName,
          userStatus: user.userStatus,
        },
        // token: token,
      });
    } else {
      return res.status(400).json({
        status: "failed",
        message: "password is incorrect",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "failed",
      message: "Something went wrong",
      error: error.message,
    });
  }
};


exports.userLogout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    return res.json({
      status: "success",
      message: "Logout successful",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "failed",
      message: "Something went wrong",
      error: error.message,
    });
  }
};


exports.generateLoginToken = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({
        status: "failed",
        message: "userId is required",
      });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: "failed",
        message: "User not found",
      });
    }

    const token = jwt.sign(
      { email: user.email, role: user.role, id: user._id },
      process.env.JWT_SECRET
    );

    res.cookie("token", token, {
      samesite: "none",
      secure: process.env.COOKIE_SECURE,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      http: true,
    });

    res.json({
      status: "success",
      message: "token generated successfully",
      data: {
        _id: user._id,
        email: user.email,
        name: user.firstName + " " + user.lastName,
        role: user.role,
        userStatus: user.userStatus,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: "Something went wrong",
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
  try {
    const user = await UserModel.findById(req.user.id).select(
      "email role _id userStatus firstName lastName"
    );
     
    if (!user) {
      return res.status(404).json({
        success: false, 
        message: "User not found"
      });
    }

    const { userStatus, role, email, firstName, lastName, _id } = user;
    const userData = {
      _id,
      name: firstName + " " + lastName,
      userStatus,
      role,
      email,
    };
    
    return res.json({
      success: true,
      message: "Token validated successfully",
      data: userData,
    });
  } catch (error) {
    console.error("Error validating token:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message
    });
  }
};
