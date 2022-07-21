const mongoose = require("mongoose");
const User = require("../../models/User");
const Conversation = require("../../models/Conversation");
const Message = require("../../models/Message");
const SocketMsg = require("../constants/socket-msg");
const SocketEvent = require("../constants/socket-event");

module.exports = (io, socket) => async (req) => {
  try {
    const { text, userId, subId } = req;
    let conversationId = req.conversationId;
    const receiver = await User.findById(userId);
    const sender = socket.currentUser;
    const session = await mongoose.startSession();

    if (!(receiver || conversationId)) {
      return socket.emit(SocketEvent.ERROR, {
        message: SocketMsg.NOT_FOUND.replace(":{entity}", "user"),
      });
    }

    if (!text) {
      return socket.emit(SocketEvent.ERROR, {
        message: SocketMsg.BAD_REQUEST,
      });
    }

    if (!conversationId) {
      const oldConversation = await Conversation.findOne({
        members: { $all: [sender._id, receiver._id] },
        type: "private",
      });

      if (!oldConversation) {
        try {
          session.startTransaction();
          const newConversationArr = await Conversation.create(
            [
              {
                members: [sender._id, receiver._id],
                type: "private",
              },
            ],
            { session }
          );

          const newConversation = newConversationArr[0];

          const messageArr = await Message.create(
            [
              {
                conversation: newConversation._id,
                sender,
                text,
                subId,
              },
            ],
            { session }
          );

          const message = messageArr[0];

          newConversation.lastMessage = message._id;
          await newConversation.save();

          await session.commitTransaction();

          io.sockets.emit(SocketEvent.SV_SEND_INVITATION_JOIN_ROOM, {
            conversationId: newConversation._id,
            newMembers: newConversation.members,
          });
        } catch (error) {
          await session.abortTransaction();

          socket.emit(SocketEvent.ERROR, {
            message: error.message,
          });
        } finally {
          session.endSession();
        }

        return;
      } else {
        conversationId = oldConversation._id;
      }
    }

    try {
      session.startTransaction();
      const conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        return socket.emit(SocketEvent.ERROR, {
          message: SocketMsg.NOT_FOUND.replace(":{entity}", "conversation"),
        });
      }

      if (!conversation.members.includes(sender._id)) {
        return socket.emit(SocketEvent.ERROR, {
          message: SocketMsg.NOT_IN_CONVERSATION,
        });
      }

      const messageArr = await Message.create(
        [
          {
            conversation: conversation._id,
            sender,
            text,
            subId,
          },
        ],
        { session }
      );

      const message = messageArr[0];

      conversation.lastMessage = message._id;
      await conversation.save();
      await session.commitTransaction();
      await conversation.populate([
        { path: "members", select: "-username -avatarId" },
        { path: "admin", select: "-username -avatarId" },
        "lastMessage",
      ]);

      io.in(conversation._id.toString()).emit(
        SocketEvent.SV_SEND_MESSAGE,
        message
      );
      io.in(conversation._id.toString()).emit(
        SocketEvent.SV_SEND_CONVERSATION,
        conversation
      );
    } catch (error) {
      await session.abortTransaction();

      socket.emit(SocketEvent.ERROR, {
        message: error.message,
      });
    } finally {
      session.endSession();
    }
  } catch (error) {
    socket.emit(SocketEvent.ERROR, {
      message: error.message,
    });
  }
};
