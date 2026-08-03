const Attendance = require("../models/Attendance");

const VALID_STATUSES = ["Present", "Absent", "Half Day"];

// @route POST /api/attendance
// @desc  Save a new attendance session (blocked if one already exists for date+year+class+section)
exports.saveAttendance = async (req, res, next) => {
  try {
    const { date, year, className, section, crName, students, skipPrefixes } = req.body;

    if (!date || !year || !className || !section || !crName) {
      return res.status(400).json({ message: "Date, year, class, section and CR name are required" });
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

    // Prevent duplicate attendance for the same creator when CR role
    const checkQuery = { date, year, className, section };
    if (req.user.role === 'CR') {
      checkQuery.markedBy = req.user._id;
    }
    const existing = await Attendance.findOne(checkQuery);
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
      crName,
      markedBy: req.user._id,
      students: filteredStudents,
      createdDate,
      createdTime,
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
    const { date, year, className, section, rollNumber } = req.query;
    const filter = {};

    if (date) filter.date = date;
    if (year) filter.year = year;
    if (className) filter.className = className;
    if (section) filter.section = section;
    if (rollNumber) filter["students.rollNumber"] = rollNumber.trim();

    // CR users should only see their own records; Teachers can see all
    if (req.user.role === 'CR') {
      filter.markedBy = req.user._id;
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
    const checkQuery = { date, year, className, section };
    if (req.user.role === 'CR') checkQuery.markedBy = req.user._id;
    const existing = await Attendance.findOne(checkQuery);
    res.status(200).json({ exists: !!existing, attendance: existing || null });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/attendance/:id
exports.getAttendanceById = async (req, res, next) => {
  try {
    const record = await Attendance.findById(req.params.id).populate("markedBy", "name email role");
    if (!record) {
      return res.status(404).json({ message: "Attendance record not found" });
    }
    // Enforce that CRs can only access their own records
    if (req.user.role === 'CR' && String(record.markedBy._id) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You do not have permission to view this attendance record' });
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

    const existingRecord = await Attendance.findById(req.params.id);
    if (!existingRecord) {
      return res.status(404).json({ message: "Attendance record not found" });
    }
    // Only the owner (creator) can update
    if (req.user.role === 'CR' && String(existingRecord.markedBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You do not have permission to update this attendance record' });
    }

    const record = await Attendance.findByIdAndUpdate(
      req.params.id,
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
    const record = await Attendance.findById(req.params.id);
    if (!record) return res.status(404).json({ message: "Attendance record not found" });

    if (req.user.role === 'CR' && String(record.markedBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You do not have permission to delete this attendance record' });
    }

    await Attendance.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Attendance record deleted" });
  } catch (err) {
    next(err);
  }
};
