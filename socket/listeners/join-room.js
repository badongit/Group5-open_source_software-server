const User = require("../../models/User");
const Conversation = require("../../models/Conversation");
const SocketEvent = require("../constants/socket-event");
const socketMsg = require("../constants/socket-msg");

module.exports = (io, socket) => async (req) => {
  try {
    const conversation = await Conversation.findOne({
      _id: conversationId,
      members: socket.currentUser._id,
    })
      .populate({ path: "members" })
      .populate({ path: "admin" })
      .populate({ path: "lastMessage" })
      .lean();

    if (!conversation) {
      return socket.emit(SocketEvent.ERROR, {
        message: socketMsg.NOT_FOUND.replace(":{entity}", "conversation"),
      });
    }

    socket.join(conversationId);
    socket.emit(SocketEvent.SV_SEND_CONVERSATION, { conversation });
  } catch (error) {
    console.log(`Error socket: ${error.message}`);
  }
};
