import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Printer, Search } from "lucide-react";
import Topbar from "../components/Topbar";
import Spinner from "../components/Spinner";
import PrintReport from "../components/PrintReport";
import api from "../api/axios";
import { YEARS, CLASSES, SECTIONS, STATUS_COLORS, STATUS_CARD_COLORS } from "../utils/rollNumbers";

const AttendanceHistory = () => {
  const [filters, setFilters] = useState({ date: "", year: "", className: "", section: "", rollNumber: "" });
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

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
              <button type="submit" className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white">
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
              <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Year</th>
                      <th className="px-4 py-3">Class</th>
                      <th className="px-4 py-3">Section</th>
                      <th className="px-4 py-3">Present</th>
                      <th className="px-4 py-3">Absent</th>
                      <th className="px-4 py-3">Half Day</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r) => (
                      <tr key={r._id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3">{formatDate(r.date)}</td>
                        <td className="px-4 py-3">{r.year}</td>
                        <td className="px-4 py-3">{r.className}</td>
                        <td className="px-4 py-3">{r.section}</td>
                        <td className="px-4 py-3 text-emerald-600">{r.summary?.present}</td>
                        <td className="px-4 py-3 text-rose-600">{r.summary?.absent}</td>
                        <td className="px-4 py-3 text-amber-600">{r.summary?.halfDay}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => setSelected(r)} className="text-xs font-medium text-brand-600 hover:underline">
                            View / Print
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
              <button onClick={() => window.print()} className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white">
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
                <div className="rounded-xl bg-emerald-50 p-4">
                  <p className="text-xs font-medium text-emerald-500">Present</p>
                  <p className="mt-1 text-2xl font-semibold text-emerald-600">{selected.summary?.present}</p>
                </div>
                <div className="rounded-xl bg-rose-50 p-4">
                  <p className="text-xs font-medium text-rose-500">Absent</p>
                  <p className="mt-1 text-2xl font-semibold text-rose-600">{selected.summary?.absent}</p>
                </div>
                <div className="rounded-xl bg-amber-50 p-4">
                  <p className="text-xs font-medium text-amber-500">Half Day</p>
                  <p className="mt-1 text-2xl font-semibold text-amber-600">{selected.summary?.halfDay}</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {selected.students.map((s) => (
                  <div key={s.rollNumber} className={`rounded-xl border p-3 ${STATUS_CARD_COLORS[s.status]}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-semibold text-slate-700">{s.rollNumber}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_COLORS[s.status]}`}>
                        {s.status}
                      </span>
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