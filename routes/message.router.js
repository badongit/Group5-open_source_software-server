const { verifyAccessToken } = require("../middlewares/auth");

const router = require("express").Router({ mergeParams: true });
const { getMessages } = require("../controllers/message.controller");

router.get("/", verifyAccessToken, getMessages);

module.exports = router;
