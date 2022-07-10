const errorEnum = require("../enum/error.enum");
const ErrorResponse = require("../helpers/error-response");
const asyncHandle = require("./asyncHandle");
const jwt = require("jsonwebtoken");
const msgEnum = require("../enum/msg.enum");
const statusCodeEnum = require("../enum/status-code.enum");
const User = require("../models/User");

module.exports = {
  verifyAccessToken: asyncHandle(async (req, res, next) => {
    const { authorization } = req.headers;

    if (!authorization || !authorization.startsWith("Bearer")) {
      return next(errorEnum.UNAUTHORIZED);
    }

    const token = authorization.split(" ")[1];

    const { id } = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(id);

    if (!user) {
      return next(
        new ErrorResponse(
          msgEnum.NOT_FOUND.replace(":{entity}", "user"),
          statusCodeEnum.NOT_FOUND
        )
      );
    }

    req.user = user;
    next();
  }),

  verifyRefreshToken: asyncHandle(async (req, res, next) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(errorEnum.UNAUTHORIZED);
    }

    const { id } = await jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const redisToken = await redisClient.get(id.toString());

    if (!redisToken) {
      return next(errorEnum.UNAUTHORIZED);
    }

    if (redisToken !== refreshToken) {
      return next(errorEnum.UNAUTHORIZED);
    }

    const user = await User.findById(id);

    if (!user) {
      return next(
        new ErrorResponse(
          msgEnum.NOT_FOUND.replace(":{entity}", "user"),
          statusCodeEnum.NOT_FOUND
        )
      );
    }

    req.user = user;
    next();
  }),
};
