const TicketModel = require("../model/ticketMOdel");

exports.addTicket = async (req, res) => {
  try {
      const data = req.body;
      const messages = typeof data.messages === "string" ? JSON.parse(data.messages) : data.messages;

      const newTicket = new TicketModel({
          user: req.user.id,
          subject: data.subject,
          category: data.category,
          description: data.description,
          status: data.status || "open",
      });

      await newTicket.save();
      return res.status(201).json({
          message: "New ticket created successfully.",
          data: newTicket,
      });
  } catch (error) {
      console.error("Error adding ticket:", error);
      return res.status(500).json({
          message: "An error occurred while processing the ticket.",
          error: error.message,
      });
  }
};
exports.getTickets = async (req, res) => {
  try {
    const tickets = await TicketModel.find({ user: req.user.id })
    return res.json({
      status: "success",
      message: "Tickets fetched successfully.",
      data: tickets,
    });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return res.json({
      status: "failed",
      message: "Something went wrong.",
      error: error.message,
    });
  }
};

exports.filterByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    console.log(status);
    const tickets = await TicketModel.find({
      user: req.user.id,
      status: status,
    });
    return res.json({
      status: "success",
      message: "Tickets fetched successfully.",
      data: tickets,
    });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return res.json({
      status: "failed",
      message: "Something went wrong.",
      error: error.message,
    });
  }
};

exports.adminTicketsGet = async (req, res) => {
  try {
    const adminId = req.user.id;
    const tickets = await TicketModel.find({ "messages.resiver": adminId });
    res.json({
        status:"success",
        data:tickets
    })
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return res.json({
      status: "failed",
      message: "Something went wrong.",
      error: error.message,
    });
  }
};

exports.adminTicketsUpdate = async (req, res) => {
    try {
      const adminId = req.user.id;
      const data = req.body;
      const mes = {
        sender: req.user.id,
        message: data.message,
        resiver: data.resiver || null,
      };
  
      let tickets = await TicketModel.find({ "messages.resiver": adminId });
  
      if (tickets.length > 0) {
        for (let ticket of tickets) {
          ticket.messages.push(mes);
          await ticket.save();  // Save each ticket separately
        }
  
        return res.json({
          status: "success",
          message: "Tickets updated successfully.",
          data: tickets,
        });
      } else {
        return res.json({
          status: "failed",
          message: "No matching tickets found.",
        });
      }
    } catch (error) {
      console.error("Error updating tickets:", error);
      return res.json({
        status: "failed",
        message: "Something went wrong.",
        error: error.message,
      });
    }
  };
  
exports.addTicketMessage = async (req, res) => {

  try {
    const data = {
        sender: req.user.id,
        message: msg.message,
        resiver: msg.resiver || null,
    }
    let addData = await TicketModel.find({_id:req.params.id})
    addData.messages.push(data)

    if(addData){
      res.json({
        status:"success",
        message:"add success"
      })
    }
  } catch (error) {
    
  }

};