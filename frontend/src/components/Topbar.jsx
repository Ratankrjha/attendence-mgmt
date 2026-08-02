import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Topbar = ({ title }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="no-print sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
        {user && <p className="text-xs text-slate-400">{user.name} · {user.role}</p>}
      </div>
      <button
        onClick={handleLogout}
        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
      >
        Logout
      </button>
    </header>
  );
};

export default Topbar;
