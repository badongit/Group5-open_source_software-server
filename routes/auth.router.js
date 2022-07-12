const router = require("express").Router();
const { changeAvatar, logout } = require("../controllers/auth.controller");
const { verifyAccessToken } = require("../middlewares/auth");

router.use(verifyAccessToken);
router.put("/avatar", changeAvatar);
router.get("/logout", logout);

module.exports = router;
