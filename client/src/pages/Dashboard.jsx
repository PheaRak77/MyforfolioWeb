import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import DashboardNav from "../components/DashboardNav";
import { useAuth } from "../context/AuthContext";
import { isLegacyDiskUrl } from "../utils/imageUrl";
import { hasLegacyProjectImages } from "../utils/projectImages";
import VerifiedBadge, { isVerifiedUser } from "../components/VerifiedBadge";

const MONTH_FORMATTER = new Intl.DateTimeFormat("en", { month: "short" });

function buildActivityData(projects, certificates) {
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (5 - index));
    return { label: MONTH_FORMATTER.format(date), year: date.getFullYear(), month: date.getMonth(), projects: 0, certificates: 0 };
  });

  const addItems = (items, key) => {
    items.forEach((item) => {
      const date = item.created_at ? new Date(item.created_at) : null;
      if (date && !Number.isNaN(date.getTime())) {
        const bucket = months.find((entry) => entry.year === date.getFullYear() && entry.month === date.getMonth());
        if (bucket) bucket[key] += 1;
      }
    });
  };

  addItems(projects, "projects");
  addItems(certificates, "certificates");
  return months;
}

function ActivityChart({ data, loading }) {
  const width = 620;
  const height = 220;
  const padding = { top: 22, right: 16, bottom: 32, left: 12 };
  const max = Math.max(1, ...data.flatMap((item) => [item.projects, item.certificates]));
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;
  const point = (value, index) => ({
    x: padding.left + (graphWidth / Math.max(data.length - 1, 1)) * index,
    y: padding.top + graphHeight - (value / max) * graphHeight,
  });
  const toPoints = (key) => data.map((item, index) => {
    const { x, y } = point(item[key], index);
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="relative h-56 sm:h-64 mt-5" aria-label="Content publishing activity chart">
      {loading ? (
        <div className="h-full animate-pulse rounded-2xl bg-slate-800/50" />
      ) : (
        <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${width} ${height}`} role="img">
          <defs>
            <linearGradient id="project-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 0.5, 1].map((step) => {
            const y = padding.top + graphHeight * step;
            return <line key={step} x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#334155" strokeOpacity="0.65" strokeDasharray="4 5" />;
          })}
          <polygon points={`${padding.left},${height - padding.bottom} ${toPoints("projects")} ${width - padding.right},${height - padding.bottom}`} fill="url(#project-area)" />
          <polyline points={toPoints("projects")} fill="none" stroke="#60a5fa" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points={toPoints("certificates")} fill="none" stroke="#c084fc" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          {data.map((item, index) => {
            const projectPoint = point(item.projects, index);
            const certificatePoint = point(item.certificates, index);
            return (
              <g key={item.label}>
                <circle cx={projectPoint.x} cy={projectPoint.y} r="4" fill="#0f172a" stroke="#60a5fa" strokeWidth="2.5" />
                <circle cx={certificatePoint.x} cy={certificatePoint.y} r="4" fill="#0f172a" stroke="#c084fc" strokeWidth="2.5" />
                <text x={projectPoint.x} y={height - 8} textAnchor="middle" fill="#64748b" fontSize="12" fontWeight="600">{item.label}</text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    projects: 0,
    certificates: 0,
    skills: 0,
    brokenImages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState({ projects: [], certificates: [], skills: [] });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        setLoading(true);
        const [pRes, cRes, sRes, profileRes] = await Promise.allSettled([
          api.get("/projects/my"),
          api.get("/certificates/my"),
          api.get("/skills/my"),
          api.get("/users/profile"),
        ]);

        const projects = pRes.status === "fulfilled" ? pRes.value.data?.projects || [] : [];
        const certificates = cRes.status === "fulfilled" ? cRes.value.data?.certificates || [] : [];
        const profileUser = profileRes.status === "fulfilled" ? profileRes.value.data?.user : null;

        const brokenProjects = projects.filter((p) =>
          hasLegacyProjectImages(p.images),
        ).length;
        const brokenCerts = certificates.filter((c) => isLegacyDiskUrl(c.image)).length;
        const brokenProfile = isLegacyDiskUrl(profileUser?.profile_image) ? 1 : 0;

        setStats({
          projects: projects.length,
          certificates: certificates.length,
          skills: sRes.status === "fulfilled" ? sRes.value.data?.skills?.length || 0 : 0,
          brokenImages: brokenProjects + brokenCerts + brokenProfile,
        });
        setContent({
          projects,
          certificates,
          skills: sRes.status === "fulfilled" ? sRes.value.data?.skills || [] : [],
        });
      } catch (err) {
        console.error("Failed to load dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, []);

  const activityData = useMemo(
    () => buildActivityData(content.projects, content.certificates),
    [content.certificates, content.projects]
  );

  const topSkills = useMemo(
    () => [...content.skills]
      .sort((first, second) => Number(second.percentage || 0) - Number(first.percentage || 0))
      .slice(0, 5),
    [content.skills]
  );

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
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
                <span>Welcome, {user?.name || "Admin"}</span>
                {isVerifiedUser(user) && <VerifiedBadge size="lg" />}
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

        {!loading && stats.brokenImages > 0 && (
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
            <p className="font-semibold text-amber-300 mb-2">
              {stats.brokenImages} image{stats.brokenImages > 1 ? "s" : ""} need re-upload
            </p>
            <p className="text-sm text-amber-200/80 mb-4">
              Old images were stored on Render&apos;s temporary disk and no longer load. Re-upload each image in Admin — new uploads are saved permanently in the database and work on all browsers.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link to="/certificates" className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-200 text-xs font-semibold hover:bg-amber-500/30">
                Fix Certificates
              </Link>
              <Link to="/projects" className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-200 text-xs font-semibold hover:bg-amber-500/30">
                Fix Projects
              </Link>
              <Link to="/profile" className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-200 text-xs font-semibold hover:bg-amber-500/30">
                Fix Profile Photo
              </Link>
            </div>
          </div>
        )}

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

        {/* Portfolio Analytics */}
        <section className="grid xl:grid-cols-5 gap-6" aria-labelledby="analytics-heading">
          <div className="xl:col-span-3 rounded-3xl bg-slate-900/70 border border-slate-800 shadow-xl shadow-black/10 p-5 sm:p-7 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-blue-400 mb-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.9)]" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em]">Portfolio analytics</span>
                </div>
                <h2 id="analytics-heading" className="text-xl font-bold text-white">Publishing activity</h2>
                <p className="mt-1 text-sm text-slate-400">Projects and certificates added over the last six months.</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold shrink-0">
                <span className="flex items-center gap-1.5 text-slate-300"><i className="w-2.5 h-2.5 rounded-full bg-blue-400" /> Projects</span>
                <span className="flex items-center gap-1.5 text-slate-300"><i className="w-2.5 h-2.5 rounded-full bg-purple-400" /> Certificates</span>
              </div>
            </div>
            <ActivityChart data={activityData} loading={loading} />
          </div>

          <div className="xl:col-span-2 rounded-3xl bg-slate-900/70 border border-slate-800 shadow-xl shadow-black/10 p-5 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-400">Capability overview</p>
                <h2 className="mt-2 text-xl font-bold text-white">Top skills</h2>
              </div>
              <Link to="/skills" className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors">Manage →</Link>
            </div>

            <div className="mt-6 space-y-4">
              {loading ? [...Array(4)].map((_, index) => (
                <div key={index} className="animate-pulse space-y-2">
                  <div className="flex justify-between"><span className="h-3 w-24 rounded bg-slate-800" /><span className="h-3 w-8 rounded bg-slate-800" /></div>
                  <div className="h-2 rounded-full bg-slate-800" />
                </div>
              )) : topSkills.length ? topSkills.map((skill) => {
                const percentage = Math.max(0, Math.min(100, Number(skill.percentage || 0)));
                return (
                  <div key={skill.id || skill.name}>
                    <div className="flex items-center justify-between gap-3 text-sm mb-2">
                      <span className="font-semibold text-slate-200 truncate">{skill.name}</span>
                      <span className="font-mono text-xs text-slate-400">{percentage}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 shadow-[0_0_12px_rgba(45,212,191,0.42)] transition-all duration-700" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              }) : (
                <div className="py-7 text-center rounded-2xl border border-dashed border-slate-700 text-sm text-slate-500">Add skills to see your capability chart.</div>
              )}
            </div>
          </div>
        </section>

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
