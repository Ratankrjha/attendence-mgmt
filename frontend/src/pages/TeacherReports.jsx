import { useMemo, useState } from "react";
import { Download, FileBarChart, Printer, Search } from "lucide-react";
import toast from "react-hot-toast";
import Topbar from "../components/Topbar";
import Spinner from "../components/Spinner";
import api from "../api/axios";

const csvValue = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

const TeacherReports = () => {
  const [filters, setFilters] = useState({ fromDate: "", toDate: "", className: "", section: "" });
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  const report = useMemo(() => {
    const students = new Map();
    records.forEach((record) => record.students.forEach((student) => {
      const key = `${record.year}|${record.className}|${record.section}|${student.rollNumber}`;
      const current = students.get(key) || { rollNumber: student.rollNumber, year: record.year, className: record.className, section: record.section, sessions: 0, score: 0, present: 0, absent: 0, halfDay: 0 };
      current.sessions += 1;
      if (student.status === "Present") { current.present += 1; current.score += 1; }
      else if (student.status === "Half Day") { current.halfDay += 1; current.score += 0.5; }
      else current.absent += 1;
      students.set(key, current);
    }));
    return [...students.values()].map((student) => ({ ...student, percentage: Math.round((student.score / student.sessions) * 100) })).sort((a, b) => a.percentage - b.percentage || a.rollNumber.localeCompare(b.rollNumber));
  }, [records]);

  const load = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
      const response = await api.get("/attendance", { params });
      setRecords(response.data.records || []);
      if (!response.data.records?.length) toast("No records found for that report");
    } catch (error) { toast.error(error.response?.data?.message || "Could not create report"); }
    finally { setLoading(false); }
  };
  const updateFilter = (event) => setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  const exportCsv = () => {
    if (!report.length) return toast.error("Create a report first");
    const rows = [["Roll Number", "Year", "Class", "Section", "Sessions", "Present", "Absent", "Half Day", "Attendance %"], ...report.map((student) => [student.rollNumber, student.year, student.className, student.section, student.sessions, student.present, student.absent, student.halfDay, student.percentage])];
    const blob = new Blob([rows.map((row) => row.map(csvValue).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = "attendance-report.csv"; link.click(); URL.revokeObjectURL(url);
  };

  return <div className="min-h-screen bg-slate-50"><Topbar title="Attendance Reports" /><main className="mx-auto max-w-6xl px-6 py-8"><div><h2 className="text-2xl font-semibold text-slate-800">Student attendance report</h2><p className="mt-1 text-sm text-slate-500">Generate an attendance percentage report for your assigned classes.</p></div><form onSubmit={load} className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100"><label className="text-xs text-slate-500">From<input type="date" name="fromDate" value={filters.fromDate} onChange={updateFilter} className="mt-1 block rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label><label className="text-xs text-slate-500">To<input type="date" name="toDate" value={filters.toDate} onChange={updateFilter} className="mt-1 block rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label><label className="text-xs text-slate-500">Class<input name="className" value={filters.className} onChange={updateFilter} placeholder="e.g. CSE" className="mt-1 block w-32 rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label><label className="text-xs text-slate-500">Section<input name="section" value={filters.section} onChange={updateFilter} placeholder="A" className="mt-1 block w-20 rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label><button className="btn-brand"><Search className="h-4 w-4" /> Create report</button></form>{loading ? <div className="flex justify-center py-16"><Spinner /></div> : <section id="print-report" className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100"><div className="no-print flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold text-slate-800">Report results</h3><p className="text-sm text-slate-500">{records.length} attendance sessions · {report.length} students</p></div><div className="flex gap-3"><button onClick={exportCsv} className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"><Download className="h-4 w-4" /> CSV</button><button onClick={() => window.print()} className="btn-brand"><Printer className="h-4 w-4" /> Print</button></div></div>{report.length ? <div className="mt-5 overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="border-b border-slate-200 text-xs uppercase text-slate-400"><tr><th className="px-3 py-3">Student</th><th className="px-3 py-3">Class</th><th className="px-3 py-3">Sessions</th><th className="px-3 py-3">Present</th><th className="px-3 py-3">Absent</th><th className="px-3 py-3">Attendance</th></tr></thead><tbody>{report.map((student) => <tr key={`${student.className}-${student.section}-${student.rollNumber}`} className="border-b border-slate-100"><td className="px-3 py-3 font-mono font-medium text-slate-700">{student.rollNumber}</td><td className="px-3 py-3 text-slate-600">{student.className} · {student.section}</td><td className="px-3 py-3 text-slate-600">{student.sessions}</td><td className="px-3 py-3 text-emerald-700">{student.present}</td><td className="px-3 py-3 text-rose-700">{student.absent}</td><td className={`px-3 py-3 font-semibold ${student.percentage < 75 ? "text-rose-600" : "text-emerald-600"}`}>{student.percentage}%</td></tr>)}</tbody></table></div> : <div className="py-12 text-center"><FileBarChart className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm text-slate-500">Select filters and create a report to see attendance percentages.</p></div>}</section>}</main></div>;
};

export default TeacherReports;
