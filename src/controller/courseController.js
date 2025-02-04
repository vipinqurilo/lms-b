const CourseModel = require("../model/CourseModel");
const path = require("path");
const { getVideoDurationInSeconds } = require("get-video-duration");
const { uploadMediaToCloudinary } = require("../upload/cloudinary");
const UserModel = require("../model/UserModel");

// Function to get video duration using get-video-duration library
const getVideoDuration = async (videoPath) => {
  try {
    const durationInSeconds = await getVideoDurationInSeconds(videoPath);
    return durationInSeconds;
  } catch (err) {
    console.error("Error fetching video duration:", err);
    throw new Error("Invalid video file");
  }
};

exports.addCourse = async (req, res) => {
  try {
    const data = req.body;
    console.log(data);

    // Get file information from the request
    const courseVideo = req.files["courseVideo"]
      ? req.files["courseVideo"][0].filename
      : null;
    const courseImage = req.files["courseImage"]
      ? req.files["courseImage"][0].filename
      : null;

    // Build the path to the video file
    const videoPath = courseVideo
      ? path.join(__dirname, "..", "public", courseVideo) // Adjust path as necessary
      : null;

    // Get video duration if a video file exists
    let videoDuration = 0;
    if (videoPath) {
      videoDuration = await getVideoDuration(videoPath);
      console.log("Video Duration: ", videoDuration);
    }

    // Prepare course data object
    const courseObj = {
      courseTitle: data.courseTitle,
      courseDescription: data.courseDescription,
      courseCategory: data.courseCategory,
      courseSubCategory: data.courseSubCategory,
      courseImage: data.courseImage,
      courseVideo: data.courseVideo,
      coursePrice: data.coursePrice,
      courseInstructor: data.courseInstructor,
      courseDuration: videoDuration,
      courseContent: JSON.parse(data.courseContent),
      courseLearning: JSON.parse(data.courseLearning),
      courseRequirements: JSON.parse(data.courseRequirements),
      status:"pending",
    };

    // Save course to the database
    const courseAdd = await CourseModel.create(courseObj);

    if (courseAdd) {
      res.json({
        status: "success",
        message: "Course added successfully",
        data: courseAdd,
      });
    } else {
      res.json({
        status: "failed",
        message: "Course not added",
      });
    }
  } catch (error) {
    console.log(error.message);
    res.json({
      status: "failed",
      message: "Something went wrong",
      error: error.message,
    });
  }
};




exports.getCourse = async (req, res) => {
    try {
        let course = await CourseModel.find({},{courseVideo:0}).limit(6).sort({createdAt:-1});
        course.map((item) => {
            item.courseImage = `https://6g2n7ff0-8000.inc1.devtunnels.ms/public/${item.courseImage}`;
            // item.courseVideo = `http://localhost:8000/public/${item.courseVideo}`;
        })
        res.json({
            status:"success",
            message:"course fetched successfully",
            data:course
        })
    } catch (error) {
        res.json({
            status:"failed",
            message:"something went wrong",
            error:error.message
        })
    }
}

exports.getSingleCourse = async (req, res) => {
    try {
        const {id} = req.params;
        const course = await CourseModel.findById(id);
        res.json({
            status:"success",
            message:"course fetched successfully",
            data:course
        })
    } catch (error) {
        res.json({
            status:"failed",
            message:"something went wrong",
            error:error.message
        })
    }
}

exports.getcourseFilter = async (req, res) => {
    try {
        const {id} = req.params;
        const course = await CourseModel.find({courseCategory : id });
        res.json({
            status:"success",
            message:"course fetched successfully",
            data:course
        })
    } catch (error) {
        res.json({
            status:"failed",
            message:"something went wrong",
            error:error.message
        })
    }
}


exports.getCourseInstructor = async (req, res) => {
    try {
        const {id} = req.params;
        const course = await CourseModel.find({ courseInstructor: id });
        res.json({
            status:"success",
            message:"course fetched successfully",
            data:course
        })
    } catch (error) {
        res.json({
            status:"failed",
            message:"something went wrong",
            error:error.message
        })
    }
}

exports.getAllCourseByAdmin = async (req, res) => {
  try {
      const courseSubCategory = await CourseModel.find({status:"pending"}).populate("courseSubCategory","name").populate({path:"user",model:UserModel}).exec();
      res.json({
          status:"success",
          message:"course sub category fetched successfully",
          data:courseSubCategory
      })
  } catch (error) {
    console.log(error)
      res.json({
          status:"failed",
          message:"something went wrong",
          error:error.message
      })
  }
}

exports.updateStatusByAdmin = async (req, res) => {
  try {
      const { id } = req.params;
      const { status } = req.body;
      const updateStatus = await CourseModel.findByIdAndUpdate(id, { status: status }, { new: true });
      if(!updateStatus) return res.json({ status: "failed", message: "status not updated" })
      res.json({
          status: "success",
          message: "status updated successfully",
          data: updateStatus
      })
  } catch (error) {
      res.json({
          status: "failed",
          message: "something went wrong",
          error: error.message
      })
  }
}

exports.addSingleVideo = async (req, res) => {
  try {
    const videoUrl = await uploadMediaToCloudinary(req.file, "video");
    res.json({
      status: "success",
      message: "video uploaded successfully",
      data: videoUrl
    })

  } catch (error) {
    console.log(error);
  }
}

exports.addSingleImage = async (req, res) => {
  try {
    const imageUrl = await uploadMediaToCloudinary(req.file, "image");
    console.log(imageUrl);
    res.json({
      status: "success",
      message: "image uploaded successfully",
      data: imageUrl
    })
  } catch (error) {
    console.log(error);
  }
}