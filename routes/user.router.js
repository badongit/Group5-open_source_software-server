const router = require("express").Router();
const { getAll, getById, searchUserByDisplayname } = require("../controllers/user.controller");

router.get("/getAll", getAll);
router.get("/getById/:id", getById);

module.exports = router;
