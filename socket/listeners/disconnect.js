const User = require("../../models/User");
const SocketEvent = require("../constants/socket-event");

module.exports = (io, socket) => async () => {
  try {
    const user = await User.findById(socket.currentUser._id);
    user.isOnline = false;
    await user.save();
  } catch (error) {
    console.log(`Error socket: ${error.message}`);
  }
};
