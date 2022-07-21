const express = require("express");
const router = express.Router();
const advancedResults = require("../middlewares/advancedResults");
const User = require("../models/User");
const { getUsers, getUserById } = require("../controllers/user.controller");
const { verifyAccessToken } = require("../middlewares/auth");

router.get("/", advancedResults(User), getUsers);

router.get("/:id", getUserById);

module.exports = router;
