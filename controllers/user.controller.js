const asyncHandle = require("../middlewares/asyncHandle");
const ResponseBuilder = require("../helpers/response-builder");
const statusCodeEnum = require("../enum/status-code.enum");
const User = require("../models/User");

module.exports = {
  //@route [GET] /api/users
  getUsers: asyncHandle(async (req, res, next) => {
    res.status(200).json(res.advancedResults);
    res
      .status(statusCodeEnum.OK)
      .json(new ResponseBuilder(res.advancedResults).build());
  }),
  //@route [GET] /api/users:id
  getUserById: asyncHandle(async (req, res, next) => {
    var userID = req.params.id;

    var user = await User.findById(userID);

    return res.status(statusCodeEnum.OK).json(new ResponseBuilder(user));
  }),
};
