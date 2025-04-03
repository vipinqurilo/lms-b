const PaymentSetting = require("../../model/paymentSetting");
const PaymentModel = require("../../model/paymentModel");
const crypto = require("crypto");
const axios = require("axios");
const { URLSearchParams } = require("url");

// Function to generate PayFast signature
const generateSignature = (data, passPhrase = null) => {
  let pfOutput = "";

  // Sort keys alphabetically & filter out empty values
  Object.keys(data)
    .sort()
    .forEach((key) => {
      if (data[key] !== "") {
        pfOutput += `${key}=${encodeURIComponent(data[key].trim()).replace(
          /%20/g,
          "+"
        )}&`;
      }
    });

  // Remove last ampersand
  pfOutput = pfOutput.slice(0, -1);

  // Append passphrase if provided
  if (passPhrase) {
    pfOutput += `&passphrase=${encodeURIComponent(passPhrase.trim()).replace(
      /%20/g,
      "+"
    )}`;
  }

  console.log("Final String Before Hashing:", pfOutput); // Log for debugging

  // Return MD5 hash
  return crypto.createHash("md5").update(pfOutput).digest("hex");
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
      notifyUrl,
    } = req.body;

    // Validate required fields
    const requiredFields = {
      courseId,
      studentId,
      amount,
      email,
      name,
      courseTitle,
      returnUrl,
      cancelUrl,
      notifyUrl,
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Validate and format amount
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      });
    }
    const formattedAmount = parsedAmount.toFixed(2);

    // Generate a unique payment ID
    const paymentId = crypto.randomUUID();

    // Fetch PayFast settings from DB or fallback to environment variables
    let payfastSettings;
    try {
      const settings = await PaymentSetting.findOne();
      payfastSettings = settings?.payfast || {};
    } catch (error) {
      payfastSettings = {};
    }

    // PayFast Credentials
    const merchantId =
      payfastSettings.merchantId || process.env.PAYFAST_MERCHANT_ID.trim();
    const merchantKey =
      payfastSettings.merchantKey || process.env.PAYFAST_MERCHANT_KEY.trim();
    const passphrase = (
      payfastSettings.passphrase ||
      process.env.PAYFAST_PASSPHRASE ||
      ""
    ).trim();

    const apiUrl =
      process.env.NODE_ENV !== "production"
        ? "https://sandbox.payfast.co.za/eng/process"
        : "https://www.payfast.co.za/eng/process";

    // Format name
    const nameParts = name.split(" ");
    const firstName = nameParts[0] || "Student";
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

    // Ensure notify URL is valid
    if (!notifyUrl.startsWith("https://") && !notifyUrl.startsWith("http://")) {
      return res.status(400).json({
        success: false,
        message: "Invalid notify URL",
      });
    }

    // Prepare PayFast Data
    const data = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      amount: formattedAmount,
      item_name: courseTitle,
      custom_str1: paymentId,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      notify_url: notifyUrl, // Ensure this is included
      name_first: firstName,
      name_last: lastName || "",
      email_address: email,
    };

    // Generate Signature
    data.signature = generateSignature(data, passphrase);

    // Store metadata in the database
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
      metadata: JSON.stringify(data), // Store the full PayFast data
    });

    // Generate Query String for PayFast
    let queryString = "";
    Object.keys(data)
      .sort()
      .forEach((key) => {
        if (data[key] !== "") {
          queryString += `${key}=${encodeURIComponent(data[key].trim()).replace(
            /%20/g,
            "+"
          )}&`;
        }
      });

    queryString = queryString.slice(0, -1); // Remove last '&'

    console.log("Final Query String:", queryString); // Debugging

    // Full PayFast URL
    const fullPayfastUrl = `${apiUrl}?${queryString}`;

    res.status(200).json({
      success: true,
      data: {
        paymentUrl: fullPayfastUrl, // Directly return this URL for redirection
        paymentData: data,
        paymentId,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating payment",
      error: error.message,
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
      notifyUrl,
    } = req.body;

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
      cancelUrl,
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Format amount - ensure it's a valid number with 2 decimal places
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
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
      payfastSettings = {};
    }

    // Use settings from database or fall back to environment variables
    const merchantId =
      payfastSettings.merchantId || process.env.PAYFAST_MERCHANT_ID.trim();
    const merchantKey =
      payfastSettings.merchantKey || process.env.PAYFAST_MERCHANT_KEY.trim();
    const apiUrl =
      payfastSettings.mode || process.env.NODE_ENV !== "production"
        ? "https://sandbox.payfast.co.za/eng/process"
        : "https://www.payfast.co.za/eng/process";

    // Format name parts
    const nameParts = name.split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

    // Format callback URLs
    const formattedReturnUrl = encodeURIComponent(
      returnUrl ||
        `${req.headers.origin}/student-dashboard/booking/payment-success?session_id=${paymentId}`
    );
    const formattedCancelUrl =
      cancelUrl || `${req.headers.origin}/cancel?session_id=${paymentId}`;
    const formattedNotifyUrl =
      notifyUrl ||
      `${"https://enjoy-capacity-bid-monitors.trycloudflare.com"}/api/payment/payfast/notify`;

    console.log("Return URL:", formattedReturnUrl);
    console.log("Cancel URL:", formattedCancelUrl);
    console.log("Notify URL:", formattedNotifyUrl);

    // Create data object for PayFast with ONLY essential fields - MATCH DASHBOARD EXACTLY
    const data = {
      amount: formattedAmount,
      cancel_url: formattedCancelUrl,
      custom_str1: paymentId,
      email_address: email,
      item_name: "booking",
      merchant_id: merchantId,
      merchant_key: merchantKey,
      name_first: firstName,
      notify_url: formattedNotifyUrl,
      // return_url: formattedReturnUrl,
    };

    // Generate signature - MUST be done last after all fields are added
    data.signature = generateSignature(
      data,
      (
        payfastSettings.passphrase ||
        process.env.PAYFAST_PASSPHRASE ||
        ""
      ).trim()
    );

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
      name_last: lastName || "",
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
      metadata: JSON.stringify(metadata),
    });

    // Log everything for debugging
    console.log("Full data object:", data);
    console.log("Generated signature:", data.signature);

    const queryString = Object.keys(data)
      .map(
        (key) => `${key}=${encodeURIComponent(data[key]).replace(/%20/g, "+")}`
      )
      .join("&");

    const fullPayfastUrl = `${apiUrl}?${queryString}`;

    console.log("Final query string for PayFast:", queryString);
    console.log("Full PayFast URL:", fullPayfastUrl);

    res.status(200).json({
      success: true,
      data: {
        paymentUrl: apiUrl,
        fullPaymentUrl: fullPayfastUrl,
        paymentData: data,
        paymentId,
      },
    });
  } catch (error) {
    console.error("PayFast booking checkout error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating payment",
      error: error.message,
    });
  }
};

