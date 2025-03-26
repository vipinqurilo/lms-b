const { default: mongoose } = require("mongoose");
const CalenderModel = require("../../model/calenderModel");
const StudentProfileModel = require("../../model/studentProfileModel");
const TeacherProfileModel = require("../../model/teacherProfileModel");
const UserModel = require("../../model/UserModel");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.getTeacherProfile = async (req, res) => {
  try {
    const teacherId = req.params.teacherId;
    const teacherProfile = await TeacherProfileModel.aggregate([
      // Match the teacher by ID
      {
        $match: {
          _id: new mongoose.Types.ObjectId(teacherId), // Convert teacherId to ObjectId
        },
      },
      // Lookup to populate userId
      {
        $lookup: {
          from: "users", // The collection name for the User model
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      // Unwind the userId array (since $lookup returns an array)
      {
        $unwind: "$user",
      },
      // Lookup to populate calendar
      {
        $lookup: {
          from: "calendars", // The collection name for the Calendar model
          localField: "calendar",
          foreignField: "_id",
          as: "calendar",
        },
      },
      // Unwind the calendar array
      {
        $unwind: "$calendar",
      },
      // Lookup to populate subjectsTaught
      {
        $lookup: {
          from: "coursesubcategories", // The collection name for the Subject model
          localField: "subjectsTaught",
          foreignField: "_id",
          as: "subjectsTaught",
        },
      },
      // Lookup to populate languagesSpoken
      {
        $lookup: {
          from: "languages", // The collection name for the Language model
          localField: "languagesSpoken",
          foreignField: "_id",
          as: "languagesSpoken",
        },
      },
      // Lookup to populate reviews
      {
        $lookup: {
          from: "tutorreviews",
          localField: "reviews",
          foreignField: "_id",
          as: "reviews",
        },
      },
      // Lookup to populate student details in reviews
      {
        $lookup: {
          from: "users",
          let: { reviews: "$reviews" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ["$_id", "$$reviews.student"],
                },
              },
            },
            {
              $project: {
                _id: 1,
                firstName: 1,
                lastName: 1,
                profilePhoto: 1,
              },
            },
          ],
          as: "studentDetails",
        },
      },
      // Project the desired fields
      {
        $project: {
          user: {
            _id: 1,
            email: 1,
            phone: 1,
            firstName: 1,
            lastName: 1,
            gender: 1,
            country: 1,
            bio: 1,
            profilePhoto: 1,
          },
          experience: 1,
          education: 1,
          calendar: {
            availability: 1,
          },
          subjectsTaught: {
            name: 1,
            pricePerHour: 1,
            _id: 1,
          },
          languagesSpoken: {
            name: 1,
            _id: 1,
          },
          tutionSlots: 1,
          reviews: {
            $map: {
              input: "$reviews",
              as: "review",
              in: {
                _id: "$$review._id",
                rating: "$$review.rating",
                review: "$$review.review",
                message: "$$review.message",
                createdAt: "$$review.createdAt",
                student: {
                  $let: {
                    vars: {
                      studentInfo: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$studentDetails",
                              as: "student",
                              cond: {
                                $eq: ["$$student._id", "$$review.student"],
                              },
                            },
                          },
                          0,
                        ],
                      },
                    },
                    in: {
                      _id: "$$studentInfo._id",
                      userName: {
                        $concat: [
                          "$$studentInfo.firstName",
                          " ",
                          "$$studentInfo.lastName",
                        ],
                      },
                      profilePhoto: "$$studentInfo.profilePhoto",
                    },
                  },
                },
              },
            },
          },
        },
      },
    ]);

    // Since aggregation returns an array, take the first element
    const result = teacherProfile[0];
    console.log(result, "result");
    if (!teacherProfile)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    res.json({
      success: true,
      message: "Teacher Profile fetched successfully",
      data: result,
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

exports.editSubjects = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subjectsTaught } = req.body;
    const user = await TeacherProfileModel.findOneAndUpdate(
      { userId },
      {
        subjectsTaught,
      }
    );
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    res.json({
      success: true,
      message: "Subjects Updated successfully",
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};
exports.editLanguages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { languagesSpoken } = req.body;
    const user = await TeacherProfileModel.findOneAndUpdate(
      { userId },
      {
        languagesSpoken,
      }
    );
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    res.json({
      success: true,
      message: "Languages Updated successfully",
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};
exports.editExperience = async (req, res) => {
  try {
    const userId = req.user.id;
    const { experience } = req.body;
    const user = await TeacherProfileModel.findOneAndUpdate(
      { userId },
      {
        experience,
      }
    );
    if (!user)
      res.status(404).json({ success: false, message: "User not found" });
    res.json({
      success: true,
      message: "Experience Updated successfully",
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};
exports.editEducation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { education } = req.body;
    const user = await TeacherProfileModel.findOneAndUpdate(
      { userId },
      {
        education,
      }
    );
    if (!user)
      res.status(404).json({ success: false, message: "User not found" });
    res.json({
      success: true,
      message: "Eduation Updated successfully",
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};
exports.getAvailabilityCalendar = async (req, res) => {
  try {
    const userId = req.user.id;
    const teacherCalendar = await CalenderModel.findOne({ userId });
    if (!teacherCalendar)
      return res.json({
        success: false,
        message: "Availablity Calendar not found",
      });
    res.json({
      success: true,
      message: "Availablity Calendar fetched successfully",
      data: teacherCalendar,
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};
exports.editAvailabilityCalendar = async (req, res) => {
  try {
    const userId = req.user.id;
    const teacherProfile = await TeacherProfileModel.findOne({ userId });
    if (!teacherProfile)
      return res.json({ success: false, message: "Teacher Profile not found" });
    const { availability } = req.body;
    let teacherCalendar = await CalenderModel.findOneAndUpdate(
      { userId },
      { availability },
      { new: true }
    ).lean();
    console.log(teacherCalendar, "sdf");
    if (!teacherCalendar) {
      teacherCalendar = await CalenderModel.create({ userId, availability });
      teacherProfile.calendar = teacherCalendar._id;
      await teacherProfile.save();
    }
    res.json({
      success: true,
      message: "Availablity Calendar Updated successfully",
      data: teacherCalendar,
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

exports.editPaymentInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    const useremail = req.user.email;

    const { paymentInfo } = req.body;

    if (
      !paymentInfo.accountNumber ||
      !paymentInfo.ifscCode ||
      !paymentInfo.bankName
    ) {
      return res.status(400).json({
        success: false,
        message: "Bank details are incomplete",
      });
    }

    const user = await TeacherProfileModel.findOne({ userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.paymentInfo = paymentInfo;
    await user.save();

    let stripeResponse;

    if (!user.paymentInfo.stripeBankAccountId) {
      console.log("Creating new Stripe connected account...");
      stripeResponse = await createConnectedAccount(
        userId,
        useremail,
        paymentInfo
      );
    } else {
      console.log("Updating existing Stripe account...");
      stripeResponse = await updateBankAccount(
        user.stripeAccountId,
        paymentInfo
      );
    }

    if (!stripeResponse.success) {
      return res.status(500).json({
        success: false,
        message: "Payment Info updated, but Stripe beneficiary creation failed",
        error: stripeResponse.error,
      });
    }

    return res.json({
      success: true,
      message: "Payment Info updated and Stripe account handled successfully",
      data: user,
      stripeResponse: stripeResponse.message,
    });
  } catch (error) {
    console.error("Error updating payment info:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

const createConnectedAccount = async (userId, email, paymentInfo) => {
  try {
    console.log(userId, "userId samosa");

    // ✅ Create a Connected Account
    const account = await stripe.accounts.create({
      type: "custom",
      country: "US",
      email,
      business_type: "individual",
      capabilities: {
        transfers: { requested: true },
      },
      // tos_acceptance: {
      //   service_agreement: "recipient",
      // },
    });

    // console.log("Stripe account created successfully: by kd", account);

    if (!account || !account.id) {
      throw new Error("Failed to retrieve Stripe account ID.");
    }

    if (
      !paymentInfo ||
      !paymentInfo.bankName ||
      !paymentInfo.accountNumber ||
      !paymentInfo.ifscCode
    ) {
      throw new Error("Bank details are missing or incomplete.");
    }

    // ✅ Attach Bank Account to the Connected Account
    const bankAccount = await stripe.accounts.createExternalAccount(
      account.id,
      {
        external_account: {
          object: "bank_account",
          country: "US",
          currency: "USD",
          account_holder_name: paymentInfo.name,
          account_holder_type: "individual",
          account_number: paymentInfo.accountNumber,
          routing_number: paymentInfo.ifscCode,
        },
      }
    );

    // console.log("Bank account added successfully:", bankAccount.id);

    // ✅ Save Stripe Account ID & Bank Account ID in Database
    const updatedProfile = await TeacherProfileModel.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) }, 
      {
        "paymentInfo.stripeBankAccountId": bankAccount.id,
        stripeAccountId: account.id,
      },
      { new: true }
    );
    console.log(updatedProfile, "updatedProfile");

    return {
      success: true,
      message: "Stripe account and bank details added successfully",
      account,
      bankAccount,
    };
  } catch (error) {
    console.error("Error creating Stripe account:", error);
    return { success: false, error: error.message };
  }
};

const updateBankAccount = async (stripeAccountId, paymentInfo) => {
  try {
    const account = await stripe.accounts.retrieve(stripeAccountId);
    if (!account) {
      return { success: false, error: "Stripe account not found" };
    }

    const newBankAccount = await stripe.accounts.createExternalAccount(
      stripeAccountId,
      {
        external_account: {
          object: "bank_account",
          country: "ZA",
          currency: "ZAR",
          account_holder_name: paymentInfo.name,
          account_holder_type: "individual",
          account_number: paymentInfo.accountNumber,
          routing_number: paymentInfo.ifscCode,
        },
      }
    );

    return {
      success: true,
      message: "Stripe bank details updated successfully",
      newBankAccount,
    };
  } catch (error) {
    console.error("Error updating Stripe bank details:", error);
    return { success: false, error: error.message };
  }
};


exports.getBankAccountDetails = async (req, res) => {
  try {
    const userId = req.user.id; 

    const teacherProfile = await TeacherProfileModel.findOne({ userId });

    if (!teacherProfile || !teacherProfile.stripeAccountId || !teacherProfile.paymentInfo.stripeBankAccountId) {
      return res.status(404).json({
        success: false,
        message: "Stripe account or bank account not found for this user",
      });
    }

    const { stripeAccountId, paymentInfo } = teacherProfile;

    // ✅ Retrieve the bank account details from Stripe
    const bankAccount = await stripe.accounts.retrieveExternalAccount(
      stripeAccountId, // The connected Stripe account ID
      paymentInfo.stripeBankAccountId // The external bank account ID
    );

    res.json({
      success: true,
      message: "Bank account details retrieved successfully",
      data: bankAccount,
    });

  } catch (error) {
    console.error("Error retrieving bank account details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve bank account details",
      error: error.message,
    });
  }
};

// exports.editPaymentInfo = async (req, res) => {
//   try {
//     console.log(req.user, "user");
//     const userId = req.user.id;

//     const { paymentInfo } = req.body;

//     const user = await TeacherProfileModel.findOneAndUpdate(
//       { userId },
//       {
//        $set:{ paymentInfo},
//       },
//       {
//         new: true,
//       }
//     );
//     if (!user)
//       res.status(404).json({ success: false, message: "User not found" });
//     res.json({
//       success: true,
//       message: "Payment Info Updated successfully",
//       data: user,
//     });
//   } catch (error) {
//     console.log(error);
//     res.json({
//       success: false,
//       message: "Something went wrong",
//       error: error.message,
//     });
//   }
// };

exports.editTutionSlots = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tutionSlots } = req.body;
    const user = await TeacherProfileModel.findOneAndUpdate(
      { userId },
      {
        tutionSlots,
      }
    );
    if (!user)
      res.status(404).json({ success: false, message: "User not found" });
    res.json({
      success: true,
      message: "Tution Slots Updated successfully",
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};
