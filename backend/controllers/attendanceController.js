const Attendance = require("../models/Attendance");
const Classroom = require("../models/Classroom");
const Notification = require("../models/Notification");

const VALID_STATUSES = ["Present", "Absent", "Half Day"];

// @route POST /api/attendance
// @desc  Save a new attendance session (blocked if one already exists for date+year+class+section)
exports.saveAttendance = async (req, res, next) => {
  try {
    const { date, year, className, section, students, skipPrefixes } = req.body;

    if (!date || !year || !className || !section) {
      return res.status(400).json({ message: "Date, year, class and section are required" });
    }

    if (!Array.isArray(students)) {
      return res.status(400).json({ message: "At least one student record is required" });
    }

    // Parse skip prefixes (one-time input from client). Example: "O, X"
    const prefixes = typeof skipPrefixes === "string" && skipPrefixes.trim()
      ? skipPrefixes
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean)
          .map((p) => p.toUpperCase())
      : [];

    // Filter students by prefixes (case-insensitive prefix match)
    let filteredStudents = students;
    if (prefixes.length) {
      filteredStudents = students.filter((s) => {
        const rn = String(s.rollNumber).toUpperCase();
        return !prefixes.some((pref) => rn.startsWith(pref));
      });
    }

    if (!Array.isArray(filteredStudents) || filteredStudents.length === 0) {
      return res.status(400).json({ message: "At least one student record is required after applying skip prefixes" });
    }

    for (const s of filteredStudents) {
      if (!s.rollNumber || !VALID_STATUSES.includes(s.status)) {
        return res.status(400).json({
          message: `Invalid record for roll number "${s.rollNumber || "unknown"}". Status must be Present, Absent, or Half Day.`,
        });
      }
    }

    const classroom = await Classroom.findOne({
      year,
      className,
      section,
      cr: req.user._id,
    });
    if (!classroom) {
      return res.status(403).json({
        message: "Your email is not linked to this class. Ask the teacher to link it using your registered email.",
      });
    }

    const existing = await Attendance.findOne({ date, classroom: classroom._id });
    if (existing) {
      return res.status(409).json({ message: "Attendance already exists for this user. Do not create duplicate records." });
    }

    const now = new Date();
    const createdDate = now.toISOString().slice(0, 10);
    const createdTime = now.toTimeString().slice(0, 8);

    const attendance = await Attendance.create({
      date,
      year,
      className,
      section,
      crName: req.user.name,
      markedBy: req.user._id,
      teacher: classroom.teacher,
      classroom: classroom._id,
      students: filteredStudents,
      createdDate,
      createdTime,
    });

    await Notification.create({
      recipient: classroom.teacher,
      type: "attendance_submitted",
      title: "New attendance submitted",
      message: `${req.user.name} submitted attendance for ${className} Section ${section} on ${date}.`,
      attendance: attendance._id,
    });

    res.status(201).json({ message: "Attendance saved successfully", attendance });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/attendance
// @desc  List/filter attendance history
// Query params: date, year, className, section, rollNumber
exports.getAttendance = async (req, res, next) => {
  try {
    const { date, fromDate, toDate, year, className, section, rollNumber } = req.query;
    const filter = {};

    if (date) filter.date = date;
    else if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = fromDate;
      if (toDate) filter.date.$lte = toDate;
    }
    if (year) filter.year = year;
    if (className) filter.className = className;
    if (section) filter.section = section;
    if (rollNumber) filter["students.rollNumber"] = rollNumber.trim();

    // Users can only see data belonging to them or to their assigned classes.
    if (String(req.user.role).toLowerCase() === 'cr') {
      filter.markedBy = req.user._id;
    } else {
      filter.teacher = req.user._id;
    }

    const records = await Attendance.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .populate("markedBy", "name email role");

    res.status(200).json({ count: records.length, records });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/attendance/check
// @desc  Check whether a session already exists for date+year+class+section
exports.checkAttendanceExists = async (req, res, next) => {
  try {
    const { date, year, className, section } = req.query;
    if (!date || !year || !className || !section) {
      return res.status(400).json({ message: "Date, year, class and section are required" });
    }
    const classroom = await Classroom.findOne({
      year,
      className,
      section,
      cr: req.user._id,
    });
    if (!classroom) {
      return res.status(403).json({ message: "Your email is not linked to this class" });
    }
    const checkQuery = { date, classroom: classroom._id };
    const existing = await Attendance.findOne(checkQuery);
    res.status(200).json({ exists: !!existing, attendance: existing || null });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/attendance/:id
exports.getAttendanceById = async (req, res, next) => {
  try {
    const accessFilter = String(req.user.role).toLowerCase() === "teacher"
      ? { _id: req.params.id, teacher: req.user._id }
      : { _id: req.params.id, markedBy: req.user._id };
    const record = await Attendance.findOne(accessFilter).populate("markedBy", "name email role");
    if (!record) {
      return res.status(404).json({ message: "Attendance record not found" });
    }
    res.status(200).json({ record });
  } catch (err) {
    next(err);
  }
};

// @route PUT /api/attendance/:id
// @desc  Update an existing attendance session (future use)
exports.updateAttendance = async (req, res, next) => {
  try {
    const { students } = req.body;
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ message: "At least one student record is required" });
    }
    for (const s of students) {
      if (!s.rollNumber || !VALID_STATUSES.includes(s.status)) {
        return res.status(400).json({ message: `Invalid record for roll number "${s.rollNumber || "unknown"}"` });
      }
    }

    const accessFilter = String(req.user.role).toLowerCase() === "teacher"
      ? { _id: req.params.id, teacher: req.user._id }
      : { _id: req.params.id, markedBy: req.user._id };
    const record = await Attendance.findOneAndUpdate(
      accessFilter,
      { students },
      { new: true, runValidators: true }
    );

    res.status(200).json({ message: "Attendance updated successfully", record });
  } catch (err) {
    next(err);
  }
};

// @route DELETE /api/attendance/:id (future use)
exports.deleteAttendance = async (req, res, next) => {
  try {
    const accessFilter = String(req.user.role).toLowerCase() === "teacher"
      ? { _id: req.params.id, teacher: req.user._id }
      : { _id: req.params.id, markedBy: req.user._id };
    const record = await Attendance.findOneAndDelete(accessFilter);
    if (!record) return res.status(404).json({ message: "Attendance record not found" });
    res.status(200).json({ message: "Attendance record deleted" });
  } catch (err) {
    next(err);
  }
};
