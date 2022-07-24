const APIEnum = require("./api.enum");
const authRouter = require("../routes/auth.router");
const conversationRouter = require("../routes/conversation.router");

const routers = [
  {
    prefix: APIEnum.AUTH,
    router: authRouter,
  },
  {
    prefix: APIEnum.CONVERSATIONS,
    router: conversationRouter,
  },
];

module.exports = routers;
