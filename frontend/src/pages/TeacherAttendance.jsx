import { useEffect, useState } from "react";
import { Check, Edit2, Printer, Search, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import Topbar from "../components/Topbar";
import Spinner from "../components/Spinner";
import PrintReport from "../components/PrintReport";
import api from "../api/axios";
import { STATUSES, STATUS_ACTIVE_COLORS, STATUS_CARD_COLORS, STATUS_COLORS } from "../utils/rollNumbers";

const formatDate = (date) => date ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(`${date}T00:00:00`)) : "—";
const statusSummary = (students = []) => students.reduce((summary, student) => ({ ...summary, [student.status]: (summary[student.status] || 0) + 1 }), {});

const TeacherAttendance = () => {
  const [filters, setFilters] = useState({ fromDate: "", toDate: "", className: "", section: "", rollNumber: "" });
  const [records, setRecords] = useState([]);
  const [selected, setSelected] = useState(null);
  const [localStudents, setLocalStudents] = useState([]);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async (activeFilters = filters) => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(activeFilters).filter(([, value]) => value));
      const response = await api.get("/attendance", { params });
      setRecords(response.data.records || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load attendance");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  const updateFilter = (event) => setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  const openRecord = (record) => { setSelected(record); setEditing(false); setLocalStudents([]); };
  const startEdit = () => { setLocalStudents(selected.students.map((student) => ({ ...student }))); setEditing(true); };

  const saveChanges = async () => {
    setSaving(true);
    try {
      const response = await api.put(`/attendance/${selected._id}`, { students: localStudents });
      setSelected(response.data.record);
      setEditing(false);
      toast.success("Attendance updated");
      load();
    } catch (error) { toast.error(error.response?.data?.message || "Could not update attendance"); }
    finally { setSaving(false); }
  };
  const deleteRecord = async () => {
    if (!window.confirm("Delete this attendance record? This cannot be undone.")) return;
    try {
      await api.delete(`/attendance/${selected._id}`);
      toast.success("Attendance deleted");
      setSelected(null);
      load();
    } catch (error) { toast.error(error.response?.data?.message || "Could not delete attendance"); }
  };

  if (selected) {
    const students = editing ? localStudents : selected.students;
    const summary = statusSummary(students);
    return <div className="min-h-screen bg-slate-50"><Topbar title="Review Attendance" /><main className="mx-auto max-w-6xl px-6 py-8"><div className="no-print flex flex-wrap gap-3"><button onClick={() => setSelected(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600">Back to records</button>{!editing ? <><button onClick={startEdit} className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"><Edit2 className="h-4 w-4" /> Edit statuses</button><button onClick={deleteRecord} className="flex items-center gap-2 rounded-lg border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600"><Trash2 className="h-4 w-4" /> Delete</button></> : <><button onClick={saveChanges} disabled={saving} className="btn-brand disabled:opacity-50">{saving ? <Spinner /> : <Check className="h-4 w-4" />} Save changes</button><button onClick={() => { setEditing(false); setLocalStudents([]); }} className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"><X className="h-4 w-4" /> Cancel</button></>}<button onClick={() => window.print()} className="btn-brand"><Printer className="h-4 w-4" /> Print</button></div>
      <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-semibold text-slate-800">{selected.className} · Section {selected.section}</h2><p className="mt-1 text-sm text-slate-500">{selected.year} · {formatDate(selected.date)} · submitted by {selected.markedBy?.name || selected.crName}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">{students.length} students</span></div><div className="mt-5 grid grid-cols-3 gap-3"><div className="rounded-xl bg-emerald-50 p-3 text-center text-sm text-emerald-700">{summary.Present || 0} Present</div><div className="rounded-xl bg-rose-50 p-3 text-center text-sm text-rose-700">{summary.Absent || 0} Absent</div><div className="rounded-xl bg-amber-50 p-3 text-center text-sm text-amber-700">{summary["Half Day"] || 0} Half Day</div></div><div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{students.map((student, index) => <div key={student.rollNumber} className={`rounded-xl border p-3 ${STATUS_CARD_COLORS[student.status]}`}><div className="flex items-center justify-between gap-2"><span className="font-mono font-semibold text-slate-700">{student.rollNumber}</span>{!editing && <span className={`rounded-full border px-2 py-0.5 text-xs ${STATUS_COLORS[student.status]}`}>{student.status}</span>}</div>{editing && <div className="mt-3 grid grid-cols-3 gap-1">{STATUSES.map((status) => <button key={status} onClick={() => setLocalStudents((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, status } : item))} className={`rounded-md border py-1 text-[11px] font-medium ${student.status === status ? STATUS_ACTIVE_COLORS[status] : "border-slate-200 text-slate-500"}`}>{status}</button>)}</div>}</div>)}</div></section><PrintReport attendance={{ ...selected, students }} /></main></div>;
  }

  return <div className="min-h-screen bg-slate-50"><Topbar title="Review Attendance" /><main className="mx-auto max-w-6xl px-6 py-8"><div><h2 className="text-2xl font-semibold text-slate-800">Attendance records</h2><p className="mt-1 text-sm text-slate-500">Only attendance for your classes appears here.</p></div><form onSubmit={(event) => { event.preventDefault(); load(); }} className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100"><label className="text-xs text-slate-500">From<input type="date" name="fromDate" value={filters.fromDate} onChange={updateFilter} className="mt-1 block rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label><label className="text-xs text-slate-500">To<input type="date" name="toDate" value={filters.toDate} onChange={updateFilter} className="mt-1 block rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label><label className="text-xs text-slate-500">Class<input name="className" value={filters.className} onChange={updateFilter} placeholder="e.g. CSE" className="mt-1 block w-28 rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label><label className="text-xs text-slate-500">Section<input name="section" value={filters.section} onChange={updateFilter} placeholder="A" className="mt-1 block w-20 rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label><label className="text-xs text-slate-500">Roll number<input name="rollNumber" value={filters.rollNumber} onChange={updateFilter} placeholder="101" className="mt-1 block w-28 rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label><button className="btn-brand"><Search className="h-4 w-4" /> Search</button></form>{loading ? <div className="flex justify-center py-16"><Spinner /></div> : records.length ? <div className="mt-5 space-y-3">{records.map((record) => <button key={record._id} onClick={() => openRecord(record)} className="flex w-full flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-5 text-left shadow-sm ring-1 ring-slate-100 transition hover:shadow-md"><div><p className="font-semibold text-slate-800">{record.className} · Section {record.section}</p><p className="mt-1 text-sm text-slate-500">{record.year} · {formatDate(record.date)} · {record.markedBy?.name || record.crName}</p></div><div className="flex gap-2 text-xs"><span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">{record.summary?.present} present</span><span className="rounded-full bg-rose-50 px-3 py-1 text-rose-700">{record.summary?.absent} absent</span></div></button>)}</div> : <div className="mt-5 rounded-2xl bg-white p-10 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-100">No attendance records match these filters.</div>}</main></div>;
};

export default TeacherAttendance;
