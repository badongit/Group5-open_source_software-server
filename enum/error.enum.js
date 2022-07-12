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
  FILE_MISSING: new ErrorResponse(
    msgEnum.FILE_MISSING,
    statusCodeEnum.BAD_REQUEST
  ),
};
