const router = require("express").Router();
const { index } = require("../controllers/auth.controller");

router.get("/", index);

module.exports = router;
