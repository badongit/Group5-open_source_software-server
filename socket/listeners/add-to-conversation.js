const { uniq, difference, compact, isEmpty } = require("lodash");
const mongoose = require("mongoose");
const { mapById } = require("../../helpers/common");
const Conversation = require("../../models/Conversation");
const Message = require("../../models/Message");
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
    const userMap = mapById(users);
    const newMemberIds = users.map((user) => user._id.toString());
    const memberIds = uniq(
      conversation.members.concat(newMemberIds).map((id) => id.toString())
    );

    if (memberIds.length > 31) {
      return socket.emit(socketEvent.ERROR, { message: socketMsg.BAD_REQUEST });
    }

    const newMembers = difference(
      newMemberIds,
      conversation.members.map((member) => member.toString())
    );

    if (isEmpty(newMembers)) {
      return socket.emit(socketEvent.ERROR, { message: socketMsg.BAD_REQUEST });
    }
    const nameArr = compact(
      newMembers.map((newMemberId) => userMap[newMemberId]?.displayname)
    );
    const text = `${socket.currentUser.displayname} added ${nameArr.join(
      ", "
    )} to the group`;
    const session = await mongoose.startSession();

    try {
      session.startTransaction();
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
      const message = messageArr[0];

      conversation.members = memberIds;
      conversation.lastMessage = message._id;
      await conversation.save({ session });
      await session.commitTransaction();

      conversation.lastMessage = message;
      await message.populate("sender");
      await conversation.populate(["members", "admin"]);

      io.sockets.emit(socketEvent.SV_SEND_INVITATION_JOIN_ROOM, {
        conversationId: conversation._id,
        members: newMembers,
      });

      io.in(conversation._id.toString()).emit(socketEvent.SV_SEND_MESSAGE, {
        message,
      });
      io.in(conversation._id.toString()).emit(
        socketEvent.SV_SEND_CONVERSATION,
        { conversation }
      );
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
