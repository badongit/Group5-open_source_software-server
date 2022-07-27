const router = require("express").Router();
const {
  changePhotoLink,
  changeRole,
  getMsgByConversation,
} = require("../controllers/conversation.controller");
const { verifyAccessToken } = require("../middlewares/auth");

router.use(verifyAccessToken);
router.put("/:conversationId/photo", changePhotoLink);
router.put("/:conversationId/role", changeRole);
router.put("/change-photo/:conversationId", changePhotoLink);
router.get("/getMsg", getMsgByConversation);

module.exports = router;
