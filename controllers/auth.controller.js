const asyncHandle = require("../middlewares/asyncHandle");
const statusCodeEnum = require("../enum/status-code.enum");
const ResponseBuilder = require("../helpers/response-builder");
const ErrorResponse = require("../helpers/error-response");
const User = require("../models/User");
const errorEnum = require("../enum/error.enum");
const msgEnum = require("../enum/msg.enum");
const isAllowType = require("../helpers/is-allow-type");
const driveServices = require("../googledrive/services");
const redisClient = require("../configs/redis");
const configuration = require("../configs/configuration");
const sendMail = require("../helpers/sendMail");
const crypto = require("crypto");

module.exports = {
  //@route [POST] /auth/register
  register: asyncHandle(async (req, res, next) => {
    const { username, email, password, displayname } = req.body;

    if (!(username && email && password && displayname)) {
      return next(errorEnum.MISSING_DATA);
    }

    const checkEmail = await User.findOne({ email });
    if (checkEmail) {
      return next(
        new ErrorResponse(msgEnum.EXISTS_EMAIL, statusCodeEnum.BAD_REQUEST)
      );
    }

    const checkUsername = await User.findOne({ username });
    if (checkUsername) {
      return next(
        new ErrorResponse(msgEnum.EXISTS_USERNAME, statusCodeEnum.BAD_REQUEST)
      );
    }

    const user = await User.create({
      username,
      email,
      password,
      displayname,
    });

    const accessToken = user.signAccessToken();
    const refreshToken = await user.signRefreshToken();

    return res.status(statusCodeEnum.CREATED).json(
      new ResponseBuilder({
        user,
        accessToken,
        refreshToken,
      }).build()
    );
  }),

  //@route [POST] /auth/login
  login: asyncHandle(async (req, res, next) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return next(errorEnum.MISSING_DATA);
    }

    const user = await User.findOne({ username }).select("password");
    if (!user) {
      return next(
        new ErrorResponse(msgEnum.INCORRECT_INFO, statusCodeEnum.BAD_REQUEST)
      );
    }

    if (!user.matchPassword(password)) {
      return next(
        new ErrorResponse(msgEnum.INCORRECT_INFO, statusCodeEnum.BAD_REQUEST)
      );
    }

    const accessToken = user.signAccessToken();
    const refreshToken = await user.signRefreshToken();

    res.status(statusCodeEnum.OK).json(
      new ResponseBuilder({
        accessToken,
        refreshToken,
      }).build()
    );
  }),

  //@route [POST] /auth/new-token
  newToken: asyncHandle(async (req, res, next) => {
    const accessToken = req.user.signAccessToken();

    res
      .status(statusCodeEnum.OK)
      .json(new ResponseBuilder({ accessToken }).build());
  }),

  //@route [PUT] /auth/avatar
  changeAvatar: asyncHandle(async (req, res, next) => {
    const avatarFile = req.files.avatar;
    const user = req.user;

    if (!avatarFile) {
      return next(errorEnum.FILE_MISSING);
    }

    if (!isAllowType(avatarFile.mimetype)) {
      return next(
        new ErrorResponse(
          msgEnum.FILE_NOT_SUPPORT.replace(":{type}", avatarFile.mimetype),
          statusCodeEnum.BAD_REQUEST
        )
      );
    }

    const response = await driveServices.uploadFileToDrive(avatarFile, {
      name: user._id,
      parents: process.env.DRIVE_AVATAR_PARENTS,
    });

    if (user.avatarId) {
      await driveServices.deleteFileInDrive(user.avatarId);
    }

    const fileId = response.data.id;

    const avatarLink = await driveServices.generateLinkFileByID(fileId);

    user.avatarLink = avatarLink;
    user.avatarId = fileId;
    await user.save();

    return res.status(statusCodeEnum.OK).json(new ResponseBuilder({ user }));
  }),

  //@route [GET] /auth/logout
  logout: asyncHandle(async (req, res, next) => {
    await redisClient.del(req.user._id.toString());

    return res.status(statusCodeEnum.OK).json(new ResponseBuilder());
  }),

  //@route [GET] /auth/profile
  getMe: asyncHandle(async (req, res, next) => {
    return res
      .status(statusCodeEnum.OK)
      .json(new ResponseBuilder({ user: req.user }).build());
  }),

  //@route [PUT] /auth/profile
  updateProfile: asyncHandle(async (req, res, next) => {
    const {  dateOfBirth, gender, displayname} = req.body;
    const fieldsUpdate = {
      dateOfBirth, gender, displayname
    };

    for (let key in fieldsUpdate) {
      if (!fieldsUpdate[key]) {
        delete fieldsUpdate[key];
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, fieldsUpdate, {
      new: true,
      runValidators: true,
    });

    return res
      .status(statusCodeEnum.OK)
      .json(new ResponseBuilder({ user }).build());
  }),

  //@route [PUT] /auth/password
  changePassword: asyncHandle(async (req, res, next) => {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");

    if (!(oldPassword && newPassword) || oldPassword === newPassword) {
      return next(errorEnum.BAD_REQUEST);
    }

    if (!user.matchPassword(oldPassword)) {
      return next(errorEnum.INVALID_PASSWORD);
    }

    user.password = newPassword;
    await user.save();

    return res
      .status(statusCodeEnum.OK)
      .json(new ResponseBuilder({ user }).build());
  }),

  forgotPassword: asyncHandle(async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
      return next(
        new ErrorResponse(msgEnum.INVALID_MAIL, statusCodeEnum.BAD_REQUEST)
      );
    }

    const user = await User.findOne({ email });

    if (!user) {
      return next(
        new ErrorResponse(
          msgEnum.NOT_FOUND.replace(":{entity}", "user"),
          statusCodeEnum.NOT_FOUND
        )
      );
    }

    const resetPasswordToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: true });

    const resetURL = `${process.env.CLIENT_URI}/reset-password/${resetPasswordToken}`;
    const html = `<p>please click here ${resetURL} to update your password. 
    the link lasts in  ${+process.env.RESET_TOKEN_EXPIRE} minutes.</p>`;

    const options = {
      email,
      subject: "Forgot password ?",
      html,
    };

    sendMail(options);

    return res
      .status(statusCodeEnum.OK)
      .json(new ResponseBuilder().withMessage(msgEnum.CHECK_EMAIL).build());
  }),

  resetPassword: asyncHandle(async (req, res, next) => {
    if (!req.params.token) {
      return next(
        new ErrorResponse(msgEnum.INVALID_TOKEN, statusCodeEnum.BAD_REQUEST)
      );
    }

    const token = crypto
      .createHash("sha256", process.env.RESET_TOKEN_SECRET)
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpired: { $gt: Date.now() },
    });

    if (!user) {
      return next(
        new ErrorResponse(msgEnum.INVALID_TOKEN, statusCodeEnum.BAD_REQUEST)
      );
    }

    const { password } = req.body;
    if (!password) {
      return next(new ErrorResponse(errorEnum.BAD_REQUEST));
    }

    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpired = null;
    await user.save();

    res.status(statusCodeEnum.OK).json(new ResponseBuilder().build());
  }),
};
