const mongoose = require("mongoose");
const User = require("../../models/User");
const Conversation = require("../../models/Conversation");
const Message = require("../../models/Message");
const socketEvent = require("../constants/socket-event");
const socketMsg = require("../constants/socket-msg");
const { toArrayUnique } = require("../../helpers/common");

module.exports = (io, socket) => async (req) => {
  try {
    let { title, members } = req;
    const users = await User.find({ _id: { $in: members } });

    if (!title || !members) {
      return socket.emit(socketEvent.ERROR, {
        message: socketMsg.BAD_REQUEST,
      });
    }

    members = users.map((user) => user._id.toString());
    members = toArrayUnique([...members, socket.currentUser._id.toString()]);

    if (members?.length < 3 || members?.length > 31) {
      return socket.emit(socketEvent.ERROR, {
        message: socketMsg.BAD_REQUEST,
      });
    }

    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const conversations = await Conversation.create(
        [
          {
            title,
            type: "group",
            members,
            admin: [socket.currentUser._id],
          },
        ],
        { session }
      );

      const conversation = conversations[0];
      const message = await Message.create(
        [
          {
            conversation,
            text: `${socket.currentUser.displayname} has created this conversation.`,
            type: "system",
          },
        ],
        { session }
      );

      conversation.lastMessage = message[0]._id;
      await conversation.save({ session });
      await session.commitTransaction();

      io.sockets.emit(socketEvent.SV_SEND_INVITATION_JOIN_ROOM, {
        conversationId: conversation._id,
        members,
      });
    } catch (error) {
      await session.abortTransaction();
      socket.emit(socketEvent.ERROR, {
        message: error.message,
      });
    } finally {
      await session.endSession();
    }
  } catch (error) {
    console.log(`Error socket: ${error.message}`);
  }
};
