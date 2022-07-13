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

    let avatarLink = await driveServices.generateLinkFileByID(fileId);
    avatarLink = avatarLink.replace("&export=download", "");

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
    const user = await User.findById(req.user._id);

    if (!user) {
      return next(
        new ErrorResponse(
          msgEnum.NOT_FOUND.replace(":{entity}", "User"),
          statusCodeEnum.NOT_FOUND
        )
      );
    }

    res.status(statusCodeEnum.OK).json({
      data: {
        user,
      },
    });
  }),

  //@route [PUT] /auth/profile
  updateProfile: asyncHandle(async (req, res, next) => {
    const { email, displayname } = req.body;
    const fieldsUpdate = {
      email,
      displayname,
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

    res.status(statusCodeEnum.OK).json(new ResponseBuilder({ user }));
  }),

  //@route [PUT] /auth/password
  changePassword: asyncHandle(async (req, res, next) => {
    const { oldPassword, newPassword } = req.body;
    const { user } = req;

    if (!(oldPassword && newPassword)) {
      return next(errorEnum.INVALID_PASSWORD);
    }

    if (oldPassword === newPassword) {
      return next(
        new ErrorResponse(
          "The new password must be different from the current password",
          400
        )
      );
    }

    if (!user.matchPassword(oldPassword)) {
      return next(errorEnum.INVALID_PASSWORD);
    }

    user.password = newPassword;
    await user.save();

    res.status(statusCodeEnum.OK).json(new ResponseBuilder({ user }));
  }),
};
