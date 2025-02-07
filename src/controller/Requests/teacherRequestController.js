const TeacherRequestModel = require("../../model/teacherRequestModel");
const TeacherProfileModel = require("../../model/teacherProfileModel");
const CalendarModel=require("../../model/calenderModel");
const UserModel = require("../../model/UserModel");
const {defaultAvailability} = require("../../utils/calendar");
exports.createTeacherRequest = async (req, res) => {
  try {
    const {
      personalInfo,
      profilePhoto,
      bio,
      education,
      experience,
      subjectsTaught,
      languagesSpoken,
    } = req.body;
    const userId = req.user.id;
    const teacherProfile=await TeacherProfileModel.findOne({userId});
    if(teacherProfile){
      return res.status(400).json({ message: "You are already a teacher." });
    }
    // Check if the user already has a pending request
    const existingRequest = await TeacherRequestModel.findOne({
      userId,
    });
    if (existingRequest) {
      return res
        .status(400)
        .json({ message: "Your request is already under review or approved." });
    }

    // Create new teacher request
    const newRequest = new TeacherRequestModel({
      userId,
      personalInfo,
      profilePhoto,
      bio,
      experience,
      subjectsTaught,
      languagesSpoken
    });
    const user = await UserModel.findOneAndUpdate({ id: userId }, personalInfo);
    await newRequest.save();
    res
      .status(201)
      .json({
        success: true,
        message: "Your request has been submitted for approval.",
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.getTeacherRequests = async (req, res) => {
  try {
    const teacherRequests = await TeacherRequestModel.find({}).sort({
      createdAt: -1,
    });
    res.json({
      success: true,
      message: "Teacher requests fetched successfully",
      data: teacherRequests,
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

exports.approvedTeacherRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await TeacherRequestModel.findById(requestId).populate(
      "userId"
    );

    if (!request) {
      return res.status(404).json({ message: "Teacher request not found" });
    }

    if (request.approvalStatus !== "In Review") {
      return res
        .status(400)
        .json({success:true, message: "This request has already been processed." });
    }

    // Approve request
    request.approvalStatus = "Approved";
    await request.save();

    // Create Teacher Profile
    const teacherProfile = new TeacherProfileModel({
      userId: request.userId._id,
      education:request.education,
      experience: request.experience,
      subjectsTaught: request.subjectsTaught,
      languagesSpoken: request.languagesSpoken,
    });
    const calendar=await CalendarModel.create({userId:request.userId._id,availability:defaultAvailability})
    teacherProfile.calendar=calendar._id;
    await teacherProfile.save();
    await UserModel.findOneAndUpdate(
      { _id: request.userId._id },
      {teacherProfile:teacherProfile._id},
      { new: true }
    );
    res.status(200).json({success:true, message: "Teacher request approved successfully." });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Something went wrong",
        error: error.message,
      });
  }
};

exports.rejectedTeacherRequest = async (req, res) => {
  try {
    const requestId = req.params.requestId;
    const { reason } = req.body;
    const request = await TeacherRequestModel.findById(requestId).populate(
      "userId"
    );
    if (!request) {
      return res.status(404).json({ message: "Teacher request not found" });
    }

    if (request.approvalStatus !== "In Review") {
      return res
        .status(400)
        .json({success:false, message: "This request has already been processed." });
    }

    const teacherRequest = await TeacherRequestModel.findByIdAndUpdate(
      { _id: requestId },
      { approvalStatus: "Rejected", reason: reason }
    );
    res.json({
      success: true,
      message: "Teacher request rejected successfully",
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};
