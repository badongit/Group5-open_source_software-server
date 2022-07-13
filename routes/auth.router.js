const router = require("express").Router();
const {
  register,
  login,
  newToken,
  changeAvatar,
  logout,
} = require("../controllers/auth.controller");
const {
  verifyRefreshToken,
  verifyAccessToken,
} = require("../middlewares/auth");

router.post("/register", register);
router.post("/login", login);
router.post("/new-token", verifyRefreshToken, newToken);

router.use(verifyAccessToken);
router.put("/avatar", changeAvatar);
router.get("/logout", logout);

module.exports = router;
