var usersPeer = [];

/**
 *
 * @param {*} data
 */
function addUser({ userId, socketId, peerId }) {
  const index = usersPeer.findIndex((user) => user.userId === userId);

  if (index !== -1) {
    usersPeer
      .filter((u) => u.userId !== userId)
      .push({ userId, socketId, peerId });
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

module.exports = { usersPeer, addUser, findUser };
