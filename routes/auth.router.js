const router = require("express").Router();
const { getMe, updateProfile, changePassword} = require("../controllers/auth.controller");
const { verifyAccessToken } = require("../middlewares/auth");

router
  .route("/profile", verifyAccessToken)
  .get(verifyAccessToken, authController.getMe)
  .put(verifyAccessToken, authController.updateProfile);


router.use(verifyAccessToken);
router
    .get("/profile", getMe)
    .put(verifyAccessToken, updateProfile);

router.put("/change-password", changePassword);

module.exports = router;
