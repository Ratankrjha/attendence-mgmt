import { useState } from "react";
import toast from "react-hot-toast";
import Topbar from "../components/Topbar";
import Spinner from "../components/Spinner";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const Profile = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.currentPassword || !form.newPassword || !form.confirmNewPassword) {
      toast.error("All fields are required");
      return;
    }
    if (form.newPassword !== form.confirmNewPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (form.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await api.put("/auth/change-password", form);
      toast.success("Password updated successfully");
      setForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Topbar title="Profile" />
      <div className="mx-auto max-w-lg px-6 py-8">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <h2 className="font-medium text-slate-800">Account Details</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-400">Name</dt>
              <dd className="font-medium text-slate-700">{user?.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Email</dt>
              <dd className="font-medium text-slate-700">{user?.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Role</dt>
              <dd className="font-medium text-slate-700">{user?.role}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Registered</dt>
              <dd className="font-medium text-slate-700">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <h2 className="font-medium text-slate-800">Change Password</h2>
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <input
              type="password"
              name="currentPassword"
              value={form.currentPassword}
              onChange={handleChange}
              placeholder="Current password"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
            <input
              type="password"
              name="newPassword"
              value={form.newPassword}
              onChange={handleChange}
              placeholder="New password"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
            <input
              type="password"
              name="confirmNewPassword"
              value={form.confirmNewPassword}
              onChange={handleChange}
              placeholder="Confirm new password"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {loading && <Spinner size="sm" />}
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
