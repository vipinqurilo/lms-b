const PaymentSetting = require("../../model/paymentSetting");
const PaymentModel = require("../../model/paymentModel");
const BookingModel = require("../../model/bookingModel");
const crypto = require("crypto");
const axios = require("axios");
const { URLSearchParams } = require("url");

const moment = require("moment");
const StudentProfileModel = require("../../model/studentProfileModel");
const CourseModel = require("../../model/CourseModel");


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
      amount,
      courseId,
      studentId = req.user?.id,
      courseTitle,
      returnUrl,
      cancelUrl,
      notifyUrl,
    } = req.body;
    // Validate required fields
    const requiredFields = {
      courseId,
      amount,
    };
    const course = await CourseModel.findById(courseId);
    if (!course) {
      return res
        .status(400)
        .json({ success: false, message: "Course not found" });
    }
    const student = await StudentProfileModel.findOne({userId: studentId})
    if(!student){
      return res.status(400).json({success: false, message: "Student not found"})
    }
    const isCourseEnrolled = student.enrolledCourses.some(
      (enrolledCourse) => enrolledCourse.courseId.toString() === courseId
    );
    if (isCourseEnrolled) {
      return res
        .status(400)
        .json({ success: false, message: "Course already enrolled" });
    }
    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([key]) => key);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }
    // Format amount
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }
    const formattedAmount = parsedAmount.toFixed(2);
    // Generate unique payment ID
    const paymentId = crypto.randomUUID();
    // Fetch PayFast settings from DB or fallback to env variables
    let payfastSettings = {};
    try {
      const settings = await PaymentSetting.findOne();
      payfastSettings = settings?.payfast || {};
    } catch (error) {}
    const merchantId = payfastSettings.merchantId || process.env.PAYFAST_MERCHANT_ID.trim();
    const merchantKey = payfastSettings.merchantKey || process.env.PAYFAST_MERCHANT_KEY.trim();
    const passphrase = (payfastSettings.passphrase || process.env.PAYFAST_PASSPHRASE || "").trim();
    const apiUrl =
      payfastSettings.mode || process.env.NODE_ENV !== "production"
        ? "https://sandbox.payfast.co.za/eng/process" 
        : "https://www.payfast.co.za/eng/process"; 
    // Format callback URLs - with fallbacks if not provided
    const defaultReturnUrl = `${req.headers.origin || 'http://localhost:3000'}/student-dashboard/course/payment-success?session_id=${paymentId}`;
    const defaultCancelUrl = `${req.headers.origin || 'http://localhost:3000'}/cancel?session_id=${paymentId}`;

    const defaultNotifyUrl = `${'https://dqhcwhfd-8000.inc1.devtunnels.ms'}/api/payment/payfast/notify`;

    const formattedReturnUrl = returnUrl || defaultReturnUrl;
    const formattedCancelUrl = cancelUrl || defaultCancelUrl;
    const formattedNotifyUrl = notifyUrl || defaultNotifyUrl;
    // Prepare PayFast data
    const data = {
      amount: formattedAmount,
      custom_str1: paymentId,
      item_name: courseTitle || `Course ID: ${courseId}`,
      merchant_id: merchantId,
      merchant_key: merchantKey,
      notify_url: formattedNotifyUrl,
      // return_url: formattedReturnUrl,
      // cancel_url: formattedCancelUrl,
    };
    // Generate signature
    data.signature = generateSignature(data, passphrase);

    const metadata = {
      courseId,
      courseTitle,
      studentId,
      ...data,
    };

    // Store payment metadata in database
    await PaymentModel.create({
      userId: studentId || "guest-user", // Fallback for anonymous purchases
      courseId,
      amount: parseFloat(formattedAmount),
      currency: "R",
      paymentFor: "course",
      status: "pending",
      sessionId: paymentId,
      paymentMethod: "payfast",
      paymentStatus: "unpaid",
      metadata: metadata,
    });
    // Generate query string
    const queryString = Object.keys(data)
      .map((key) => `${key}=${encodeURIComponent(data[key]).replace(/%20/g, "+")}`)
      .join("&");
    const fullPayfastUrl = `${apiUrl}?${queryString}`;
    res.status(200).json({
      success: true,
      data: {
        paymentUrl: fullPayfastUrl,
        paymentData: data,
        paymentId,
      },
    });
  } catch (error) {
    console.error("PayFast course checkout error:", error);
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
      `${process.env.BACKEND_URL}/api/payment/payfast/notify`;

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
      email_address: email,
    };

    // Create payment record in database
    await PaymentModel.create({
      userId: studentId,
      teacherId,
      amount: parseFloat(formattedAmount),
      currency: "R",
      paymentFor: "booking",
      status: "pending",
      sessionId: paymentId,
      paymentMethod: "payfast",
      paymentStatus: "unpaid",
      metadata: metadata,
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

exports.verifyPayment = async (req, res) => {
  try {
    const { paymentId } = req.body;
    console.log(paymentId, "payment id ");

    const PaymentRecord = await PaymentModel.findOne({ sessionId: paymentId });

    if (!PaymentRecord) {
      res.status(404).json({
        status: "failed",
        message: "payment not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "payment record fetched successfully",
      data: PaymentRecord,
    });
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: "internal server error ",
    });
  }
};


exports.processPayout = async (req, res) => {
  try {
    const { recipient, amount, reason } = req.body;

    if (!recipient || !amount || !reason) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    if (process.env.NODE_ENV !== "production") {
      return res.status(200).json({
        success: true,
        message: "Mock payout success (sandbox not supported)",
        data: { recipient, amount, reason },
      });
    }

    const apiUrl = "https://api.payfast.co.za/transfers";

    const response = await axios.post(
      apiUrl,
      {
        recipient,
        amount: parseFloat(amount).toFixed(2),
        reason,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYFAST_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.status(200).json({
      success: true,
      message: "Payout processed successfully",
      data: response.data,
    });
  } catch (error) {
    console.error("Payout Error:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: "Error processing payout",
      error: error.response?.data || error.message,
    });
  }
};


exports.payoutWebhook = async (req, res) => {
  try {
    console.log("Received Payout Webhook:", req.body);

    // Verify webhook signature (if required)

    // Process webhook data (update database, notify user, etc.)
    
    res.status(200).send("Webhook received");
  } catch (error) {
    console.error("Webhook Error:", error);
    res.status(500).send("Webhook processing failed");
  }
};