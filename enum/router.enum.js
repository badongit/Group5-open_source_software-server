const APIEnum = require("./api.enum");
const authRouter = require("../routes/auth.router");
const userRouter = require("../routes/user.router");
const routers = [
  {
    prefix: APIEnum.AUTH,
    router: authRouter,
  },
  {
    prefix: APIEnum.USERS,
    router: userRouter,
  },
];

module.exports = routers;
