const APIEnum = require("./api.enum");
const authRouter = require("../routes/auth.router");

const routers = [
  {
    prefix: APIEnum.AUTH,
    router: authRouter,
  },
];

module.exports = routers;
