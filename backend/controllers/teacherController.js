const Attendance = require("../models/Attendance");
const Classroom = require("../models/Classroom");

const attendanceRate = (students) => {
  if (!students.length) return 0;
  const score = students.reduce((total, student) => {
    if (student.status === "Present") return total + 1;
    if (student.status === "Half Day") return total + 0.5;
    return total;
  }, 0);
  return Math.round((score / students.length) * 100);
};

exports.getDashboard = async (req, res, next) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const [classrooms, records, todayRecords] = await Promise.all([
      Classroom.find({ teacher: req.user._id }).select("year className section"),
      Attendance.find({ teacher: req.user._id })
        .sort({ date: -1, createdAt: -1 })
        .populate("markedBy", "name email"),
      Attendance.find({ teacher: req.user._id, date: today }).select("classroom"),
    ]);

    const allStudents = records.flatMap((record) => record.students);
    const rates = new Map();
    records.forEach((record) => {
      record.students.forEach((student) => {
        const key = `${record.classroom || `${record.year}|${record.className}|${record.section}`}|${student.rollNumber}`;
        const current = rates.get(key) || {
          rollNumber: student.rollNumber,
          className: record.className,
          section: record.section,
          year: record.year,
          sessions: 0,
          score: 0,
        };
        current.sessions += 1;
        current.score += student.status === "Present" ? 1 : student.status === "Half Day" ? 0.5 : 0;
        rates.set(key, current);
      });
    });

    const lowAttendance = [...rates.values()]
      .map((student) => ({
        ...student,
        percentage: Math.round((student.score / student.sessions) * 100),
      }))
      .filter((student) => student.percentage < 75)
      .sort((a, b) => a.percentage - b.percentage || b.sessions - a.sessions)
      .slice(0, 8);

    const markedClassroomIds = new Set(todayRecords.map((record) => String(record.classroom)));
    const pendingClasses = classrooms
      .filter((classroom) => !markedClassroomIds.has(String(classroom._id)))
      .map((classroom) => ({
        id: classroom._id,
        year: classroom.year,
        className: classroom.className,
        section: classroom.section,
      }));

    res.status(200).json({
      stats: {
        classes: classrooms.length,
        students: new Set(records.flatMap((record) => record.students.map((student) => `${record.classroom}|${student.rollNumber}`))).size,
        attendanceSessions: records.length,
        todaySessions: todayRecords.length,
        overallAttendance: attendanceRate(allStudents),
      },
      pendingClasses,
      lowAttendance,
      recentAttendance: records.slice(0, 6),
    });
  } catch (err) {
    next(err);
  }
};
