//const { usersPeer, addUser, findUser } = require("../listUser");
const socketEvent = require("../constants/socket-event");
const User = require("../../models/User");

let usersPeer = [];

/**
 *
 * @param {*} data
 */
function addUser({ userId, socketId, peerId }) {
  const index = usersPeer.findIndex((user) => user.userId === userId);
  if (index !== -1) {
    usersPeer = usersPeer.filter((u) => u.userId !== userId);
    usersPeer.push({ userId, socketId, peerId });
  } else {
    usersPeer.push({ userId, socketId, peerId });
  }
}

function findUser(userId) {
  const index = usersPeer.findIndex((user) => user.userId === userId);
  if (index !== -1) {
    return usersPeer.splice(index, 1)[0];
  }
  return;
}

module.exports = (io, socket) => async (req) => {
  try {
    const { userId, another, PeerId } = req;

    if (!another) {
      addUser({ userId, socketId: socket.id, peerId: PeerId });
    } else {
      addUser({ userId, socketId: socket.id, peerId: PeerId });
      const caller = await User.findById(userId);
      io.to(usersPeer.filter((u) => u.userId === another[0])[0]?.socketId).emit(
        socketEvent.SV_CALL_TO_USER,
        {
          caller,
          peerId: PeerId,
        }
      );
    }
  } catch (error) {
    console.log(`Error socket: ${error.message}`);
  }
};
