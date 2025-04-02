const express = require("express");
const router = express.Router();
const { registerUser, loginUser } = require("../controllers/userController");

/**
 * @openapi
 * /register:
 *   post:
 *     description: This is a register API!
 *     responses:
 *       200:
 *         description: Return an access token.
 */
router.post("/register", registerUser);

/**
 * @openapi
 * /login:
 *   post:
 *     description: This is a login API!
 *     responses:
 *       200:
 *         description: Return an access token.
 */
router.post("/login", loginUser);

module.exports = router;