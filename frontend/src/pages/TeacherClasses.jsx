import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Edit2, Plus, Save, Trash2, Users } from "lucide-react";
import toast from "react-hot-toast";
import Topbar from "../components/Topbar";
import Spinner from "../components/Spinner";
import api from "../api/axios";
import { YEARS, CLASSES, SECTIONS } from "../utils/rollNumbers";

const emptyForm = { year: "", className: "", section: "", crId: "", studentsText: "" };

const studentsToText = (students = []) => students.map((student) => `${student.rollNumber}${student.name ? `, ${student.name}` : ""}`).join("\n");
const parseStudents = (text) => text.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
  const [rollNumber, ...name] = line.split(",");
  return { rollNumber: rollNumber.trim(), name: name.join(",").trim() };
});

const TeacherClasses = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [crs, setCrs] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [classRes, crRes] = await Promise.all([api.get("/classes"), api.get("/classes/cr-options")]);
      setClassrooms(classRes.data.classrooms || []);
      setCrs(crRes.data.crs || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load class data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => { setForm(emptyForm); setEditingId(null); };
  const updateForm = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const saveClass = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, crId: form.crId || null, students: parseStudents(form.studentsText) };
      delete payload.studentsText;
      if (editingId) await api.put(`/classes/${editingId}`, payload);
      else await api.post("/classes", payload);
      toast.success(editingId ? "Class updated" : "Class created and CR assigned");
      resetForm();
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not save class");
    } finally {
      setSaving(false);
    }
  };

  const editClass = (classroom) => {
    setEditingId(classroom._id);
    setForm({ year: classroom.year, className: classroom.className, section: classroom.section, crId: classroom.cr?._id || classroom.cr || "", studentsText: studentsToText(classroom.students) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteClass = async (classroom) => {
    if (!window.confirm(`Delete ${classroom.className} Section ${classroom.section}?`)) return;
    try {
      await api.delete(`/classes/${classroom._id}`);
      toast.success("Class deleted");
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not delete class");
    }
  };

  return <div className="min-h-screen bg-slate-50">
    <Topbar title="Classes & Students" />
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl font-semibold text-slate-800">Manage classes</h2><p className="mt-1 text-sm text-slate-500">Create a class, assign its CR, and keep its student roster current.</p></div><Link to="/teacher" className="text-sm font-medium text-brand-600">Dashboard</Link></div>
      <form onSubmit={saveClass} className="mt-7 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <div className="flex items-center justify-between gap-3"><h3 className="font-semibold text-slate-800">{editingId ? "Edit class" : "Add a class"}</h3>{editingId && <button type="button" onClick={resetForm} className="text-sm font-medium text-slate-500">Cancel edit</button>}</div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm text-slate-600">Year<select required name="year" value={form.year} onChange={updateForm} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"><option value="">Select year</option>{YEARS.map((year) => <option key={year}>{year}</option>)}</select></label>
          <label className="text-sm text-slate-600">Class<select required name="className" value={form.className} onChange={updateForm} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"><option value="">Select class</option>{CLASSES.map((className) => <option key={className}>{className}</option>)}</select></label>
          <label className="text-sm text-slate-600">Section<select required name="section" value={form.section} onChange={updateForm} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"><option value="">Select section</option>{SECTIONS.map((section) => <option key={section}>{section}</option>)}</select></label>
          <label className="text-sm text-slate-600">Assign CR<select name="crId" value={form.crId} onChange={updateForm} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"><option value="">No CR assigned</option>{crs.map((cr) => <option key={cr._id} value={cr._id}>{cr.name} · {cr.email}</option>)}</select></label>
        </div>
        <label className="mt-4 block text-sm text-slate-600">Student roster <span className="text-slate-400">(one per line: Roll Number, Student Name)</span><textarea name="studentsText" value={form.studentsText} onChange={updateForm} rows="6" placeholder={"101, Asha Kumar\n102, Rahul Singh\nA0"} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm" /></label>
        <p className="mt-2 text-xs text-slate-400">You can add, rename, or remove students by editing this roster. Roll numbers must be unique within the class.</p>
        <button disabled={saving} className="btn-brand mt-5 disabled:opacity-50">{saving ? <Spinner /> : <Save className="h-4 w-4" />}{editingId ? "Save class changes" : "Create class"}</button>
      </form>

      <section className="mt-7"><div className="flex items-center gap-2"><Users className="h-5 w-5 text-brand-600" /><h3 className="font-semibold text-slate-800">Your assigned classes</h3></div>{loading ? <div className="flex justify-center py-16"><Spinner /></div> : classrooms.length ? <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">{classrooms.map((classroom) => <article key={classroom._id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"><div className="flex items-start justify-between gap-3"><div><h4 className="font-semibold text-slate-800">{classroom.className} · Section {classroom.section}</h4><p className="mt-1 text-sm text-slate-500">{classroom.year}</p></div><span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">{classroom.students.length} students</span></div><div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm"><p className="text-slate-400">Assigned CR</p><p className="mt-1 font-medium text-slate-700">{classroom.cr?.name || "Not assigned"}</p>{classroom.cr?.email && <p className="text-xs text-slate-500">{classroom.cr.email}</p>}</div><div className="mt-4 flex gap-3"><button onClick={() => editClass(classroom)} className="flex items-center gap-1 text-sm font-medium text-brand-600"><Edit2 className="h-4 w-4" /> Edit</button><button onClick={() => deleteClass(classroom)} className="flex items-center gap-1 text-sm font-medium text-rose-600"><Trash2 className="h-4 w-4" /> Delete</button></div></article>)}</div> : <div className="mt-4 rounded-2xl bg-white p-10 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-100">Create your first class, then assign a CR so attendance can be submitted.</div>}</section>
    </main>
  </div>;
};

export default TeacherClasses;
