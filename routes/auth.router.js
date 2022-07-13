const router = require("express").Router();
const {
<<<<<<< HEAD
  register,
  login,
  newToken,
  changeAvatar,
  logout,
=======
>>>>>>> c62d688bf270b13db0628cbba613068d844bf808
  getMe,
  updateProfile,
  changePassword,
} = require("../controllers/auth.controller");
<<<<<<< HEAD
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
=======
const { verifyAccessToken } = require("../middlewares/auth");

router.use(verifyAccessToken);
>>>>>>> c62d688bf270b13db0628cbba613068d844bf808
router.get("/profile", getMe);
router.put("/profile", updateProfile);
router.put("/password", changePassword);

module.exports = router;
