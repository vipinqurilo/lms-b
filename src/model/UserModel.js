const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema(
  {
    userId: { type: String },
    userName: { type: String, unique: true },
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: {
      type: { countryCode: { type: String }, number: { type: String } },
    },
    country: { type: String, required: true, default: "South Africa" },
    gender: { type: String, enum: ["male", "female"] },
    role: {
      type: String,
      enum: ["student", "teacher", "admin"],
      default: "student",
    },
    bio: { type: String, default: "" },
    profilePhoto: {
      type: String,
      default:
        "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png",
    },
    studentProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
    },
    teacherProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeacherProfile",
    },
    socialLinks: [{ name: { type: String }, url: { type: String } }],
    userStatus: {
      type: String,
      enum: ["active", "inactive", "pending"],
      default: "active",
    },
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
    },
    earnings: { type: Number, default: 0 },
    forgotPasswordToken: { type: String, default: "" },
    forgotPasswordUsed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const UserModel = mongoose.model("User", UserSchema);
module.exports = UserModel;
