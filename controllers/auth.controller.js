const asyncHandle = require("../middlewares/asyncHandle");
const statusCodeEnum = require("../enum/status-code.enum");
const ResponseBuilder = require("../helpers/response-builder");
const ErrorResponse = require("../helpers/error-response");
const User = require("../models/User");
const errorEnum = require("../enum/error.enum");
const msgEnum = require("../enum/msg.enum");

module.exports = {
  //@route [GET] /
  index: asyncHandle((req, res, next) => {
    return res.status(statusCodeEnum.OK).json(new ResponseBuilder({}));
  }),
};
