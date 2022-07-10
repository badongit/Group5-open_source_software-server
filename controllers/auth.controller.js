const asyncHandle = require("../middlewares/asyncHandle");
const statusCodeEnum = require("../enum/status-code.enum");
const ResponseBuilder = require("../helpers/response-builder");

module.exports = {
  //@route [GET] /
  index: asyncHandle((req, res, next) => {
    return res.status(statusCodeEnum.OK).json(new ResponseBuilder({}));
  }),
};
