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

exports.verifyPayment = async (req, res) => {
  try {
    const { paymentId } = req.body;

    const PaymentRecord = await PaymentModel.findOne({ sessionId: paymentId });

    if (!PaymentRecord) {
      res.status(404).json({
        status: "failed",
        message: "payment not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "payment status fetched successfully",
      paymentStatus: PaymentRecord.paymentStatus,
    });
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: "internal server error ",
    });
  }
};
