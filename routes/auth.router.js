const router = require("express").Router();
const {
  register,
  login,
  newToken,
  changeAvatar,
  logout,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
} = require("../controllers/auth.controller");
const {
  verifyRefreshToken,
  verifyAccessToken,
} = require("../middlewares/auth");

router.post("/register", register);
router.post("/login", login);
router.post("/new-token", verifyRefreshToken, newToken);
router.post("/password/forgot", forgotPassword);
router.post("/password/reset/:token", resetPassword);

router.use(verifyAccessToken);
router.put("/avatar", changeAvatar);
router.get("/logout", logout);
router.get("/profile", getMe);
router.put("/profile", updateProfile);
router.put("/password", changePassword);

module.exports = router;
