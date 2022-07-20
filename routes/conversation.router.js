const router = require("express").Router();
const {
    changePhotoLink,
  } = require("../controllers/conversation.controller");
const { verifyAccessToken } = require("../middlewares/auth");

router.use(verifyAccessToken);
router.put("/change-photo/:conversationId", changePhotoLink);

module.exports = router;
