const { client } = require('../../config/paypalConfig');
const paypal = require('@paypal/checkout-server-sdk');
const paymentModel = require('../../model/paymentModel'); // Assuming you have a payment model
// const EarningModel = require('../models/earningModel');

exports.createBookingPayment = async (req, res) => {
    try {
        const {
            sessionTitle, teacherId, studentId, subjectId, amount,
            sessionDate, sessionStartTime, sessionEndTime, sessionDuration
        } = req.body;

        console.log(teacherId, studentId, subjectId, amount, sessionDate, sessionStartTime, sessionEndTime, sessionDuration);

        // Step 1: Create PayPal Order
        const request = new paypal.orders.OrdersCreateRequest();
        request.requestBody({
            intent: 'CAPTURE',
            purchase_units: [
                {
                    amount: {
                        currency_code: "ZAR",
                        value: amount.toFixed(2), // PayPal requires amount as a string in decimal format
                    },
                    description: sessionTitle,
                    
                }
            ],
            application_context: {
                return_url: `${process.env.FRONTEND_URL}/booking/payment-success`,
                cancel_url: `${process.env.FRONTEND_URL}/booking/payment-failed`
            }
        });

        const response = await client.execute(request);
        const orderId = response.result.id;

        // Step 2: Save the Payment Record (Pending Status)
        const payment = new paymentModel({
            userId: studentId,
            paymentFor: "booking",
            amount,
            paymentMethod: "paypal",
            sessionId: orderId,
            status: "pending"
        });
        await payment.save();

        // await EarningModel.create({
        //     course: subjectId,
        //     teacher: teacherId,
        //     student: studentId,
        //     amount,
        //     date: Date.now(),
        //     type: 'tutor'
        // });

        res.json({ success: true,message:"Order Created Succesfully",data:{ orderId, url: response.result.links.find(link => link.rel === "approve").href} });

    } catch (error) {
        console.error("PayPal Payment Error:", error);
        res.status(500).json({ message: "Payment initiation failed" });
    }
};

//Caputre Paypal Payment

exports.captureBookingPayment = async (req, res) => {
    try {
        const { orderId } = req.body; // Get order ID from frontend

        const request = new paypal.orders.OrdersCaptureRequest(orderId);
        request.requestBody({});

        const response = await client.execute(request);
        const status = response.result.status;

        if (status === "COMPLETED") {
            await paymentModel.findOneAndUpdate(
                { sessionId: orderId },
                { status: "completed" }
            );

            return res.json({ success: true, message: "Payment successful", details: response.result });
        }

        res.status(400).json({ success: false, message: "Payment not completed" });

    } catch (error) {
        console.error("PayPal Capture Error:", error);
        res.status(500).json({ message: "Payment capture failed" });
    }
};

