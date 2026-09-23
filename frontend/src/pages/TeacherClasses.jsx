import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Edit2, Plus, Save, Trash2, Users } from "lucide-react";
import toast from "react-hot-toast";
import Topbar from "../components/Topbar";
import Spinner from "../components/Spinner";
import api from "../api/axios";
import { YEARS, CLASSES, SECTIONS } from "../utils/rollNumbers";

const emptyForm = { year: "", className: "", section: "", crEmail: "" };

const TeacherClasses = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const classRes = await api.get("/classes");
      setClassrooms(classRes.data.classrooms || []);
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
      const payload = { ...form };
      if (editingId) await api.put(`/classes/${editingId}`, payload);
      else await api.post("/classes", payload);
      toast.success(editingId ? "Class link updated" : "Class linked to CR");
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
    setForm({ year: classroom.year, className: classroom.className, section: classroom.section, crEmail: classroom.cr?.email || "" });
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
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl font-semibold text-slate-800">Link a class to a CR</h2><p className="mt-1 text-sm text-slate-500">Enter the CR's registered email and class details. The link is active immediately—no approval needed.</p></div><Link to="/teacher" className="text-sm font-medium text-brand-600">Dashboard</Link></div>
      <form onSubmit={saveClass} className="mt-7 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <div className="flex items-center justify-between gap-3"><h3 className="font-semibold text-slate-800">{editingId ? "Update class link" : "Create class link"}</h3>{editingId && <button type="button" onClick={resetForm} className="text-sm font-medium text-slate-500">Cancel edit</button>}</div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm text-slate-600">Year<select required name="year" value={form.year} onChange={updateForm} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"><option value="">Select year</option>{YEARS.map((year) => <option key={year}>{year}</option>)}</select></label>
          <label className="text-sm text-slate-600">Class<select required name="className" value={form.className} onChange={updateForm} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"><option value="">Select class</option>{CLASSES.map((className) => <option key={className}>{className}</option>)}</select></label>
          <label className="text-sm text-slate-600">Section<select required name="section" value={form.section} onChange={updateForm} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"><option value="">Select section</option>{SECTIONS.map((section) => <option key={section}>{section}</option>)}</select></label>
          <label className="text-sm text-slate-600">CR email<input required type="email" name="crEmail" value={form.crEmail} onChange={updateForm} placeholder="cr@example.com" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" /></label>
        </div>
        <button disabled={saving} className="btn-brand mt-5 disabled:opacity-50">{saving ? <Spinner /> : <Save className="h-4 w-4" />}{editingId ? "Save link" : "Link CR to class"}</button>
      </form>

      <section className="mt-7"><div className="flex items-center gap-2"><Users className="h-5 w-5 text-brand-600" /><h3 className="font-semibold text-slate-800">Your class links</h3></div>{loading ? <div className="flex justify-center py-16"><Spinner /></div> : classrooms.length ? <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">{classrooms.map((classroom) => <article key={classroom._id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"><div><h4 className="font-semibold text-slate-800">{classroom.className} · Section {classroom.section}</h4><p className="mt-1 text-sm text-slate-500">{classroom.year}</p></div><div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm"><p className="text-slate-400">Linked CR</p><p className="mt-1 font-medium text-slate-700">{classroom.cr?.name}</p><p className="text-xs text-slate-500">{classroom.cr?.email}</p></div><div className="mt-4 flex gap-3"><button onClick={() => editClass(classroom)} className="flex items-center gap-1 text-sm font-medium text-brand-600"><Edit2 className="h-4 w-4" /> Edit</button><button onClick={() => deleteClass(classroom)} className="flex items-center gap-1 text-sm font-medium text-rose-600"><Trash2 className="h-4 w-4" /> Delete</button></div></article>)}</div> : <div className="mt-4 rounded-2xl bg-white p-10 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-100">Link a CR email to a class to start receiving attendance.</div>}</section>
    </main>
  </div>;
};

export default TeacherClasses;
