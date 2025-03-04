const { default: mongoose } = require("mongoose");
const bookingModel = require("../model/bookingModel");
const OrderModel = require("../model/orderModel");
const moment = require("moment");

exports.getCourseEarnings = async (req,res) => {
    try{
        const {startDate,endDate}=req.query;
        const teacherId = req.user.id;
        console.log(startDate,endDate,teacherId,"earnings")
        const query={
            'courseDetails.courseInstructor': new mongoose.Types.ObjectId(teacherId)
        }
         // Date range filtering
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
        // Aggregation pipeline for course purchases
        const courseEarnings = await OrderModel.aggregate([
        {
            // Lookup to join orders with courses
            $lookup: {
            from: "courses",
            localField: 'courseId',
            foreignField: '_id',
            as: 'courseDetails'
            }
        },
        {
            // Unwind the courseDetails array
            $unwind: '$courseDetails'
        },
        {
            // Match orders where the course's teacherId matches the specified teacherId
            $match: query
        },
        {
        // Group by courseId and course name
        $group: {
          _id: {
            courseId: '$courseId',
            courseTitle: '$courseDetails.courseTitle',
            courseImage:'$courseDetails.courseImage'
          },
          enrollments: { $sum: 1 }, 
          totalAmount: { $sum: '$amount' }
        }
      },
      {
        // Calculate commission and earnings
        $project: {
          courseId: '$_id.courseId',
          courseName: '$_id.courseTitle',
          courseImage:'$_id.courseImage',
          enrollments: 1,
          totalAmount: 1,
          commission: { $multiply: ['$totalAmount', 0.40] }, // 40% commission
          earnings: { $multiply: ['$totalAmount', 0.60] }    // 60% earnings
        }
      }
    ]);
    
    console.log(courseEarnings);
    return res.json({success:true,message:courseEarnings.length>0?"Course Purchases Found Succesfully":"No Course Purhcase Found",data:courseEarnings});
    }
    catch(error){
    console.log(error,"error")
    res.json({success:"false",message:"Internal Server Error"});
    }
  };

  exports.getTutoringEarnings = async (req,res) => {
    try{
    const teacherId=req.user.id;
    const {startDate,endDate}=req.query;
    const query={
        status:"scheduled",
        teacherId:new mongoose.Types.ObjectId(teacherId)
    }
      // Date range filtering
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
    console.log(startDate,endDate,teacherId)
    const bookings = await bookingModel.aggregate([
        {
          $match: query
        },
        {
          $lookup: {
            from: "coursesubcategories",
            localField: "subjectId",
            foreignField: "_id",
            as: "subjectDetails"
          }
        },
        {
          $unwind:  {
            path: "$subjectDetails",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $group: {
            _id: {
              subjectId: "$subjectId",
              subjectName: "$subjectDetails.name",
              subjectPricePerHour: "$subjectDetails.pricePerHour"
            },
            sessions: { $sum: 1 },
            totalAmount: { $sum: "$amount" }
          }
        },
        {
          $project: {
            _id: 0,
            subjectId: "$_id.subjectId",
            subjectName: "$_id.subjectName",
            subjectPricePerHour: "$_id.subjectPricePerHour",
            sessions: 1,
            totalAmount: 1,
            commission: { $multiply: ['$totalAmount', 0.40] }, // 40% commission
            earnings: { $multiply: ['$totalAmount', 0.60] }    // 60% earnings
          }
        }
      ]);
      
    console.log(bookings,'booking')
    return res.json({success:true,message:bookings.length>0?"Tutoring Sessions Found Succesfully":"No Data found",data:bookings});
    }
    catch(error){
    console.log(error);
    res.status(500).json({success:"false",message:"Internal Server Error"});
    }
  };
  
  
 
  