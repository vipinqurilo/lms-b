const StudentProfileModel = require("../../model/studentProfileModel");

const getStudentProfile = async (req, res) => {
  try {
    const userId = req.user.id; 
    console.log(userId,'userId')
    const studentProfile = await StudentProfileModel.findOne({ userId })
      .populate('userId', 'name email') // Populate basic user info
      .populate({
        path: 'enrolledCourses.courseId',
        select: 'courseTitle courseDescription coursePrice courseInstructor courseCategory',
        populate: {
          path: 'courseInstructor',
          select: 'name email'
        }
      })
      .populate({
        path: 'tutionBookings',
        select: 'date status tutor subject',
        populate: {
          path: 'tutor',
          select: 'name email'
        }
      });

    if (!studentProfile) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    res.status(200).json({
      success: true,
      data: studentProfile
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching student profile",
      error: error.message
    });
  }
};

const getEnrolledCourses = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page, limit, search } = req.query;

    const studentProfile = await StudentProfileModel.findOne({ userId })
      .select('enrolledCourses')
      .populate({
        path: 'enrolledCourses.courseId',
        select: '-__v',
        populate: {
          path: 'courseInstructor',
          select: 'name email profileImage'
        }
      });

    if (!studentProfile) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    let filteredData = studentProfile.enrolledCourses;
    console.log(filteredData,'filtereddata')
    // Apply search filter if search query is provided
    if (search) {
      filteredData = filteredData.filter(course => 
        course.courseId && course.courseId.courseTitle && 
        course.courseId.courseTitle.toLowerCase().includes(search.toLowerCase())
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
          message: "Invalid pagination parameters. Page and limit must be positive numbers."
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
          itemsPerPage: limitNum
        }
      });
    }

    // If no pagination parameters, return all filtered data
    res.status(200).json({
      success: true,
      data: paginatedData,
      totalItems
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching enrolled courses",
      error: error.message
    });
  }
};

module.exports = {
  getStudentProfile,
  getEnrolledCourses
};