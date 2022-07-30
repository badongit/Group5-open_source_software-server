const User = require("../../models/User");
const Conversation = require("../../models/Conversation");
const Message = require("../../models/Message");
const SocketEvent = require("../constants/socket-event");
const socketMsg = require("../constants/socket-msg");

module.exports = (io, socket) => async (req) => {
  try {
    const conversations = await Conversation.find({
      members: socket.currentUser._id,
    })
      .populate({ path: "members" })
      .populate({ path: "admin" })
      .populate({ path: "lastMessage" })
      .lean();

    const rooms = conversations.map((conversation) => conversation.id);
    socket.join(rooms);
    socket.emit(SocketEvent.SV_SEND_CONVERSATIONS, { conversations });
  } catch (error) {
    console.log(`Error socket: ${error.message}`);
  }
};
