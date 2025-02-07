const express = require('express');
const { addTicket } = require('../controller/ticketController');
const ticketRouter = express.Router();

ticketRouter.post('/',addTicket)
 

module.exports = ticketRouter;
