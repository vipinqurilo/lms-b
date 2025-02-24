const express = require("express")
const { createOrderViaStripe, getOrders } = require("../controller/orderController")
const { authMiddleware } = require("../middleware/authMiddleware")

const OrderRoute = express.Router()


OrderRoute.post('/stripe',authMiddleware,createOrderViaStripe)
OrderRoute.get('/',authMiddleware,getOrders)
// OrderRoute.post("/create-payment-intent",authMiddleware,addOrderStripe)


module.exports = OrderRoute