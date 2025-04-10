const { default: mongoose } = require("mongoose");
const CourseModel = require("../model/CourseModel");
const EarningModel = require("../model/earningModel");
const OrderModel = require("../model/orderModel");
const paymentModel = require("../model/paymentModel");
const StudentProfileModel = require("../model/studentProfileModel");
const moment = require("moment");

const stripe = require("stripe")(
  "sk_test_51QsH7dPMQ11XQz7t9MpL7LScJgFX7wCAzCScqZXrYlMZUN6hrKPuxZmEFLYg8si74hSQM9i4DrdCKnk4HEHLEpbF00LCULZN5a"
);

function generateRandomCode() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

exports.createCourseOrder = async (req, res) => {
  try {
    const { sessionId, mode } = req.body;

    if (mode === "payfast") {
      const payment = await paymentModel.findOne({ sessionId });
      if (!payment) {
        return res
          .status(400)
          .json({ success: false, message: "Payment not found" });
      }

      if (payment.paymentStatus !== "paid") {
        console.error("Payment not in succeeded state:", payment.paymentStatus);
        return res.status(400).json({ 
          success: false,
          message: "Payment not verified" 
        });
      }
      const course = await CourseModel.findById(payment?.metadata?.courseId);

      if (!course) {
        return res
          .status(400)
          .json({ success: false, message: "Course not found" });
      }

      if (payment.paymentStatus !== "paid") {
        console.error("Payment not in succeeded state:", payment.paymentStatus);
        return res.status(400).json({
          success: false,
          message: "Payment not verified",
        });
      }

      const studentProfile = await StudentProfileModel.findOne({
        userId: payment?.userId,
      });

      if (!studentProfile) {
        return res.status(404).json({
          status: "failed",
          message: "student profile not found",
        });
      }

      const alreadyEnrolled = studentProfile.enrolledCourses.some(
        (enrolled) => enrolled.courseId.toString() === course._id.toString()
      );

      if (alreadyEnrolled) {
        return res.status(400).json({
          status: "failed",
          message: "Course already enrolled",
          data: {
            course,
            orderId: payment?.orderId,
            amount: payment?.amount,
            orderDate: payment?.createdAt,
            transactionId: payment?.transactionId,
          },
        });
      }

      const objData = {
        orderId: generateRandomCode(),
        userId:req.user.id,
        courseId: course._id,
        amount:payment?.amount,
        paymentId: payment._id,
      };

      const newOrder = await OrderModel.create(objData);
    
      await StudentProfileModel.findOneAndUpdate(
        { userId: payment?.userId },
        { $push: { enrolledCourses: { courseId: course?._id, progress: 0 } } }
      );

      return res.status(200).json({
        success: true,
        message: "Course Bought Successfully",
        data: {
          course,
          orderId: payment?.orderId,
          amount: payment?.amount,
          orderDate: payment?.createdAt,
          transactionId: payment?.transactionId,
          order:newOrder
        },
      });
    } else {
      // Step 1: Retrieve Payment Details from Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (!session || session.payment_status != "paid") {
        return res.status(400).json({ message: "Payment not verified" });
      }
      //console.log(session,"session");

      //Update Payment Details
      const payment = await paymentModel.findOneAndUpdate(
        { sessionId: session.id },
        {
          transactionId: session.payment_intent,
          status: "succeeded",
          paymentStatus: "paid",
        }
      );

      //Find the Course
      const { userId, courseId, amount } = session.metadata;
      const course = await CourseModel.findById(courseId);
      const existingOrder = await OrderModel.findOne({ userId, courseId });
      //check for existing order
      console.log(existingOrder, "existing ");
      if (existingOrder)
        return res.json({
          success: true,
          message: "Course Already Purchased",
          data: {
            course,
            orderId: existingOrder?.orderId,
            amount: existingOrder.amount,
            orderDate: existingOrder?.createdAt,
            transactionId: payment.transactionId,
          },
        });

      const objData = {
        orderId: generateRandomCode(),
        userId,
        courseId,
        amount,
        paymentId: payment._id,
      };

      const newOrder = await OrderModel.create(objData);
      const studentProfile = await StudentProfileModel.findOneAndUpdate(
        { userId },
        {
          $push: {
            enrolledCourses: {
              courseId: new mongoose.Types.ObjectId(courseId),
              progress: 0,
            },
          },
        },
        { new: true }
      );
      res.json({
        success: "true",
        message: "Course Bought Successfully",
        data: {
          course,
          orderId: newOrder?.orderId,
          amount: newOrder.amount,
          orderDate: newOrder?.createdAt,
          transactionId: payment.transactionId,
        },
      });
    }
  } catch (error) {
    console.log(error);
    res.json({
      success: "false",
      message: "Internal Server error",
      error: error.message,
    });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const userRole = req.user.role;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const skip = (page - 1) * limit;

    let query = {};

    if (userRole !== "admin") {
      query.userId = req.user.id;
    }

    if (search) {
      const orders = await OrderModel.aggregate([
        {
          $lookup: {
            from: "courses",
            localField: "courseId",
            foreignField: "_id",
            as: "course",
          },
        },
        {
          $match: {
            ...(userRole !== "admin"
              ? { userId: new mongoose.Types.ObjectId(req.user.id) }
              : {}),
            "course.courseTitle": { $regex: search, $options: "i" },
          },
        },
      ]);

      const orderIds = orders.map((order) => order._id);
      query._id = { $in: orderIds };
    }

    // Get total count for pagination
    const totalOrders = await OrderModel.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limit);

    // Fetch orders with pagination
    const orders = await OrderModel.find(query)
      .populate("courseId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      message: "Orders fetched successfully",
      data: {
        orders,
        currentPage: page,
        totalPages,
        totalOrders,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};