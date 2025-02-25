const { default: mongoose } = require("mongoose");
const CourseModel = require("../model/CourseModel");
const EarningModel = require("../model/earningModel");
const OrderModel = require("../model/orderModel");
const paymentModel = require("../model/paymentModel");
const StudentProfileModel = require("../model/studentProfileModel");

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
exports.createOrderViaStripe = async (req, res) => {
  try {
    const { sessionId } = req.body;

        // Step 1: Retrieve Payment Details from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (!session || session.payment_status != "paid") {
            return res.status(400).json({ message: "Payment not verified" });
        }
        //console.log(session,"session");
        
        //Update Payment Details
        const payment=await paymentModel.findOneAndUpdate(
          {sessionId:session.id},
          {transactionId:session.payment_intent,status:"succeeded",paymentStatus:"paid"}
        )
    //Find the Course 
   

    
    const { userId,courseId, amount } = session.metadata;
    const course=await CourseModel.findById(courseId);
    const existingOrder = await OrderModel.findOne({ userId,courseId });
    //check for existing order
    console.log(existingOrder,"existing ")
    if (existingOrder)
      return res.json({ success: true, message: "Course Already Purchased",data:{
        course,
        orderId:existingOrder?.orderId,
        amount:existingOrder.amount,
        orderDate:existingOrder?.createdAt,
        transactionId:payment.transactionId
      } });
      
      const objData = {
        orderId: generateRandomCode(),
        userId,
        courseId,
        amount,
        paymentId:payment._id,
      };
    
      const newOrder=await OrderModel.create(objData);
      const studentProfile = await StudentProfileModel.findOneAndUpdate(
        { userId },
        { 
          $push: { 
            enrolledCourses: {
              courseId: new mongoose.Types.ObjectId(courseId),
              progress: 0
            } 
          }
        },
        { new: true }
      );
        res.json({
          success: "true",
          message: "Course Bought Successfully",
          data:{
            course,
            orderId:newOrder?.orderId,
            amount:newOrder.amount,
            orderDate:newOrder?.createdAt,
            transactionId:payment.transactionId
          }
        });
      
    
  } catch (error) {
    console.log(error);
    res.json({
      success: "false",
      message: "Internal Server error",
      error:error.message
    });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const myOrders = await OrderModel.find({ userId}).populate(
      "courseId"
    ).sort({"createdAt":-1})
    res.json({
      success: true,
      message:"Orders Fetch Successfully",
      data: myOrders,
    });
  } catch (error) {
    res.json({
      success:false,
      message:"Internal Server Error",
      error: error.message,
    });
  }
};
