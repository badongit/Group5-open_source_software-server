const Conversation = require("../../models/Conversation");
const Message = require("../../models/Message");
const SocketEvent = require("../constants/socket-event");
const SocketMsg = require("../constants/socket-msg");

module.exports = (io, socket) => async (req) => {
  try {
    const message = await Message.findById(req.messageId).populate("sender");

    if (!message) {
      return socket.emit(SocketEvent.ERROR, {
        message: SocketMsg.NOT_FOUND.replace(":{entity}", "message"),
      });
    }

    if (message.sender.id !== socket.currentUser.id || message.deletedAt) {
      return socket.emit(SocketEvent.ERROR, {
        message: SocketMsg.FORBIDDEN,
      });
    }

    await message.recall();

    if (message.conversation._id) {
      io.in(message.conversation.id).emit(SocketEvent.SV_SEND_MESSAGE, message);
    }

    const conversation = await Conversation.findById(
      message.conversation._id
    ).populate(["members", "admin", "lastMessage"]);

    if (
      conversation &&
      message._id.toString() === conversation.lastMessage.toString()
    ) {
      io.in(conversation.id).emit(
        SocketEvent.SV_SEND_CONVERSATION,
        conversation
      );
    }
  } catch (error) {
    socket.emit(SocketEvent.ERROR, { message: error.message });
  }
};
