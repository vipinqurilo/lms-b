const CourseModel = require("../model/CourseModel");
const OrderModel = require("../model/orderModel");
const stripeModel = require("../model/stripeModel");

const stripe = require("stripe")("sk_test_51QsH7dPMQ11XQz7t9MpL7LScJgFX7wCAzCScqZXrYlMZUN6hrKPuxZmEFLYg8si74hSQM9i4DrdCKnk4HEHLEpbF00LCULZN5a");


 
exports.addOrderStripe = async (req, res) => {
  try {
    // Ensure `req.user` exists
    if (!req.user || !req.user.id) {
      return res.status(401).json({ status: "fail", message: "Unauthorized access" });
    }

    const { course, amountTotal } = req.body;
    const studentId = req.user.id;

    // Check if order already exists
    const existingOrder = await OrderModel.find({ studentId, course });
    if (existingOrder.length > 0) {
      return res.status(400).json({ status: "fail", message: "Order already purchased" });
    }

    // Generate random order ID
    function generateRandomCode() {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      return Array.from({ length: 6 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("");
    }

    const orderId = generateRandomCode();

    // Fetch course details
    const courseData = await CourseModel.findOne({ _id: course });
    if (!courseData) {
      return res.status(404).json({ status: "fail", message: "Course not found" });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: courseData.courseTitle,
            },
            unit_amount: amountTotal * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: "http://localhost:3000/success",
      cancel_url: "http://localhost:3000/cancel",
    });

    // Create order object
    const orderData = {
      orderId,
      studentId,
      course,
      sessionId: session.id,
      amountTotal: session.amount_total / 100, // Convert back to original amount
      currency: session.currency,
      paymentStatus: "pending", // Set to pending initially
    };

    // Store order in DB
    const createdOrder = await OrderModel.create(orderData);

    if (createdOrder) {
      return res.json({
        status: "success",
        message: "Order created successfully",
        checkoutUrl: session.url,
      });
    } else {
      return res.status(500).json({ status: "fail", message: "Failed to create order" });
    }
  } catch (error) {
    console.error("Stripe Order Error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};


//   app.post("/webhook", bodyParser.raw({ type: "application/json" }), async (req, res) => {
//     const event = req.body;
    
//     if (event.type === "checkout.session.completed") {
//       const session = event.data.object;
//       await Order.findOneAndUpdate({ sessionId: session.id }, { paymentStatus: "paid" });
//       console.log("Payment Successful for session:", session.id);
//     }
//     res.status(200).send();
//   });
  
  // 3. Get Order Status
  exports.verifyStripePayment=async (req, res) => {
        const event = req.body;
        //Checkout Completed
        if (event.type === "checkout.session.completed") {
          const session = event.data.object;
  
          console.log("Checkout Session Completed:", session.id);
  
          // Update the database with paymentIntentId
          await stripeModel.findOneAndUpdate(
              { sessionId: session.id }, 
              { paymentIntentId: session.payment_intent } // Now update the payment intent
          );
      }
        if (event.type === "payment_intent.succeeded") {
          const paymentIntent = event.data.object;
          console.log(paymentIntent,"paymetn session")
          await stripeModel.findOneAndUpdate({ paymentIntentId: paymentIntent.id }, { paymentStatus: "paid" });
          console.log("Payment Successful for session:", paymentIntent.id);
        }
        res.status(200).send();
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