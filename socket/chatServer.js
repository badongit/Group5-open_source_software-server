const socketIO = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ErrorResponse = require("../helpers/error-response");
const statusCodeEnum = require("../enum/status-code.enum");
const socketMsg = require("./constants/socket-msg");
const socketEvent = require("./constants/socket-event");
const listeners = require("./listeners");

module.exports.listen = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: "*",
    },
    maxHttpBufferSize: 20e6,
    transports: ["websocket"],
  });

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

    // call - video
    socket.on(socketEvent.SV_CALL_VIDEO_USER, listeners.callVideo(io.socket));

    //error
    socket.on(socketEvent.ERROR, (error) => {
      console.log(error);
    });
  });
};
