const router = require("express").Router();
const { signUp, signIn } = require("../controller/auth.controller");

router.post("/signup", signUp);
router.post("/login", signIn);

module.exports = router;