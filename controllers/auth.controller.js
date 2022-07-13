const asyncHandle = require("../middlewares/asyncHandle");
const statusCodeEnum = require("../enum/status-code.enum");
const ResponseBuilder = require("../helpers/response-builder");
const errorEnum = require("../enum/error.enum");
const User = require("../models/User");

module.exports = {
  getMe: asyncHandle(async (req, res, next) => {
    return res
      .status(statusCodeEnum.OK)
      .json(new ResponseBuilder({ user: req.user }).build());
  }),

  updateProfile: asyncHandle(async (req, res, next) => {
    const { email, displayname } = req.body;
    const fieldsUpdate = {
      email,
      displayname,
    };

    for (let key in fieldsUpdate) {
      if (!fieldsUpdate[key]) {
        delete fieldsUpdate[key];
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, fieldsUpdate, {
      new: true,
      runValidators: true,
    });

    return res
      .status(statusCodeEnum.OK)
      .json(new ResponseBuilder({ user }).build());
  }),

  changePassword: asyncHandle(async (req, res, next) => {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");

    if (!(oldPassword && newPassword) || oldPassword === newPassword) {
      return next(errorEnum.BAD_REQUEST);
    }

    if (!user.matchPassword(oldPassword)) {
      return next(errorEnum.INVALID_PASSWORD);
    }

    user.password = newPassword;
    await user.save();

    return res
      .status(statusCodeEnum.OK)
      .json(new ResponseBuilder({ user }).build());
  }),
};
