const Conversation = require("../../models/Conversation");
const Message = require("../../models/Message");
const socketEvent = require("../constants/socket-event");
const socketMsg = require("../constants/socket-msg");

module.exports = (io, socket) => async (req) => {
  try {
    const message = await Message.findById(req.messageId).populate("sender");

    if (!message) {
      return socket.emit(socketEvent.ERROR, {
        message: socketMsg.NOT_FOUND.replace(":{entity}", "message"),
      });
    }

    if (message.sender.id !== socket.currentUser.id || message.deletedAt) {
      return socket.emit(socketEvent.ERROR, {
        message: socketMsg.FORBIDDEN,
      });
    }

    await message.recall();

    if (message.conversation._id) {
      io.in(message.conversation._id.toString()).emit(
        socketEvent.SV_SEND_MESSAGE,
        { message }
      );
    }

    const conversation = await Conversation.findById(
      message.conversation._id
    ).populate(["members", "admin", "lastMessage"]);

    if (
      conversation &&
      message._id.toString() === conversation.lastMessage.toString()
    ) {
      io.in(conversation._id.toString()).emit(
        socketEvent.SV_SEND_CONVERSATION,
        { conversation }
      );
    }
  } catch (error) {
    socket.emit(socketEvent.ERROR, { message: error.message });
  }
};
