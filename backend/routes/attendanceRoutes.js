const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  saveAttendance,
  getAttendance,
  checkAttendanceExists,
  getAttendanceById,
  updateAttendance,
  deleteAttendance,
} = require("../controllers/attendanceController");

router.use(protect);

router.get("/check", checkAttendanceExists);
router.get("/", getAttendance);
router.get("/:id", getAttendanceById);

router.post("/", authorize("CR"), saveAttendance);
router.put("/:id", authorize("CR"), updateAttendance);
router.delete("/:id", authorize("CR"), deleteAttendance);

module.exports = router;
