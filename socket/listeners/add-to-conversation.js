const { toArrayUnique } = require("../../helpers/common");
const Conversation = require("../../models/Conversation");
const User = require("../../models/User");
const socketEvent = require("../constants/socket-event");
const socketMsg = require("../constants/socket-msg");

module.exports = (io, socket) => async (req) => {
  try {
    const { conversationId, members } = req;
    if (!conversationId || !members || !members?.length) {
      return socket.emit(socketEvent.ERROR, { message: socketMsg.BAD_REQUEST });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return socket.emit(socketEvent.ERROR, {
        message: socketMsg.NOT_FOUND.replace(":{entity}", "conversation"),
      });
    }

    const users = await User.find({ _id: { $in: members } });
    const newMemberIds = users.map((user) => user._id);
    const memberIds = toArrayUnique(conversation.members.concat(newMemberIds));
  } catch (error) {
    socket.emit(socketEvent.ERROR, { message: error.message });
  }
};
