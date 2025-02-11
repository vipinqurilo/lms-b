const TicketModel = require("../model/ticketMOdel");

exports.addTicket = async (req, res) => {
    try {
        const data = req.body;

        const objData = {
            user: req.user.id,
            subject: data.subject,
            description: data.description,
            status: data.status || "open",
            messages: JSON.parse(data.messages).map(msg => ({
                sender: req.user.id,               
                message: msg.message,            
                resiver: msg.resiver || null      
            }))
        };

        let existingTicket = await TicketModel.findOne({ user: objData.user, subject: objData.subject });

        if (existingTicket) {
            existingTicket.messages.push(...objData.messages);
            await existingTicket.save();
            return res.status(200).json({ message: "Message added to existing ticket.", ticket: existingTicket });
        } else {
            const newTicket = new TicketModel(objData);
            await newTicket.save();
            return res.status(201).json({ message: "New ticket created successfully.", ticket: newTicket });
        }
    } catch (error) {
        console.error("Error adding ticket:", error);
        return res.status(500).json({ message: "An error occurred while processing the ticket.", error: error.message });
    }
};

