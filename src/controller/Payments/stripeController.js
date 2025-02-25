const CourseModel = require("../../model/CourseModel");
const OrderModel = require("../../model/orderModel");
const paymentModel = require("../../model/paymentModel");
const stripeModel = require("../../model/stripeModel");
const StudentProfileModel = require("../../model/studentProfileModel");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// Create course payment 
exports.createCoursePayment = async (req, res) => {
  try {
    const userId=req.user.id;
    const {courseId, amount} = req.body;
    console.log(courseId,amount);
    const studentProfile = await StudentProfileModel.findOne({userId});
    const courseAlreadyPurchased=studentProfile.enrolledCourses.find((ele)=>ele._id==courseId.toString())
    if(courseAlreadyPurchased)
      return res.json({success:true,message:"Course already purchased"})
    const course=await CourseModel.findById(courseId)
    // Step 1: Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card",],
        mode: "payment",
        success_url: `${process.env.FRONTEND_URL}/courses/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/courses/payment-failed`,
        customer_email: req.user.email, // Optional: Prefill email if user is logged in
        metadata: { amount,courseId,userId  }, // Store booking data
        line_items: [
            {
                price_data: {
                    currency: "ZAR",
                    product_data: { name: course. courseTitle },
                    unit_amount: Math.round(amount * 100) // Stripe expects amount in cents
                },
                quantity: 1
            }
        ]
    });
    // console.log(session,"session")
    // Step 2: Save the Payment Record (Pending Status)
    const payment = new paymentModel({
       
        userId,
        amount,
        paymentFor:'course',
        paymentMethod: "stripe",
        sessionId: session.id,
        status: "pending"
    });
    await payment.save();

    // Step 3: Send the session ID to the frontend
    res.json({ success: true, sessionId: session.id ,url:session.url});
} catch (error) {
    console.error("Stripe Payment Error:", error);
    res.status(500).json({success:false, message: "Payment initiation failed" });
}
};
//Create Booking Payment
exports.createBookingPayment = async (req, res) => {
  try {

    const {sessionTitle, teacherId, studentId, subjectId, amount, sessionDate, sessionStartTime,sessionEndTime,sessionDuration } = req.body;
    console.log(teacherId, studentId, subjectId, amount, sessionDate, sessionStartTime,sessionEndTime,sessionDuration)
    // Step 1: Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card",],
        mode: "payment",
        success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/payment-failed`,
        customer_email: req.user.email, // Optional: Prefill email if user is logged in
        metadata: { sessionTitle,teacherId, studentId,subjectId, sessionDate,sessionStartTime,sessionEndTime,sessionDuration  }, // Store booking data
        line_items: [
            {
                price_data: {
                    currency: "ZAR",
                    product_data: { name: sessionTitle },
                    unit_amount: Math.round(amount * 100) // Stripe expects amount in cents
                },
                quantity: 1
            }
        ]
    });
    // console.log(session,"session")
    // Step 2: Save the Payment Record (Pending Status)
    const payment = new paymentModel({
       
        userId: studentId,
        paymentFor:"booking",
        amount,
        paymentMethod: "stripe",
        sessionId: session.id,
        status: "pending"
    });
    await payment.save();

    // Step 3: Send the session ID to the frontend
    res.json({ success: true, sessionId: session.id ,url:session.url});
} catch (error) {
    console.error("Stripe Payment Error:", error);
    res.status(500).json({ message: "Payment initiation failed" });
}
};

/*************  ✨ Codeium Command ⭐  *************/
/**
 * Verifies Stripe payment events received from the webhook.
 * 
 * This function handles various types of Stripe events including:
 * - `checkout.session.completed`: Logs the completion of the checkout session 
 *   and updates the payment record with the transaction ID.
 * - `checkout.session.expired` and `checkout.session.async_payment_failed`: 
 *   Updates the payment status to "expired" if the session is pending.
 * - `payment_intent.succeeded`: Marks the payment status as "succeeded" in the 
 *   database.
 * - `payment_intent.payment_failed`: Marks the payment status as "failed" in 
 *   the database and logs the payment intent ID.
 * - `payment_intent.canceled`: Marks the payment status as "cancelled" in the 
 *   database and logs the payment intent ID.
 * 
 * @param {Object} req - The request object containing the event data.
 * @param {Object} res - The response object to send the success message.
 */

/******  52ffaf57-a15b-4cd9-835d-7e58e473f726  *******/
  exports.verifyStripePayment=async (req, res) => {
    try{
        const event = req.body;
        console.log(event.type, "event");
        //Checkout Completed
        if (event.type === "checkout.session.completed") {
          const session = event.data.object;
  
          console.log("Checkout Session Completed:", session.id);
          
          // Update the database with paymentIntentId
          await paymentModel.findOneAndUpdate(
              { sessionId: session.id }, 
              { transactionId: session.payment_intent } // Now update the payment intent
          );
        }
      //Payment Failed or Expired
      if (
        event.type === "checkout.session.expired" || 
        event.type === "checkout.session.async_payment_failed"
      ) {

        const session = event.data.object;
        console.log(session,"session")
        const payment = await paymentModel.findOne(
            { sessionId:session.id},
        );
        if(payment&&payment.status=="pending"){
            await paymentModel.findOneAndUpdate({ sessionId: session.id }, { status: "expired" });
            console.log("Payment failed, updated:", payment);
       }
    }
        //Payment Success
        if (event.type === "payment_intent.succeeded") {
          const paymentIntent = event.data.object;
          console.log(paymentIntent,"payment session")
          await paymentModel.findOneAndUpdate({ transactionId: paymentIntent.id }, { paymentStatus: "succeeded" });
          console.log("Payment Successful for session:", paymentIntent.id);
        }

        //Payment Failed
        if (event.type === "payment_intent.payment_failed") {
          const paymentIntent = event.data.object;
          const sessions = await stripe.checkout.sessions.list({
            payment_intent: paymentIntent.id,
            limit: 1, // Get the most recent session
        });
          await paymentModel.findOneAndUpdate({ sessionId: sessions.data[0].id }, {status: "failed",transactionId:paymentIntent.id });
          console.log("Payment Failed for session:", paymentIntent.id);
        }
        if(event.type==="payment_intent.canceled"){
          const paymentIntent = event.data.object;
          const sessions = await stripe.checkout.sessions.list({
            payment_intent: paymentIntent.id,
            limit: 1, // Get the most recent session
        });
          await paymentModel.findOneAndUpdate({ sessionId: sessions.data[0].id }, {status: "cancelled",transactionId:paymentIntent.id });
          console.log("Payment Cancelled for session:", paymentIntent.id);
      }
        res.status(200).send({success:true,message:"Payment verified successfully"});
    }
    catch(e){
      console.log(e);
      res.json({success:"false",mesage:"Something went wrong"})
    }
      }
      
exports.orderGet =  async (req, res) => {
    try {
      const order = await Order.findOne({ sessionId: req.params.sessionId });
      if (!order) return res.status(404).json({ error: "Order not found" });
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }