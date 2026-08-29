const Classroom = require("../models/Classroom");
const Attendance = require("../models/Attendance");

const classroomQueryFor = (user, id) => {
  if (String(user.role).toLowerCase() === "teacher") {
    return { _id: id, teacher: user._id };
  }
  return { _id: id };
};

exports.listClassrooms = async (req, res, next) => {
  try {
    const filter = String(req.user.role).toLowerCase() === "teacher" ? { teacher: req.user._id } : {};
    const classrooms = await Classroom.find(filter)
      .sort({ year: 1, className: 1, section: 1 });
    res.status(200).json({ count: classrooms.length, classrooms });
  } catch (err) {
    next(err);
  }
};

exports.getClassroom = async (req, res, next) => {
  try {
    const classroom = await Classroom.findOne(classroomQueryFor(req.user, req.params.id));
    if (!classroom) return res.status(404).json({ message: "Class not found" });
    res.status(200).json({ classroom });
  } catch (err) {
    next(err);
  }
};

exports.createClassroom = async (req, res, next) => {
  try {
    const { year, className, section } = req.body;
    if (!year || !className || !section) {
      return res.status(400).json({ message: "Year, class and section are required" });
    }
    const classroom = await Classroom.create({
      teacher: req.user._id,
      year,
      className: className.trim(),
      section,
    });
    res.status(201).json({ message: "Class created", classroom });
  } catch (err) {
    next(err);
  }
};

exports.updateClassroom = async (req, res, next) => {
  try {
    const classroom = await Classroom.findOne({ _id: req.params.id, teacher: req.user._id });
    if (!classroom) return res.status(404).json({ message: "Class not found" });

    const { year, className, section } = req.body;
    if (year !== undefined) classroom.year = year;
    if (className !== undefined) classroom.className = className.trim();
    if (section !== undefined) classroom.section = section;
    await classroom.save();
    res.status(200).json({ message: "Class updated", classroom });
  } catch (err) {
    next(err);
  }
};

exports.deleteClassroom = async (req, res, next) => {
  try {
    const classroom = await Classroom.findOne({ _id: req.params.id, teacher: req.user._id });
    if (!classroom) return res.status(404).json({ message: "Class not found" });

    const attendanceCount = await Attendance.countDocuments({ classroom: classroom._id });
    if (attendanceCount) {
      return res.status(409).json({
        message: "This class has attendance records and cannot be deleted. Remove those records first.",
      });
    }

    await classroom.deleteOne();
    res.status(200).json({ message: "Class deleted" });
  } catch (err) {
    next(err);
  }
};
