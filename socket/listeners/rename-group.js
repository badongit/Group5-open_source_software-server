const { default: mongoose } = require("mongoose");
const Conversation = require("../../models/Conversation");
const Message = require("../../models/Message");
const socketEvent = require("../constants/socket-event");
const socketMsg = require("../constants/socket-msg");

module.exports = (io, socket) => async (req) => {
  try {
    const { conversationId, title } = req;

    if (!conversationId || !title) {
      return socket.emit(socketEvent.ERROR, { message: socketMsg.BAD_REQUEST });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      members: socket.currentUser._id,
      type: "group",
    });

    if (!conversation) {
      return socket.emit(socketEvent.ERROR, {
        message: socketMsg.NOT_FOUND.replace(":{entity}", "conversation"),
      });
    }

    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const messageArr = await Message.create(
        [
          {
            conversation: conversation._id,
            text: `${socket.currentUser.displayname} changed the group name to ${title}`,
            type: "system",
          },
        ],
        { session }
      );
      const message = messageArr[0];

      conversation.title = title;
      conversation.lastMessage = message._id;
      await conversation.save({ session });

      await conversation.populate(["members", "admin"]);
      conversation.lastMessage = message;

      io.in(conversation._id.toString()).emit(
        socketEvent.SV_SEND_CONVERSATION,
        { conversation }
      );
      io.in(conversation._id.toString()).emit(socketEvent.SV_SEND_MESSAGE, {
        message,
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  } catch (error) {
    socket.emit(socketEvent.ERROR, { message: error.message });
  }
};
