const StudentProfileModel = require("../model/studentProfileModel");

exports.getStudents = async (req, res) => {
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
            query.sessionDate = {};
            if (startDate) query.sessionDate.$gte = new Date(moment( startDate ).format('YYYY-MM-DD[T00:00:00.000Z]'))
            if (endDate) query.sessionDate.$lte = new Date(moment( endDate ).format('YYYY-MM-DD[T00:00:00.000Z]'))
        }
        const students = await StudentProfileModel.aggregate([
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
                }
            }
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
                $count: "totalStudents"
            }
        ]
        const totalResult=await StudentProfileModel.aggregate(countQuery);
        const totalStudents=totalResult.length>0?totalResult[0].totalStudents:0;
        res.json({
            success: true,
            data: students,
            
            total: totalStudents,
            currentPage: page,
            totalPages: Math.ceil(totalStudents / parseInt(limit)),
            message: "Students retrieved successfully",
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve students", details: error.message });
    }
};  