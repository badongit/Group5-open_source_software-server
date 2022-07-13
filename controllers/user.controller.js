const asyncHandle = require("../middlewares/asyncHandle");
const statusCodeEnum = require("../enum/status-code.enum");
const msgCodeEnum = require("../enum/msg.enum");
const ResponseBuilder = require("../helpers/response-builder");
const User = require("../models/User");

module.exports = {
  //@route [GET] /
  getAll: asyncHandle(async (req, res, next) => {
    const limit = req.query.limit || process.env.LIMIT;
    const page = req.query.page || 1;
    const keySearch = new RegExp(req.query.search || "");
    var users = await User.find({
      displayname: { $regex: keySearch, $options: "i" },
    })
      .skip(limit * page - limit)
      .limit(limit)
      .sort("-createdAt");
    var obj = {
      users,
      pagination: {
        total: users.length,
        next: {
          page,
          limit,
          startIndex: limit * page - limit,
        },
      },
    };
    return res.status(statusCodeEnum.OK).json(new ResponseBuilder(obj));
  }),
  getById: asyncHandle(async (req, res, next) => {
    var userID = req.params.id;
    try {
      var user = await User.findById(userID);
    } catch (error) {
      return next(new ErrorResponse(error));
    }
    return res.status(statusCodeEnum.OK).json(new ResponseBuilder(user));
  }),
};
