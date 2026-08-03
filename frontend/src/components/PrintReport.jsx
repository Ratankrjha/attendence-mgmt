import toast from "react-hot-toast";
import { Copy } from "lucide-react";

const formatDate = (isoDate) => {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
};

const PrintReport = ({ attendance }) => {
  if (!attendance) return null;

  const present = attendance.students.filter((s) => s.status === "Present").map((s) => s.rollNumber);
  const absent = attendance.students.filter((s) => s.status === "Absent").map((s) => s.rollNumber);
  const halfDay = attendance.students.filter((s) => s.status === "Half Day").map((s) => s.rollNumber);

  const buildPlainTextReport = () => {
    const lines = [];
    lines.push("Attendance Report");
    lines.push("");
    lines.push(`Date: ${formatDate(attendance.date)}    Year: ${attendance.year}`);
    lines.push(`Class: ${attendance.className}    Section: ${attendance.section}`);
    lines.push("");
    lines.push("Present Students:");
    lines.push(present.length ? present.join(", ") : "—");
    lines.push("");
    lines.push("Absent Students:");
    lines.push(absent.length ? absent.join(", ") : "—");
    lines.push("");
    lines.push("Half Day Students:");
    lines.push(halfDay.length ? halfDay.join(", ") : "—");
    lines.push("");
    lines.push("Summary:");
    lines.push(`Total Students: ${attendance.students.length}`);
    lines.push(`Present: ${present.length}`);
    lines.push(`Absent: ${absent.length}`);
    lines.push(`Half Day: ${halfDay.length}`);
    lines.push("");
    lines.push(`Marked By: ${attendance.crName}`);
    lines.push(`Generated Time: ${new Date().toLocaleString()}`);

    return lines.join("\n");
  };

  const handleCopy = async () => {
    const text = buildPlainTextReport();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      }
      toast.success("Report copied to clipboard");
    } catch (err) {
      toast.error("Failed to copy report");
    }
  };

  return (
    <div id="print-report" className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-100 print:shadow-none print:ring-0">
      <div className="flex items-start justify-between">
        <h2 className="text-center text-lg font-semibold text-slate-800 flex-1">Attendance Report</h2>
        <button onClick={handleCopy} className="no-print ml-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-50">
          <Copy className="h-4 w-4" /> Copy Report
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-y-1 text-sm text-slate-700">
        <p><span className="font-medium">Date:</span> {formatDate(attendance.date)}</p>
        <p><span className="font-medium">Year:</span> {attendance.year}</p>
        <p><span className="font-medium">Class:</span> {attendance.className}</p>
        <p><span className="font-medium">Section:</span> {attendance.section}</p>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-emerald-700">Present Students</h3>
        <p className="mt-1 break-words text-sm text-slate-600">{present.length ? present.join(", ") : "—"}</p>
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-semibold text-rose-700">Absent Students</h3>
        <p className="mt-1 break-words text-sm text-slate-600">{absent.length ? absent.join(", ") : "—"}</p>
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-semibold text-amber-700">Half Day Students</h3>
        <p className="mt-1 break-words text-sm text-slate-600">{halfDay.length ? halfDay.join(", ") : "—"}</p>
      </div>

      <div className="mt-6 border-t border-slate-200 pt-4 text-sm text-slate-700">
        <h3 className="font-semibold text-slate-800">Summary</h3>
        <p>Total Students: {attendance.students.length}</p>
        <p>Present: {present.length}</p>
        <p>Absent: {absent.length}</p>
        <p>Half Day: {halfDay.length}</p>
        <p className="mt-2">Marked By: {attendance.crName}</p>
        <p>Generated Time: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
};

export default PrintReport;
