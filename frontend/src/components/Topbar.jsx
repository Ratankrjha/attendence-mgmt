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
    <header className="no-print sticky top-0 z-30 topbar flex items-center justify-between px-6 py-4 backdrop-blur">
      <div>
        <h1 className="text-lg font-semibold text-slate-50">{title}</h1>
        {user && <p className="text-xs text-slate-100">{user.name} · {user.role}</p>}
      </div>
      <button
        onClick={handleLogout}
        className="btn-ghost"
      >
        Logout
      </button>
    </header>
  );
};

export default Topbar;
