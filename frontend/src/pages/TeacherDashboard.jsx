import Topbar from "../components/Topbar";

const TeacherDashboard = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Topbar title="Teacher Dashboard" />
      <div className="flex h-[70vh] flex-col items-center justify-center px-4 text-center">
        <div className="rounded-2xl bg-white px-10 py-12 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-xl font-semibold text-slate-800">Teacher Module Coming Soon</h2>
          <p className="mt-2 max-w-sm text-sm text-slate-500">
            We're building attendance review tools for teachers. Check back soon.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
