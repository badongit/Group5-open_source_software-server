const mongoose = require("mongoose");
const User = require("../../models/User");
const Conversation = require("../../models/Conversation");
const Message = require("../../models/Message");
const SocketMsg = require("../constants/socket-msg");
<<<<<<< HEAD
const SocketEvent = require("../constants/socket-event");
=======
>>>>>>> 462f039 (update socket send message to send both text and file)
const driveService = require("../../googledrive/services");
const {
  isDenyType,
  getExtensionFile,
  getTypeFile,
} = require("../../helpers/common");

module.exports = (io, socket) => async (req) => {
  try {
    const { text, userId, subId, file, metadata } = req;
    let conversationId = req.conversationId;
    const receiver = await User.findById(userId);
    const sender = socket.currentUser;
    const session = await mongoose.startSession();

    if (!(receiver || conversationId)) {
      return socket.emit(SocketEvent.ERROR, {
        message: SocketMsg.NOT_FOUND.replace(":{entity}", "user"),
      });
    }

    //check missing info message
    if (!text && !file) {
      return socket.emit(SocketEvent.ERROR, {
        message: SocketMsg.BAD_REQUEST,
      });
    }

    //check missing metadata if send file
    if (file && !(metadata?.name && metadata.type && subId)) {
      return socket.emit(SocketEvent.ERROR, {
        message: SocketMsg.BAD_REQUEST,
      });
    }

    if (file && isDenyType(metadata.type)) {
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

          const messageEntities = [];

          if (file) {
            const response = await driveService.createFileInDrive(fileBuffer, {
              type: metadata.type,
              name: subId + getExtensionFile(metadata.name),
              parents: process.env.DRIVE_MESSAGE_PARENTS,
            });

            messageEntities.push({
              conversationId: newConversation._id,
              sender,
              subId,
              fileId: response.data.id,
              fileType: getTypeFile(metadata.type),
            });
          }

          if (text) {
            messageEntities.push({
              conversationId: newConversation._id,
              sender,
              text,
              subId,
            });
          }

          const messageArr = await Message.create(messageEntities, { session });

          const lastMessage = messageArr[messageArr.length - 1];

          newConversation.lastMessage = lastMessage._id;
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

      const messageEntities = [];

      if (file) {
        const response = await driveService.createFileInDrive(fileBuffer, {
          type: metadata.type,
          name: subId + getExtensionFile(metadata.name),
          parents: process.env.DRIVE_MESSAGE_PARENTS,
        });

        messageEntities.push({
          conversationId: newConversation._id,
          sender,
          subId,
          fileId: response.data.id,
          fileType: getTypeFile(metadata.type),
        });
      }

      if (text) {
        messageEntities.push({
          conversationId: newConversation._id,
          sender,
          text,
          subId,
        });
      }

      const messageArr = await Message.create(messageEntities, { session });

      const lastMessage = messageArr[messageArr.length - 1];

      conversation.lastMessage = lastMessage._id;
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
