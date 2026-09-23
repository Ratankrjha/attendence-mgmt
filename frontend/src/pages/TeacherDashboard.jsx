import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, BookOpen, CalendarCheck, ClipboardList, FileBarChart, GraduationCap, ShieldAlert, Users } from "lucide-react";
import toast from "react-hot-toast";
import Topbar from "../components/Topbar";
import Spinner from "../components/Spinner";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const formatDate = (date) => date ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(`${date}T00:00:00`)) : "—";

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [dashboardRes, notificationRes] = await Promise.all([api.get("/teacher/dashboard"), api.get("/notifications")]);
        setDashboard(dashboardRes.data);
        setUnread(notificationRes.data.unreadCount || 0);
      } catch (error) {
        toast.error(error.response?.data?.message || "Could not load the teacher dashboard");
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const stats = dashboard?.stats;
  const cards = [
    { label: "Assigned Classes", value: stats?.classes ?? 0, icon: BookOpen, tone: "text-indigo-600 bg-indigo-50" },
    { label: "Students", value: stats?.students ?? 0, icon: Users, tone: "text-sky-600 bg-sky-50" },
    { label: "Today's Sessions", value: stats?.todaySessions ?? 0, icon: CalendarCheck, tone: "text-emerald-600 bg-emerald-50" },
    { label: "Overall Attendance", value: `${stats?.overallAttendance ?? 0}%`, icon: GraduationCap, tone: "text-amber-600 bg-amber-50" },
  ];
  const shortcuts = [
    { to: "/teacher/classes", title: "Link CR to Class", description: "Connect a CR email with a class", icon: Users },
    { to: "/teacher/attendance", title: "Review Attendance", description: "Search, correct, or delete records", icon: ClipboardList },
    { to: "/teacher/reports", title: "Reports", description: "Find low attendance and export CSV", icon: FileBarChart },
    { to: "/teacher/notifications", title: "Notifications", description: unread ? `${unread} unread update${unread === 1 ? "" : "s"}` : "No unread updates", icon: Bell },
  ];

  return <div className="min-h-screen bg-slate-50">
    <Topbar title="Teacher Dashboard" />
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-2xl font-semibold text-slate-800">Welcome, {user?.name}</h2><p className="mt-1 text-sm text-slate-500">Your classes, attendance, and alerts in one place.</p></div><Link to="/profile" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Profile</Link></div>
      {loading ? <div className="flex justify-center py-20"><Spinner /></div> : <>
        <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">{cards.map(({ label, value, icon: Icon, tone }) => <div key={label} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}><Icon className="h-5 w-5" /></div><p className="mt-4 text-2xl font-semibold text-slate-800">{value}</p><p className="text-sm text-slate-500">{label}</p></div>)}</div>
        <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-2">{shortcuts.map(({ to, title, description, icon: Icon }) => <Link key={to} to={to} className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md"><Icon className="h-6 w-6 text-brand-600" /><h3 className="mt-3 font-semibold text-slate-800">{title}</h3><p className="mt-1 text-sm text-slate-500">{description}</p></Link>)}</div>
        <div className="mt-7 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100"><div className="flex items-center justify-between gap-3"><h3 className="font-semibold text-slate-800">Pending today</h3><Link to="/teacher/attendance" className="text-sm font-medium text-brand-600">View attendance</Link></div>{dashboard?.pendingClasses?.length ? <div className="mt-4 space-y-3">{dashboard.pendingClasses.map((item) => <div key={item.id} className="flex items-center justify-between rounded-xl bg-amber-50 px-4 py-3 text-sm"><div><p className="font-medium text-slate-700">{item.className} · Section {item.section}</p><p className="text-xs text-slate-500">{item.year} · {item.crName}</p></div><span className="text-xs font-medium text-amber-700">Not submitted</span></div>)}</div> : <p className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">All your classes have submitted attendance today.</p>}</section>
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100"><div className="flex items-center justify-between gap-3"><h3 className="font-semibold text-slate-800">Low-attendance alerts</h3><ShieldAlert className="h-5 w-5 text-rose-500" /></div>{dashboard?.lowAttendance?.length ? <div className="mt-4 space-y-3">{dashboard.lowAttendance.slice(0, 5).map((student) => <div key={`${student.className}-${student.section}-${student.rollNumber}`} className="flex items-center justify-between rounded-xl bg-rose-50 px-4 py-3 text-sm"><div><p className="font-mono font-medium text-slate-700">{student.rollNumber}</p><p className="text-xs text-slate-500">{student.className} · {student.section} · {student.sessions} sessions</p></div><span className="font-semibold text-rose-600">{student.percentage}%</span></div>)}</div> : <p className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">No students are below the 75% threshold yet.</p>}</section>
        </div>
        <section className="mt-7 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100"><h3 className="font-semibold text-slate-800">Recent submissions</h3>{dashboard?.recentAttendance?.length ? <div className="mt-4 divide-y divide-slate-100">{dashboard.recentAttendance.map((record) => <div key={record._id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><div><p className="font-medium text-slate-700">{record.className} · Section {record.section}</p><p className="text-xs text-slate-500">{formatDate(record.date)} · submitted by {record.markedBy?.name || record.crName}</p></div><span className="text-slate-500">{record.summary?.present}/{record.summary?.total} present</span></div>)}</div> : <p className="mt-4 text-sm text-slate-500">No attendance submissions yet.</p>}</section>
      </>}
    </main>
  </div>;
};

export default TeacherDashboard;
