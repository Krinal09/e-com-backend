const express = require("express");
const router = express.Router();
const { getAllUsers } = require("../../controllers/admin/user-controller");
const { authMiddleware } = require("../../controllers/auth/auth-controller");

// Get all users (protected route, requires authentication)
router.get("/", authMiddleware, getAllUsers);

module.exports = router; 