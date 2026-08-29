const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const { getDashboard } = require("../controllers/teacherController");

const router = express.Router();

router.use(protect, authorize("Teacher"));
router.get("/dashboard", getDashboard);

module.exports = router;
