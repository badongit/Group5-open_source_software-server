const socketIO = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ErrorResponse = require("../helpers/error-response");
const statusCodeEnum = require("../enum/status-code.enum");
const socketMsg = require("./constants/socket-msg");
const socketEvent = require("./constants/socket-event");
const listeners = require("./listeners");
const Meeting = require("../models/Meeting");
const { CronJob } = require("cron");
const dayjs = require("dayjs");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");

module.exports.listen = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: "*",
    },
    maxHttpBufferSize: 20e6,
    transports: ["websocket"],
  });

  const cronSocket = new CronJob(
    "0 * * * * *",
    async function () {
      try {
        const meetings = (
          await Promise.all([
            Meeting.find({
              start: { $eq: dayjs().add(1, "day").second(0).millisecond(0) },
            }),
            Meeting.find({
              start: { $eq: dayjs().add(1, "hour").second(0).millisecond(0) },
            }),
            Meeting.find({
              start: {
                $eq: dayjs().add(30, "minute").second(0).millisecond(0),
              },
            }),
            Meeting.find({
              start: { $eq: dayjs().add(5, "minute").second(0).millisecond(0) },
            }),
          ])
        ).flat();

        const meetingStart = await Meeting.find({
          start: {
            $eq: dayjs().second(0).millisecond(0),
          },
        });

        await Promise.all(
          meetings.map((meeting) => notificationMeeting(io, meeting, false))
        );

        await Promise.all(
          meetingStart.map((meeting) => notificationMeeting(io, meeting, true))
        );
      } catch (error) {
        console.log(error);
      }
    },
    null,
    true,
    "Asia/Ho_Chi_Minh"
  );

  async function notificationMeeting(io, meeting, isStarting) {
    try {
      const conversation = await Conversation.findById(meeting.conversation);

      if (!conversation) {
        throw new ErrorResponse(
          socketMsg.NOT_FOUND.replace(":{entity}", "conversation")
        );
      }

      const text = isStarting
        ? socketMsg.MEETING_STARTING
        : socketMsg.MEETING_START_AT.replace(
            ":{time}",
            dayjs(meeting.start).format("hh:mm A")
          );
      const message = (
        await Message.create([
          {
            conversation: meeting.conversation,
            text,
            meeting: meeting._id,
            type: "meeting",
          },
        ])
      )[0];

      conversation.lastMessage = message;
      await conversation.save();
      await conversation.populate(["members", "admin"]);
      await message.populate("meeting");

      io.in(conversation._id.toString()).emit(
        socketEvent.SV_SEND_CONVERSATION,
        {
          conversation,
        }
      );
      io.in(conversation._id.toString()).emit(socketEvent.SV_SEND_MESSAGE, {
        message,
      });
    } catch (error) {
      console.log(error);
    }
  }

  cronSocket.start();

  //middleware auth
  io.use(async (socket, next) => {
    try {
      const { token } = socket.handshake.auth;
      // const token = socket.handshake.headers.token;
      const { id } = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findById(id);

      if (!user) {
        return next(
          new ErrorResponse(
            socketMsg.NOT_FOUND.replace(":{entity}", "user"),
            statusCodeEnum.NOT_FOUND
          )
        );
      }
      user.isOnline = true;
      await user.save();

      socket.currentUser = user;
      io.sockets.emit(socketEvent.SV_SEND_USER, { user });
      next();
    } catch (error) {
      next(error);
    }
  });

  //socket connect
  io.on(socketEvent.CONNECTION, async (socket) => {
    try {
      const user = await User.findById(socket.currentUser?._id);
      user.isOnline = true;
      await user.save();
    } catch (error) {
      console.log(`Error connect socket: ${error.message}`);
    }

    socket.on(socketEvent.DISCONNECT, listeners.disconnect(io, socket));

    // join room
    socket.on(socketEvent.CLIENT_JOIN_ROOM, listeners.joinRoom(io, socket));

    // create conversation
    socket.on(
      socketEvent.CLIENT_CREATE_CONVERSATION,
      listeners.createConversation(io, socket)
    );

    //client send message
    socket.on(
      socketEvent.CLIENT_SEND_MESSAGE,
      listeners.sendMessage(io, socket)
    );

    //client send file
    socket.on(socketEvent.CLIENT_SEND_FILE, listeners.sendFile(io, socket));

    // get conversations
    socket.on(
      socketEvent.CLIENT_GET_CONVERSATIONS,
      listeners.getConversations(io, socket)
    );

    //client recall message
    socket.on(
      socketEvent.CLIENT_RECALL_MESSAGE,
      listeners.recallMessage(io, socket)
    );

    //leave conversation
    socket.on(
      socketEvent.CLIENT_LEAVE_CONVERSATION,
      listeners.leaveConversation(io, socket)
    );

    //disconnect room socket
    socket.on(socketEvent.CLIENT_LEAVE_ROOM_SOCKET, (req) => {
      socket.leave(req.conversationId);
    });

    //add to conversation
    socket.on(
      socketEvent.CLIENT_ADD_TO_CONVERSATION,
      listeners.addToConversation(io, socket)
    );

    //rename group
    socket.on(
      socketEvent.CLIENT_RENAME_GROUP,
      listeners.renameGroup(io, socket)
    );

    socket.on(
      socketEvent.CLIENT_CREATE_MEETING,
      listeners.createMeeting(io, socket)
    );

    //error
    socket.on(socketEvent.ERROR, (error) => {
      console.log(error);
    });
  });
};
