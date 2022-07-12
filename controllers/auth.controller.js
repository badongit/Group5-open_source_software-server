const asyncHandle = require("../middlewares/asyncHandle");
const statusCodeEnum = require("../enum/status-code.enum");
const ResponseBuilder = require("../helpers/response-builder");
const errorEnum = require("../enum/error.enum");
const msgEnum = require("../enum/msg.enum");
const ErrorResponse = require("../helpers/error-response");
module.exports = {
  getMe: asyncHandle(async (req, res, next) => {
    const user = await User.findById(req.user._id);
  
    if (!user) {
      return next(
        new ErrorResponse(
        msgEnum.NOT_FOUND.replace(":{entity}", "User"),
        statusCodeEnum.NOT_FOUND
        )
      );
    }
  
    res.status(statusCodeEnum.OK).json({
      data: {
        user,
      },
    });
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
  
    res.status(statusCodeEnum.OK).json(new ResponseBuilder({ user }));
  }),
  
  changePassword: asyncHandle(async (req, res, next) => {
    const { oldPassword, newPassword } = req.body;
    const { user } = req;
  
    if (!(oldPassword && newPassword)) {
      return next(errorEnum.INVALID_PASSWORD);
    }
  
    if (oldPassword === newPassword) {
      return next(
        new ErrorResponse(
          "The new password must be different from the current password",
          400
        )
      );
    }
  
    if (!user.matchPassword(oldPassword)) {
      return next(errorEnum.INVALID_PASSWORD);
    }
  
    user.password = newPassword;
    await user.save();
  
    res.status(statusCodeEnum.OK).json(new ResponseBuilder({ user }));
  }),
};
