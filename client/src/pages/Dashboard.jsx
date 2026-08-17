import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import DashboardNav from "../components/DashboardNav";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    projects: 0,
    certificates: 0,
    skills: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        setLoading(true);
        const [pRes, cRes, sRes] = await Promise.allSettled([
          api.get("/projects/my"),
          api.get("/certificates/my"),
          api.get("/skills/my"),
        ]);

        setStats({
          projects: pRes.status === "fulfilled" ? pRes.value.data?.projects?.length || 0 : 0,
          certificates: cRes.status === "fulfilled" ? cRes.value.data?.certificates?.length || 0 : 0,
          skills: sRes.status === "fulfilled" ? sRes.value.data?.skills?.length || 0 : 0,
        });
      } catch (err) {
        console.error("Failed to load dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, []);

  const cards = [
    {
      title: "Projects",
      count: stats.projects,
      desc: "Manage portfolio project showcases, images, and live demo links.",
      link: "/projects",
      btnText: "Manage Projects",
      gradient: "from-blue-600 to-indigo-600",
      accent: "text-blue-400",
      bgLight: "bg-blue-500/10",
      border: "border-blue-500/20",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      title: "Certificates",
      count: stats.certificates,
      desc: "Add verified credentials, course completion records, and certificates.",
      link: "/certificates",
      btnText: "Manage Certificates",
      gradient: "from-indigo-600 to-purple-600",
      accent: "text-purple-400",
      bgLight: "bg-purple-500/10",
      border: "border-purple-500/20",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
    },
    {
      title: "Technical Skills",
      count: stats.skills,
      desc: "Organize languages, frameworks, percentages, and tech icons.",
      link: "/skills",
      btnText: "Manage Skills",
      gradient: "from-emerald-600 to-teal-600",
      accent: "text-emerald-400",
      bgLight: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
    },
    {
      title: "Profile & Identity",
      count: "Verified",
      desc: "Update your name, avatar image, contact phone, and account details.",
      link: "/profile",
      btnText: "Edit Profile",
      gradient: "from-amber-600 to-orange-600",
      accent: "text-amber-400",
      bgLight: "bg-amber-500/10",
      border: "border-amber-500/20",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white">
      <DashboardNav />

      {/* Main Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Welcome Banner */}
        <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-800/80 border border-slate-800/80 p-8 sm:p-10 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                Admin Workspace
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Welcome, {user?.name || "Admin"}
              </h1>
              <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-xl leading-relaxed">
                Control and customize your public developer portfolio. Changes you save here are instantly visible to visitors.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-lg shadow-blue-500/25 hover:bg-blue-500 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View Live Portfolio
              </Link>
            </div>
          </div>
        </div>

        {/* Overview Stats & Management Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card) => (
            <div
              key={card.title}
              className="rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 shadow-lg hover:shadow-xl transition-all duration-300 p-6 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-2xl ${card.bgLight} ${card.border} border ${card.accent} flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                    {card.icon}
                  </div>
                  <span className="text-2xl font-extrabold text-white font-mono">
                    {loading ? "..." : card.count}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                  {card.title}
                </h2>
                <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                  {card.desc}
                </p>
              </div>

              <div className="pt-6 mt-4 border-t border-slate-800/80">
                <Link
                  to={card.link}
                  className={`w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-gradient-to-r hover:${card.gradient} text-slate-200 hover:text-white text-xs font-semibold text-center block border border-slate-700/60 hover:border-transparent transition-all duration-200 shadow-sm`}
                >
                  {card.btnText} &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Action Shortcuts */}
        <div className="rounded-3xl bg-slate-900/50 border border-slate-800/60 p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-white">Quick Actions</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <Link
              to="/projects"
              className="p-4 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                +
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Add New Project</p>
                <p className="text-xs text-slate-400">Publish to portfolio</p>
              </div>
            </Link>

            <Link
              to="/skills"
              className="p-4 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                +
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Add New Skill</p>
                <p className="text-xs text-slate-400">Set percentage & icon</p>
              </div>
            </Link>

            <Link
              to="/certificates"
              className="p-4 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-colors">
                +
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Add Certificate</p>
                <p className="text-xs text-slate-400">Upload credential image</p>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