async function verifyPayFastIPN(ipnData) {
  try {
    const pfHost =
      process.env.NODE_ENV === "production"
        ? "https://www.payfast.co.za/eng/query/validate"
        : "https://sandbox.payfast.co.za/eng/query/validate";

    const response = await axios.post(pfHost, ipnData, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    return response.data === "VALID";
  } catch (error) {
    console.error("PayFast IPN verification error:", error);
    return false;
  }
}

// Handle PayFast IPN (Instant Payment Notification)
exports.handlePayFastIPN = async (req, res) => {
  try {
    console.log("PayFast IPN received:", req.body);

    // console.log("PayFast Provided Signature:", req.body.signature);
    // console.log("Our Generated Signature:", generateSignature(req.body, process.env.PAYFAST_PASSPHRASE));

    // Validate required fields
    const {
      payment_status,
      pf_payment_id,
      amount_gross,
      item_name,
      custom_str1,
    } = req.body;

    if (!payment_status || !pf_payment_id || !amount_gross || !custom_str1) {
      console.error("Missing required fields in PayFast IPN.");
      return res.status(400).send("Invalid request");
    }

    // Find the payment record using the stored sessionId (custom_str1)
    const payment = await PaymentModel.findOne({ sessionId: custom_str1 });

    if (!payment) {
      console.error("Payment record not found for sessionId:", custom_str1);
      return res.status(404).send("Payment record not found");
    }

    // Verify payment amount (optional, for security)
    if (parseFloat(amount_gross) !== parseFloat(payment.amount)) {
      console.error("Payment amount mismatch!");
      return res.status(400).send("Payment amount mismatch");
    }

    // Verify PayFast IPN data (Security check)
    const isVerified = await verifyPayFastIPN(req.body);
    if (!isVerified) {
      console.error("PayFast IPN verification failed!");
      return res.status(400).send("Invalid IPN verification");
    }

    // Update payment status
    payment.paymentStatus = payment_status === "COMPLETE" ? "paid" : "failed";
    payment.transactionId = pf_payment_id;
    await payment.save();

    console.log("Payment updated successfully:", payment._id);
    res.status(200).send("IPN Processed");
  } catch (error) {
    console.error("Error handling PayFast IPN:", error);
    res.status(500).send("Server Error");
  }
};

exports.paymentSuccess = async (req, res) => {
  try {
    const sessionId = req.query.session_id;

    if (!sessionId) {
      return res
        .status(400)
        .json({ success: false, message: "Session ID is required" });
    }

    // Fetch payment details from the database
    const payment = await PaymentModel.findOne({ sessionId });

    if (!payment || payment.paymentStatus !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Payment not found or not completed",
      });
    }

    res.status(200).json({
      success: true,
      message: "Payment successful!",
      payment,
    });
  } catch (error) {
    console.error("Error handling payment success:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
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
        message: "Payment ID is required",
      });
    }

    // Look up the payment by sessionId
    const payment = await PaymentModel.findOne({ sessionId: paymentId });
    console.log("Payment found:", payment ? "Yes" : "No");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Update payment status to verified if it's pending
    if (payment.status === "pending") {
      const updatedPayment = await PaymentModel.findByIdAndUpdate(
        payment._id,
        {
          status: "succeeded",
          paymentStatus: "paid",
        },
        { new: true }
      );

      console.log("Payment status updated to verified:", updatedPayment);
    }

    // Parse metadata if needed
    let metadata = {};
    try {
      if (payment.metadata && typeof payment.metadata === "string") {
        metadata = JSON.parse(payment.metadata);
      } else if (payment.metadata && typeof payment.metadata === "object") {
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
        paymentStatus:
          payment.status === "pending" ? "paid" : payment.paymentStatus,
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
        sessionDuration: payment.sessionDuration || metadata.sessionDuration,
      },
    });
  } catch (error) {
    console.error("PayFast verify payment error:", error);
    res.status(500).json({
      success: false,
      message: "Error verifying payment",
      error: error.message,
    });
  }
};

