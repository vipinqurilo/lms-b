const express = require('express');
const { addTicket, getTickets, adminTicketsGet, adminTicketsUpdate, filterByStatus, addTicketMessage, statusUpdate } = require('../controller/ticketController');
const { authMiddleware } = require('../middleware/authMiddleware');
const ticketRouter = express.Router();

ticketRouter.post('/',authMiddleware,addTicket)
ticketRouter.get('/',authMiddleware,getTickets)
ticketRouter.get('/filter/:status',authMiddleware,filterByStatus)
ticketRouter.post('/addMessage/:id',authMiddleware,addTicketMessage)
 
// admin 

ticketRouter.get('/admin/get',authMiddleware,adminTicketsGet)
ticketRouter.post('/admin',authMiddleware,adminTicketsUpdate)
ticketRouter.post('/admin',authMiddleware,statusUpdate)
module.exports = ticketRouter;
