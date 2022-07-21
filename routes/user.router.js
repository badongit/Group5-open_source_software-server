const router = require("express").Router();
const {
    verifyRefreshToken,
    verifyAccessToken,
  } = require("../middlewares/auth");
  
const { getAll, getById } = require("../controllers/user.controller");

router.get("/" ,getAll);
router.get("/:id", getById);

module.exports = router;
