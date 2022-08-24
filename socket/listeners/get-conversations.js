const User = require("../../models/User");
const Conversation = require("../../models/Conversation");
const Message = require("../../models/Message");
const socketEvent = require("../constants/socket-event");
const socketMsg = require("../constants/socket-msg");

module.exports = (io, socket) => async (req) => {
  try {
    const conversations = await Conversation.find({
      members: socket.currentUser._id,
    })
      .populate({ path: "members" })
      .populate({ path: "admin" })
      .populate({ path: "lastMessage" })
      .sort("-updatedAt")
      .lean();

    const rooms = conversations.map((conversation) =>
      conversation._id.toString()
    );
    socket.join(rooms);
    socket.emit(socketEvent.SV_SEND_CONVERSATIONS, { conversations });
  } catch (error) {
    console.log(`Error socket: ${error.message}`);
  }
};
