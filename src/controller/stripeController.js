const stripeModel = require("../model/stripeModel");

const stripe = require("stripe")("sk_test_51QsH7dPMQ11XQz7t9MpL7LScJgFX7wCAzCScqZXrYlMZUN6hrKPuxZmEFLYg8si74hSQM9i4DrdCKnk4HEHLEpbF00LCULZN5a");


exports.addOrderStripe = async (req, res) => {
    try {
        console.log("requist")
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Product Name",
              },
              unit_amount: 1000, // $10 in cents
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: "http://localhost:3000/success",
        cancel_url: "http://localhost:3000/cancel",
      });
        
      
     
        if(session?.id){
            // console.log(session , "session session")
          const objData = {
            sessionId:session?.id,
            amountTotal:session?.amount_total,
            currency:session?.currency,
            paymentStatus:session?.payment_status
          }
          const dataStore = await stripeModel.create(objData)
      }
      res.json({ url: session.url });
    } catch (error) {
        console.log(error,"error")
      res.status(500).json({ error: error.message });
    }
  }



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