// // Validate PayFast notification
// const validateNotification = async (data, payfastHost, expectedMerchantId) => {
//   try {
//     // 1. Check if all required parameters are present
//     const requiredParams = ['m_payment_id', 'pf_payment_id', 'payment_status', 'item_name', 'amount_gross'];
//     for (const param of requiredParams) {
//       if (!data[param]) {
//         return { valid: false, reason: `Missing required parameter: ${param}` };
//       }
//     }

//     // 2. Check if merchant ID matches
//     if (data.merchant_id !== expectedMerchantId) {
//       return { valid: false, reason: 'Invalid merchant ID' };
//     }

//     // 3. Verify signature
//     const receivedSignature = data.signature;
//     // Create a copy of data without the signature for verification
//     const dataForVerification = { ...data };
//     delete dataForVerification.signature;

//     // Get passphrase from database or environment
//     let passphrase = '';
//     try {
//       const settings = await PaymentSetting.findOne();
//       passphrase = settings?.payfast?.passphrase || process.env.PAYFAST_PASSPHRASE || '';
//     } catch (error) {
//       console.error("Error fetching passphrase, using environment variable", error);
//       passphrase = process.env.PAYFAST_PASSPHRASE || '';
//     }

//     // Generate signature for comparison
//     const calculatedSignature = generateSignature(dataForVerification, passphrase);

//     if (receivedSignature !== calculatedSignature) {
//       console.error('Signature mismatch:', {
//         received: receivedSignature,
//         calculated: calculatedSignature
//       });
//       return { valid: false, reason: 'Invalid signature' };
//     }

//     // 4. Validate that the notification came from PayFast
//     // Note: In a production environment, we should validate the IP address
//     // and make a validation request to PayFast's validation service

//     return { valid: true };
//   } catch (error) {
//     console.error('Error validating notification:', error);
//     return { valid: false, reason: 'Validation error' };
//   }
// };

// // Handle PayFast notification/webhook
// exports.handlePayfastNotify = async (req, res) => {
//   try {
//     console.log('Received PayFast notification:', req.body);

