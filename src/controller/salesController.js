const moment = require('moment');
const Booking = require('../model/bookingModel'); // Assuming the Order model is in models/Order.js
const Order = require('../model/orderModel')
exports.getCourseSalesData = async (req, res) => {

    const { startDate, endDate } = req.query;
    const query = {};
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate)
            query.createdAt.$gte = new Date(
                moment(startDate).format("YYYY-MM-DD[T00:00:00.000Z]")
            );
        if (endDate)
            query.createdAt.$lte = new Date(
                moment(endDate).format("YYYY-MM-DD[T00:00:00.000Z]")
            );
    }
    try {

        const salesData = await Order.aggregate([
            // Match orders within the specified date range
            {
                $match: query,
            },
            // Lookup course details
            {
                $lookup: {
                    from: 'courses',
                    localField: 'courseId',
                    foreignField: '_id',
                    as: 'courseDetails',
                },
            },
            { $unwind: '$courseDetails' },
            // Lookup teacher details
            {
                $lookup: {
                    from: 'users',
                    localField: 'courseDetails.courseInstructor',
                    foreignField: '_id',
                    as: 'teacherDetails',
                },
            },
            {
                $unwind: {
                    path: '$teacherDetails',
                    preserveNullAndEmptyArrays: true
                }
            },
            // Group by teacher

            {
                $group: {
                    _id: {
                        teacherId: '$teacherDetails._id',
                        courseId: '$courseDetails._id',
                    },
                    teacherName: { $first: '$teacherDetails.firstName' },
                    teacherProfilePhoto: { $first: '$teacherDetails.profilePhoto' },
                    courseName: { $first: '$courseDetails.courseTitle' },
                    courseImage: { $first: '$courseDetails.courseImage' },
                    enrollments: { $sum: 1 },
                    totalSales: { $sum: '$amount' },
                },
            },
            // Group by teacher to aggregate course data
            {
                $group: {
                    _id: '$teacherId',
                    teacherName: { $first: '$teacherName' },
                    teacherProfilePhoto: { $first: '$teacherProfilePhoto' },
                    courses: {
                        $push: {
                            courseId: '$_id.courseId',
                            courseName: '$courseName',
                            courseImage: '$courseImage',
                            enrollments: '$enrollments',
                            totalSales: '$totalSales',
                            avgPrice: { $divide: ['$totalSales', '$enrollments'] },
                        },
                    },
                    totalEnrollments: { $sum: '$enrollments' },
                    totalSalesAmount: { $sum: '$totalSales' },
                },
            },
        ]);

        return res.status(200).json({ success: true, message: "Course Sales Found Sucessfully", data: salesData })
    } catch (error) {
        console.error('Error fetching sales data:', error);
        res.status(500).json({ success: false, message: "Something went wrong" })
    }
}

