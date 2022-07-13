const router = require("express").Router();
const { index, register, login, newToken } = require("../controllers/auth.controller");
const { verifyRefreshToken, verifyAccessToken } = require("../middlewares/auth");

router.get("/", index);
router.post("/register", register)
router.post("/login", login)
router.post("/new-token", verifyRefreshToken, newToken);

module.exports = router;
