const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  register,
  login,
  getProfile,
  changePassword,
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.get("/profile", protect, getProfile);
router.get("/preferences", protect, getPreferences);
router.put("/preferences", protect, updatePreferences);
router.put("/change-password", protect, changePassword);

module.exports = router;
