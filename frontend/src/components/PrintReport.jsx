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

  return (
    <div id="print-report" className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-100 print:shadow-none print:ring-0">
      <h2 className="text-center text-lg font-semibold text-slate-800">Attendance Report</h2>

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
