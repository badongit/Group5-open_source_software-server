const Conversation = require("../models/Conversation");
const asyncHandle = require("../middlewares/asyncHandle");
const statusCodeEnum = require("../enum/status-code.enum");
const ResponseBuilder = require("../helpers/response-builder");
const ErrorResponse = require("../helpers/error-response");
const errorEnum = require("../enum/error.enum");
const msgEnum = require("../enum/msg.enum");
const isAllowType = require("../helpers/is-allow-type");
const driveServices = require("../googledrive/services");

module.exports = {
  //@route [PUT] /conversations/:conversationId/photo
  changePhotoLink: asyncHandle(async (req, res, next) => {
    const photoFile = req.files.photo;

    if (!photoFile) {
      return next(errorEnum.FILE_MISSING);
    }

    if (!isAllowType(photoFile.mimetype)) {
      return next(
        new ErrorResponse(
          msgEnum.FILE_NOT_SUPPORT.replace(":{type}", photoFile.mimetype),
          statusCodeEnum.BAD_REQUEST
        )
      );
    }

    const conversation = await Conversation.findOne({
      _id: req.params.conversationId,
      type: "group",
    })
      .populate({ path: "members", select: "-username -avatarId" })
      .populate({ path: "admin", select: "-username -avatarId" })
      .populate("lastMessage");

    if (!conversation) {
      return next(
        new ErrorResponse(
          msgEnum.NOT_FOUND.replace(":{entity}", "conversation"),
          statusCodeEnum.NOT_FOUND
        )
      );
    }

    if (
      !(
        conversation.members.findIndex(
          (member) => member._id.toString() === req.user._id.toString()
        ) + 1
      )
    ) {
      return next(errorEnum.FORBIDDEN);
    }

    const response = await driveServices.uploadFileToDrive(photoFile, {
      name: conversation._id,
    });

    if (conversation.photoId) {
      await driveServices.deleteFileInDrive(conversation.photoId);
    }

    const fileId = response.data.id;
    let photoLink = await driveServices.generateLinkFileByID(fileId);
    photoLink = photoLink.replace("&export=download", "");

    conversation.photoLink = photoLink;
    conversation.photoId = fileId;
    await conversation.save();

    return res
      .status(statusCodeEnum.OK)
      .json(new ResponseBuilder({ conversation }).build());
  }),

    changeRole: asyncHandle(async (req, res, next) => {
        const { userId, role } = req.body;

        if (!role || !userId) {
            return next(errorEnum.BAD_REQUEST);
        }

        const conversation = await Conversation.findById(req.params.conversationId);

        if (!conversation) {
            return next(errorEnum.BAD_REQUEST);
        }

        const isMember = conversation.members.includes(userId);

        if (!isMember) {
            return next(
                new ErrorResponse(msgEnum.NOT_MEMBER, statusCodeEnum.BAD_REQUEST)
            );
        }

        if (!['admin', 'members'].includes(role)) {
            return next(
                new ErrorResponse(msgEnum.INVALID_ROLE, statusCodeEnum.BAD_REQUEST)
            );
        }

        const isAdmin = conversation.admin.includes(userId);

        if (role === "admin" && !isAdmin) {
            conversation.admin = conversation.admin.concat(userId);
            await conversation.save();
        }

        if (role === "members" && isAdmin) {
            conversation.admin = conversation.admin.filter(
                (ad) => ad._id.toString() !== userId
            );

            if (!conversation.admin.length) {
                conversation.admin = conversation.admin.concat(conversation.members[0]);
            }
            await conversation.save();
        }

        await conversation.populate([
            { path: "members", select: "-username -avatarId" },
            { path: "admin", select: "-username -avatarId" },
            "lastMessage",
        ]);

        res.status(200).json({
            message: "success",
            data: {
                conversation,
            },
        });
    }),
};