//     // Get PayFast settings from database, fall back to .env variables
//     let payfastSettings;
//     try {
//       const settings = await PaymentSetting.findOne();
//       payfastSettings = settings?.payfast || {};
//     } catch (error) {
//       console.error("Error fetching PayFast settings, using defaults", error);
//       payfastSettings = {};
//     }

//     // Use settings from database or fall back to environment variables
//     const merchantId = payfastSettings.merchant_id || process.env.PAYFAST_MERCHANT_ID;
//     const payfastHost = payfastSettings.test_mode || process.env.NODE_ENV !== 'production'
//       ? 'sandbox.payfast.co.za'
//       : 'www.payfast.co.za';

//     console.log("Using PayFast settings for validation:", {
//       merchantId,
//       payfastHost,
//       testMode: payfastSettings.test_mode || process.env.NODE_ENV !== 'production'
//     });

//     // Verify the notification is from PayFast
//     const validationResult = await validateNotification(req.body, payfastHost, merchantId);

//     if (!validationResult.valid) {
//       console.error('PayFast notification validation failed:', validationResult.reason);
//       return res.status(400).send('Validation failed');
//     }

//     // Extract payment details
//     const { m_payment_id, pf_payment_id, payment_status, amount_gross } = req.body;

//     // Find the payment in the database
//     const payment = await PaymentModel.findOne({ sessionId: m_payment_id });

//     if (!payment) {
//       console.error('Payment not found:', m_payment_id);
//       return res.status(404).send('Payment not found');
//     }

//     // Update payment status
//     payment.status = payment_status;
//     payment.paymentProviderId = pf_payment_id;
//     payment.updatedAt = new Date();

//     // Additional fields to store
//     payment.paymentDetails = {
//       ...payment.paymentDetails || {},
//       payfast: req.body
//     };

//     // If payment is successful, process booking or course enrollment
//     if (payment_status === 'COMPLETE') {
//       // Extract metadata
//       const metadata = payment.metadata ?
//         (typeof payment.metadata === 'string' ? JSON.parse(payment.metadata) : payment.metadata) :
//         {};

//       console.log('Payment metadata:', metadata);

//       // Check if this is a course or booking payment
//       if (metadata.courseId) {
//         // Process course enrollment
//         // (Implementation would depend on your course model)
//         console.log('Processing course enrollment for course:', metadata.courseId);
//       } else if (metadata.teacherId && metadata.studentId && metadata.subjectId) {
//         // Process booking
//         try {
//           // Create booking using metadata
//           const bookingData = {
//             teacherId: metadata.teacherId,
//             studentId: metadata.studentId || payment.userId,
//             subjectId: metadata.subjectId,
//             sessionDate: metadata.sessionDate,
//             sessionStartTime: metadata.sessionStartTime,
//             sessionEndTime: metadata.sessionEndTime,
//             sessionDuration: metadata.sessionDuration,
//             paymentId: payment._id
//           };

//           console.log('Creating booking with data:', bookingData);

//           // Here you would create the booking in your database
//           // const booking = await Booking.create(bookingData);

//           // Log success
//           console.log('Booking created successfully');
//         } catch (error) {
//           console.error('Error creating booking:', error);
//         }
//       } else {
//         console.warn('Payment successful but missing metadata for processing:', m_payment_id);
//       }
//     }

//     // Save updated payment record
//     await payment.save();

//     // Always respond with 200 OK to PayFast
//     return res.status(200).send('OK');

//   } catch (error) {
//     console.error('PayFast notification handling error:', error);
//     res.status(500).send('Internal server error');
//   }
// };

// // Process PayFast IPN notifications (webhook)
// exports.handleNotification = async (req, res) => {
//   try {
//     console.log(`Received PayFast notification via ${req.method}:`, req.method === 'POST' ? req.body : req.query);
//     console.log(`Headers:`, req.headers);

//     // Get data based on HTTP method
//     const pfData = req.method === 'POST' ? { ...req.body } : { ...req.query };

//     // Log all received data for debugging
//     console.log("All received data:", pfData);

//     // Get PayFast settings from database, fall back to .env variables
//     let payfastSettings;
//     try {
//       const settings = await PaymentSetting.findOne();
//       payfastSettings = settings?.payfast || {};
//     } catch (error) {
//       console.error("Error fetching PayFast settings, using defaults", error);
//       payfastSettings = {};
//     }