exports.getTutionsSalesData = async (req, res) => {

    const { startDate, endDate, page = 1, limit = 10 } = req.query;
    const query = { status: "scheduled" };
    if (startDate || endDate) {
        query.sessionDate = {};
        if (startDate)
            query.sessionDate.$gte = new Date(
                moment(startDate).format("YYYY-MM-DD[T00:00:00.000Z]")
            );
        if (endDate)
            query.sessionDate.$lte = new Date(
                moment(endDate).format("YYYY-MM-DD[T00:00:00.000Z]")
            );
    }
    try {

        const salesData = await Booking.aggregate([
            // Match orders within the specified date range
            {
                $match: query,
            },
            // Lookup course details
            {
                $lookup: {
                    from: 'coursesubcategories',
                    localField: 'subjectId',
                    foreignField: '_id',
                    as: 'subjectDetails',
                },
            },
            { $unwind: '$subjectDetails' },
            // Lookup teacher details
            {
                $lookup: {
                    from: 'users',
                    localField: 'teacherId',
                    foreignField: '_id',
                    as: 'teacherDetails',
                },
            },
            {
                $unwind: {
                    path: '$teacherDetails',
                    preserveNullAndEmptyArrays: true
                }
            },
            // // Group by teacher
            {
                $group: {
                    _id: {
                        teacherId: '$teacherDetails._id',
                        subjectId: '$subjectDetails._id',
                    },
                    teacherName: { $first: '$teacherDetails.firstName' },
                    teacherProfilePhoto: { $first: '$teacherDetails.profilePhoto' },
                    subjectName: { $first: '$subjectDetails.name' },
                    subjectImage: { $first: '$subjectDetails.subjectImage' },
                    sessions: { $sum: 1 },
                    totalSales: { $sum: '$amount' },
                },
            },
            // // Group by teacher to aggregate course data
            {
                $group: {
                    _id: '$teacherId',
                    teacherName: { $first: '$teacherName' },
                    teacherProfilePhoto: { $first: '$teacherProfilePhoto' },
                    subjects: {
                        $push: {
                            subjectId: '$_id.subjectId',
                            subjectName: '$subjectName',
                            subjectImage: '$subjectImage',
                            sessions: '$sessions',
                            totalSales: '$totalSales',
                            avgPrice: { $divide: ['$totalSales', '$enrollments'] },
                        },
                    },
                    totalSessions: { $sum: '$sessions' },
                    totalSalesAmount: { $sum: '$totalSales' },
                },
            },
            {
                $skip: parseInt(limit) * (page - 1)
            },
            {
                $limit: parseInt(limit)
            }
        ]);
        const totalRecords = await Booking.aggregate([
            // Match orders within the specified date range
            {
                $match: query,
            },
            // Lookup course details
            {
                $lookup: {
                    from: 'coursesubcategories',
                    localField: 'subjectId',
                    foreignField: '_id',
                    as: 'subjectDetails',
                },
            },
            { $unwind: '$subjectDetails' },
            // Lookup teacher details
            {
                $lookup: {
                    from: 'users',
                    localField: 'teacherId',
                    foreignField: '_id',
                    as: 'teacherDetails',
                },
            },
            {
                $unwind: {
                    path: '$teacherDetails',
                    preserveNullAndEmptyArrays: true
                }
            },
            // // Group by teacher
            {
                $group: {
                    _id: {
                        teacherId: '$teacherDetails._id',
                        subjectId: '$subjectDetails._id',
                    },
                    teacherName: { $first: '$teacherDetails.firstName' },
                    teacherProfilePhoto: { $first: '$teacherDetails.profilePhoto' },
                    subjectName: { $first: '$subjectDetails.name' },
                    subjectImage: { $first: '$subjectDetails.subjectImage' },
                    sessions: { $sum: 1 },
                    totalSales: { $sum: '$amount' },
                },
            },
            // // Group by teacher to aggregate course data
            {
                $group: {
                    _id: '$teacherId',
                    teacherName: { $first: '$teacherName' },
                    teacherProfilePhoto: { $first: '$teacherProfilePhoto' },
                    subjects: {
                        $push: {
                            subjectId: '$_id.subjectId',
                            subjectName: '$subjectName',
                            subjectImage: '$subjectImage',
                            sessions: '$sessions',
                            totalSales: '$totalSales',
                            avgPrice: { $divide: ['$totalSales', '$enrollments'] },
                        },
                    },
                    totalSessions: { $sum: '$sessions' },
                    totalSalesAmount: { $sum: '$totalSales' },
                },
            },
            {
                $count: 'total'
            },

        ]);
        return res.status(200).json({ success: true, message: "Tution Sales Found Sucessfully", data: salesData, currentPage: page, totalRecords: totalRecords[0]?.total || 0, totalPages: Math.ceil(totalRecords[0]?.total || 0 / parseInt(limit)) })
    } catch (error) {
        console.error('Error fetching sales data:', error);
        res.status(500).json({ success: false, message: "Something went wrong" })
    }
}
