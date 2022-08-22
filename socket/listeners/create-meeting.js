const { default: mongoose } = require("mongoose");
const Conversation = require("../../models/Conversation");
const Meeting = require("../../models/Meeting");
const Message = require("../../models/Message");
const socketEvent = require("../constants/socket-event");
const socketMsg = require("../constants/socket-msg");
const dayjs = require("dayjs");

module.exports = (io, socket) => async (req) => {
  try {
    const { title, description, start, conversationId } = req;

    if (!title || !start || !conversationId || new Date(start) <= new Date()) {
      return socket.emit(socketEvent.ERROR, { message: socketMsg.BAD_REQUEST });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      type: "group",
    });
    if (!conversation) {
      return socket.emit(socketEvent.ERROR, {
        message: socketMsg.NOT_FOUND.replace(":{entity}", "conversation"),
      });
    }

    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const meeting = (
        await Meeting.create(
          [
            {
              title,
              conversation: conversationId,
              creator: socket.currentUser._id,
              start: dayjs(start).second(0).millisecond(0),
              description: description,
            },
          ],
          { session }
        )
      )[0];

      const message = (
        await Message.create(
          [
            {
              conversation: conversationId,
              text: socketMsg.CREATE_MEETING.replace(
                ":{user}",
                socket.currentUser.displayname
              ),
              meeting: meeting._id,
              type: "meeting",
            },
          ],
          { session }
        )
      )[0];

      conversation.lastMessage = message;
      await conversation.save({ session });
      await session.commitTransaction();
      await conversation.populate(["members", "admin"]);
      await message.populate("meeting");

      io.in(conversation._id.toString()).emit(
        socketEvent.SV_SEND_CONVERSATION,
        { conversation }
      );
      io.in(conversation._id.toString()).emit(socketEvent.SV_SEND_MESSAGE, {
        message,
      });
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
