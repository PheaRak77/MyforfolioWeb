import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import publicApi from "../api/publicApi";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import useScrollReveal from "../hooks/useScrollReveal";
import PortfolioImage from "../components/PortfolioImage";
import ProjectCardImage from "../components/ProjectCardImage";
import VerifiedBadge, { isVerifiedUser } from "../components/VerifiedBadge";
import { fetchPublicPortfolioData, hydrateFromCache } from "../utils/publicDataCache";
import {
  keepPermanentImages,
  normalizeProjectImages,
} from "../utils/projectImages";

const Home = () => {
  const { user: authUser, isAuthenticated, logout } = useAuth();

  const [profile, setProfile] = useState(() => hydrateFromCache().profile?.user ?? null);
  const [projects, setProjects] = useState(() => hydrateFromCache().projects?.projects ?? []);
  const [certificates, setCertificates] = useState(() => hydrateFromCache().certificates?.certificates ?? []);
  const [skills, setSkills] = useState(() => hydrateFromCache().skills?.skills ?? []);
  const [loading, setLoading] = useState(() => !hydrateFromCache().profile);
  const [error, setError] = useState("");

  // Scroll Reveal Hooks for each section
  const revealAbout       = useScrollReveal({ threshold: 0.1 });
  const revealSkills      = useScrollReveal({ threshold: 0.08 });
  const revealProjects    = useScrollReveal({ threshold: 0.06 });
  const revealCerts       = useScrollReveal({ threshold: 0.06 });
  const revealContact     = useScrollReveal({ threshold: 0.08 });

  // Filter and Modal States
  const [selectedTech, setSelectedTech] = useState("all");
  const [selectedSkillCategory, setSelectedSkillCategory] = useState("all");
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Contact Form State & Validation
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [contactErrors, setContactErrors] = useState({});
  const [sendingMessage, setSendingMessage] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [copiedField, setCopiedField] = useState("");
  const [profileImgError, setProfileImgError] = useState(false);
  const [headerImgError, setHeaderImgError] = useState(false);
  const [contactApiError, setContactApiError] = useState("");

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(""), 2500);
  };

  const validateContact = () => {
    const errors = {};
    if (!contactForm.name.trim()) {
      errors.name = "Please enter your name";
    } else if (contactForm.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    }

    if (!contactForm.email.trim()) {
      errors.email = "Please enter your email address";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactForm.email.trim())) {
      errors.email = "Please enter a valid email address";
    }

    if (!contactForm.subject.trim()) {
      errors.subject = "Please enter a subject";
    }

    if (!contactForm.message.trim()) {
      errors.message = "Please write a message";
    } else if (contactForm.message.trim().length < 10) {
      errors.message = "Message must be at least 10 characters";
    }

    setContactErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!validateContact()) return;

    setSendingMessage(true);
    setContactApiError("");

    try {
      const { data } = await api.post("/contact", {
        name: contactForm.name.trim(),
        email: contactForm.email.trim(),
        subject: contactForm.subject.trim(),
        message: contactForm.message.trim(),
      });

      if (data.success) {
        setContactSubmitted(true);
        setContactForm({ name: "", email: "", subject: "", message: "" });
        setContactErrors({});
      } else {
        setContactApiError(data.message || "Failed to send message. Please try again.");
      }
    } catch (err) {
      const serverMessage = err.response?.data?.message;
      setContactApiError(
        serverMessage || "Something went wrong. Please try again or contact directly via email."
      );
    } finally {
      setSendingMessage(false);
    }
  };

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        setLoading(true);
        setError("");

        const responses = await fetchPublicPortfolioData(publicApi, {
          profile: "/users/public-profile",
          projects: "/projects",
          certificates: "/certificates",
          skills: "/skills",
        });

        const profileRes = responses.profile;
        const projectsRes = responses.projects;
        const certsRes = responses.certificates;
        const skillsRes = responses.skills;

        if (profileRes?.status === "fulfilled" && profileRes.value.data?.user) {
          setProfile(profileRes.value.data.user);
        }

        if (
          projectsRes?.status === "fulfilled" &&
          projectsRes.value.data?.projects
        ) {
          setProjects(projectsRes.value.data.projects);
        }

        if (
          certsRes?.status === "fulfilled" &&
          certsRes.value.data?.certificates
        ) {
          setCertificates(certsRes.value.data.certificates);
        }

        if (skillsRes?.status === "fulfilled" && skillsRes.value.data?.skills) {
          setSkills(skillsRes.value.data.skills);
        }
      } catch (err) {
        console.error("Error loading portfolio data:", err);
        setError("Unable to load portfolio details at this time.");
      } finally {
        setLoading(false);
      }
    };

    fetchPublicData();
  }, []);

  // Display user priority: authenticated user if looking at own portfolio, else fetched public profile
  // ALWAYS show the admin/owner's public profile on the portfolio page
  // regardless of who is currently logged in
  const displayUser = profile;

  // Extract all unique tech stack tags from projects
  const allTechStacks = Array.from(
    new Set(
      projects.flatMap((p) =>
        Array.isArray(p.tech_stack) ? p.tech_stack : [],
      ),
    ),
  );

  // Extract all unique categories from skills
  const skillCategories = Array.from(
    new Set(skills.map((s) => s.category).filter(Boolean)),
  );

  // Filter skills by category
  const filteredSkills =
    selectedSkillCategory === "all"
      ? skills
      : selectedSkillCategory === "featured"
        ? skills.filter((s) => s.is_featured)
        : skills.filter((s) => s.category === selectedSkillCategory);

  // Filter projects by tech
  const filteredProjects =
    selectedTech === "all"
      ? projects
      : selectedTech === "featured"
        ? projects.filter((p) => p.is_featured)
        : projects.filter((p) => p.tech_stack?.includes(selectedTech));

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const getProjectValidImages = (project) => {
    if (!project?.images) return [];
    return normalizeProjectImages(project.images).filter(
      (url) =>
        typeof url === "string" &&
        url.trim() &&
        !url.endsWith(".git") &&
        !url.includes("github.com/"),
    );
  };

  const getProjectMainImage = (project) => {
    const validImages = getProjectValidImages(project);
    const permanent = keepPermanentImages(validImages);
    return permanent[0] || validImages[0] || null;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-blue-600 selection:text-white font-sans antialiased">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-900/90 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <a
            href="#hero"
            className="flex items-center gap-3 group transition-transform hover:scale-105 flex-shrink-0"
          >
            {displayUser?.profile_image && !headerImgError ? (
              <PortfolioImage
                src={displayUser.profile_image}
                alt={displayUser.name || "Portfolio"}
                variant="profile"
                onError={() => setHeaderImgError(true)}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover ring-2 ring-blue-500/50 shadow-md flex-shrink-0"
                fallback={
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-md text-lg flex-shrink-0">
                    {displayUser?.name
                      ? displayUser.name.charAt(0).toUpperCase()
                      : "P"}
                  </div>
                }
              />
            ) : (
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-md text-lg flex-shrink-0">
                {displayUser?.name
                  ? displayUser.name.charAt(0).toUpperCase()
                  : "P"}
              </div>
            )}
            <div className="min-w-0">
              <span className="font-bold text-base sm:text-lg tracking-tight text-white group-hover:text-blue-400 transition-colors flex items-center gap-1.5 max-w-[200px] sm:max-w-[280px]">
                <span className="truncate">{displayUser?.name || "Yorn Pheareak"}</span>
                <VerifiedBadge size="md" className="flex-shrink-0" />
              </span>
              <span className="block text-xs text-slate-400 font-medium capitalize truncate">
                {displayUser?.role || "Admin"}
              </span>
            </div>
          </a>

          {/* Desktop Nav Links (Visible on LG screens 1024px and up) */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-7 text-sm font-medium text-slate-300">
            <a
              href="#about"
              className="hover:text-blue-400 transition-colors hover:translate-y-[-1px]"
            >
              About
            </a>
            <a
              href="#skills"
              className="hover:text-blue-400 transition-colors hover:translate-y-[-1px]"
            >
              Skills ({skills.length})
            </a>
            <a
              href="#projects"
              className="hover:text-blue-400 transition-colors hover:translate-y-[-1px]"
            >
              Projects ({projects.length})
            </a>
            <a
              href="#certificates"
              className="hover:text-blue-400 transition-colors hover:translate-y-[-1px]"
            >
              Certificates ({certificates.length})
            </a>
            <a
              href="#contact"
              className="hover:text-blue-400 transition-colors hover:translate-y-[-1px]"
            >
              Contact
            </a>
          </nav>

          {/* Right Action / Mobile Hamburger Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Desktop Auth Action */}
            <div className="hidden lg:flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  {authUser?.role === "admin" && (
                    <Link
                      to="/dashboard"
                      className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/25 transition-all flex items-center gap-1.5"
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
                          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                        />
                      </svg>
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={logout}
                    className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                    title="Logout"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-all flex items-center gap-1.5"
                >
                  <svg
                    className="w-3.5 h-3.5 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                  </svg>
                  Sign In
                </Link>
              )}
            </div>

            {/* Mobile / Tablet Hamburger Button (Visible on screens below 1024px) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 focus:outline-none transition-all flex items-center gap-2"
              aria-label="Toggle Navigation Menu"
            >
              <span className="text-xs font-semibold hidden sm:inline text-slate-400">Menu</span>
              {mobileMenuOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 px-4 sm:px-6 pt-3 pb-6 space-y-3 shadow-2xl animate-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col space-y-1.5 text-sm font-medium">
              <a
                href="#about"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center justify-between"
              >
                <span>About & Overview</span>
                <span className="text-xs text-slate-500">&rarr;</span>
              </a>
              <a
                href="#skills"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center justify-between"
              >
                <span>Skills & Technologies</span>
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 font-semibold">{skills.length}</span>
              </a>
              <a
                href="#projects"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center justify-between"
              >
                <span>Featured Projects</span>
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 font-semibold">{projects.length}</span>
              </a>
              <a
                href="#certificates"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center justify-between"
              >
                <span>Certifications</span>
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-purple-500/10 text-purple-400 font-semibold">{certificates.length}</span>
              </a>
              <a
                href="#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center justify-between"
              >
                <span>Contact</span>
                <span className="text-xs text-slate-500">&rarr;</span>
              </a>
            </nav>

            {/* Mobile / Tablet Auth Actions */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              {isAuthenticated ? (
                <>
                  {authUser?.role === "admin" && (
                    <Link
                      to="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full py-3 px-4 rounded-xl bg-blue-600 text-white font-semibold text-xs text-center block shadow-lg shadow-blue-500/25 hover:bg-blue-500 transition-all flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                      <span>Admin Dashboard</span>
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-semibold transition-all text-center"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3 px-4 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold text-center block transition-all"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24 py-12">
        {/* HERO / PROFILE SECTION */}
        <section
          id="hero"
          className="relative pt-6 pb-12 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16"
        >
          {/* Ambient Glows */}
          <div className="absolute top-1/4 -left-20 w-72 h-72 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Left Text Column */}
          <div className="flex-1 space-y-6 text-center lg:text-left z-10 w-full">
            {/* Modern Availability Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-800/90 border border-slate-700/80 shadow-lg shadow-blue-500/5 backdrop-blur-md animate-role-pill">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold tracking-wide text-slate-200">
                Full-Stack Developer • Available for Projects
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight text-white leading-[1.15] animate-hero-1">
              <span className="inline-flex items-center gap-2.5">
                Hi, I'm <span className="animate-hand-wave text-3xl sm:text-4xl lg:text-5xl">👋</span>
              </span>{" "}
              <br className="hidden sm:inline" />
              <span className="relative inline-flex items-center gap-2 mt-1 sm:mt-2">
                <span className="animate-name-gradient font-black">
                  {displayUser?.name || "Yorn Pheareak"}
                </span>
                <VerifiedBadge size="xl" className="flex-shrink-0 translate-y-0.5 sm:translate-y-1" />
                {/* Ambient dynamic glow underneath */}
                <span
                  aria-hidden="true"
                  className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-blue-500/25 via-indigo-500/25 to-purple-500/25 blur-2xl -z-10"
                />
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal animate-hero-2">
              Welcome to my portfolio! Explore my latest completed projects,
              verified credentials, and technical skills below.
            </p>

            {/* Badges Info */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2 text-sm text-slate-300 animate-hero-3">
              {displayUser?.email && (
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-sm">
                  <svg
                    className="w-4 h-4 text-blue-400 flex-shrink-0"
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
                  <span className="text-xs sm:text-sm truncate">{displayUser.email}</span>
                </div>
              )}

              {displayUser?.phone && (
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-sm">
                  <svg
                    className="w-4 h-4 text-green-400 flex-shrink-0"
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
                  <span className="text-xs sm:text-sm">{displayUser.phone}</span>
                </div>
              )}

              {displayUser?.dob && (
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-sm">
                  <svg
                    className="w-4 h-4 text-purple-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-xs sm:text-sm">Born {formatDisplayDate(displayUser.dob)}</span>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4 animate-hero-4">
              <a
                href="#projects"
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg shadow-blue-500/25 hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all text-sm"
              >
                View Projects
              </a>
              <a
                href="#certificates"
                className="px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold border border-slate-700 hover:border-slate-600 transition-all hover:-translate-y-0.5 text-sm"
              >
                View Certificates
              </a>
              <a
                href="#contact"
                className="px-6 py-3.5 rounded-xl bg-transparent hover:bg-slate-800/50 text-slate-300 hover:text-white font-medium transition-all text-sm"
              >
                Contact Me &rarr;
              </a>
            </div>
          </div>

          {/* Right Profile Card / Avatar Column */}
          <div className="flex-shrink-0 z-10 animate-hero-avatar">
            <div className="relative group animate-float">
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-500" />
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 lg:w-80 lg:h-80 rounded-3xl overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center shadow-2xl">
                {displayUser?.profile_image && !profileImgError ? (
                  <PortfolioImage
                    src={displayUser.profile_image}
                    alt={displayUser.name || "Profile"}
                    variant="profile"
                    onError={() => setProfileImgError(true)}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    fallback={
                      <div className="text-center p-6">
                        <div className="w-28 h-28 mx-auto mb-4 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-5xl font-bold text-white shadow-inner">
                          {displayUser?.name
                            ? displayUser.name.charAt(0).toUpperCase()
                            : "P"}
                        </div>
                        <p className="font-semibold text-lg text-white">
                          {displayUser?.name || "Portfolio Owner"}
                        </p>
                        <p className="text-sm text-slate-400 capitalize">
                          {displayUser?.role || "Developer"}
                        </p>
                      </div>
                    }
                  />
                ) : (
                  <div className="text-center p-6">
                    <div className="w-28 h-28 mx-auto mb-4 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-5xl font-bold text-white shadow-inner">
                      {displayUser?.name
                        ? displayUser.name.charAt(0).toUpperCase()
                        : "P"}
                    </div>
                    <p className="font-semibold text-lg text-white">
                      {displayUser?.name || "Portfolio Owner"}
                    </p>
                    <p className="text-sm text-slate-400 capitalize">
                      {displayUser?.role || "Developer"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ABOUT & SKILLS SUMMARY */}
        <section
          id="about"
          ref={revealAbout.ref}
          className={`scroll-mt-28 space-y-8 reveal reveal-up reveal-slow ${revealAbout.isVisible ? "visible" : ""}`}
        >
          <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                About & Overview
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Background, skills, and summary
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-800 hover:border-slate-700 transition-colors reveal reveal-scale reveal-delay-1" style={{opacity: revealAbout.isVisible ? 1 : 0, transform: revealAbout.isVisible ? 'none' : 'scale(0.88)', filter: revealAbout.isVisible ? 'none' : 'blur(4px)', transitionProperty: 'opacity, transform, filter', transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)', transitionDuration: '700ms', transitionDelay: '80ms'}}>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6"
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
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Full-Stack Architecture
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Building responsive frontend user interfaces, robust REST APIs,
                secure authentication workflows, and relational database
                schemas.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-800 hover:border-slate-700 transition-colors" style={{opacity: revealAbout.isVisible ? 1 : 0, transform: revealAbout.isVisible ? 'none' : 'scale(0.88) translateY(24px)', transitionProperty: 'opacity, transform', transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)', transitionDuration: '700ms', transitionDelay: '200ms'}}>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Projects & Deliverables
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {projects.length > 0
                  ? `Featuring ${projects.length} curated project${projects.length > 1 ? "s" : ""} built with modern frameworks and practical full-stack integrations.`
                  : "Continuous development of modern web applications and real-world tools."}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-800 hover:border-slate-700 transition-colors" style={{opacity: revealAbout.isVisible ? 1 : 0, transform: revealAbout.isVisible ? 'none' : 'scale(0.88) translateY(24px)', transitionProperty: 'opacity, transform', transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)', transitionDuration: '700ms', transitionDelay: '320ms'}}>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Certified & Verified
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {certificates.length > 0
                  ? `Holds ${certificates.length} completed course certification${certificates.length > 1 ? "s" : ""} validating web development and software principles.`
                  : "Committed to ongoing education, certifications, and technical mastery."}
              </p>
            </div>
          </div>
        </section>

        {/* TECHNICAL SKILLS SECTION */}
        <section
          id="skills"
          ref={revealSkills.ref}
          className={`scroll-mt-28 space-y-8 reveal reveal-up ${revealSkills.isVisible ? "visible" : ""}`}
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold mb-2">
                Technical Expertise
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Skills & Technologies
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Languages, frameworks, databases, and development tools with
                proficiency levels.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSelectedSkillCategory("all")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  selectedSkillCategory === "all"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                    : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                }`}
              >
                All ({skills.length})
              </button>

              {skills.some((s) => s.is_featured) && (
                <button
                  onClick={() => setSelectedSkillCategory("featured")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    selectedSkillCategory === "featured"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                      : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                  }`}
                >
                  ★ Featured
                </button>
              )}

              {skillCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedSkillCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    selectedSkillCategory === cat
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                      : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 bg-slate-800/30 rounded-2xl border border-slate-800">
              <div className="w-8 h-8 mx-auto mb-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p>Loading skills...</p>
            </div>
          ) : filteredSkills.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-slate-800/30 rounded-2xl border border-slate-800">
              <p className="text-slate-300">
                No skills found in this category.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {filteredSkills.map((skill, index) => (
                <div
                  key={skill.id}
                  className="p-5 rounded-2xl bg-slate-800/70 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/90 shadow-lg hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
                  style={{
                    opacity: revealSkills.isVisible ? 1 : 0,
                    transform: revealSkills.isVisible ? "none" : "translateY(32px) scale(0.95)",
                    transitionProperty: "opacity, transform",
                    transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                    transitionDuration: "600ms",
                    transitionDelay: `${Math.min(index * 70, 420)}ms`,
                  }}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        {skill.icon ? (
                          <div className="w-11 h-11 rounded-xl bg-slate-900/90 border border-slate-700/70 p-2 flex items-center justify-center shadow-md flex-shrink-0 group-hover:scale-110 group-hover:border-blue-500/50 transition-all duration-300">
                            <PortfolioImage
                              src={skill.icon}
                              alt={skill.name}
                              className="w-full h-full object-contain"
                              fallback={
                                <span className="text-blue-400 font-bold text-sm">
                                  {skill.name?.charAt(0)}
                                </span>
                              }
                            />
                          </div>
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-base shadow-md flex-shrink-0">
                            {skill.name?.charAt(0)}
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              {skill.category}
                            </span>
                            {skill.is_featured && (
                              <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                ★
                              </span>
                            )}
                          </div>
                          <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors mt-1">
                            {skill.name}
                          </h3>
                        </div>
                      </div>

                      <span className="text-base font-extrabold text-blue-400 font-mono flex-shrink-0">
                        {skill.percentage}%
                      </span>
                    </div>

                    {/* Animated Progress Bar */}
                    <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden my-3 border border-slate-700/50">
                      <div
                        className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-700 group-hover:brightness-125"
                        style={{ width: `${skill.percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                    <span>Proficiency</span>
                    <span className="font-semibold text-slate-300">
                      {skill.level ||
                        (skill.percentage >= 85 ? "Advanced" : "Intermediate")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* PROJECTS SECTION */}
        <section
          id="projects"
          ref={revealProjects.ref}
          className={`scroll-mt-28 space-y-8 reveal reveal-up ${revealProjects.isVisible ? "visible" : ""}`}
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold mb-2">
                Portfolio Showcase
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Featured Projects
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Explore live applications, source code, and tech stacks.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSelectedTech("all")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  selectedTech === "all"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                    : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                }`}
              >
                All ({projects.length})
              </button>

              {projects.some((p) => p.is_featured) && (
                <button
                  onClick={() => setSelectedTech("featured")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    selectedTech === "featured"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                      : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                  }`}
                >
                  ★ Featured
                </button>
              )}

              {allTechStacks.slice(0, 5).map((tech) => (
                <button
                  key={tech}
                  onClick={() => setSelectedTech(tech)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    selectedTech === tech
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                      : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                  }`}
                >
                  {tech}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 bg-slate-800/30 rounded-2xl border border-slate-800">
              <div className="w-8 h-8 mx-auto mb-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p>Loading projects...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-slate-800/30 rounded-2xl border border-slate-800">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-slate-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <p className="text-lg font-medium text-slate-300">
                No projects found in this category.
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Check back soon or select "All" to view available projects.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project, index) => {
                const mainImage = getProjectMainImage(project);
                const validImages = getProjectValidImages(project);

                return (
                  <div
                    key={project.id}
                    className="group rounded-2xl bg-slate-800/70 border border-slate-800 hover:border-slate-700/80 shadow-lg hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 flex flex-col overflow-hidden"
                  >
                    {/* Project Image Preview — no opacity animation (fixes lazy-load black box) */}
                    <div
                      onClick={() => setSelectedProject(project)}
                      className="relative w-full h-48 min-h-[12rem] bg-slate-950 overflow-hidden cursor-pointer"
                    >
                      {mainImage ? (
                        <ProjectCardImage
                          src={mainImage}
                          alt={project.title}
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-slate-500 p-4">
                          <svg
                            className="w-10 h-10 mb-2 opacity-50 text-blue-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <span className="text-xs uppercase tracking-wider font-semibold">
                            {project.title}
                          </span>
                        </div>
                      )}

                      {project.is_featured && (
                        <span className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full bg-blue-600/90 backdrop-blur-md text-white text-[11px] font-bold shadow-md">
                          ★ Featured
                        </span>
                      )}

                      {validImages.length > 1 && (
                        <span className="absolute bottom-3 right-3 z-10 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-slate-300 text-[10px] font-medium">
                          +{validImages.length - 1} photos
                        </span>
                      )}
                    </div>

                    {/* Project Content — scroll reveal animation */}
                    <div
                      className="p-6 flex-1 flex flex-col justify-between space-y-4"
                      style={{
                        opacity: revealProjects.isVisible ? 1 : 0,
                        transform: revealProjects.isVisible ? "none" : "translateY(24px)",
                        transitionProperty: "opacity, transform",
                        transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                        transitionDuration: "650ms",
                        transitionDelay: `${Math.min(index * 100, 500)}ms`,
                      }}
                    >
                      <div>
                        <h3
                          onClick={() => setSelectedProject(project)}
                          className="text-xl font-bold text-white hover:text-blue-400 transition-colors cursor-pointer"
                        >
                          {project.title}
                        </h3>

                        <p className="text-slate-400 text-sm mt-2 line-clamp-3 leading-relaxed">
                          {project.description ||
                            "No project description provided."}
                        </p>
                      </div>

                      {/* Tech Stack Pills */}
                      {project.tech_stack && project.tech_stack.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {project.tech_stack.map((tech) => (
                            <span
                              key={tech}
                              className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-700/60 text-slate-300 text-xs font-medium"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Project Links (Read-Only) */}
                      <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap gap-3">
                          {project.links && project.links.length > 0 ? (
                            project.links.map((link, idx) => (
                              <a
                                key={idx}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                              >
                                <span>{link.label}</span>
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
                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                  />
                                </svg>
                              </a>
                            ))
                          ) : (
                            <span className="text-xs text-slate-500">
                              No external links
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => setSelectedProject(project)}
                          className="text-xs text-slate-400 hover:text-white font-medium transition-colors"
                        >
                          Details &rarr;
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* CERTIFICATES SECTION */}
        <section
          id="certificates"
          ref={revealCerts.ref}
          className={`scroll-mt-28 space-y-8 reveal reveal-up ${revealCerts.isVisible ? "visible" : ""}`}
        >
          <div className="border-b border-slate-800 pb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold mb-2">
              Credentials
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Certifications & Courses
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Verified certifications, academy achievements, and completed
              training courses.
            </p>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 bg-slate-800/30 rounded-2xl border border-slate-800">
              <div className="w-8 h-8 mx-auto mb-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p>Loading certificates...</p>
            </div>
          ) : certificates.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-slate-800/30 rounded-2xl border border-slate-800">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-slate-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                />
              </svg>
              <p className="text-lg font-medium text-slate-300">
                No certificates published yet.
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Completed certificates will appear here.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {certificates.map((cert, index) => (
                <div
                  key={cert.id}
                  className="rounded-2xl bg-slate-800/70 border border-slate-800 hover:border-slate-700/80 shadow-lg hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col overflow-hidden group"
                  style={{
                    opacity: revealCerts.isVisible ? 1 : 0,
                    transform: revealCerts.isVisible ? "none" : "translateY(40px)",
                    transitionProperty: "opacity, transform",
                    transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                    transitionDuration: "650ms",
                    transitionDelay: `${Math.min(index * 100, 500)}ms`,
                  }}
                >
                  {/* Certificate Image Preview */}
                  <div
                    onClick={() => setSelectedCertificate(cert)}
                    className="relative w-full h-44 bg-slate-950 overflow-hidden cursor-pointer"
                  >
                    {cert.image ? (
                      <PortfolioImage
                        src={cert.image}
                        alt={cert.course}
                        variant="certificate"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        fallback={
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-indigo-950 text-indigo-400 p-4 text-center">
                            <svg
                              className="w-12 h-12 mb-2 opacity-60"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                              />
                            </svg>
                            <span className="text-xs uppercase tracking-wider font-semibold text-slate-300">
                              Certificate
                            </span>
                          </div>
                        }
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-indigo-950 text-indigo-400 p-4 text-center">
                        <svg
                          className="w-12 h-12 mb-2 opacity-60"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                          />
                        </svg>
                        <span className="text-xs uppercase tracking-wider font-semibold text-slate-300">
                          Certificate
                        </span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="px-3 py-1 rounded-full bg-slate-900/80 text-white text-xs font-medium flex items-center gap-1">
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
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                          />
                        </svg>
                        Click to Zoom
                      </span>
                    </div>
                  </div>

                  {/* Certificate Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3
                        onClick={() => setSelectedCertificate(cert)}
                        className="text-lg font-bold text-white hover:text-indigo-400 transition-colors cursor-pointer"
                      >
                        {cert.course}
                      </h3>

                      {cert.instructor && (
                        <p className="text-xs font-semibold text-indigo-400 mt-1 flex items-center gap-1.5">
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
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          <span>Instructor / Org: {cert.instructor}</span>
                        </p>
                      )}

                      <p className="text-slate-400 text-sm mt-2 line-clamp-3 leading-relaxed">
                        {cert.description || "Course certificate completed."}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      {cert.issued_on ? (
                        <span>Issued: {formatDisplayDate(cert.issued_on)}</span>
                      ) : (
                        <span>Verified Credential</span>
                      )}

                      <button
                        onClick={() => setSelectedCertificate(cert)}
                        className="text-indigo-400 hover:text-indigo-300 font-medium"
                      >
                        View Full &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* CONTACT SECTION */}
        <section
          id="contact"
          ref={revealContact.ref}
          className={`scroll-mt-28 reveal reveal-scale-up ${revealContact.isVisible ? "visible" : ""}`}
        >
          <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-800/80 border border-slate-800 p-8 sm:p-12 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 grid lg:grid-cols-12 gap-10 lg:gap-14">
              {/* Left Column: Direct Info & Quick Copy */}
              <div className="lg:col-span-5 space-y-6">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold">
                  Get In Touch
                </div>

                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Let's Build Something Great Together
                </h2>

                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  Have a project inquiry, job opportunity, or question? Send a message directly or connect through email and phone.
                </p>

                {/* Direct Contact Cards */}
                <div className="space-y-3 pt-2">
                  {displayUser?.email && (
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-3 group transition-all">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Email Address</p>
                          <p className="text-sm font-bold text-white truncate">{displayUser.email}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopy(displayUser.email, "email")}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex-shrink-0 transition-colors"
                      >
                        {copiedField === "email" ? "✓ Copied!" : "Copy"}
                      </button>
                    </div>
                  )}

                  {displayUser?.phone && (
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-3 group transition-all">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Phone / Telegram</p>
                          <p className="text-sm font-bold text-white truncate">{displayUser.phone}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopy(displayUser.phone, "phone")}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex-shrink-0 transition-colors"
                      >
                        {copiedField === "phone" ? "✓ Copied!" : "Copy"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Interactive Send Message Form */}
              <div className="lg:col-span-7 bg-slate-950/70 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl">
                {contactSubmitted ? (
                  <div className="text-center py-10 space-y-4 animate-in zoom-in-95 duration-300">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-white">Message Sent Successfully!</h3>
                    <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
                      Thank you for reaching out. Your message has been recorded and I will respond to your email shortly!
                    </p>
                    <button
                      type="button"
                      onClick={() => { setContactSubmitted(false); setContactApiError(""); }}
                      className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all mt-4"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <h3 className="text-xl font-bold text-white mb-2">Send a Message</h3>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                          Your Name
                        </label>
                        <input
                          type="text"
                          value={contactForm.name}
                          onChange={(e) => {
                            setContactForm({ ...contactForm, name: e.target.value });
                            if (contactErrors.name) setContactErrors({ ...contactErrors, name: "" });
                          }}
                          placeholder="John Doe"
                          className={`w-full px-4 py-3 bg-slate-900 border rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 transition-all ${
                            contactErrors.name
                              ? "border-red-500 focus:ring-red-500 bg-red-500/5"
                              : "border-slate-800 focus:ring-blue-500 focus:border-transparent"
                          }`}
                        />
                        {contactErrors.name && (
                          <p className="text-red-400 text-xs mt-1 font-medium">⚠ {contactErrors.name}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                          Your Email
                        </label>
                        <input
                          type="email"
                          value={contactForm.email}
                          onChange={(e) => {
                            setContactForm({ ...contactForm, email: e.target.value });
                            if (contactErrors.email) setContactErrors({ ...contactErrors, email: "" });
                          }}
                          placeholder="john@example.com"
                          className={`w-full px-4 py-3 bg-slate-900 border rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 transition-all ${
                            contactErrors.email
                              ? "border-red-500 focus:ring-red-500 bg-red-500/5"
                              : "border-slate-800 focus:ring-blue-500 focus:border-transparent"
                          }`}
                        />
                        {contactErrors.email && (
                          <p className="text-red-400 text-xs mt-1 font-medium">⚠ {contactErrors.email}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={contactForm.subject}
                        onChange={(e) => {
                          setContactForm({ ...contactForm, subject: e.target.value });
                          if (contactErrors.subject) setContactErrors({ ...contactErrors, subject: "" });
                        }}
                        placeholder="Project Discussion / Collaboration"
                        className={`w-full px-4 py-3 bg-slate-900 border rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 transition-all ${
                          contactErrors.subject
                            ? "border-red-500 focus:ring-red-500 bg-red-500/5"
                            : "border-slate-800 focus:ring-blue-500 focus:border-transparent"
                        }`}
                      />
                      {contactErrors.subject && (
                        <p className="text-red-400 text-xs mt-1 font-medium">⚠ {contactErrors.subject}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                        Your Message
                      </label>
                      <textarea
                        rows={4}
                        value={contactForm.message}
                        onChange={(e) => {
                          setContactForm({ ...contactForm, message: e.target.value });
                          if (contactErrors.message) setContactErrors({ ...contactErrors, message: "" });
                        }}
                        placeholder="Hi, I would like to discuss a project..."
                        className={`w-full px-4 py-3 bg-slate-900 border rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 transition-all ${
                          contactErrors.message
                            ? "border-red-500 focus:ring-red-500 bg-red-500/5"
                            : "border-slate-800 focus:ring-blue-500 focus:border-transparent"
                        }`}
                      />
                      {contactErrors.message && (
                        <p className="text-red-400 text-xs mt-1 font-medium">⚠ {contactErrors.message}</p>
                      )}
                    </div>

                    {contactApiError && (
                      <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
                        <span className="flex-shrink-0 mt-0.5">⚠</span>
                        <span>{contactApiError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={sendingMessage}
                      className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-semibold shadow-lg shadow-blue-500/25 hover:from-blue-500 hover:to-purple-500 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 transition-all text-sm flex items-center justify-center gap-2"
                    >
                      {sendingMessage ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Sending Message...</span>
                        </>
                      ) : (
                        <span>Send Message &rarr;</span>
                      )}
                    </button>
                  </form>

                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 bg-slate-950/60 py-8 text-center text-slate-500 text-sm">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            &copy; {new Date().getFullYear()} {displayUser?.name || "Portfolio"}
            . All rights reserved. (Public Read-Only View)
          </p>
          <div className="flex items-center gap-4 text-xs">
            <a href="#hero" className="hover:text-slate-300">
              Back to top &uarr;
            </a>
            {!isAuthenticated && (
              <Link to="/login" className="hover:text-blue-400">
                Admin Sign In
              </Link>
            )}
          </div>
        </div>
      </footer>

      {/* PROJECT DETAILS MODAL (READ-ONLY) */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedProject(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <svg
                className="w-5 h-5"
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

            {selectedProject &&
              getProjectValidImages(selectedProject).length > 0 && (
                <div className="space-y-3">
                  <PortfolioImage
                    src={getProjectValidImages(selectedProject)[0]}
                    alt={selectedProject.title}
                    variant="project"
                    className="w-full max-h-72 object-cover rounded-xl border border-slate-800"
                  />
                  {getProjectValidImages(selectedProject).length > 1 && (
                    <div className="grid grid-cols-3 gap-2">
                      {getProjectValidImages(selectedProject)
                        .slice(1)
                        .map((imgUrl, i) => (
                          <PortfolioImage
                            key={i}
                            src={imgUrl}
                            alt=""
                            variant="project"
                            className="w-full h-20 object-cover rounded-lg border border-slate-800"
                          />
                        ))}
                    </div>
                  )}
                </div>
              )}

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-bold text-white">
                  {selectedProject.title}
                </h3>
                {selectedProject.is_featured && (
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-xs font-bold">
                    Featured
                  </span>
                )}
              </div>
              <p className="text-slate-300 text-sm mt-3 whitespace-pre-line leading-relaxed">
                {selectedProject.description}
              </p>
            </div>

            {selectedProject.tech_stack &&
              selectedProject.tech_stack.length > 0 && (
                <div>
                  <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-2">
                    Technologies Used
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.tech_stack.map((tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1 rounded-lg bg-slate-800 text-blue-400 text-xs font-medium border border-slate-700"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {selectedProject.links && selectedProject.links.length > 0 && (
              <div className="pt-4 border-t border-slate-800">
                <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-3">
                  Links & Live Demos
                </h4>
                <div className="flex flex-wrap gap-3">
                  {selectedProject.links.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors shadow-md shadow-blue-500/20"
                    >
                      <span>{link.label}</span>
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
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CERTIFICATE LIGHTBOX / ZOOM MODAL (READ-ONLY) */}
      {selectedCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedCertificate(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <svg
                className="w-5 h-5"
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

            {selectedCertificate.image && (
              <div className="rounded-xl overflow-hidden border border-slate-800 bg-black">
                <PortfolioImage
                  src={selectedCertificate.image}
                  alt={selectedCertificate.course}
                  variant="certificate"
                  className="w-full max-h-96 object-contain"
                />
              </div>
            )}

            <div>
              <h3 className="text-2xl font-bold text-white">
                {selectedCertificate.course}
              </h3>
              {selectedCertificate.instructor && (
                <p className="text-sm font-semibold text-indigo-400 mt-1">
                  Issued by / Instructor: {selectedCertificate.instructor}
                </p>
              )}
              {selectedCertificate.issued_on && (
                <p className="text-xs text-slate-400 mt-1">
                  Date: {formatDisplayDate(selectedCertificate.issued_on)}
                </p>
              )}
              <p className="text-slate-300 text-sm mt-4 whitespace-pre-line leading-relaxed">
                {selectedCertificate.description ||
                  "Certificate of completion."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
