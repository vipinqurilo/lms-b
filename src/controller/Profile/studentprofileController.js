const StudentProfileModel = require("../../model/studentProfileModel");
const CourseModel = require("../../model/CourseModel");
const pdf = require("html-pdf");
const path = require("path");
const { render } = require("ejs");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;
const uploadPDF = require("../../upload/cloudinary");

cloudinary.config({
  cloud_name: process.env.cloud_name,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const getStudentProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(userId, "userId");
    const studentProfile = await StudentProfileModel.findOne({ userId })
      .populate("userId", "name email") // Populate basic user info
      .populate({
        path: "enrolledCourses.courseId",
        select:
          "courseTitle courseDescription coursePrice courseInstructor courseCategory",
        populate: {
          path: "courseInstructor",
          select: "name email",
        },
      })
      .populate({
        path: "tutionBookings",
        select: "date status tutor subject",
        populate: {
          path: "tutor",
          select: "name email",
        },
      });

    if (!studentProfile) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    res.status(200).json({
      success: true,
      data: studentProfile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching student profile",
      error: error.message,
    });
  }
};

const getEnrolledCourses = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page, limit, search } = req.query;

    const studentProfile = await StudentProfileModel.findOne({ userId })
      .select("enrolledCourses")
      .populate({
        path: "enrolledCourses.courseId",
        select: "-__v",
        populate: {
          path: "courseInstructor",
          select: "name email profileImage",
        },
      });

    if (!studentProfile) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    let filteredData = studentProfile.enrolledCourses;
    console.log(filteredData, "filtereddata");
    // Apply search filter if search query is provided
    if (search) {
      filteredData = filteredData.filter(
        (course) =>
          course.courseId &&
          course.courseId.courseTitle &&
          course.courseId.courseTitle
            .toLowerCase()
            .includes(search.toLowerCase())
      );
    }

    let totalItems = filteredData.length;
    let totalPages = 1;
    let paginatedData = filteredData;

    // Apply pagination only if both page and limit are provided
    if (page && limit) {
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);

      if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid pagination parameters. Page and limit must be positive numbers.",
        });
      }

      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;

      totalPages = Math.ceil(totalItems / limitNum);
      paginatedData = filteredData.slice(startIndex, endIndex);

      return res.status(200).json({
        success: true,
        data: paginatedData,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems,
          itemsPerPage: limitNum,
        },
      });
    }

    // If no pagination parameters, return all filtered data
    res.status(200).json({
      success: true,
      data: paginatedData,
      totalItems,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching enrolled courses",
      error: error.message,
    });
  }
};

const getEnrolledCourseIds = async (req, res) => {
  try {
    const userId = req.user.id;

    const studentProfile = await StudentProfileModel.findOne({ userId }).select(
      "enrolledCourses"
    );

    if (!studentProfile) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    const enrolledCourses = studentProfile.enrolledCourses;

    res.status(200).json({
      success: true,
      data: enrolledCourses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching enrolled course IDs",
      error: error.message,
    });
  }
};

const generateCertificate = async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId } = req.params;

    const studentProfile = await StudentProfileModel.findOne({ userId });
    if (!studentProfile) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    const enrolledCourse = studentProfile.enrolledCourses.find(
      (course) => course.courseId.toString() === courseId
    );

    if (!enrolledCourse || !enrolledCourse.isCompleted) {
      return res.status(404).json({ message: "Course not Completed" });
    }

    const studentData = {
      studentName: enrolledCourse.certificate.studentName,
      courseTitle: enrolledCourse.certificate.courseTitle,
      completionDate: enrolledCourse.certificate.completionDate,
      instructorName: enrolledCourse.certificate.instructorName,
    };

    const html = await new Promise((resolve, reject) => {
      res.render("certificate", studentData, (err, renderedData) => {
        if (err) reject(err);
        else resolve(renderedData);
      });
    });

    const pdfPath = path.join(
      __dirname,
      "../../public/certificates",
      "certificate.pdf"
    );

    pdf
      .create(html, {
        format: "letter",
        orientation: "landscape",
        border: {
          top: "10mm",
          right: "10mm",
          bottom: "10mm",
          left: "10mm",
        },
      })
      .toFile(pdfPath, async (err) => {
        if (err) {
          return res.status(500).json({ error: "Failed to generate PDF" });
        }

        // Read file and convert to base64 buffer
        const fileBuffer = fs.readFileSync(pdfPath);
        const fileStr = `data:application/pdf;base64,${fileBuffer.toString(
          "base64"
        )}`;

        // Upload to Cloudinary
        cloudinary.uploader.upload(
          fileStr,
          {
            resource_type: "raw",
            folder: "luxe",
          },
          async (error, result) => {
            if (error) {
              return res.status(500).json({ error: "Failed to upload PDF" });
            }

            // Delete the local file after successful upload
            fs.unlinkSync(pdfPath);

            res.json({
              message: "Certificate generated",
              pdfUrl: result.secure_url,
            });
          }
        );
      });
  } catch (error) {
    res.status(500).json({ status: "failed", error: error.message });
  }
};

module.exports = {
  getStudentProfile,
  getEnrolledCourses,
  getEnrolledCourseIds,
  generateCertificate,
};
