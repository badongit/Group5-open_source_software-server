const router = require("express").Router();
const {
  changePhotoLink,
  changeRole,
} = require("../controllers/conversation.controller");
const apiEnum = require("../enum/api.enum");
const { verifyAccessToken } = require("../middlewares/auth");
const messageRouter = require("./message.router");

router.use(`/:conversationId/${apiEnum.MESSAGES}`, messageRouter);
router.use(verifyAccessToken);
router.put("/:conversationId/photo", changePhotoLink);
router.put("/:conversationId/role", changeRole);

module.exports = router;
