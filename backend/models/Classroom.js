const mongoose = require("mongoose");

const classroomSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    year: {
      type: String,
      enum: ["1st Year", "2nd Year", "3rd Year", "4th Year"],
      required: true,
    },
    className: { type: String, required: true, trim: true },
    section: {
      type: String,
      enum: ["A", "B", "C", "D", "E", "F"],
      required: true,
    },
  },
  { timestamps: true }
);

classroomSchema.index(
  { year: 1, className: 1, section: 1 },
  { unique: true }
);

module.exports = mongoose.model("Classroom", classroomSchema);
