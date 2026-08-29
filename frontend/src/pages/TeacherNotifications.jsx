import { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import toast from "react-hot-toast";
import Topbar from "../components/Topbar";
import Spinner from "../components/Spinner";
import api from "../api/axios";

const TeacherNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = async () => { try { const response = await api.get("/notifications"); setNotifications(response.data.notifications || []); } catch (error) { toast.error("Could not load notifications"); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const markAll = async () => { try { await api.patch("/notifications/read-all"); setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true }))); } catch { toast.error("Could not update notifications"); } };
  const markRead = async (notification) => { if (notification.isRead) return; try { await api.patch(`/notifications/${notification._id}/read`); setNotifications((current) => current.map((item) => item._id === notification._id ? { ...item, isRead: true } : item)); } catch { toast.error("Could not update notification"); } };
  return <div className="min-h-screen bg-slate-50"><Topbar title="Notifications" /><main className="mx-auto max-w-3xl px-6 py-8"><div className="flex items-center justify-between gap-3"><div><h2 className="text-2xl font-semibold text-slate-800">Updates from your CRs</h2><p className="mt-1 text-sm text-slate-500">Attendance submissions appear here.</p></div><button onClick={markAll} className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"><CheckCheck className="h-4 w-4" /> Mark all read</button></div>{loading ? <div className="flex justify-center py-16"><Spinner /></div> : notifications.length ? <div className="mt-6 space-y-3">{notifications.map((notification) => <button key={notification._id} onClick={() => markRead(notification)} className={`w-full rounded-2xl p-5 text-left shadow-sm ring-1 ring-slate-100 ${notification.isRead ? "bg-white" : "bg-indigo-50"}`}><div className="flex justify-between gap-3"><div><p className="font-semibold text-slate-800">{notification.title}</p><p className="mt-1 text-sm text-slate-600">{notification.message}</p></div>{!notification.isRead && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand-600" />}</div><p className="mt-3 text-xs text-slate-400">{new Date(notification.createdAt).toLocaleString("en-IN")}</p></button>)}</div> : <div className="mt-6 rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-100"><Bell className="mx-auto h-9 w-9 text-slate-300" /><p className="mt-3 text-sm text-slate-500">No notifications yet.</p></div>}</main></div>;
};

export default TeacherNotifications;
