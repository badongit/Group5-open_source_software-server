const router = require("express").Router();
const {
  changePhotoLink,
  changeRole,
} = require("../controllers/conversation.controller");
const { verifyAccessToken } = require("../middlewares/auth");

router.use(verifyAccessToken);
router.put("/:conversationId/photo", changePhotoLink);
router.put("/:conversationId/role", changeRole);

module.exports = router;
