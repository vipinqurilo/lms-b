const Contact = require("../models/contactModel");

exports.submitContactForm = async (req, res) => {
    try {
        console.debug('Received contact form submission:', req.body);

        const { name, number: phoneNumber, email, message } = req.body;

        if (!name || !phoneNumber || !email || !message) {
            console.debug('Validation failed: Missing required fields');
            return res.status(400).json({ status: 'fail', message: 'Please provide all required fields' });
        }

        // Validate email format
        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(email)) {
            console.debug('Validation failed: Invalid email format');
            return res.status(400).json({ status: 'fail', message: 'Please provide a valid email address' });
        }

        // Validate phone number (basic validation for numbers only)
        if (!/^\d+$/.test(phoneNumber)) {
            console.debug('Validation failed: Phone number contains non-digit characters');
            return res.status(400).json({ status: 'fail', message: 'Phone number should contain only digits' });
        }

        const contact = await Contact.create({
            name,
            phoneNumber,
            email,
            message
        });

        console.debug('Contact saved successfully:', contact);

        res.status(201).json({
            status: 'success',
            data: {
                contact
            }
        });
    } catch (err) {
        console.error('Error submitting contact form:', err);
        res.status(500).json({ status: 'error', message: 'Server error', error: err.message });
    }
};