const asyncHandle = require("../middlewares/asyncHandle");
const statusCodeEnum = require("../enum/status-code.enum");
const msgEnum = require("../enum/msg.enum");
const ResponseBuilder = require("../helpers/response-builder");
const ErrorResponse = require("../helpers/error-response");
const User = require("../models/User");
const errorEnum = require("../enum/error.enum");

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
};
