const TeacherRequestModel = require("../../model/teacherRequestModel");
const TeacherProfileModel = require("../../model/teacherProfileModel");
const CalendarModel = require("../../model/calenderModel");
const UserModel = require("../../model/UserModel");
const { defaultAvailability } = require("../../utils/calendar");
const walletModel = require("../../model/walletModel");

exports.createTeacherRequest = async (req, res) => {
  try {
    const {
      personalInfo,
      profilePhoto,
      introVideo,
      bio,
      education,
      experience,
      subjectsTaught,
      languagesSpoken,
    } = req.body;

    const userId = req.user.id;
    const teacherProfile = await TeacherProfileModel.findOne({ userId });
    if (teacherProfile) {
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
    const newRequest = await TeacherRequestModel.create({
      userId,
      personalInfo,
      profilePhoto,
      introVideo,
      bio,
      experience,
      education,
      subjectsTaught,
      languagesSpoken,
    });
    console.log(newRequest, "sdf");
    // await UserModel.findOneAndUpdate(
    //   { id: userId },
    //   { ...personalInfo, profilePhoto, introVideo, bio }
    // );
    res.status(201).json({
      success: true,
      message: "Your request has been submitted for approval.",
      data: newRequest,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.getTeacherRequests = async (req, res) => {
  try {
    let {
      search,
      approvalStatus,
      page = 1,
      limit = 10,
      startDate,
      endDate,
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    let query = { approvalStatus: "in review" };

    if (search && search.trim() != "")
      query.$or = [
        { "personalInfo.firstName": { $regex: search, $options: "i" } },
        { "personalInfo.lastName": { $regex: search, $options: "i" } },
      ];

    // Approval Status filter
    if (approvalStatus && approvalStatus.trim() !== "") {
      query.approvalStatus = approvalStatus;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const teacherRequests = await TeacherRequestModel.aggregate([
      {
        $match: query,
      },
      { $sort: { createdAt: 1 } },

      // // Pagination
      { $skip: skip },
      { $limit: limit },
    ]);

    const totalRequests = await TeacherRequestModel.countDocuments(query);
    res.json({
      success: true,
      data: teacherRequests,
      total: totalRequests,
      currentPage: page,
      totalPages: Math.ceil(totalRequests / limit),
      message: "Teacher Requests retrieved successfully",
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

exports.getTeacherRequestsById = async (req, res) => {
  try {
    console.log(req.user.role);
    const query = {};
    if (req.user.role == "admin" && req.params.requestId)
      query._id = req.params.requestId;
    if (req.user.role == "teacher") query.userId = req.user.id;
    console.log(query);
    const teacherRequest = await TeacherRequestModel.findOne(query);
    if (!teacherRequest)
      return res.status(404).json({ message: "Teacher request not found" });
    res.json({
      success: true,
      data: teacherRequest,
      message: "Teacher request found successfully",
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
exports.editTeacherRequest = async (req, res) => {
  try {
    const data = req.body;
    data.approvalStatus = "in review";
    const requestId = req.params.requestId;
    const editRequest = await TeacherRequestModel.findOneAndUpdate(
      { _id: requestId },
      data,
      { new: true }
    );
    // editRequest.approvalStatus="in review";
    // await editRequest.save();
    if (!editRequest) {
      return res
        .status(404)
        .json({ success: false, message: "Teacher request not found" });
    }
    res.json({
      success: true,
      data: editRequest,
      message: "Teacher request updated successfully",
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

    if (request.approvalStatus !== "in review") {
      return res.status(400).json({
        success: true,
        message: "This request has already been processed.",
      });
    }

   

    // Create Teacher Profile
    const teacherProfile = await TeacherProfileModel.create({
      userId: request.userId._id,
      education: request.education,
      experience: request.experience,
      introVideo: request.introVideo,
      subjectsTaught: request.subjectsTaught,
      languagesSpoken: request.languagesSpoken,
    });
    const calendar = await CalendarModel.create({
      userId: request.userId._id,
      availability: defaultAvailability,
    });
    const wallet = await walletModel.create({ userId: request.userId._id });

    teacherProfile.calendar = calendar._id;
    await teacherProfile.save();
    await UserModel.findOneAndUpdate(
      { _id: request.userId._id },
      {
        teacherProfile: teacherProfile._id,
        userStatus: "active",
        walletId: wallet._id,
        ...request.personalInfo,
        bio: request.bio,
        profilePhoto: request.profilePhoto,
      },
      { new: true }
    );
     // Approve request
     request.approvalStatus = "approved";
     await request.save();
    res.status(200).json({
      success: true,
      message: "Teacher request approved successfully.",
    });
  } catch (error) {
    res.status(500).json({
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

    if (request.approvalStatus !== "in review") {
      return res.status(400).json({
        success: false,
        message: "This request has already been processed.",
      });
    }

    const teacherRequest = await TeacherRequestModel.findByIdAndUpdate(
      { _id: requestId },
      { approvalStatus: "rejected", reason: reason }
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
