const ErrorResponse = require("../helpers/error-response");
const msgEnum = require("./msg.enum");
const statusCodeEnum = require("./status-code.enum");

module.exports = {
  BAD_REQUEST: new ErrorResponse(
    msgEnum.BAD_REQUEST,
    statusCodeEnum.BAD_REQUEST
  ),
  UNAUTHORIZED: new ErrorResponse(
    msgEnum.UNAUTHORIZED,
    statusCodeEnum.UNAUTHORIZED
  ),
  INVALID_PASSWORD: new ErrorResponse(
    msgEnum.INVALID_PASSWORD,
    statusCodeEnum.BAD_REQUEST
  ),
};
