const { usersPeer, addUser, findUser } = require("../listUser");
const socketEvent = require("../constants/socket-event");
const User = require("../../models/User");

module.exports = (io, socket) => async (req) => {
  try {
    const { userId, another } = req;

    if (!another) {
      addUser({ userId, socketId: socket.id });
      console.log(usersPeer);
    } else {
      const caller = await User.findById(userId);
      //   console.log("me", me); k nghe à khum tớ nghe c ns mà thế thì thằng socket này ngáo ngáo í thi thoảng nó k check online :)) ừ @@
      //   console.log("another", another);
      //   console.log("usersPeer", usersPeer);
      console.log(
        "id to call",
        usersPeer.filter((u) => u.userId === another[0])[0]?.socketId
      );
      io.to(usersPeer.filter((u) => u.userId === another[0])[0]?.socketId).emit(
        socketEvent.SV_CALL_TO_USER,
        { caller }
      );
    }
  } catch (error) {
    console.log(`Error socket: ${error.message}`);
  }
};
