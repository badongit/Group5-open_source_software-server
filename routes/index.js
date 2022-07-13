const routes = require("../enum/router.enum");

module.exports = (app) => {
  app.get("/", (req, res) => {
    res.send("Hello mini chat is here");
  });

  routes.forEach((route) => {
    app.use(`/api/${route.prefix}`, route.router);
  });

  app.get("*", (req, res) => {
    return res.status(404).json({
      success: false,
      message: "API not found",
    });
  });
};
