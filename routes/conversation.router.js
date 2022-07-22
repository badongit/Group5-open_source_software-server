const router = require("express").Router();
const { changePhotoLink } = require("../controllers/conversation.controller");
const { verifyAccessToken } = require("../middlewares/auth");

router.put("/:conversationId/photo", verifyAccessToken, changePhotoLink);

module.exports = router;
