const Conversation = require("../../models/Conversation");
const socketEvent = require("../constants/socket-event");
const socketMsg = require("../constants/socket-msg");
const mongoose = require("mongoose");
const User = require("../../models/User");
const Message = require("../../models/Message");

module.exports = (io, socket) => async (req) => {
  try {
    const { userId, conversationId } = req;

    if (!userId || !conversationId) {
      return socket.emit(socketEvent.ERROR, { message: socketMsg.BAD_REQUEST });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      members: userId,
      type: "group",
    });

    if (!conversation) {
      return socket.emit(socketEvent.ERROR, {
        message: socketMsg.NOT_FOUND.replace(":{entity}", "conversation"),
      });
    }

    if (
      socket.currentUser.id !== userId &&
      !conversation.admin.includes(socket.currentUser.id)
    ) {
      return socket.emit(socketEvent.ERROR, {
        message: socketMsg.FORBIDDEN,
      });
    }

    const session = await mongoose.startSession();

    try {
      session.startTransaction();
      const newMembers = conversation.members.filter(
        (member) => member.toString() !== userId
      );
      const newAdmin = conversation.admin.filter(
        (admin) => admin.toString() !== userId
      );

      if (
        newAdmin.length === 0 &&
        conversation.type === "group" &&
        newMembers.length
      ) {
        newAdmin.push(newMembers[0]);
      }

      const user = await User.findById(userId);
      let message;

      if (user) {
        let text = "";
        if (socket.currentUser._id.toString() === userId) {
          text = `${socket.currentUser.displayname} was left from this conversation`;
        } else {
          text = `${socket.currentUser.displayname} invited ${user.displayname} out of this conversation`;
        }

        const messageArr = await Message.create(
          [
            {
              conversation: conversation._id,
              text,
              type: "system",
            },
          ],
          { session }
        );

        message = messageArr[0];
        conversation.lastMessage = message._id;
      }
      conversation.members = newMembers;
      conversation.admin = newAdmin;
      await conversation.save({ session });
      await session.commitTransaction();

      await conversation.populate(["members", "admin", "lastMessage"]);

      io.in(conversation._id.toString()).emit(
        socketEvent.SV_SEND_USER_LEAVE_CONVERSATION,
        {
          conversationId,
          userId,
        }
      );

      if (message) {
        io.in(conversation._id.toString()).emit(socketEvent.SV_SEND_MESSAGE, {
          message,
        });
      }

      io.in(conversation._id.toString()).emit(
        socketEvent.SV_SEND_CONVERSATION,
        { conversation }
      );
    } catch (error) {
      await session.abortTransaction();
      socket.emit(socketEvent.ERROR, { message: error.message });
    } finally {
      await session.endSession();
    }
  } catch (error) {
    socket.emit(socketEvent.ERROR, { message: error.message });
  }
};
