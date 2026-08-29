const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const {
  listClassrooms,
  getClassroom,
  createClassroom,
  updateClassroom,
  deleteClassroom,
} = require("../controllers/classroomController");

const router = express.Router();

router.use(protect);
router.get("/", listClassrooms);
router.get("/:id", getClassroom);
router.post("/", authorize("Teacher"), createClassroom);
router.put("/:id", authorize("Teacher"), updateClassroom);
router.delete("/:id", authorize("Teacher"), deleteClassroom);

module.exports = router;
