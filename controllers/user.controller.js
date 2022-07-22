const asyncHandle = require("../middlewares/asyncHandle");
const ResponseBuilder = require("../helpers/response-builder");
const statusCodeEnum = require("../enum/status-code.enum");
const User = require("../models/User");
const ErrorResponse = require("../helpers/error-response");
const msgEnum = require("../enum/msg.enum");

module.exports = {
  //@route [GET] /api/users
  getUsers: asyncHandle(async (req, res, next) => {
    res
      .status(statusCodeEnum.OK)
      .json(
        new ResponseBuilder({ users: res.advancedResults.data })
          .withPagination(res.advancedResults.pagination)
          .build()
      );
  }),
  //@route [GET] /api/users/:id
  getUserById: asyncHandle(async (req, res, next) => {
    const userId = req.params.id;

    const user = await User.findById(userId).lean();

    if (!user) {
      return next(
        new ErrorResponse(
          msgEnum.NOT_FOUND.replace(":{entity}", "user"),
          statusCodeEnum.NOT_FOUND
        )
      );
    }

    return res.status(statusCodeEnum.OK).json(new ResponseBuilder({ user }));
  }),
};
