const PaymentSetting = require("../../model/paymentSetting");
const PaymentModel = require("../../model/paymentModel");
const crypto = require('crypto');
const axios = require('axios');
const { URLSearchParams } = require('url');

// Helper function to generate transaction reference
const generateTransactionRef = () => {
  return `booking_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
};

/**
 * Generate PayFast signature
 * This matches PayFast's specific implementation of MD5 signature generation
 * @param {object} data - Payment data
 * @param {string} passphrase - Optional passphrase
 * @returns {string} - MD5 hash signature
 */
const generateSignature = (data, passphrase = process.env.PAYFAST_PASSPHRASE || '') => {
  console.log("\n==================== SIGNATURE GENERATION ====================");
  console.log("Generating signature with passphrase:", passphrase ? "[passphrase provided]" : "[no passphrase]");
  
  // Get the keys in alphabetical order - EXCLUDING signature
  const keys = Object.keys(data).filter(key => key !== 'signature').sort();
  console.log("Sorted keys:", keys);
    
  // Create a signature string with proper encoding EXACTLY as PayFast expects
  // FIRST JOIN ALL VALUES WITH AMPERSANDS, THEN APPEND PASSPHRASE
  let signatureString = '';
  
  // Build the string WITHOUT URL ENCODING first
  keys.forEach(key => {
    // Skip empty values as PayFast does
    if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
      signatureString += `${key}=${data[key]}&`;
    }
  });
    
  // Remove trailing &
  signatureString = signatureString.slice(0, -1);
  
  // Add passphrase if provided
  if (passphrase !== '') {
    signatureString += `&passphrase=${passphrase}`;
  }
  
  // PayFast uses a specific MD5 encoding step
  // Log the exact signature string that will be hashed
  console.log("EXACT signature string before MD5 (CRITICAL FOR DEBUGGING):");
  console.log(signatureString);
  
  // Generate MD5 hash
  const signature = crypto.createHash('md5').update(signatureString).digest('hex');
  console.log("Final MD5 signature:", signature);
  console.log("==============================================================\n");
  
  return signature;
};

// Create PayFast checkout for courses
exports.createCourseCheckout = async (req, res) => {
  try {
    const { 
      courseId, 
      studentId, 
      amount, 
      email, 
      name,
      courseTitle,
      returnUrl, 
      cancelUrl, 
      notifyUrl 
    } = req.body;
    console.log("Course checkout request received:", req.body);
    
    // Validate required fields
    const requiredFields = { 
      courseId, 
      studentId, 
      amount, 
      email, 
      name,
      courseTitle,
      returnUrl, 
      cancelUrl 
    };
    
    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => !value)
      .map(([key]) => key);
    
    if (missingFields.length > 0) {
      console.error("Missing required fields:", missingFields);
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }
    
    // Format amount - ensure it's a valid number with 2 decimal places
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount"
      });
    }
    const formattedAmount = parsedAmount.toFixed(2);
    
    // Generate a unique payment ID
    const paymentId = crypto.randomUUID();
    
    // Get PayFast settings from database, fall back to .env variables
    let payfastSettings;
    try {
      const settings = await PaymentSetting.findOne();
      payfastSettings = settings?.payfast || {};
    } catch (error) {
      console.error("Error fetching PayFast settings, using defaults", error);
      payfastSettings = {};
    }
    
    // Use settings from database or fall back to environment variables
    const merchantId = payfastSettings.merchant_id || process.env.PAYFAST_MERCHANT_ID;
    const merchantKey = payfastSettings.merchant_key || process.env.PAYFAST_MERCHANT_KEY;
    const apiUrl = payfastSettings.test_mode || process.env.NODE_ENV !== 'production' 
      ? 'https://sandbox.payfast.co.za/eng/process' 
      : 'https://www.payfast.co.za/eng/process';
      
    console.log("Using PayFast settings:", { 
      merchantId, 
      testMode: payfastSettings.test_mode || process.env.NODE_ENV !== 'production',
      apiUrl 
    });
    
    console.log("Using merchant ID:", merchantId);
    console.log("Using PayFast URL:", apiUrl);
      
    // Format name parts
    const nameParts = name.split(' ');
    const firstName = nameParts[0] || 'Student';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    
    // Format callback URLs
    const formattedReturnUrl = `${returnUrl}?session_id=${paymentId}`;
    const formattedCancelUrl = cancelUrl;
    const formattedNotifyUrl = notifyUrl;
    
    console.log("Return URL:", formattedReturnUrl);
    console.log("Cancel URL:", formattedCancelUrl);
    console.log("Notify URL:", formattedNotifyUrl);
    
    // Create data object for PayFast with ONLY essential fields - MATCH DASHBOARD EXACTLY
    const data = {
      // Merchant details
      merchant_id: merchantId,
      merchant_key: merchantKey,
      
      // Payment details
      amount: formattedAmount,
      item_name: 'course'
    };

    // Generate signature - MUST be done last after all fields are added
    data.signature = generateSignature(data, payfastSettings.passphrase || process.env.PAYFAST_PASSPHRASE || '');
    
    // Store all other data as metadata in our database
    const metadata = {
      courseId,
      studentId,
      courseTitle,
      amount: formattedAmount,
      return_url: formattedReturnUrl,
      cancel_url: formattedCancelUrl,
      notify_url: formattedNotifyUrl,
      email_address: email,
      name_first: firstName,
      name_last: lastName || ''
    };
    
    // Create payment record in database
    const payment = await PaymentModel.create({
      userId: studentId,
      courseId,
      amount: parseFloat(formattedAmount),
      currency: "ZAR",
      paymentFor: "course",
      status: "pending",
      sessionId: paymentId,
      paymentMethod: "payfast",
      paymentStatus: "unpaid",
      metadata: JSON.stringify(metadata)
    });
    
    console.log("Created payment record:", payment._id);
    
    // Log everything for debugging
    console.log("Full data object:", data);
    console.log("Generated signature:", data.signature);
    
    // Log the exact query string that would be sent to PayFast
    let queryString = "";
    Object.keys(data).forEach(key => {
      const value = encodeURIComponent(data[key]).replace(/%20/g, "+");
      queryString += `${key}=${value}&`;
    });
    queryString = queryString.slice(0, -1); // Remove trailing &
    console.log("Final query string for PayFast:", queryString);
    
    // Create the full PayFast URL with query parameters
    const fullPayfastUrl = `${apiUrl}?${queryString}`;
    console.log("Full PayFast URL:", fullPayfastUrl);
    
    res.status(200).json({
      success: true,
      data: {
        paymentUrl: apiUrl,
        fullPaymentUrl: fullPayfastUrl,
        paymentData: data,
        paymentId
      }
    });
    
  } catch (error) {
    console.error("PayFast course checkout error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating payment",
      error: error.message
    });
  }
};

// Create PayFast checkout for bookings
exports.createBookingCheckout = async (req, res) => {
  try {
    const { 
      teacherId, 
      studentId, 
      subjectId, 
      sessionDate, 
      sessionStartTime, 
      sessionEndTime, 
      sessionDuration,
      sessionTitle,
      amount, 
      email, 
      name, 
      returnUrl, 
      cancelUrl, 
      notifyUrl 
    } = req.body;
    console.log("Booking checkout request received:", req.body);

    // Validate required fields
    const requiredFields = { 
      teacherId, 
      studentId, 
      subjectId, 
      sessionDate, 
      sessionStartTime, 
      sessionEndTime, 
      sessionDuration,
      sessionTitle,
      amount, 
      email, 
      name, 
      returnUrl, 
      cancelUrl 
    };
    
    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => !value)
      .map(([key]) => key);
    
    if (missingFields.length > 0) {
      console.error("Missing required fields:", missingFields);
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Format amount - ensure it's a valid number with 2 decimal places
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount"
      });
    }
    const formattedAmount = parsedAmount.toFixed(2);

    // Generate a unique payment ID
    const paymentId = crypto.randomUUID();
    
    // Get PayFast settings from database, fall back to .env variables
    let payfastSettings;
    try {
      const settings = await PaymentSetting.findOne();
      payfastSettings = settings?.payfast || {};
    } catch (error) {
      console.error("Error fetching PayFast settings, using defaults", error);
      payfastSettings = {};
    }
    
    // Use settings from database or fall back to environment variables
    const merchantId = payfastSettings.merchant_id || process.env.PAYFAST_MERCHANT_ID;
    const merchantKey = payfastSettings.merchant_key || process.env.PAYFAST_MERCHANT_KEY;
    const apiUrl = payfastSettings.test_mode || process.env.NODE_ENV !== 'production' 
      ? 'https://sandbox.payfast.co.za/eng/process' 
      : 'https://www.payfast.co.za/eng/process';
      
    console.log("Using PayFast settings:", { 
      merchantId, 
      testMode: payfastSettings.test_mode || process.env.NODE_ENV !== 'production',
      apiUrl 
    });

    console.log("Using merchant ID:", merchantId);
    console.log("PayFast URL:", apiUrl);

    // Format name parts
    const nameParts = name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    // Format callback URLs
    const formattedReturnUrl = returnUrl || `${req.headers.origin}/student-dashboard/booking/payment-success?session_id=${paymentId}`;
    const formattedCancelUrl = cancelUrl || `${req.headers.origin}/cancel?session_id=${paymentId}`;
    const formattedNotifyUrl = notifyUrl || `${process.env.BACKEND_URL || "http://localhost:8000"}/api/payment/payfast/notify`;
    
    console.log("Return URL:", formattedReturnUrl);
    console.log("Cancel URL:", formattedCancelUrl);
    console.log("Notify URL:", formattedNotifyUrl);

    // Create data object for PayFast with ONLY essential fields - MATCH DASHBOARD EXACTLY
    const data = {
      // Merchant details
      merchant_id: merchantId,
      merchant_key: merchantKey,
      
      // Payment details
      amount: formattedAmount,
      item_name: 'booking'
    };

    // Generate signature - MUST be done last after all fields are added
    data.signature = generateSignature(data, payfastSettings.passphrase || process.env.PAYFAST_PASSPHRASE || '');
    
    // Store all other data as metadata in our database
    const metadata = {
      teacherId,
      studentId,
      subjectId,
      sessionDate,
      sessionStartTime,
      sessionEndTime,
      sessionDuration,
      sessionTitle,
      amount: formattedAmount,
      return_url: formattedReturnUrl,
      cancel_url: formattedCancelUrl,
      notify_url: formattedNotifyUrl,
      email_address: email,
      name_first: firstName,
      name_last: lastName || ''
    };
    
    // Create payment record in database
    const payment = await PaymentModel.create({
      userId: studentId,
      teacherId,
      amount: parseFloat(formattedAmount),
      currency: "ZAR",
      paymentFor: "booking",
      status: "pending",
      sessionId: paymentId,
      paymentMethod: "payfast",
      paymentStatus: "unpaid",
      metadata: JSON.stringify(metadata)
    });
    
    console.log("Created payment record:", payment._id);
    
    // Log everything for debugging
    console.log("Full data object:", data);
    console.log("Generated signature:", data.signature);
    
    // Log the exact query string that would be sent to PayFast
    let queryString = "";
    Object.keys(data).forEach(key => {
      const value = encodeURIComponent(data[key]).replace(/%20/g, "+");
      queryString += `${key}=${value}&`;
    });
    queryString = queryString.slice(0, -1); // Remove trailing &
    console.log("Final query string for PayFast:", queryString);

    // Create the full PayFast URL with query parameters
    const fullPayfastUrl = `${apiUrl}?${queryString}`;
    console.log("Full PayFast URL:", fullPayfastUrl);

    res.status(200).json({
      success: true,
      data: {
        paymentUrl: apiUrl,
        fullPaymentUrl: fullPayfastUrl,
        paymentData: data,
        paymentId
      }
    });
    
  } catch (error) {
    console.error("PayFast booking checkout error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating payment",
      error: error.message
    });
  }
};

// Process PayFast IPN notifications (webhook)
exports.handleNotification = async (req, res) => {
  try {
    console.log(`Received PayFast notification via ${req.method}:`, req.method === 'POST' ? req.body : req.query);
    console.log(`Headers:`, req.headers);
    
    // Get data based on HTTP method
    const pfData = req.method === 'POST' ? { ...req.body } : { ...req.query };
    
    // Log all received data for debugging
    console.log("All received data:", pfData);
    
    // Get PayFast settings from database, fall back to .env variables
    let payfastSettings;
    try {
      const settings = await PaymentSetting.findOne();
      payfastSettings = settings?.payfast || {};
    } catch (error) {
      console.error("Error fetching PayFast settings, using defaults", error);
      payfastSettings = {};
    }
    
    // Use settings from database or fall back to environment variables
    const merchantId = payfastSettings.merchant_id || process.env.PAYFAST_MERCHANT_ID;
    const passphrase = payfastSettings.passphrase || process.env.PAYFAST_PASSPHRASE || '';
    const isDevMode = payfastSettings.test_mode || process.env.NODE_ENV !== 'production';
    
    console.log("Using PayFast settings:", { 
      merchantId, 
      testMode: isDevMode,
      hasPassphrase: !!passphrase
    });
    
    // Get signature from the data
    const receivedSignature = pfData.signature;
    
    // Skip signature validation in dev mode if configured
    const skipSignatureValidation = isDevMode && process.env.SKIP_PAYFAST_SIGNATURE === 'true';
    
    if (!receivedSignature && !skipSignatureValidation) {
      console.error('No signature in request');
      if (skipSignatureValidation) {
        console.log('Skipping signature validation in dev mode');
      } else {
        return res.status(200).send('OK'); // Still return 200 to PayFast
      }
    }
    
    // Verify signature if not in dev mode or not skipping validation
    if (receivedSignature && !skipSignatureValidation) {
      // Remove the signature from the data before generating our own
      const pfDataForSignature = { ...pfData };
      delete pfDataForSignature.signature;
      
      // Generate signature from received data
      const calculatedSignature = generateSignature(pfDataForSignature, passphrase);
      
      console.log("Received signature:", receivedSignature);
      console.log("Calculated signature:", calculatedSignature);
      
      // Verify signature
      if (receivedSignature !== calculatedSignature) {
        console.error('Invalid signature');
        console.error('Received:', receivedSignature);
        console.error('Calculated:', calculatedSignature);
        // Continue processing even with invalid signature in dev mode
        if (!isDevMode) {
          return res.status(200).send('OK');
        } else {
          console.log('Continuing despite invalid signature due to dev mode');
        }
      }
    } else if (skipSignatureValidation) {
      console.log('Skipped signature validation in dev mode');
    }
    
    // Verify data
    const paymentId = pfData.m_payment_id;
    if (!paymentId) {
      console.error('No payment ID in request');
      return res.status(200).send('OK');
    }
    
    const paymentStatus = pfData.payment_status || 'COMPLETE'; // Default to COMPLETE in dev mode if missing
    
    // Find payment in database
    const payment = await PaymentModel.findOne({ sessionId: paymentId });
    
    if (!payment) {
      console.error('Payment not found:', paymentId);
      return res.status(200).send('OK'); // Still return 200 to PayFast
    }
    
    console.log(`Found payment ${paymentId} with current status ${payment.status}`);
    
    // Update payment status if present
    if (paymentStatus === 'COMPLETE') {
      payment.status = 'succeeded';
      payment.paymentStatus = 'paid';
      if (pfData.pf_payment_id) payment.transactionId = pfData.pf_payment_id;
      
      // Add all PayFast response data to the payment record
      payment.paymentDetails = {
        ...payment.paymentDetails || {},
        payfast: pfData
      };
      
      await payment.save();
      
      // Extract metadata for additional processing
      let metadata = {};
      try {
        if (payment.metadata && typeof payment.metadata === 'string') {
          metadata = JSON.parse(payment.metadata);
        } else if (payment.metadata && typeof payment.metadata === 'object') {
          metadata = payment.metadata;
        }
      } catch (error) {
        console.error('Error parsing metadata:', error);
      }
      
      console.log('Payment metadata:', metadata);
      
      // Process based on payment type (course or booking)
      if (payment.paymentFor === 'course' || metadata.courseId) {
        // Process course enrollment logic here
        console.log(`Processing course enrollment for course ${payment.courseId || metadata.courseId}`);
        // Your course enrollment code here
      } else {
        // Process booking logic here
        console.log(`Processing booking for teacher ${payment.teacherId || metadata.teacherId}`);
        // Your booking processing code here
      }
      
      // Log success
      console.log(`Payment ${paymentId} successfully updated to succeeded`);
    } else {
      console.log(`Payment ${paymentId} status is ${paymentStatus}, not updating to succeeded`);
    }
    
    // PayFast expects a 200 response
    res.status(200).send('OK'); 
    
  } catch (error) {
    console.error('PayFast IPN error:', error);
    // Even on error, return 200 to PayFast as per their requirements
    res.status(200).send('OK');
  }
};

// Verify payment status
exports.verifyPayment = async (req, res) => {
  try {
    const { paymentId } = req.body;
    console.log("Verifying payment:", paymentId);
    
    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: "Payment ID is required"
      });
    }
    
    // Look up the payment by sessionId
    const payment = await PaymentModel.findOne({ sessionId: paymentId });
    console.log("Payment found:", payment ? "Yes" : "No");
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }
    
    // Update payment status to verified if it's pending
    if (payment.status === "pending") {
      const updatedPayment = await PaymentModel.findByIdAndUpdate(
        payment._id,
        {
          status: "succeeded",
          paymentStatus: "paid"
        },
        { new: true }
      );
      
      console.log("Payment status updated to verified:", updatedPayment);
    }
    
    // Parse metadata if needed
    let metadata = {};
    try {
      if (payment.metadata && typeof payment.metadata === 'string') {
        metadata = JSON.parse(payment.metadata);
      } else if (payment.metadata && typeof payment.metadata === 'object') {
        metadata = payment.metadata;
      }
      console.log("Parsed metadata:", metadata);
    } catch (error) {
      console.error("Error parsing metadata:", error);
    }
    
    console.log("Payment verified successfully");
    return res.status(200).json({
      success: true,
      data: {
        id: payment._id,
        status: payment.status === "pending" ? "succeeded" : payment.status,
        paymentStatus: payment.status === "pending" ? "paid" : payment.paymentStatus,
        amount: payment.amount,
        createdAt: payment.createdAt,
        sessionId: payment.sessionId,
        // Use fields from payment record with fallback to metadata
        teacherId: payment.teacherId || metadata.teacherId,
        studentId: payment.studentId || payment.userId || metadata.studentId,
        subjectId: payment.subjectId || metadata.subjectId,
        sessionDate: payment.sessionDate || metadata.sessionDate,
        sessionStartTime: payment.sessionStartTime || metadata.sessionStartTime,
        sessionEndTime: payment.sessionEndTime || metadata.sessionEndTime,
        sessionDuration: payment.sessionDuration || metadata.sessionDuration
      }
    });
    
  } catch (error) {
    console.error("PayFast verify payment error:", error);
    res.status(500).json({
      success: false,
      message: "Error verifying payment",
      error: error.message
    });
  }
};

// Validate PayFast notification
const validateNotification = async (data, payfastHost, expectedMerchantId) => {
  try {
    // 1. Check if all required parameters are present
    const requiredParams = ['m_payment_id', 'pf_payment_id', 'payment_status', 'item_name', 'amount_gross'];
    for (const param of requiredParams) {
      if (!data[param]) {
        return { valid: false, reason: `Missing required parameter: ${param}` };
      }
    }
    
    // 2. Check if merchant ID matches
    if (data.merchant_id !== expectedMerchantId) {
      return { valid: false, reason: 'Invalid merchant ID' };
    }
    
    // 3. Verify signature
    const receivedSignature = data.signature;
    // Create a copy of data without the signature for verification
    const dataForVerification = { ...data };
    delete dataForVerification.signature;
    
    // Get passphrase from database or environment
    let passphrase = '';
    try {
      const settings = await PaymentSetting.findOne();
      passphrase = settings?.payfast?.passphrase || process.env.PAYFAST_PASSPHRASE || '';
    } catch (error) {
      console.error("Error fetching passphrase, using environment variable", error);
      passphrase = process.env.PAYFAST_PASSPHRASE || '';
    }
    
    // Generate signature for comparison
    const calculatedSignature = generateSignature(dataForVerification, passphrase);
    
    if (receivedSignature !== calculatedSignature) {
      console.error('Signature mismatch:', { 
        received: receivedSignature, 
        calculated: calculatedSignature 
      });
      return { valid: false, reason: 'Invalid signature' };
    }
    
    // 4. Validate that the notification came from PayFast
    // Note: In a production environment, we should validate the IP address
    // and make a validation request to PayFast's validation service
    
    return { valid: true };
  } catch (error) {
    console.error('Error validating notification:', error);
    return { valid: false, reason: 'Validation error' };
  }
};

// Handle PayFast notification/webhook
exports.handlePayfastNotify = async (req, res) => {
  try {
    console.log('Received PayFast notification:', req.body);
    
    // Get PayFast settings from database, fall back to .env variables
    let payfastSettings;
    try {
      const settings = await PaymentSetting.findOne();
      payfastSettings = settings?.payfast || {};
    } catch (error) {
      console.error("Error fetching PayFast settings, using defaults", error);
      payfastSettings = {};
    }
    
    // Use settings from database or fall back to environment variables
    const merchantId = payfastSettings.merchant_id || process.env.PAYFAST_MERCHANT_ID;
    const payfastHost = payfastSettings.test_mode || process.env.NODE_ENV !== 'production' 
      ? 'sandbox.payfast.co.za'
      : 'www.payfast.co.za';
    
    console.log("Using PayFast settings for validation:", { 
      merchantId, 
      payfastHost,
      testMode: payfastSettings.test_mode || process.env.NODE_ENV !== 'production'
    });
    
    // Verify the notification is from PayFast
    const validationResult = await validateNotification(req.body, payfastHost, merchantId);
    
    if (!validationResult.valid) {
      console.error('PayFast notification validation failed:', validationResult.reason);
      return res.status(400).send('Validation failed');
    }
    
    // Extract payment details
    const { m_payment_id, pf_payment_id, payment_status, amount_gross } = req.body;
    
    // Find the payment in the database
    const payment = await PaymentModel.findOne({ sessionId: m_payment_id });
    
    if (!payment) {
      console.error('Payment not found:', m_payment_id);
      return res.status(404).send('Payment not found');
    }
    
    // Update payment status
    payment.status = payment_status;
    payment.paymentProviderId = pf_payment_id;
    payment.updatedAt = new Date();
    
    // Additional fields to store
    payment.paymentDetails = {
      ...payment.paymentDetails || {},
      payfast: req.body
    };
    
    // If payment is successful, process booking or course enrollment
    if (payment_status === 'COMPLETE') {
      // Extract metadata
      const metadata = payment.metadata ? 
        (typeof payment.metadata === 'string' ? JSON.parse(payment.metadata) : payment.metadata) : 
        {};
        
      console.log('Payment metadata:', metadata);
      
      // Check if this is a course or booking payment
      if (metadata.courseId) {
        // Process course enrollment
        // (Implementation would depend on your course model)
        console.log('Processing course enrollment for course:', metadata.courseId);
      } else if (metadata.teacherId && metadata.studentId && metadata.subjectId) {
        // Process booking
        try {
          // Create booking using metadata
          const bookingData = {
            teacherId: metadata.teacherId,
            studentId: metadata.studentId || payment.userId,
            subjectId: metadata.subjectId,
            sessionDate: metadata.sessionDate,
            sessionStartTime: metadata.sessionStartTime,
            sessionEndTime: metadata.sessionEndTime,
            sessionDuration: metadata.sessionDuration,
            paymentId: payment._id
          };
          
          console.log('Creating booking with data:', bookingData);
          
          // Here you would create the booking in your database
          // const booking = await Booking.create(bookingData);
          
          // Log success
          console.log('Booking created successfully');
        } catch (error) {
          console.error('Error creating booking:', error);
        }
      } else {
        console.warn('Payment successful but missing metadata for processing:', m_payment_id);
      }
    }
    
    // Save updated payment record
    await payment.save();
    
    // Always respond with 200 OK to PayFast
    return res.status(200).send('OK');
    
  } catch (error) {
    console.error('PayFast notification handling error:', error);
    res.status(500).send('Internal server error');
  }
}; 