const express = require("express");
const router = express.Router();
const advancedResults = require("../middlewares/advancedResults");
const User = require("../models/User");
const { getUsers, getUserById } = require("../controllers/user.controller");
const { verifyAccessToken } = require("../middlewares/auth");

router.get("/:id", getUserById);
router.get("/", verifyAccessToken, advancedResults(User), getUsers);

module.exports = router;
