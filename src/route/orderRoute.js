const express = require("express")
const { addOrder, getOrder } = require("../controller/orderController")
const { authMiddleware } = require("../middleware/authMiddleware")

const OrderRoute = express.Router()


OrderRoute.post('/',authMiddleware,addOrder)
OrderRoute.get('/',authMiddleware,getOrder)

module.exports = OrderRoute