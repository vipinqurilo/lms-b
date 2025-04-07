import axios from "axios";

const processPayoutPayfast = async (recipient, amount, reason) => {
  try {
    if (!recipient || !amount || !reason) {
      throw new Error("Missing required fields");
    }

    if (process.env.NODE_ENV !== "production") {
      return {
        success: true,
        message: "Mock payout success (sandbox not supported)",
        data: { recipient, amount, reason },
      };
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
          Authorization: `Bearer ${process.env.PAYFAST_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      success: true,
      message: "Payout Processsed successfully",
      data: response.data,
    };
  } catch (error) {
    console.error("Error processing Payfast payout:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
