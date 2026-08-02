import { Link } from "react-router-dom";
import { ClipboardCheck, History, UserCircle } from "lucide-react";
import Topbar from "../components/Topbar";
import { useAuth } from "../context/AuthContext";

const CRDashboard = () => {
  const { user } = useAuth();

  const menuItems = [
    {
      to: "/cr/mark-attendance",
      icon: ClipboardCheck,
      title: "Mark Attendance",
      desc: "Record today's attendance for your class",
    },
    {
      to: "/cr/history",
      icon: History,
      title: "Attendance History",
      desc: "View, filter, and print past records",
    },
    {
      to: "/profile",
      icon: UserCircle,
      title: "Profile",
      desc: "Manage your account and password",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Topbar title="CR Dashboard" />
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h2 className="text-2xl font-semibold text-slate-800">Welcome, {user?.name}</h2>
        <p className="mt-1 text-sm text-slate-500">What would you like to do?</p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {menuItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <item.icon className="h-7 w-7 text-brand-600" />
              <h3 className="mt-4 font-medium text-slate-800">{item.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CRDashboard;
