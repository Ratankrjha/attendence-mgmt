import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Plus, Printer, Save } from "lucide-react";
import Topbar from "../components/Topbar";
import Spinner from "../components/Spinner";
import ConfirmDialog from "../components/ConfirmDialog";
import PrintReport from "../components/PrintReport";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import {
  generateRollNumberRange,
  YEARS,
  CLASSES,
  SECTIONS,
  STATUSES,
  STATUS_COLORS,
  STATUS_ACTIVE_COLORS,
  STATUS_CARD_COLORS,
} from "../utils/rollNumbers";

const todayISO = () => new Date().toISOString().slice(0, 10);

const MarkAttendance = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [date, setDate] = useState(todayISO());
  const [year, setYear] = useState("");
  const [className, setClassName] = useState("");
  const [section, setSection] = useState("");
  const [rollFrom, setRollFrom] = useState("");
  const [rollTo, setRollTo] = useState("");
  const [rangeError, setRangeError] = useState("");

  const [records, setRecords] = useState({}); // { rollNumber: status }
  const [manualRoll, setManualRoll] = useState("");
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [savedAttendance, setSavedAttendance] = useState(null);

  const rollNumbers = useMemo(() => Object.keys(records), [records]);

  const summary = useMemo(() => {
    const values = Object.values(records);
    return {
      total: values.length,
      present: values.filter((s) => s === "Present").length,
      absent: values.filter((s) => s === "Absent").length,
      halfDay: values.filter((s) => s === "Half Day").length,
    };
  }, [records]);

  const canProceedStep1 = !!date;
  const canProceedStep2 = !!year;
  const canProceedStep3 = !!className;
  const canProceedStep4 = !!section;

  const generateList = () => {
    if (!rollFrom.trim() || !rollTo.trim()) {
      setRangeError("Enter both a starting and ending roll number for your class.");
      return;
    }
    const { error, rollNumbers: rangeRolls } = generateRollNumberRange(rollFrom, rollTo);
    if (error) {
      setRangeError(error);
      return;
    }
    setRangeError("");
    const initial = {};
    rangeRolls.forEach((rn) => {
      initial[rn] = "Present";
    });
    setRecords(initial);
    setStep(6);
  };

  const setStatus = (rollNumber, status) => {
    setRecords((prev) => ({ ...prev, [rollNumber]: status }));
  };

  const addManualRoll = () => {
    const rn = manualRoll.trim();
    if (!rn) return;
    if (records[rn]) {
      toast.error("This roll number already exists in the list");
      return;
    }
    setRecords((prev) => ({ ...prev, [rn]: "Present" }));
    setManualRoll("");
  };

  const handleSaveClick = async () => {
    if (rollNumbers.length === 0) {
      toast.error("Generate the student list first");
      return;
    }
    setChecking(true);
    try {
      const res = await api.get("/attendance/check", {
        params: { date, year, className, section },
      });
      if (res.data.exists) {
        toast.error("Attendance already exists. Do not create duplicate records.");
        return;
      }
      setConfirmOpen(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not verify existing attendance");
    } finally {
      setChecking(false);
    }
  };

  const confirmSave = async () => {
    setConfirmOpen(false);
    setSaving(true);
    try {
      const students = Object.entries(records).map(([rollNumber, status]) => ({
        rollNumber,
        status,
      }));

      const res = await api.post("/attendance", {
        date,
        year,
        className,
        section,
        crName: user.name,
        students,
      });

      toast.success("Attendance saved successfully");
      setSavedAttendance(res.data.attendance);
      setStep(7);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const stepLabels = ["Date", "Year", "Class", "Section", "Range", "Roster", "Done"];

  return (
    <div className="min-h-screen bg-slate-50">
      <Topbar title="Mark Attendance" />

      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Stepper */}
        <div className="no-print mb-8 flex items-center gap-2">
          {stepLabels.map((label, idx) => (
            <div key={label} className="flex flex-1 items-center gap-2">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  step > idx ? "bg-brand-600 text-white" : step === idx + 1 ? "bg-brand-100 text-brand-700 ring-2 ring-brand-500" : "bg-slate-200 text-slate-500"
                }`}
              >
                {idx + 1}
              </div>
              <span className="hidden text-xs font-medium text-slate-500 sm:block">{label}</span>
              {idx < stepLabels.length - 1 && <div className="h-px flex-1 bg-slate-200" />}
            </div>
          ))}
        </div>

        {/* Step 1: Date */}
        {step === 1 && (
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <h2 className="font-medium text-slate-800">Select Date</h2>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-3 w-full max-w-xs rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
            <div className="mt-6">
              <button
                disabled={!canProceedStep1}
                onClick={() => setStep(2)}
                className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Year */}
        {step === 2 && (
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <h2 className="font-medium text-slate-800">Select Year</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {YEARS.map((y) => (
                <button
                  key={y}
                  onClick={() => setYear(y)}
                  className={`rounded-lg border px-3 py-3 text-sm font-medium transition ${
                    year === y ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setStep(1)} className="rounded-lg border border-slate-200 px-5 py-2 text-sm font-medium text-slate-600">
                Back
              </button>
              <button
                disabled={!canProceedStep2}
                onClick={() => setStep(3)}
                className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Class */}
        {step === 3 && (
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <h2 className="font-medium text-slate-800">Select Class</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {CLASSES.map((c) => (
                <button
                  key={c}
                  onClick={() => setClassName(c)}
                  className={`rounded-lg border px-3 py-3 text-sm font-medium transition ${
                    className === c ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setStep(2)} className="rounded-lg border border-slate-200 px-5 py-2 text-sm font-medium text-slate-600">
                Back
              </button>
              <button
                disabled={!canProceedStep3}
                onClick={() => setStep(4)}
                className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Section */}
        {step === 4 && (
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <h2 className="font-medium text-slate-800">Select Section</h2>
            <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-6">
              {SECTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSection(s)}
                  className={`rounded-lg border px-3 py-3 text-sm font-medium transition ${
                    section === s ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setStep(3)} className="rounded-lg border border-slate-200 px-5 py-2 text-sm font-medium text-slate-600">
                Back
              </button>
              <button
                disabled={!canProceedStep4}
                onClick={() => setStep(5)}
                className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Roll number range for this specific class */}
        {step === 5 && (
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <h2 className="font-medium text-slate-800">Which roll numbers belong to this class?</h2>
            <p className="mt-1 text-sm text-slate-500">
              {className} · {section} might only cover a specific range (e.g. K3 to R7). Enter the range so the
              roster only includes your students — not the full predefined list.
            </p>
            <div className="mt-4 flex flex-wrap items-end gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">From roll number</label>
                <input
                  value={rollFrom}
                  onChange={(e) => setRollFrom(e.target.value)}
                  placeholder="e.g. K3 or 1"
                  className="w-40 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">To roll number</label>
                <input
                  value={rollTo}
                  onChange={(e) => setRollTo(e.target.value)}
                  placeholder="e.g. R7 or 60"
                  className="w-40 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </div>
            </div>
            {rangeError && <p className="mt-3 text-sm text-rose-600">{rangeError}</p>}
            <p className="mt-3 text-xs text-slate-400">
              Roll numbers follow the sequence 1–100, then A0–A9, B0–B9, … up to Z0–Z9. You can also add extra
              custom roll numbers on the next screen.
            </p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setStep(4)} className="rounded-lg border border-slate-200 px-5 py-2 text-sm font-medium text-slate-600">
                Back
              </button>
              <button
                onClick={generateList}
                className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white"
              >
                Generate Student List
              </button>
            </div>
          </div>
        )}

        {/* Step 6: Attendance grid */}
        {step === 6 && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-medium text-slate-800">
                    {className} · {section} · {year}
                  </h2>
                  <p className="text-xs text-slate-400">{date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    value={manualRoll}
                    onChange={(e) => setManualRoll(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addManualRoll()}
                    placeholder="Custom roll number"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  />
                  <button
                    onClick={addManualRoll}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    <Plus className="h-4 w-4" /> Add Manual Roll Number
                  </button>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <SummaryCard label="Total Students" value={summary.total} tone="slate" />
              <SummaryCard label="Present" value={summary.present} tone="emerald" />
              <SummaryCard label="Absent" value={summary.absent} tone="rose" />
              <SummaryCard label="Half Day" value={summary.halfDay} tone="amber" />
            </div>

            {/* Grid */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {rollNumbers.map((rn) => (
                  <div key={rn} className={`rounded-xl border p-3 transition-colors ${STATUS_CARD_COLORS[records[rn]]}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-semibold text-slate-700">{rn}</span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_COLORS[records[rn]]}`}
                      >
                        {records[rn]}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-1.5">
                      {STATUSES.map((s) => (
                        <button
                          key={s}
                          onClick={() => setStatus(rn, s)}
                          className={`rounded-md border py-1 text-[11px] font-medium transition ${
                            records[rn] === s ? STATUS_ACTIVE_COLORS[s] : "border-slate-200 text-slate-500 hover:bg-slate-50"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="no-print sticky bottom-4 flex justify-end gap-3 rounded-2xl bg-white p-4 shadow-lg ring-1 ring-slate-100">
              <button
                onClick={() => setStep(5)}
                className="rounded-lg border border-slate-200 px-5 py-2 text-sm font-medium text-slate-600"
              >
                Back
              </button>
              <button
                onClick={handleSaveClick}
                disabled={checking || saving}
                className="flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {(checking || saving) && <Spinner size="sm" />}
                <Save className="h-4 w-4" />
                Save Attendance
              </button>
            </div>
          </div>
        )}

        {/* Step 7: Done / Print */}
        {step === 7 && savedAttendance && (
          <div className="space-y-6">
            <div className="no-print rounded-2xl bg-emerald-50 p-6 ring-1 ring-emerald-200">
              <h2 className="font-medium text-emerald-800">Attendance saved successfully</h2>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white"
                >
                  <Printer className="h-4 w-4" /> Print Report
                </button>
                <button
                  onClick={() => navigate("/cr/history")}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
                >
                  View History
                </button>
                <button
                  onClick={() => navigate("/cr")}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
            <PrintReport attendance={savedAttendance} />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Save attendance?"
        message={`This will save attendance for ${rollNumbers.length} students on ${date}. This cannot be duplicated later for the same date, year, class and section.`}
        confirmLabel="Save"
        onConfirm={confirmSave}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};

const SummaryCard = ({ label, value, tone }) => {
  const tones = {
    slate: "text-slate-700",
    emerald: "text-emerald-600",
    rose: "text-rose-600",
    amber: "text-amber-600",
  };
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${tones[tone]}`}>{value}</p>
    </div>
  );
};

export default MarkAttendance;
