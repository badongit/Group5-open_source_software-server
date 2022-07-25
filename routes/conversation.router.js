const router = require("express").Router();
const { changePhotoLink, changeRole } = require("../controllers/conversation.controller");
const { verifyAccessToken } = require("../middlewares/auth");

router.use(verifyAccessToken);
router.put("/:conversationId/photo", verifyAccessToken, changePhotoLink);
router.put("/change-role/:conversationId", changeRole);

module.exports = router;
