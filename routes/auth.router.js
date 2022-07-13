const router = require("express").Router();
const {
  getMe,
  updateProfile,
  changePassword,
} = require("../controllers/auth.controller");
const { verifyAccessToken } = require("../middlewares/auth");

router.use(verifyAccessToken);
router.get("/profile", getMe);
router.put("/profile", updateProfile);
router.put("/password", changePassword);

module.exports = router;
