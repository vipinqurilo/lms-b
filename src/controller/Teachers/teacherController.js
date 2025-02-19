const TeacherProfileModel = require("../../model/teacherProfileModel");

exports.getTeachers = async (req, res) => {
    try {
        const query={};
        const {search,startDate,endDate, page = 1, limit = 10} = req.query;
        if(search&&search!=="")
        {
            query.$or = [
                { "user.firstName": { $regex: search, $options: "i" } },
                { "user.lastName": { $regex: search, $options: "i" } },
            ];
        }
        
        if (startDate || endDate) {
            query.scheduledDate = {};
            if (startDate) query.scheduledDate.$gte = new Date(moment( startDate ).format('YYYY-MM-DD[T00:00:00.000Z]'))
            if (endDate) query.scheduledDate.$lte = new Date(moment( endDate ).format('YYYY-MM-DD[T00:00:00.000Z]'))
        }
        const teachers = await TeacherProfileModel.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user",
                },
            },
            {
                $unwind: "$user",
            },
            {
                $lookup: {
                    from: "courses",
                    localField: "courses",
                    foreignField: "_id",
                    as: "courses",
                },
            },
            {
                $lookup: {
                    from: "bookings",
                    localField: "tutionBookings",
                    foreignField: "_id",
                    as: "tutionBookings",
                },
            },
            {
                $lookup: {
                    from: "tution",
                    localField: "courses",
                    foreignField: "_id",
                    as: "courses",
                },
            },
            
            {
                $match: query,
            },
             {
                $addFields: {
                    pendingCourses: { $size: { $filter: { input: "$courses", as: "course", cond: { $eq: ["$$course.status", "pending"] } } } },
                    publishedCourses: { $size: { $filter: { input: "$courses", as: "course", cond: { $eq: ["$$course.status", "published"] } } } },
                    unpublishedCourses: { $size: { $filter: { input: "$courses", as: "course", cond: { $eq: ["$$course.status", "unpublished"] } } } },
                    totalEnrolledStudents: { $sum: "$courses.enrolledStudents" },
                    cancelledSessions: { $size: { $filter: { input: "$tutionBookings", as: "booking", cond: { $eq: ["$$booking.status", "cancelled"] } } } },
                    completedSessions: { $size: { $filter: { input: "$tutionBookings", as: "booking", cond: { $eq: ["$$booking.status", "completed"] } } } },
                    totalSessions: { $size: "$tutionBookings" },
                    scheduledSessions: { $size: { $filter: { input: "$tutionBookings", as: "booking", cond: { $eq: ["$$booking.status", "scheduled"] } } } },
                    confirmedSessions: { $size: { $filter: { input: "$tutionBookings", as: "booking", cond: { $eq: ["$$booking.status", "confirmed"] } } } },
                    rescheuledSessions: { $size: { $filter: { input: "$tutionBookings", as: "booking", cond: { $eq: ["$$booking.status", "rescheduled"] } } } },
                },
            },
            {
                $skip: (page - 1) * parseInt(limit),
            },
            {
                $limit: parseInt(limit),
            },
            
            {
                $project: {
                    _id: 1,
                    user: {
                        _id: 1,
                        firstName: 1,
                        lastName: 1,
                        email: 1,
                        profilePhoto: 1,
                        gender: 1,
                    },
                    // tutionBookings:1,
                    courses:1,
                    pendingCourses: 1,
                    publishedCourses: 1,
                    unpublishedCourses: 1,
                    totalEnrolledStudents: 1,
                    cancelledSessions: 1,
                    confirmedSessions:1,
                    rescheuledSessions:1,
                    completedSessions: 1,
                    totalSessions: 1,
                    scheduledSessions: 1,
                }
            },
            
        ]);
       
        //Counting Total Students
        const countQuery=[
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user",
                },
            },
            {
                $unwind: "$user",
            },
            {
                $match: query,
            },
            
            {
                $count: "totalTeachers"
            }
        ]
        const totalResult=await TeacherProfileModel.aggregate(countQuery);
        const totalTeachers=totalResult.length>0?totalResult[0].totalTeachers:0;
        res.json({
            success: true,
            data: teachers,
            total: totalTeachers,
            currentPage: page,
            totalPages: Math.ceil(totalTeachers / parseInt(limit)),
            message: "Teachers retrieved successfully",
        });
    } catch (error) {
        res.status(500).json({ success:false,message: "Failed to retrieve teachers", error: error.message });
    }
};