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
      return res.status(statusCodeEnum.BAD_REQUEST).json(
        new ResponseBuilder()
          .withMessage("Missing information")
          .withCode(statusCodeEnum.BAD_REQUEST)
          .build()
        );
    }

    const checkEmail = await User.findOne({ email });
    if (checkEmail) {
      return res.status(statusCodeEnum.BAD_REQUEST).json(
        new ResponseBuilder()
          .withMessage("Email already exists")
          .withCode(statusCodeEnum.BAD_REQUEST)
          .build()
        );
    }

    const checkUsername = await User.findOne({ username });
    if (checkUsername) {
      return res.status(statusCodeEnum.BAD_REQUEST).json(
        new ResponseBuilder()
          .withMessage("Username already exists")
          .withCode(statusCodeEnum.BAD_REQUEST)
          .build()
        );
    }

    const user = await User.create({
      username,
      email,
      password,
      displayname
    })

    const accessToken = user.signAccessToken();
    const refreshToken = await user.signRefreshToken();

    res.status(statusCodeEnum.OK).json(
      new ResponseBuilder({
        user,
        accessToken,
        refreshToken
      })
        .withMessage("Your account has been registered successfully!")
        .build()
      );
  }),

  //@route [POST] /login
  login: asyncHandle(async (req, res, next) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(statusCodeEnum.BAD_REQUEST).json(
        new ResponseBuilder()
          .withMessage("Missing information")
          .withCode(statusCodeEnum.BAD_REQUEST)
          .build()
      );
    }

    const user = await User.findOne({ username }).select("password");
    if (!user) {
      return res.status(statusCodeEnum.BAD_REQUEST).json(
        new ResponseBuilder()
          .withMessage("Username or password is incorrect")
          .withCode(statusCodeEnum.BAD_REQUEST)
          .build()
      );
    }

    if (!user.matchPassword(password)) {
      return res.status(statusCodeEnum.BAD_REQUEST).json(
        new ResponseBuilder()
          .withMessage("Username or password is incorrect")
          .withCode(statusCodeEnum.BAD_REQUEST)
          .build()
      );
    }

    const accessToken = user.signAccessToken();
    const refreshToken = await user.signRefreshToken();

    res.status(statusCodeEnum.OK).json(
      new ResponseBuilder({
        accessToken,
        refreshToken
      })
        .withMessage("Login successfully!")
        .build()
      );
  }),

  //@route [POST] /new-token
  newToken: asyncHandle(async (req, res, next) => {
    const accessToken = req.user.signAccessToken();

    res.status(statusCodeEnum.OK).json(
      new ResponseBuilder({ accessToken })
        .withMessage("Token has been refreshed successfully!")
        .build()
      );
  })
};
