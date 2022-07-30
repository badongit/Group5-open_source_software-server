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
    },
    maxHttpBufferSize: 20e6,
    transports: ["websocket"],
  });

  //middleware auth
  io.use(async (socket, next) => {
    try {
      // const { token } = socket.handshake.auth;
      const token =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyY2ZkMTA4MTA2OGEyYTBhNGI1NzUzYyIsImlhdCI6MTY1OTE3NjMyMywiZXhwIjoxNjU5MjYyNzIzfQ._ao5X27dLlydj--VrbqMumATxrjQn7NRFqnmvnSHtCU";
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
      SocketEvent.CLIENT_SEND_MESSAGE,
      listeners.sendMessage(io, socket)
    );

    //client send file
    socket.on(SocketEvent.CLIENT_SEND_FILE, listeners.sendFile(io, socket));

    // get conversations
    socket.on(
      SocketEvent.CLIENT_GET_CONVERSATIONS,
      listeners.getConversations(io, socket)
    );

    //client recall message
    socket.on(
      SocketEvent.CLIENT_RECALL_MESSAGE,
      listeners.recallMessage(io, socket)
    );
    //error
    socket.on(SocketEvent.ERROR, (error) => {
      console.log(error);
    });
  });
};
