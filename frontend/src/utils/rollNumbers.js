// Generates the predefined roll number set:
// Numeric 1-100, then alphabetic blocks A0-A9 through Z0-Z9
export const generatePredefinedRollNumbers = () => {
  const rollNumbers = [];

  for (let i = 1; i <= 100; i++) {
    rollNumbers.push(String(i));
  }

  for (let charCode = 65; charCode <= 90; charCode++) {
    const letter = String.fromCharCode(charCode);
    for (let n = 0; n <= 9; n++) {
      rollNumbers.push(`${letter}${n}`);
    }
  }

  return rollNumbers;
};

// Returns the slice of the full predefined sequence that falls between
// `from` and `to` (inclusive), in whichever order they were entered.
// Works for numeric ranges ("12" to "45") and alphabetic ranges ("K3" to "R7")
// since both live in the same ordered sequence.
export const generateRollNumberRange = (from, to) => {
  const full = generatePredefinedRollNumbers();
  const normalizedFrom = from.trim().toUpperCase();
  const normalizedTo = to.trim().toUpperCase();

  const startIdx = full.indexOf(normalizedFrom);
  const endIdx = full.indexOf(normalizedTo);

  if (startIdx === -1 || endIdx === -1) {
    return { error: "Roll numbers must be in the format 1-100 or a letter+digit like K3.", rollNumbers: [] };
  }

  const [lo, hi] = startIdx <= endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
  return { error: null, rollNumbers: full.slice(lo, hi + 1) };
};

export const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

export const CLASSES = ["CSE", "CSE(AI)", "IT", "ECE", "EEE", "Mechanical", "Civil", "CS", "DS"];

export const SECTIONS = ["A", "B", "C", "D", "E", "F"];

export const STATUSES = ["Present", "Absent", "Half Day"];

export const STATUS_COLORS = {
  Present: "bg-emerald-100 text-emerald-700 border-emerald-300",
  Absent: "bg-rose-100 text-rose-700 border-rose-300",
  "Half Day": "bg-amber-100 text-amber-700 border-amber-300",
};

export const STATUS_ACTIVE_COLORS = {
  Present: "bg-emerald-600 text-white border-emerald-600",
  Absent: "bg-rose-600 text-white border-rose-600",
  "Half Day": "bg-amber-500 text-white border-amber-500",
};
