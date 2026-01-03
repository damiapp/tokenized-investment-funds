const express = require("express");
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// POST /auth/register
router.post("/register", authController.register);

// POST /auth/login
router.post("/login", authController.login);

// GET /me
router.get("/me", authMiddleware, authController.getCurrentUser);

module.exports = router;
