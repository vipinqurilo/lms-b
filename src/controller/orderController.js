const CourseModel = require("../model/CourseModel");
const OrderModel = require("../model/orderModel");

const stripe = require("stripe")(
  "sk_test_51QsH7dPMQ11XQz7t9MpL7LScJgFX7wCAzCScqZXrYlMZUN6hrKPuxZmEFLYg8si74hSQM9i4DrdCKnk4HEHLEpbF00LCULZN5a"
);

exports.addOrder = async (req, res) => {
  try {
    const { course, amountTotal } = req.body;
    const id = req.user.id;
    const findOrder = await OrderModel.find({ studentId: id, course: course });
    if (!findOrder)
      return res.json({ status: "fail", message: "Order Alredy Buy" });
    function generateRandomCode() {
      const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let code = "";
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    }
    const objData = {
      orderId: generateRandomCode(),
      studentId: id,
      course: course,
      sessionId: null,
      amountTotal: amountTotal,
      currency: null,
      paymentStatus: null,
    };
    let dataId = await CourseModel.findOne({ _id: course });
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: dataId.courseTitle,
            },
            unit_amount: objData.amountTotal * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: "http://localhost:3000/success",
      cancel_url: "http://localhost:3000/cancel",
    });

    if (session?.id) {
      (objData.sessionId = session?.id),
        (objData.amountTotal = session?.amount_total),
        (objData.currency = session?.currency),
        (objData.paymentStatus = session?.payment_status);
      const dataCreate = await OrderModel.create(objData);
      if (dataCreate) {
        res.json({
          status: "success",
          message: "Order Add Success",
        });
      } else {
        res.json({
          status: "Fail",
          message: "Order Not Add",
        });
      }
    }
  } catch (error) {
    console.log(error);
    res.json({
      status: "Fail",
      message: "Internal error",
    });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const id = req.user.id;
    const allOrder = await OrderModel.find({ studentId: id }).populate(
      "course"
    ).populate("course.courseInstructor");
    res.json({
      status: "success",
      data: allOrder,
    });
  } catch (error) {
    res.json({
      status: "fail",
      error: error.message,
    });
  }
};
