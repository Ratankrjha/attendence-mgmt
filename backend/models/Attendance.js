const mongoose = require("mongoose");

const studentRecordSchema = new mongoose.Schema(
  {
    rollNumber: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["Present", "Absent", "Half Day"],
      required: true,
    },
  },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
    date: {
      // stored as YYYY-MM-DD for clean uniqueness + filtering
      type: String,
      required: true,
    },
    year: {
      type: String,
      enum: ["1st Year", "2nd Year", "3rd Year", "4th Year"],
      required: true,
    },
    className: {
      type: String,
      required: true,
      trim: true,
    },
    section: {
      type: String,
      enum: ["A", "B", "C", "D", "E", "F"],
      required: true,
    },
    crName: {
      type: String,
      required: true,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    students: {
      type: [studentRecordSchema],
      required: true,
      validate: (v) => Array.isArray(v) && v.length > 0,
    },
    createdDate: {
      type: String, // YYYY-MM-DD, when the record was actually saved
      required: true,
    },
    createdTime: {
      type: String, // HH:mm:ss
      required: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate attendance for the same date/year/class/section
attendanceSchema.index(
  { date: 1, year: 1, className: 1, section: 1 },
  { unique: true }
);

attendanceSchema.virtual("summary").get(function () {
  const summary = { total: this.students.length, present: 0, absent: 0, halfDay: 0 };
  this.students.forEach((s) => {
    if (s.status === "Present") summary.present += 1;
    else if (s.status === "Absent") summary.absent += 1;
    else if (s.status === "Half Day") summary.halfDay += 1;
  });
  return summary;
});

attendanceSchema.set("toJSON", { virtuals: true });
attendanceSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
