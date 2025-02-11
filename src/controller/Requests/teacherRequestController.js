const TeacherRequestModel = require("../../model/teacherRequestModel");
const TeacherProfileModel = require("../../model/teacherProfileModel");
const CalendarModel = require("../../model/calenderModel");
const UserModel = require("../../model/UserModel");
const { defaultAvailability } = require("../../utils/calendar");
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
    const newRequest = new TeacherRequestModel({
      userId,
      personalInfo,
      profilePhoto,
      bio,
      experience,
      education,
      subjectsTaught,
      languagesSpoken,
    });
    const user = await UserModel.findOneAndUpdate({ id: userId }, personalInfo);
    res.status(201).json({
      success: true,
      message: "Your request has been submitted for approval.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.getTeacherRequests = async (req, res) => {
  try {
    let { search, approvalStatus, page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;
    let query = { approvalStatus: "in review" };
    if (search && search != "")
      query.$or = [
        { "personalInfo.firstName": { $regex: search, $options: "i" } },
        { "personalInfo.lastName": { $regex: search, $options: "i" } },
      ];
    if (approvalStatus && approvalStatus !== "")
      query.approvalStatus = approvalStatus;
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
      message: "Users retrieved successfully",
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
    console.log(req.user.role)
    const query={}
    if(req.user.role=="admin"&&req.params.requestId)
      query._id=req.params.requestId;
    if(req.user.role=="teacher")
      query.userId=req.user.id;
    console.log(query);
    const teacherRequest = await TeacherRequestModel.findOne(query);
    if(!teacherRequest)
      return res.status(404).json({message:"Teacher request not found"});
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
}
exports.editTeacherRequest = async (req, res) => {
    try{
       const data=req.body;
       const requestId=req.params.requestId;
        const editRequest = await TeacherRequestModel.findOneAndUpdate({_id:requestId},data,{new:true});
        if (!editRequest) {
            return res.status(404).json({success: false, message: "Teacher request not found" });
        }
        res.json({
            success: true,
            data: editRequest,
            message: "Teacher request updated successfully",
        });
        
    }
    catch(error){
        console.log(error);
        res.json({
            success: false,
            message: "Something went wrong",
            error: error.message,
        });
    }
}
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
      return res
        .status(400)
        .json({
          success: true,
          message: "This request has already been processed.",
        });
    }

    // Approve request
    request.approvalStatus = "approved";
    await request.save();

    // Create Teacher Profile
    const teacherProfile = new TeacherProfileModel({
      userId: request.userId._id,
      education: request.education,
      experience: request.experience,
      subjectsTaught: request.subjectsTaught,
      languagesSpoken: request.languagesSpoken,
    });
    const calendar = await CalendarModel.create({
      userId: request.userId._id,
      availability: defaultAvailability,
    });
    teacherProfile.calendar = calendar._id;
    await teacherProfile.save();
    await UserModel.findOneAndUpdate(
      { _id: request.userId._id },
      { teacherProfile: teacherProfile._id },
      { new: true }
    );
    res
      .status(200)
      .json({
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
      return res
        .status(400)
        .json({
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
