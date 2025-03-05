const TicketModel = require("../model/ticketMOdel");

exports.addTicket = async (req, res) => {
  try {
    const data = req.body;
    const messages =
      typeof data.messages === "string"
        ? JSON.parse(data.messages)
        : data.messages;

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
    let { page, limit, status } = req.query;

    const query = { user: req.user.id };
    if (status) {
      query.status = status;
    }

    let tickets;
    let totalTickets = await TicketModel.countDocuments(query);

    if (!page || !limit) {
      tickets = await TicketModel.find(query)
        .populate("messages.sender")
        .populate("messages.receiver")
        .sort({ createdAt: -1 });
    } else {
      page = parseInt(page) || 1;
      limit = parseInt(limit) || 10;
      const skip = (page - 1) * limit;

      tickets = await TicketModel.find(query)
        .populate("messages.sender")
        .populate("messages.receiver")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    }

    return res.json({
      status: "success",
      message: "Tickets fetched successfully.",
      data: tickets,
      pagination:
        page && limit
          ? {
              currentPage: page,
              totalPages: Math.ceil(totalTickets / limit),
              totalTickets,
            }
          : null,
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

    let { page, limit, status } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page - 1) * limit;

    const query = { "messages.receiver": adminId };
    if (status) {
      query.status = status;
    }

    const tickets = await TicketModel.find(query)
      .populate("messages.sender")
      .populate("messages.receiver")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalTickets = await TicketModel.countDocuments(query);

    res.json({
      status: "success",
      message: "Tickets fetched successfully",
      data: tickets,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalTickets / limit),
        totalTickets,
      },
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

exports.adminTicketsUpdate = async (req, res) => {
  try {
    const adminId = req.user.id;
    const data = req.body;
    const mes = {
      sender: req.user.id,
      message: data.message,
      receiver: data.receiver || null,
    };

    let tickets = await TicketModel.find({ "messages.receiver": adminId });

    if (tickets.length > 0) {
      for (let ticket of tickets) {
        ticket.messages.push(mes);
        await ticket.save(); // Save each ticket separately
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
      message: req.body.message,
      receiver: req.body.receiver || null,
    };
    console.log(data, "data");
    let addData = await TicketModel.findOne({ _id: req.params.id });
    console.log(addData, data, "addData");
    addData.messages.push(data);
    await addData.save();
    if (addData) {
      res.json({
        status: "success",
        message: "add success",
      });
    }
  } catch (error) {
    console.log(error);
  }
};

exports.statusUpdate = async (req, res) => {
  try {
    const { status, id } = req.params;

    // Validate ID and status
    if (!id || !status) {
      return res
        .status(400)
        .json({ success: false, message: "ID and status are required." });
    }

    // Update ticket status
    const statusUpdate = await TicketModel.findOneAndUpdate(
      { _id: id },
      { status },
      { new: true }
    );

    if (!statusUpdate) {
      return res
        .status(404)
        .json({ success: false, message: "Ticket not found." });
    }

    res.status(200).json({
      success: true,
      message: "Status updated successfully.",
      data: statusUpdate,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
