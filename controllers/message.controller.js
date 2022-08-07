const errorEnum = require("../enum/error.enum");
const msgEnum = require("../enum/msg.enum");
const statusCodeEnum = require("../enum/status-code.enum");
const ErrorResponse = require("../helpers/error-response");
const getMany = require("../helpers/get-many");
const ResponseBuilder = require("../helpers/response-builder");
const asyncHandle = require("../middlewares/asyncHandle");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

module.exports = {
  getMessages: asyncHandle(async (req, res, next) => {
    const { conversationId } = req.params;

    if (!conversationId) {
      return next(errorEnum.BAD_REQUEST);
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return next(
        new ErrorResponse(
          msgEnum.NOT_FOUND.replace(":{entity}", "conversation"),
          statusCodeEnum.NOT_FOUND
        )
      );
    }

    if (!conversation.members.includes(req.user._id)) {
      return next(errorEnum.FORBIDDEN);
    }

    const rawQuery = { ...req.query, conversation: conversationId };

    const { data: messages, pagination } = await getMany(Message, rawQuery, [
      "sender",
    ]);

    return res
      .status(statusCodeEnum.OK)
      .json(
        new ResponseBuilder({ messages }).withPagination(pagination).build()
      );
  }),
};
