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
  MISSING_DATA: new ErrorResponse(
    msgEnum.MISSING_DATA,
    statusCodeEnum.BAD_REQUEST
  ),
};
