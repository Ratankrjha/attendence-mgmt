import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Printer, Search, Copy, Edit2, Trash, Check, X } from "lucide-react";
import Topbar from "../components/Topbar";
import Spinner from "../components/Spinner";
import PrintReport from "../components/PrintReport";
import api from "../api/axios";
import { YEARS, CLASSES, SECTIONS, STATUSES, STATUS_COLORS, STATUS_CARD_COLORS, STATUS_ACTIVE_COLORS } from "../utils/rollNumbers";

const AttendanceHistory = () => {
  const [filters, setFilters] = useState({ date: "", year: "", className: "", section: "", rollNumber: "" });
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [localStudents, setLocalStudents] = useState([]);
  const [savingEdits, setSavingEdits] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params[k] = v;
      });
      const res = await api.get("/attendance", { params });
      setRecords(res.data.records);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load attendance history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRecords();
  };

  const formatDate = (isoDate) => {
    if (!isoDate) return "";
    const [y, m, d] = isoDate.split("-");
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Topbar title="Attendance History" />

      <div className="mx-auto max-w-6xl px-6 py-8">
        {!selected && (
          <>
            <form onSubmit={handleSearch} className="no-print mb-6 flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Date</label>
                <input type="date" name="date" value={filters.date} onChange={handleFilterChange} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Year</label>
                <select name="year" value={filters.year} onChange={handleFilterChange} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <option value="">All</option>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Class</label>
                <select name="className" value={filters.className} onChange={handleFilterChange} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <option value="">All</option>
                  {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Section</label>
                <select name="section" value={filters.section} onChange={handleFilterChange} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <option value="">All</option>
                  {SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Roll Number</label>
                <input name="rollNumber" value={filters.rollNumber} onChange={handleFilterChange} placeholder="e.g. 12 or B4" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <button type="submit" className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white btn-brand">
                <Search className="h-4 w-4" /> Search
              </button>
            </form>

            {loading ? (
              <div className="flex justify-center py-16"><Spinner /></div>
            ) : records.length === 0 ? (
              <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-100">
                No attendance records found for these filters.
              </div>
            ) : (
              <div className="space-y-3">
                {records.map((r) => (
                  <button
                    key={r._id}
                    onClick={() => setSelected(r)}
                    className="flex w-full flex-col gap-3 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-slate-800">{formatDate(r.date)}</p>
                      <p className="text-xs text-slate-400">
                        {r.year} · {r.className} · Section {r.section}
                      </p>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-600">
                        {r.summary?.present} Present
                      </span>
                      <span className="rounded-full bg-rose-50 px-3 py-1 font-medium text-rose-600">
                        {r.summary?.absent} Absent
                      </span>
                      <span className="rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-600">
                        {r.summary?.halfDay} Half Day
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {selected && (
          <div className="space-y-6">
            <div className="no-print flex gap-3">
              <button onClick={() => setSelected(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600">
                Back to list
              </button>

              {!editing && (
                <>
                  <button onClick={() => {
                    setEditing(true);
                    setLocalStudents(selected.students.map(s => ({ ...s })));
                  }} className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600">
                    <Edit2 className="h-4 w-4" /> Edit
                  </button>

                  <button onClick={async () => {
                    if (!window.confirm('Delete attendance for this date? This cannot be undone.')) return;
                    setDeleting(true);
                    try {
                      await api.delete(`/attendance/${selected._id}`);
                      toast.success('Attendance deleted');
                      setSelected(null);
                      fetchRecords();
                    } catch (err) {
                      toast.error(err.response?.data?.message || 'Failed to delete attendance');
                    } finally {
                      setDeleting(false);
                    }
                  }} className="flex items-center gap-2 rounded-lg border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50">
                    <Trash className="h-4 w-4" /> Delete
                  </button>
                </>
              )}

              {editing && (
                <>
                  <button onClick={async () => {
                    // Save edits
                    if (!localStudents || localStudents.length === 0) {
                      toast.error('No students to save');
                      return;
                    }
                    setSavingEdits(true);
                    try {
                      const res = await api.put(`/attendance/${selected._id}`, { students: localStudents });
                      toast.success('Attendance updated');
                      // refresh selected from server response
                      const updated = res.data.record || res.data.attendance || null;
                      if (updated) setSelected(updated);
                      setEditing(false);
                      fetchRecords();
                    } catch (err) {
                      toast.error(err.response?.data?.message || 'Failed to save changes');
                    } finally {
                      setSavingEdits(false);
                    }
                  }} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white">
                    {savingEdits ? <Spinner /> : <Check className="h-4 w-4" />} Save changes
                  </button>

                  <button onClick={() => { setEditing(false); setLocalStudents([]); }} className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600">
                    <X className="h-4 w-4" /> Cancel
                  </button>
                </>
              )}

              <button onClick={() => window.print()} className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white btn-brand">
                <Printer className="h-4 w-4" /> Print Report
              </button>
            </div>

            <div className="no-print rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-medium text-slate-800">
                  {selected.className} · {selected.section} · {selected.year}
                </h2>
                <p className="text-xs text-slate-400">{formatDate(selected.date)}</p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-400">Total Students</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-700">{selected.students.length}</p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-4 relative">
                  <p className="text-xs font-medium text-emerald-500">Present</p>
                  <p className="mt-1 text-2xl font-semibold text-emerald-600">{selected.summary?.present}</p>
                  <button onClick={() => {
                    const present = (editing ? localStudents : selected.students).filter(s => s.status === 'Present').map(s => s.rollNumber).join(', ');
                    if (!present) { toast('No present students to copy'); return; }
                    navigator.clipboard?.writeText(present).then(() => toast.success('Present list copied')) .catch(() => {
                      const ta = document.createElement('textarea'); ta.value = present; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); toast.success('Present list copied');
                    });
                  }} className="absolute right-3 top-3 text-emerald-600">
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <div className="rounded-xl bg-rose-50 p-4 relative">
                  <p className="text-xs font-medium text-rose-500">Absent</p>
                  <p className="mt-1 text-2xl font-semibold text-rose-600">{selected.summary?.absent}</p>
                  <button onClick={() => {
                    const absent = (editing ? localStudents : selected.students).filter(s => s.status === 'Absent').map(s => s.rollNumber).join(', ');
                    if (!absent) { toast('No absent students to copy'); return; }
                    navigator.clipboard?.writeText(absent).then(() => toast.success('Absent list copied')) .catch(() => {
                      const ta = document.createElement('textarea'); ta.value = absent; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); toast.success('Absent list copied');
                    });
                  }} className="absolute right-3 top-3 text-rose-600">
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <div className="rounded-xl bg-amber-50 p-4">
                  <p className="text-xs font-medium text-amber-500">Half Day</p>
                  <p className="mt-1 text-2xl font-semibold text-amber-600">{selected.summary?.halfDay}</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(editing ? localStudents : selected.students).map((s, idx) => (
                  <div key={s.rollNumber} className={`rounded-xl border p-3 ${STATUS_CARD_COLORS[s.status]}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-semibold text-slate-700">{s.rollNumber}</span>
                      <div className="flex items-center gap-2">
                        {!editing && (
                          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_COLORS[s.status]}`}>
                            {s.status}
                          </span>
                        )}

                        {editing && (
                          <div className="mt-0 grid grid-cols-3 gap-1.5">
                            {STATUSES.map((st) => (
                              <button key={st} onClick={() => {
                                setLocalStudents(prev => {
                                  const copy = [...prev];
                                  copy[idx] = { ...copy[idx], status: st };
                                  return copy;
                                });
                              }} className={`rounded-md border py-1 text-[11px] font-medium ${localStudents[idx]?.status === st ? STATUS_ACTIVE_COLORS[st] : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                                {st}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <PrintReport attendance={selected} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceHistory;