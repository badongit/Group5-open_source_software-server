const asyncHandle = require("../middlewares/asyncHandle");
const statusCodeEnum = require("../enum/status-code.enum");
const ResponseBuilder = require("../helpers/response-builder");
const errorEnum = require("../enum/error.enum");
const isAllowType = require("../helpers/is-allow-type");
const msgEnum = require("../enum/msg.enum");
const ErrorResponse = require("../helpers/error-response");
const redisClient = require("../configs/redis");

module.exports = {
  //@route [PUT] /auth/avatar
  changeAvatar: asyncHandle(async (req, res, next) => {
    const avatarFile = req.files.avatar;

    if (!avatarFile) {
      return next(errorEnum.FILE_MISSING);
    }

    if (!isAllowType(avatarFile.mimetype)) {
      return next(
        new ErrorResponse(
          msgEnum.FILE_NOT_SUPPORT.replace(":{type}", avatarFile.mimetype),
          statusCodeEnum.BAD_REQUEST
        )
      );
    }

    const response = await driveServices.uploadFileToDrive(avatarFile, {
      name: user._id,
      parents: process.env.DRIVE_AVATAR_ID,
    });

    if (user.avatarId) {
      await driveServices.deleteFileInDrive(user.avatarId);
    }

    const fileId = response.data.id;

    let avatarLink = await driveServices.generateLinkFileByID(fileId);
    avatarLink = avatarLink.replace("&export=download", "");

    user.avatarLink = avatarLink;
    user.avatarId = fileId;
    await user.save();

    return res.status(statusCodeEnum.OK).json(new ResponseBuilder({ user }));
  }),

  //@route [GET] /auth/logout
  logout: asyncHandle(async (req, res, next) => {
    await redisClient.del(req.user._id.toString());

    return res.status(statusCodeEnum.OK).json(new ResponseBuilder());
  }),
};
