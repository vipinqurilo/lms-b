const express = require("express")
const { addOrder, getOrder } = require("../controller/orderController")
const { authMiddleware } = require("../middleware/authMiddleware")
const { addOrderStripe } = require("../controller/Payments/stripeController")

const OrderRoute = express.Router()


// OrderRoute.post('/',authMiddleware,addOrder)
// OrderRoute.get('/',authMiddleware,getOrder)
// OrderRoute.post("/create-payment-intent",authMiddleware,addOrderStripe)


module.exports = OrderRoute