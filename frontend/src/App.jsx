import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import TeacherDashboard from "./pages/TeacherDashboard";
import CRDashboard from "./pages/CRDashboard";
import MarkAttendance from "./pages/MarkAttendance";
import AttendanceHistory from "./pages/AttendanceHistory";
import Profile from "./pages/Profile";
import { useAuth } from "./context/AuthContext";

const RoleRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return user.role === "Teacher" ? (
    <Navigate to="/teacher" replace />
  ) : (
    <Navigate to="/cr" replace />
  );
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/" element={<RoleRedirect />} />

      <Route
        path="/teacher"
        element={
          <ProtectedRoute allowedRoles={["Teacher"]}>
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/cr"
        element={
          <ProtectedRoute allowedRoles={["CR"]}>
            <CRDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cr/mark-attendance"
        element={
          <ProtectedRoute allowedRoles={["CR"]}>
            <MarkAttendance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cr/history"
        element={
          <ProtectedRoute allowedRoles={["CR"]}>
            <AttendanceHistory />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
