const Classroom = require("../models/Classroom");
const Attendance = require("../models/Attendance");
const User = require("../models/User");

const normaliseStudents = (students = []) => {
  if (!Array.isArray(students)) {
    const error = new Error("Students must be a list");
    error.statusCode = 400;
    throw error;
  }

  const seen = new Set();
  return students.map((student) => {
    const rollNumber = String(student.rollNumber || "").trim().toUpperCase();
    if (!rollNumber) {
      const error = new Error("Every student needs a roll number");
      error.statusCode = 400;
      throw error;
    }
    if (seen.has(rollNumber)) {
      const error = new Error(`Duplicate roll number: ${rollNumber}`);
      error.statusCode = 400;
      throw error;
    }
    seen.add(rollNumber);
    return { rollNumber, name: String(student.name || "").trim() };
  });
};

const validateCR = async (crId) => {
  if (!crId) return null;
  const cr = await User.findOne({ _id: crId, role: "CR" });
  if (!cr) {
    const error = new Error("Select a valid CR account");
    error.statusCode = 400;
    throw error;
  }
  return cr._id;
};

const classroomQueryFor = (user, id) => {
  if (String(user.role).toLowerCase() === "teacher") {
    return { _id: id, teacher: user._id };
  }
  return { _id: id, cr: user._id };
};

exports.listClassrooms = async (req, res, next) => {
  try {
    const filter = String(req.user.role).toLowerCase() === "teacher"
      ? { teacher: req.user._id }
      : { cr: req.user._id };
    const classrooms = await Classroom.find(filter)
      .sort({ year: 1, className: 1, section: 1 })
      .populate("cr", "name email");
    res.status(200).json({ count: classrooms.length, classrooms });
  } catch (err) {
    next(err);
  }
};

exports.getClassroom = async (req, res, next) => {
  try {
    const classroom = await Classroom.findOne(classroomQueryFor(req.user, req.params.id))
      .populate("cr", "name email");
    if (!classroom) return res.status(404).json({ message: "Class not found" });
    res.status(200).json({ classroom });
  } catch (err) {
    next(err);
  }
};

exports.createClassroom = async (req, res, next) => {
  try {
    const { year, className, section, crId, students = [] } = req.body;
    if (!year || !className || !section) {
      return res.status(400).json({ message: "Year, class and section are required" });
    }
    const classroom = await Classroom.create({
      teacher: req.user._id,
      year,
      className: className.trim(),
      section,
      cr: await validateCR(crId),
      students: normaliseStudents(students),
    });
    await classroom.populate("cr", "name email");
    res.status(201).json({ message: "Class created", classroom });
  } catch (err) {
    next(err);
  }
};

exports.updateClassroom = async (req, res, next) => {
  try {
    const classroom = await Classroom.findOne({ _id: req.params.id, teacher: req.user._id });
    if (!classroom) return res.status(404).json({ message: "Class not found" });

    const { year, className, section, crId, students } = req.body;
    if (year !== undefined) classroom.year = year;
    if (className !== undefined) classroom.className = className.trim();
    if (section !== undefined) classroom.section = section;
    if (crId !== undefined) classroom.cr = await validateCR(crId);
    if (students !== undefined) classroom.students = normaliseStudents(students);

    await classroom.save();
    await classroom.populate("cr", "name email");
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

exports.listCRs = async (req, res, next) => {
  try {
    const crs = await User.find({ role: "CR" })
      .select("name email createdAt")
      .sort({ name: 1 });
    res.status(200).json({ crs });
  } catch (err) {
    next(err);
  }
};
