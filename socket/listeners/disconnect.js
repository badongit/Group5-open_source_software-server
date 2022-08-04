const User = require("../../models/User");
const socketEvent = require("../constants/socket-event");

module.exports = (io, socket) => async () => {
  try {
    const user = await User.findById(socket.currentUser._id);
    user.isOnline = false;
    await user.save();
    io.sockets.emit(socketEvent.SV_SEND_USER, { user });
  } catch (error) {
    console.log(`Error socket: ${error.message}`);
  }
};
