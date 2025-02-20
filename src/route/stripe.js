const express = require("express")
const { addOrderStripe, verifyStripePayment } = require("../controller/Payments/stripeController")
const bodyParser = require("body-parser")
 

const stripeRoute = express.Router()

// stripeRoute.post("/create-payment-intent",addOrderStripe)
// stripeRoute.post("/verify",bodyParser.raw({ type: "application/json" }),verifyStripePayment)
// stripeRoute.put("/create-payment-intent/:sessionId",addOrderStripe)


module.exports = stripeRoute