//     // Use settings from database or fall back to environment variables
//     const merchantId = payfastSettings.merchant_id || process.env.PAYFAST_MERCHANT_ID;
//     const passphrase = payfastSettings.passphrase || process.env.PAYFAST_PASSPHRASE || '';
//     const isDevMode = payfastSettings.test_mode || process.env.NODE_ENV !== 'production';

//     console.log("Using PayFast settings:", {
//       merchantId,
//       testMode: isDevMode,
//       hasPassphrase: !!passphrase
//     });

//     // Get signature from the data
//     const receivedSignature = pfData.signature;

//     // Skip signature validation in dev mode if configured
//     const skipSignatureValidation = isDevMode && process.env.SKIP_PAYFAST_SIGNATURE === 'true';

//     if (!receivedSignature && !skipSignatureValidation) {
//       console.error('No signature in request');
//       if (skipSignatureValidation) {
//         console.log('Skipping signature validation in dev mode');
//       } else {
//         return res.status(200).send('OK'); // Still return 200 to PayFast
//       }
//     }

//     // Verify signature if not in dev mode or not skipping validation
//     if (receivedSignature && !skipSignatureValidation) {
//       // Remove the signature from the data before generating our own
//       const pfDataForSignature = { ...pfData };
//       delete pfDataForSignature.signature;

//       // Generate signature from received data
//       const calculatedSignature = generateSignature(pfDataForSignature, passphrase);

//       console.log("Received signature:", receivedSignature);
//       console.log("Calculated signature:", calculatedSignature);

//       // Verify signature
//       if (receivedSignature !== calculatedSignature) {
//         console.error('Invalid signature');
//         console.error('Received:', receivedSignature);
//         console.error('Calculated:', calculatedSignature);
//         // Continue processing even with invalid signature in dev mode
//         if (!isDevMode) {
//           return res.status(200).send('OK');
//         } else {
//           console.log('Continuing despite invalid signature due to dev mode');
//         }
//       }
//     } else if (skipSignatureValidation) {
//       console.log('Skipped signature validation in dev mode');
//     }

//     // Verify data
//     const paymentId = pfData.m_payment_id;
//     if (!paymentId) {
//       console.error('No payment ID in request');
//       return res.status(200).send('OK');
//     }

//     const paymentStatus = pfData.payment_status || 'COMPLETE'; // Default to COMPLETE in dev mode if missing

//     // Find payment in database
//     const payment = await PaymentModel.findOne({ sessionId: paymentId });

//     if (!payment) {
//       console.error('Payment not found:', paymentId);
//       return res.status(200).send('OK'); // Still return 200 to PayFast
//     }

//     console.log(`Found payment ${paymentId} with current status ${payment.status}`);

//     // Update payment status if present
//     if (paymentStatus === 'COMPLETE') {
//       payment.status = 'succeeded';
//       payment.paymentStatus = 'paid';
//       if (pfData.pf_payment_id) payment.transactionId = pfData.pf_payment_id;

//       // Add all PayFast response data to the payment record
//       payment.paymentDetails = {
//         ...payment.paymentDetails || {},
//         payfast: pfData
//       };

//       await payment.save();

//       // Extract metadata for additional processing
//       let metadata = {};
//       try {
//         if (payment.metadata && typeof payment.metadata === 'string') {
//           metadata = JSON.parse(payment.metadata);
//         } else if (payment.metadata && typeof payment.metadata === 'object') {
//           metadata = payment.metadata;
//         }
//       } catch (error) {
//         console.error('Error parsing metadata:', error);
//       }

//       console.log('Payment metadata:', metadata);

//       // Process based on payment type (course or booking)
//       if (payment.paymentFor === 'course' || metadata.courseId) {
//         // Process course enrollment logic here
//         console.log(`Processing course enrollment for course ${payment.courseId || metadata.courseId}`);
//         // Your course enrollment code here
//       } else {
//         // Process booking logic here
//         console.log(`Processing booking for teacher ${payment.teacherId || metadata.teacherId}`);
//         // Your booking processing code here
//       }

//       // Log success
//       console.log(`Payment ${paymentId} successfully updated to succeeded`);
//     } else {
//       console.log(`Payment ${paymentId} status is ${paymentStatus}, not updating to succeeded`);
//     }

//     // PayFast expects a 200 response
//     res.status(200).send('OK');

//   } catch (error) {
//     console.error('PayFast IPN error:', error);
//     // Even on error, return 200 to PayFast as per their requirements
//     res.status(200).send('OK');
//   }
// };
