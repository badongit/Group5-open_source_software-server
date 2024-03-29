const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const redisClient = require("../configs/redis");
const jwt = require("jsonwebtoken");

const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, "username is required"],
      unique: [true, "username is taken"],
      minlength: [8, "username at least 8 characters"],
      maxlength: [20, "username up to 20 characters"],
      trim: true,
    },
    email: {
      type: String,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "email does not match",
      ],
      required: [true, "email is required"],
      unique: [true, "email is taken"],
      trim: true,
    },
    password: {
      type: String,
      required: [true, "password is required"],
      trim: true,
      minlength: [8, "password at least 8 characters"],
      select: false,
    },
    displayname: {
      type: String,
      required: [true, "display name is required"],
      trim: true,
      minlength: [2, "display name at least 2 characters"],
      maxlength: [30, "display name up to 30 characters"],
    },
    gender: {
      type: String,
      enum: {
        values: ["male", "female", "other"],
        message: "gender {VALUE} is not supported",
      },
    },
    dateOfBirth: Date,
    avatarLink: {
      type: String,
      default:
        "https://drive.google.com/uc?id=1ZIMBibM4hIkyso_U6G_kn7LBUvXmOkCe",
    },
    avatarId: String,
    isOnline: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpired: {
      type: Date,
      select: false,
    },
    blocked: [{ type: Schema.Types.ObjectId, ref: "users" }],
  },
  {
    timestamps: true,
  }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(15).toString("hex");

  this.resetPasswordToken = crypto
    .createHash("sha256", process.env.RESET_TOKEN_SECRET)
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpired =
    Date.now() + +process.env.RESET_TOKEN_EXPIRE * 60 * 1000;

  return resetToken;
};

UserSchema.methods.matchPassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};

UserSchema.methods.signRefreshToken = async function () {
  const refreshToken = jwt.sign(
    { id: this._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRE }
  );

  await redisClient.set(this._id.toString(), refreshToken);

  return refreshToken;
};

UserSchema.methods.signAccessToken = function () {
  const accessToken = jwt.sign(
    { id: this._id },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRE }
  );

  return accessToken;
};

UserSchema.index({
  displayname: "text",
});

module.exports = mongoose.model("users", UserSchema);
