const express = require("express")
const { createCourseOrder, getOrders } = require("../controller/orderController")
const { authMiddleware } = require("../middleware/authMiddleware")

const OrderRoute = express.Router()


OrderRoute.post('/',authMiddleware,createCourseOrder)
OrderRoute.get('/',authMiddleware,getOrders)
// OrderRoute.post("/create-payment-intent",authMiddleware,addOrderStripe)


module.exports = OrderRoute