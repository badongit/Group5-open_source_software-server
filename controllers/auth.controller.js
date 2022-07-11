const asyncHandle = require("../middlewares/asyncHandle");
const statusCodeEnum = require("../enum/status-code.enum");
const ResponseBuilder = require("../helpers/response-builder");
const ErrorResponse = require("../helpers/error-response");
const User = require("../models/User");

module.exports = {
  //@route [GET] /
  index: asyncHandle((req, res, next) => {
    return res.status(statusCodeEnum.OK).json(new ResponseBuilder({}));
  }),

  //@route [POST] /register
  register: asyncHandle(async (req, res, next) => {
    const { username, email, password, displayname } = req.body;

    if (!(username && email && password && displayname)) {
      return res.status(statusCodeEnum.BAD_REQUEST).json({
        message: 'Missing information'
      })
    }

    const checkEmail = await User.findOne({ email });
    if (checkEmail) {
      return res.status(statusCodeEnum.BAD_REQUEST).json({
        message: 'Email already exists'
      })
    }

    const checkUsername = await User.findOne({ username });
    if (checkUsername) {
      return res.status(statusCodeEnum.BAD_REQUEST).json({
        success: false,
        message: 'Username already exists'
      })
    }

    const user = await User.create({
      username,
      email,
      password,
      displayname
    })

    const accessToken = user.signAccessToken();
    const refreshToken = await user.signRefreshToken();

    res.status(statusCodeEnum.CREATED).json({
      message: 'Your account has been registered successfully!',
      data: {
        user,
        accessToken,
        refreshToken
      }
    })
  }),

  //@route [POST] /login
  login: asyncHandle(async (req, res, next) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(statusCodeEnum.BAD_REQUEST).json({
        message: 'Missing information'
      })
    }

    const user = await User.findOne({ username }).select("password");
    if (!user) {
      return res.status(statusCodeEnum.BAD_REQUEST).json({
        message: 'Username or password is incorrect'
      })
    }

    if (!user.matchPassword(password)) {
      return res.status(statusCodeEnum.BAD_REQUEST).json({
        message: 'Password is incorrect'
      })
    }

    const accessToken = user.signAccessToken();
    const refreshToken = await user.signRefreshToken();

    res.status(statusCodeEnum.CREATED).json({
      message: 'Login successfully!',
      data: {
        accessToken,
        refreshToken
      }
    })
  }),

  //@route [POST] /new-token
  newToken: asyncHandle(async (req, res, next) => {
    const token = req.user.signAccessToken();

    res.status(statusCodeEnum.CREATED).json({
      message: 'Token has been refreshed successfully!',
      data: {
        token
      }
    })
  })
};
