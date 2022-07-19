const socketIO = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ErrorResponse = require("../helpers/error-response");
const statusCodeEnum = require("../enum/status-code.enum");
const SocketMsg = require("./constants/socket-msg");
const SocketEvent = require("./constants/socket-event");
const listeners = require("./listeners");

module.exports.listen = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: "*",
      maxHttpBufferSize: 8e6,
    },
    transports: ["polling"],
  });

  //middleware auth
  io.use(async (socket, next) => {
    try {
      const { token } = socket.handshake.auth;
      const { id } = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findById(id);

      if (!user) {
        return next(
          new ErrorResponse(
            SocketMsg.NOT_FOUND.replace(":{entity}", "user"),
            statusCodeEnum.NOT_FOUND
          )
        );
      }

      socket.currentUser = user;
      next();
    } catch (error) {
      next(error);
    }
  });

  //socket connect
  io.on(SocketEvent.CONNECTION, async (socket) => {
    try {
      const user = await User.findById(socket.currentUser?._id);
      user.isOnline = true;
      await user.save();
    } catch (error) {
      console.log(`Error connect socket: ${error.message}`);
    }

    socket.on(SocketEvent.DISCONNECT, listeners.disconnect(io, socket));

    // join room
    socket.on(SocketEvent.CLIENT_JOIN_ROOM, listeners.joinRoom(io, socket));

    // create conversation
    socket.on(
      SocketEvent.CLIENT_CREATE_CONVERSATION,
      listeners.createConversation(io, socket)
    );

    //client send message
    socket.on(
      SovketEvent.CLIENT_SEND_MESSAGE,
      listeners.sendMessage(io, socket)
    );
  });
};
