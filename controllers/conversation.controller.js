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

        const conversation = await Conversation.findById(req.params.conversationId)
            .populate({ path: "members", select: "-username -avatarId" })
            .populate({ path: "admin", select: "-username -avatarId" })
            .populate("lastMessage");

        if (!conversation) {
            return next(
                new ErrorResponse(
                  msgEnum.NOT_FOUND,
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
            return next(
                new ErrorResponse(
                  msgEnum.FORBIDDEN,
                  statusCodeEnum.FORBIDDEN
                )
              );
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

        return res.status(statusCodeEnum.OK).json(new ResponseBuilder({ conversation }));
}),
}