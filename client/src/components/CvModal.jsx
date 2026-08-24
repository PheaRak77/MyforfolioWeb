import { useState, useEffect, useRef } from "react";
import heroImg from "../assets/hero.png";
import PortfolioImage from "./PortfolioImage";

export default function CvModal({ isOpen, onClose, user }) {
  const [copiedField, setCopiedField] = useState(null);
  const [isA4Fit, setIsA4Fit] = useState(true);
  const cvContentRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handlePrintOrDownload = () => {
    window.print();
  };

  // Data defaults matching the user's CV
  const cvData = {
    name: user?.name || "YORN PHEAREAK",
    role: "FULL-STACK DEVELOPER",
    phone: user?.phone || "088 393 0493",
    email: user?.email || "yornpheareak168@gmail.com",
    address: "Toul Sangke 1, Russey Keo, Phnom Penh",
    website: "https://myportfolio-web-xi.vercel.app/",
    telegram: "@yorn_pheareak",
    languages: [
      { name: "Khmer", level: "Native" },
      { name: "English", level: "Intermediate" },
    ],
    profileSummary:
      "Motivated Full-Stack Developer and 4th-year IT student at the National University of Management. Experienced in building responsive applications with Vue.js and React.js, and currently expanding backend expertise in Node.js and Express.js. Passionate about computer vision, clean code architecture, and building scalable end-to-end web solutions.",
    experience: [
      {
        role: "Technical Support & Sales Specialist",
        company: "Pov Thyda Phone Shop",
        location: "Phnom Penh",
        period: "Feb 2024 – Present",
        points: [
          "Manage device diagnostics, cross-platform data migration, and mobile operating system troubleshooting for diverse client devices.",
          "Provide direct technical support to users, resolving application configuration, network connectivity, and hardware issues.",
        ],
      },
    ],
    technicalSkills: {
      frontend: "Vue.js, React.js, JavaScript, HTML, CSS, Tailwind CSS, Bootstrap.",
      backend: "Node.js (In Progress), Express.js (In Progress), PHP, RESTful APIs.",
      databases: "MySQL, PostgreSQL.",
      tools: "Git, GitHub, Vercel, C / C++ / OOP.",
    },
    proficiencies: [
      {
        title: "Clean & Beautiful User Interfaces",
        desc: "Passionate about crafting visually appealing, modern, and intuitive user interfaces that deliver exceptional user experiences across all digital touchpoints.",
      },
      {
        title: "Fully Responsive Web Development",
        desc: "Expert in designing and building fully responsive websites that adapt seamlessly to any screen size—from mobile phones and tablets to desktop monitors—ensuring optimal layout consistency and accessibility.",
      },
      {
        title: "Modern Styling Frameworks",
        desc: "Proficient in leveraging Tailwind CSS and Bootstrap to create fast-loading, clean, and pixel-perfect layouts with custom styling and animations.",
      },
      {
        title: "Framework Mastery",
        desc: "Strong hands-on experience building dynamic, component-driven single-page applications (SPAs) using Vue.js and React.js.",
      },
      {
        title: "Server-Side Development",
        desc: "Actively expanding backend engineering expertise in building scalable server-side applications using Node.js, PHP, and Express.js (In Progress).",
      },
    ],
    education: [
      {
        school: "National University of Management (NUM)",
        location: "Phnom Penh, Cambodia",
        degree: "Bachelor's Degree in Information Technology",
        period: "Current (4th-Year Student)",
      },
    ],
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cv-modal-title"
    >
      {/* Modal Container */}
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] my-auto">
        {/* Top Floating Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5 bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-md z-20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h2
                id="cv-modal-title"
                className="text-sm sm:text-base font-bold text-white leading-tight flex items-center gap-2"
              >
                Curriculum Vitae (CV)
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Ready to Download
                </span>
              </h2>
              <p className="text-xs text-slate-400 hidden sm:block">
                Preview, download high-quality PDF, or print directly
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5 ml-auto">
            {/* Fit Width Toggle on Desktop */}
            <button
              type="button"
              onClick={() => setIsA4Fit(!isA4Fit)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-colors"
              title="Toggle View Width"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
              <span>{isA4Fit ? "Original A4" : "Full Width"}</span>
            </button>

            {/* Print / Save as PDF Button */}
            <button
              type="button"
              onClick={handlePrintOrDownload}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              <span>Download PDF / Print</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/80 transition-colors"
              aria-label="Close CV Modal"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* CV Scrollable Content Body */}
        <div className="overflow-y-auto p-3 sm:p-6 lg:p-8 bg-slate-950 flex justify-center cv-scroll-container">
          {/* Printable Document Sheet (Styled to match the uploaded CV perfectly) */}
          <div
            ref={cvContentRef}
            id="printable-cv-sheet"
            className={`w-full bg-[#f8fafc] text-slate-800 rounded-xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none transition-all duration-300 ${
              isA4Fit ? "max-w-[860px]" : "max-w-full"
            }`}
            style={{
              fontFamily:
                "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            }}
          >
            {/* Document Header Banner */}
            <div className="bg-[#1e293b] text-white p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 border-b border-slate-700">
              <div className="text-center sm:text-left space-y-1">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white uppercase">
                  {cvData.name}
                </h1>
                <p className="text-blue-400 text-sm sm:text-base font-semibold tracking-wider uppercase">
                  {cvData.role}
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  National University of Management (NUM) • Bachelor of IT
                </p>
              </div>

              {/* Quick Contact Chips in Header */}
              <div className="flex flex-wrap justify-center sm:justify-end gap-2 text-xs text-slate-300">
                <button
                  type="button"
                  onClick={() => handleCopy(cvData.email, "email")}
                  className="px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 flex items-center gap-1.5 transition-colors"
                  title="Click to copy email"
                >
                  <svg
                    className="w-3.5 h-3.5 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span>
                    {copiedField === "email" ? "Copied!" : cvData.email}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(cvData.phone, "phone")}
                  className="px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 flex items-center gap-1.5 transition-colors"
                  title="Click to copy phone"
                >
                  <svg
                    className="w-3.5 h-3.5 text-emerald-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <span>
                    {copiedField === "phone" ? "Copied!" : cvData.phone}
                  </span>
                </button>
              </div>
            </div>

            {/* Main CV Two-Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[720px]">
              {/* LEFT SIDEBAR (Dark Slate Theme - 4 Cols) */}
              <div className="md:col-span-4 bg-[#1e293b] text-slate-200 p-6 sm:p-7 space-y-7 border-r border-slate-700/60">
                {/* Profile Photo */}
                <div className="flex flex-col items-center text-center">
                  <div className="relative w-36 h-36 rounded-2xl overflow-hidden border-2 border-blue-500/40 shadow-xl bg-slate-800 group">
                    {user?.profile_image ? (
                      <PortfolioImage
                        src={user.profile_image}
                        alt={cvData.name}
                        variant="profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={heroImg}
                        alt={cvData.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src =
                            "https://api.dicebear.com/7.x/bottts/svg?seed=Pheareak";
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* CONTACT SECTION */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-blue-400 border-b border-slate-700/80 pb-1.5 flex items-center gap-2">
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                      />
                    </svg>
                    Contact
                  </h3>
                  <div className="space-y-2.5 text-xs text-slate-300">
                    <div className="flex items-start gap-2.5">
                      <svg
                        className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      <div>
                        <span className="font-medium text-white block">
                          {cvData.phone}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <svg
                        className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      <div className="break-all">
                        <a
                          href={`mailto:${cvData.email}`}
                          className="hover:text-blue-300 transition-colors"
                        >
                          {cvData.email}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <svg
                        className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <div>
                        <span>{cvData.address}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <svg
                        className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                        />
                      </svg>
                      <div className="break-all">
                        <a
                          href={cvData.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-blue-300 underline underline-offset-2 transition-colors"
                        >
                          Portfolio Website
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* LANGUAGES */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-blue-400 border-b border-slate-700/80 pb-1.5 flex items-center gap-2">
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                      />
                    </svg>
                    Languages
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                    {cvData.languages.map((lang) => (
                      <li key={lang.name}>
                        <span className="font-medium text-white">{lang.name}</span>
                        {lang.level ? ` (${lang.level})` : ""}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* REFERENCES */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-blue-400 border-b border-slate-700/80 pb-1.5 flex items-center gap-2">
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    Reference
                  </h3>
                  <div className="space-y-1.5 text-xs text-slate-300">
                    <p>
                      <span className="text-slate-400 font-medium">Phone: </span>
                      <span className="text-white font-medium">{cvData.phone}</span>
                    </p>
                    <p className="break-all">
                      <span className="text-slate-400 font-medium">Email: </span>
                      <span className="text-white">{cvData.email}</span>
                    </p>
                    <p>
                      <span className="text-slate-400 font-medium">Telegram: </span>
                      <span className="text-blue-400 font-semibold">
                        {cvData.telegram}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* RIGHT MAIN BODY (Clean White Theme - 8 Cols) */}
              <div className="md:col-span-8 p-6 sm:p-8 space-y-6 bg-white text-slate-800">
                {/* PROFILE SECTION */}
                <section className="space-y-2">
                  <div className="flex items-center gap-2 border-b-2 border-slate-800 pb-1">
                    <span className="p-1 rounded bg-slate-800 text-white">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </span>
                    <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                      Profile
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed text-justify">
                    {cvData.profileSummary}
                  </p>
                </section>

                {/* WORK EXPERIENCE */}
                <section className="space-y-3">
                  <div className="flex items-center gap-2 border-b-2 border-slate-800 pb-1">
                    <span className="p-1 rounded bg-slate-800 text-white">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </span>
                    <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                      Work Experience
                    </h2>
                  </div>

                  {cvData.experience.map((exp, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                          {exp.role}{" "}
                          <span className="font-normal text-slate-600">
                            {exp.company} | {exp.location}
                          </span>
                        </h4>
                        <span className="text-xs font-semibold text-slate-600 mt-0.5 sm:mt-0">
                          {exp.period}
                        </span>
                      </div>
                      <ul className="space-y-1 text-xs sm:text-[13px] text-slate-700 list-disc list-inside">
                        {exp.points.map((pt, pIdx) => (
                          <li key={pIdx} className="leading-snug">
                            {pt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </section>

                {/* TECHNICAL SKILLS */}
                <section className="space-y-3">
                  <div className="flex items-center gap-2 border-b-2 border-slate-800 pb-1">
                    <span className="p-1 rounded bg-slate-800 text-white">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                        />
                      </svg>
                    </span>
                    <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                      Technical Skills
                    </h2>
                  </div>

                  <div className="space-y-2 text-xs sm:text-[13px] text-slate-700">
                    <p>
                      <strong className="text-slate-900">Frontend: </strong>
                      {cvData.technicalSkills.frontend}
                    </p>
                    <p>
                      <strong className="text-slate-900">Backend & APIs: </strong>
                      {cvData.technicalSkills.backend}
                    </p>
                    <p>
                      <strong className="text-slate-900">Databases: </strong>
                      {cvData.technicalSkills.databases}
                    </p>
                    <p>
                      <strong className="text-slate-900">Tools & Technologies: </strong>
                      {cvData.technicalSkills.tools}
                    </p>
                  </div>

                  {/* Technical Proficiency Breakdown */}
                  <div className="pt-2 space-y-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Technical Proficiency
                    </h4>
                    <div className="space-y-2 text-xs text-slate-700">
                      {cvData.proficiencies.map((prof, pIdx) => (
                        <div key={pIdx} className="space-y-0.5">
                          <p className="font-bold text-slate-900 text-[12px] flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block"></span>
                            {prof.title}:
                          </p>
                          <p className="text-[12px] text-slate-600 leading-relaxed pl-3">
                            {prof.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* EDUCATION */}
                <section className="space-y-2">
                  <div className="flex items-center gap-2 border-b-2 border-slate-800 pb-1">
                    <span className="p-1 rounded bg-slate-800 text-white">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 14l9-5-9-5-9 5 9 5z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                        />
                      </svg>
                    </span>
                    <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                      Education
                    </h2>
                  </div>

                  {cvData.education.map((edu, eIdx) => (
                    <div key={eIdx} className="space-y-0.5 text-xs sm:text-[13px]">
                      <p className="font-bold text-slate-900">
                        {edu.school}{" "}
                        <span className="font-normal text-slate-600">
                          | {edu.location}
                        </span>
                      </p>
                      <p className="text-slate-700">
                        {edu.degree} |{" "}
                        <span className="font-semibold text-blue-600">
                          {edu.period}
                        </span>
                      </p>
                    </div>
                  ))}
                </section>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer with Quick Actions */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Formatted for standard A4 printing and digital sharing</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintOrDownload}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-md shadow-blue-500/20"
            >
              📥 Download PDF / Print
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors border border-slate-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
