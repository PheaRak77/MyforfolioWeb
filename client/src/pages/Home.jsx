import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";
import publicApi from "../api/publicApi";
import { useAuth } from "../context/AuthContext";
import useScrollReveal from "../hooks/useScrollReveal";
import PortfolioImage from "../components/PortfolioImage";
import VerifiedBadge, { VerifiedName } from "../components/VerifiedBadge";
import MotionBackground from "../components/MotionBackground";
import FingerprintLoader from "../components/FingerprintLoader";
import ThemeToggle from "../components/ThemeToggle";
import ProjectCard from "../components/ProjectCard";
import CertificateCard from "../components/CertificateCard";
import {
  fetchPublicPortfolioData,
  hydrateFromCache,
} from "../utils/publicDataCache";
import { getProjectValidImages } from "../utils/projectImages";
import { formatDisplayDate } from "../utils/formatDate";

// The CV modal statically imports a full-page CV render. Nobody sees it until
// they click "Look CV", so it stays out of the first-load bundle.
const CvModal = lazy(() => import("../components/CvModal"));

// One synchronous storage read for the whole page instead of one per useState
// initialiser — readCache touches both localStorage and sessionStorage per key.
const cached = hydrateFromCache();

const Home = () => {
  const { user: authUser, isAuthenticated, logout } = useAuth();

  const [profile, setProfile] = useState(
    () =>
      cached.portfolio?.user ??
      cached.profile?.user ?? {
        name: "Yorn Pheareak",
        role: "Full-Stack Developer",
        email: "renpearak6666@gmail.com",
        phone: "0883930493",
        bio: "Full-Stack Developer passionate about building high-performance, modern web applications.",
      },
  );
  const [projects, setProjects] = useState(
    () => cached.portfolio?.projects ?? cached.projects?.projects ?? [],
  );
  const [certificates, setCertificates] = useState(
    () =>
      cached.portfolio?.certificates ?? cached.certificates?.certificates ?? [],
  );
  const [skills, setSkills] = useState(
    () => cached.portfolio?.skills ?? cached.skills?.skills ?? [],
  );
  const [loading, setLoading] = useState(
    () => !cached.portfolio && !cached.profile,
  );
  const [_error, setError] = useState("");

  // Scroll Reveal Hooks for each section
  const [revealAboutRef, isAboutVisible] = useScrollReveal({ threshold: 0.1 });
  const [revealSkillsRef, isSkillsVisible] = useScrollReveal({ threshold: 0.08 });
  const [revealProjectsRef, isProjectsVisible] = useScrollReveal({ threshold: 0.06 });
  const [revealCertsRef, isCertsVisible] = useScrollReveal({ threshold: 0.06 });
  const [revealContactRef, isContactVisible] = useScrollReveal({ threshold: 0.08 });

  // Filter and Modal States
  const [selectedTech, setSelectedTech] = useState("all");
  const [selectedSkillCategory, setSelectedSkillCategory] = useState("all");
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cvModalOpen, setCvModalOpen] = useState(false);

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

  const handleCopy = useCallback((text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(""), 2500);
  }, []);

  const handleNavClick = useCallback((e, targetId) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.querySelector(targetId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const validateContact = useCallback(() => {
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
  }, [contactForm]);

  const handleContactFocus = useCallback(() => {
    // Silently pre-warm Render API when user starts typing
    publicApi.get("/health").catch(() => {});
  }, []);

  const handleContactSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!validateContact()) return;

      setSendingMessage(true);
      setContactApiError("");

      try {
        const { data } = await publicApi.post("/contact", {
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
          setContactApiError(
            data.message || "Failed to send message. Please try again.",
          );
        }
      } catch (err) {
        const serverMessage = err.response?.data?.message;
        setContactApiError(
          serverMessage ||
            "Something went wrong. Please try again or contact directly via email.",
        );
      } finally {
        setSendingMessage(false);
      }
    },
    [contactForm, validateContact],
  );

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        setLoading(true);
        setError("");

        const responses = await fetchPublicPortfolioData(publicApi, {
          portfolio: "/portfolio",
        });

        const portfolio = responses.portfolio?.value?.data;
        if (responses.portfolio?.status === "fulfilled" && portfolio) {
          setProfile(portfolio.user ?? null);
          setProjects(portfolio.projects ?? []);
          setCertificates(portfolio.certificates ?? []);
          setSkills(portfolio.skills ?? []);
        } else {
          // Keep the public site compatible until the Render service receives
          // the matching server deployment. Once /portfolio is available this
          // fallback is not requested at all.
          const legacy = await fetchPublicPortfolioData(publicApi, {
            profile: "/users/public-profile",
            projects: "/projects",
            certificates: "/certificates",
            skills: "/skills",
          });

          if (legacy.profile?.status === "fulfilled") {
            setProfile(legacy.profile.value.data?.user ?? null);
          }
          if (legacy.projects?.status === "fulfilled") {
            setProjects(legacy.projects.value.data?.projects ?? []);
          }
          if (legacy.certificates?.status === "fulfilled") {
            setCertificates(legacy.certificates.value.data?.certificates ?? []);
          }
          if (legacy.skills?.status === "fulfilled") {
            setSkills(legacy.skills.value.data?.skills ?? []);
          }
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
  const allTechStacks = useMemo(
    () =>
      Array.from(
        new Set(
          projects.flatMap((p) =>
            Array.isArray(p.tech_stack) ? p.tech_stack : [],
          ),
        ),
      ),
    [projects],
  );

  // Extract all unique categories from skills
  const skillCategories = useMemo(
    () => Array.from(new Set(skills.map((s) => s.category).filter(Boolean))),
    [skills],
  );

  // Filter skills by category
  const filteredSkills = useMemo(
    () =>
      selectedSkillCategory === "all"
        ? skills
        : selectedSkillCategory === "featured"
          ? skills.filter((s) => s.is_featured)
          : skills.filter((s) => s.category === selectedSkillCategory),
    [skills, selectedSkillCategory],
  );

  // Filter projects by tech
  const filteredProjects = useMemo(
    () =>
      selectedTech === "all"
        ? projects
        : selectedTech === "featured"
          ? projects.filter((p) => p.is_featured)
          : projects.filter((p) => p.tech_stack?.includes(selectedTech)),
    [projects, selectedTech],
  );

  // Stable identities so the memoised cards below don't re-render when
  // unrelated page state (contact form, theme, modals) changes.
  const handleSelectProject = useCallback(
    (project) => setSelectedProject(project),
    [],
  );
  const handleSelectCertificate = useCallback(
    (cert) => setSelectedCertificate(cert),
    [],
  );

  return (
    <div className="portfolio-page relative min-h-screen bg-slate-50 text-slate-900 dark:bg-[#070b14] dark:text-slate-100 selection:bg-amber-400 selection:text-black font-sans antialiased overflow-x-hidden">
      {/* Motion-style Parametric Matrix Wave & Ambient Aurora Glow */}
      <MotionBackground />

      {/* Top Apple-Style Glassmorphic Navigation Bar */}
      <header className="sticky top-0 z-40 apple-nav-blur bg-white/75 dark:bg-[#070b14]/75 border-b border-black/[0.06] dark:border-white/[0.08] pt-safe-top shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-3 sm:gap-4">
          <a
            href="#hero"
            className="flex items-center gap-3 group transition-transform hover:scale-105 flex-shrink-0"
          >
            <div className="relative flex-shrink-0">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 rounded-full blur-sm opacity-70 group-hover:opacity-100 transition duration-300" />
              {displayUser?.profile_image && !headerImgError ? (
                <PortfolioImage
                  src={displayUser.profile_image}
                  alt={displayUser.name || "Portfolio"}
                  variant="profile"
                  onError={() => setHeaderImgError(true)}
                  className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-white dark:ring-slate-900 shadow-md"
                  fallback={
                    <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-500 flex items-center justify-center font-bold text-slate-900 shadow-md text-base">
                      {displayUser?.name
                        ? displayUser.name.charAt(0).toUpperCase()
                        : "P"}
                    </div>
                  }
                />
              ) : (
                <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-500 flex items-center justify-center font-bold text-slate-900 shadow-md text-base">
                  {displayUser?.name
                    ? displayUser.name.charAt(0).toUpperCase()
                    : "P"}
                </div>
              )}
            </div>
            <div className="min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-bold text-sm sm:text-base tracking-tight text-neutral-900 dark:text-white group-hover:text-amber-500 dark:group-hover:text-amber-300 transition-colors truncate max-w-[130px] sm:max-w-[170px]">
                  {displayUser?.name || "Yorn Pheareak"}
                </span>
                <VerifiedBadge size="sm" className="flex-shrink-0" />
              </div>
              <span className="block text-[11px] text-neutral-500 dark:text-neutral-400 font-medium capitalize truncate">
                {displayUser?.role || "Full-Stack Developer"}
              </span>
            </div>
          </a>

          {/* Apple-Style Desktop Nav Links (Visible on LG screens) */}
          <nav className="hidden lg:flex items-center gap-1.5 xl:gap-2 text-xs font-semibold text-neutral-600 dark:text-neutral-300">
            <a
              href="#about"
              onClick={(e) => handleNavClick(e, "#about")}
              className="px-3.5 py-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 hover:text-neutral-900 dark:hover:text-white transition-all"
            >
              About
            </a>
            <a
              href="#skills"
              onClick={(e) => handleNavClick(e, "#skills")}
              className="px-3.5 py-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 hover:text-neutral-900 dark:hover:text-white transition-all"
            >
              Skills
            </a>
            <a
              href="#projects"
              onClick={(e) => handleNavClick(e, "#projects")}
              className="px-3.5 py-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 hover:text-neutral-900 dark:hover:text-white transition-all"
            >
              Projects
            </a>
            <a
              href="#certificates"
              onClick={(e) => handleNavClick(e, "#certificates")}
              className="px-3.5 py-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 hover:text-neutral-900 dark:hover:text-white transition-all"
            >
              Certificates
            </a>
            <a
              href="#contact"
              onClick={(e) => handleNavClick(e, "#contact")}
              className="px-3.5 py-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 hover:text-neutral-900 dark:hover:text-white transition-all"
            >
              Contact
            </a>
            <button
              type="button"
              onClick={() => setCvModalOpen(true)}
              className="ml-2 text-neutral-950 font-bold transition-all hover:scale-105 flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-md shadow-amber-500/25"
              title="Look and Download CV"
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
                  strokeWidth={2.2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span>Look CV</span>
            </button>
          </nav>

          {/* Right Action / Mobile Hamburger Toggle */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
            {/* Theme Toggle Button (Light / Dark) with View Transition & Morphing Sun/Moon */}
            <ThemeToggle size="md" />

            {/* Desktop Auth Action */}
            <div className="hidden lg:flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  {authUser?.role === "admin" && (
                    <Link
                      to="/dashboard"
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:scale-105 transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      Dashboard
                    </Link>
                  )}
                  <button
                    onClick={logout}
                    className="px-3 py-1.5 text-xs font-medium rounded-full bg-black/5 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors"
                    title="Logout"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-full bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10 text-neutral-800 dark:text-neutral-200 hover:text-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/15 transition-all flex items-center gap-1.5"
                >
                  Sign In
                </Link>
              )}
            </div>

            {/* Apple-Grade Morphing Hamburger Button for Smartphone */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-10 h-10 rounded-full bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10 flex flex-col items-center justify-center gap-1.5 focus:outline-none transition-all active:scale-90"
              aria-label="Toggle Navigation Menu"
            >
              <span
                className={`w-5 h-0.5 bg-neutral-800 dark:bg-neutral-200 rounded-full transform transition-all duration-300 origin-center ${
                  mobileMenuOpen ? "rotate-45 translate-y-2" : ""
                }`}
              />
              <span
                className={`w-5 h-0.5 bg-neutral-800 dark:bg-neutral-200 rounded-full transition-all duration-200 ${
                  mobileMenuOpen ? "opacity-0 scale-0" : "opacity-100"
                }`}
              />
              <span
                className={`w-5 h-0.5 bg-neutral-800 dark:bg-neutral-200 rounded-full transform transition-all duration-300 origin-center ${
                  mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {/* Apple-Style Animated Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden apple-nav-blur bg-white/95 dark:bg-[#070b14]/95 border-b border-black/[0.08] dark:border-white/[0.08] px-5 pt-4 pb-7 pb-safe-bottom space-y-4 shadow-2xl animate-mobile-drawer origin-top">
            <nav className="flex flex-col space-y-2 text-sm font-semibold">
              <a
                href="#about"
                onClick={(e) => handleNavClick(e, "#about")}
                className="animate-menu-item-1 px-4 py-3 rounded-2xl text-neutral-800 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center justify-between"
              >
                <span>About & Overview</span>
                <span className="text-xs text-neutral-400 font-bold">
                  &rarr;
                </span>
              </a>
              <a
                href="#skills"
                onClick={(e) => handleNavClick(e, "#skills")}
                className="animate-menu-item-2 px-4 py-3 rounded-2xl text-neutral-800 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center justify-between"
              >
                <span>Skills & Technologies</span>
                <span className="text-xs text-neutral-400 font-bold">
                  &rarr;
                </span>
              </a>
              <a
                href="#projects"
                onClick={(e) => handleNavClick(e, "#projects")}
                className="animate-menu-item-3 px-4 py-3 rounded-2xl text-neutral-800 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center justify-between"
              >
                <span>Featured Projects</span>
                <span className="text-xs text-neutral-400 font-bold">
                  &rarr;
                </span>
              </a>
              <a
                href="#certificates"
                onClick={(e) => handleNavClick(e, "#certificates")}
                className="animate-menu-item-4 px-4 py-3 rounded-2xl text-neutral-800 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center justify-between"
              >
                <span>Certificates</span>
                <span className="text-xs text-neutral-400 font-bold">
                  &rarr;
                </span>
              </a>
              <a
                href="#contact"
                onClick={(e) => handleNavClick(e, "#contact")}
                className="animate-menu-item-5 px-4 py-3 rounded-2xl text-neutral-800 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center justify-between"
              >
                <span>Contact Me</span>
                <span className="text-xs text-neutral-400 font-bold">
                  &rarr;
                </span>
              </a>

              {/* Look CV Action in Menu */}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setCvModalOpen(true);
                }}
                className="animate-menu-item-6 w-full px-5 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-neutral-950 font-bold shadow-lg shadow-amber-500/25 transition-transform active:scale-98 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2.5">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span>Look & Download CV</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/10 text-neutral-950 font-extrabold uppercase">
                  PDF
                </span>
              </button>
            </nav>

            {/* Mobile Auth Actions & Theme Switch */}
            <div className="pt-3 border-t border-black/[0.08] dark:border-white/[0.08] space-y-2">
              <ThemeToggle variant="row" />

              {isAuthenticated ? (
                <>
                  {authUser?.role === "admin" && (
                    <Link
                      to="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full py-3 px-4 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold text-xs text-center block shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <span>Admin Dashboard</span>
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-black/5 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 text-xs font-semibold transition-all text-center"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3 px-4 rounded-xl bg-black/5 dark:bg-white/10 text-neutral-800 dark:text-neutral-200 text-xs font-semibold text-center block transition-all"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-20 lg:space-y-24 py-8 sm:py-12">
        {/* HERO / PROFILE SECTION */}
        <section
          id="hero"
          className="relative pt-6 pb-12 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-14 rounded-3xl"
        >
          {/* Left Text Column */}
          <div className="flex-1 space-y-6 text-center lg:text-left z-10 w-full">
            {/* Modern Availability Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-900/80 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 shadow-lg shadow-emerald-500/10 backdrop-blur-xl animate-role-pill">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold tracking-wide uppercase">
                Full-Stack Developer
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight text-neutral-900 dark:text-white leading-[1.12] animate-hero-1">
              <span className="inline-flex items-center gap-3 font-extrabold text-neutral-800 dark:text-slate-100 animate-greeting-shimmer">
                Hi, I'm{" "}
                <span className="animate-hand-wave text-3xl sm:text-4xl lg:text-5xl drop-shadow-md">
                  👋
                </span>
              </span>{" "}
              <br className="hidden sm:inline" />
              <span className="relative inline-flex items-center gap-3 sm:gap-4 mt-2 sm:mt-3 flex-wrap">
                <span className="animate-name-gradient font-black text-4xl sm:text-5xl lg:text-6xl xl:text-7xl tracking-tight drop-shadow-sm">
                  {displayUser?.name || "Yorn Pheareak"}
                </span>
                <VerifiedBadge
                  size="2xl"
                  className="inline-block flex-shrink-0 drop-shadow-[0_0_14px_rgba(56,189,248,0.6)]"
                />
                {/* Ambient dynamic glow underneath */}
                <span
                  aria-hidden="true"
                  className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-amber-400/20 via-indigo-500/20 to-fuchsia-500/20 blur-3xl -z-10 animate-aurora-1"
                />
              </span>
            </h1>

            <p className="text-base sm:text-lg text-neutral-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal animate-hero-2">
              Welcome to my portfolio! Explore my latest completed projects,
              verified credentials, and technical skills below.
            </p>

            {/* Badges Info */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2 text-sm animate-hero-3">
              {displayUser?.email && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-md hover:border-amber-500/40 transition-all backdrop-blur-md group">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-500 dark:text-amber-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
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
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                    {displayUser.email}
                  </span>
                </div>
              )}

              {displayUser?.phone && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-md hover:border-emerald-500/40 transition-all backdrop-blur-md group">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
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
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                    {displayUser.phone}
                  </span>
                </div>
              )}

              {displayUser?.dob && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-md hover:border-purple-500/40 transition-all backdrop-blur-md group">
                  <div className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-500 dark:text-purple-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
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
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                    Born {formatDisplayDate(displayUser.dob)}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-4 animate-hero-4">
              <button
                type="button"
                onClick={() => setCvModalOpen(true)}
                className="relative group overflow-hidden px-6 sm:px-7 py-3.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-bold shadow-xl shadow-amber-500/25 hover:shadow-2xl hover:shadow-amber-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all text-sm sm:text-base flex items-center gap-3"
              >
                <div className="absolute inset-0 w-1/2 h-full bg-white/30 skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000" />
                <svg
                  className="w-4 h-4 group-hover:scale-110 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                <span>Look CV</span>
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-black/10 text-neutral-950">
                  PDF
                </span>
              </button>

              <a
                href="#projects"
                className="px-5 py-3.5 rounded-full bg-white/80 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 text-neutral-800 dark:text-white font-semibold border border-black/5 dark:border-white/10 hover:border-amber-400/50 transition-all hover:-translate-y-0.5 text-sm shadow-sm backdrop-blur-md"
              >
                View Projects
              </a>
              <a
                href="#certificates"
                className="px-5 py-3.5 rounded-full bg-white/80 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 text-neutral-700 dark:text-slate-200 font-semibold border border-black/5 dark:border-white/10 hover:border-amber-400/50 transition-all hover:-translate-y-0.5 text-sm shadow-sm backdrop-blur-md"
              >
                Certificates
              </a>
              <a
                href="#contact"
                className="px-5 py-3.5 rounded-full bg-transparent hover:bg-black/5 dark:hover:bg-white/10 text-neutral-600 dark:text-slate-300 hover:text-neutral-950 dark:hover:text-white font-semibold transition-all text-sm"
              >
                Contact Me &rarr;
              </a>
            </div>
          </div>

          {/* Right — Circular Floral Wreath Frame */}
          <div className="flex-shrink-0 z-10 animate-hero-avatar relative">
            <div className="relative group flex items-center justify-center">

              {/* Soft ambient floral glow */}
              <div className="absolute -inset-10 rounded-full bg-gradient-to-tr from-amber-200/20 via-emerald-200/15 to-sky-200/20 dark:from-amber-400/10 dark:via-emerald-400/10 dark:to-sky-400/10 blur-3xl opacity-70 group-hover:opacity-100 transition duration-700 pointer-events-none" />

              {/* Circular Floral Frame Avatar (Dynamic with backend photo & fallback) */}
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 lg:w-96 lg:h-96 xl:w-[26rem] xl:h-[26rem] flex items-center justify-center group-hover:scale-[1.02] transition-transform duration-500">
                {/* Dynamic photo clipped inside circular window */}
                <div className="absolute w-[68%] h-[68%] rounded-full overflow-hidden z-0 shadow-md">
                  {displayUser?.profile_image && !profileImgError ? (
                    <PortfolioImage
                      src={displayUser.profile_image}
                      alt={displayUser.name || "Profile"}
                      variant="profile"
                      priority={true}
                      onError={() => setProfileImgError(true)}
                      className="w-full h-full object-cover"
                      fallback={
                        <img
                          src="/profile-framed.png"
                          alt={displayUser?.name || "Profile"}
                          className="w-full h-full object-cover"
                        />
                      }
                    />
                  ) : (
                    <img
                      src="/profile-framed.png"
                      alt={displayUser?.name || "Profile"}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                {/* Floral Wreath Overlay on top */}
                <img
                  src="/floral-frame.png"
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10 select-none filter drop-shadow-lg"
                  loading="eager"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </section>

        {/* CV / RESUME TIMELINE SECTION (Directly after Banner UI) */}
        <section id="experience" className="relative pt-4 pb-8 space-y-10">
          <div className="border-b border-black/[0.08] dark:border-white/[0.08] pb-4 flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-300 text-xs font-bold mb-2">
                Resume & Profile
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                Work Experience, Skills & Education
              </h2>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
                Detailed breakdown from my official curriculum vitae
              </p>
            </div>
          </div>

          {/* Timeline Container */}
          <div className="relative border-l-2 border-amber-400/40 dark:border-amber-400/30 ml-4 sm:ml-6 pl-6 sm:pl-8 space-y-12">
            {/* 1. WORK EXPERIENCE */}
            <div className="relative group">
              {/* Timeline Icon Badge */}
              <div className="absolute -left-[43px] sm:-left-[51px] top-0 w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-400 text-neutral-950 font-bold flex items-center justify-center shadow-lg shadow-amber-400/25 ring-4 ring-white dark:ring-[#070b14] group-hover:scale-110 transition-transform">
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
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>

              <div className="p-6 sm:p-7 rounded-3xl bg-white/80 dark:bg-white/[0.04] backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-sm hover:border-amber-400/50 transition-all duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/5 dark:border-white/10 pb-4 mb-4">
                  <div>
                    <span className="text-xs uppercase font-extrabold tracking-wider text-amber-500 dark:text-amber-300">
                      Work Experience
                    </span>
                    <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mt-0.5">
                      Technical Support & Sales Specialist
                    </h3>
                    <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">
                      Pov Thyda Phone Shop | Phnom Penh
                    </p>
                  </div>
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-300 text-xs font-bold self-start sm:self-center border border-amber-500/20">
                    Feb 2024 – Present
                  </div>
                </div>

                <ul className="space-y-3 text-sm text-neutral-600 dark:text-neutral-300">
                  <li className="flex items-start gap-2.5">
                    <span className="text-amber-500 font-bold mt-0.5">•</span>
                    <span>
                      Manage device diagnostics, cross-platform data migration,
                      and mobile operating system troubleshooting for diverse
                      client devices.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-amber-500 font-bold mt-0.5">•</span>
                    <span>
                      Provide direct technical support to users, resolving
                      application configuration, network connectivity, and
                      hardware issues.
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* 2. TECHNICAL SKILLS & PROFICIENCY */}
            <div className="relative group">
              {/* Timeline Icon Badge */}
              <div className="absolute -left-[43px] sm:-left-[51px] top-0 w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-400 text-neutral-950 font-bold flex items-center justify-center shadow-lg shadow-amber-400/25 ring-4 ring-white dark:ring-[#070b14] group-hover:scale-110 transition-transform">
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
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
              </div>

              <div className="p-6 sm:p-7 rounded-3xl bg-white/80 dark:bg-white/[0.04] backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-sm hover:border-amber-400/50 transition-all duration-300 space-y-6">
                <div className="border-b border-black/5 dark:border-white/10 pb-4">
                  <span className="text-xs uppercase font-extrabold tracking-wider text-amber-500 dark:text-amber-300">
                    Core Competencies
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mt-0.5">
                    Technical Skills Overview
                  </h3>
                </div>

                {/* Categorized Skills Grid */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                    <h4 className="font-bold text-xs uppercase text-amber-600 dark:text-amber-300 tracking-wide mb-1.5">
                      Frontend
                    </h4>
                    <p className="text-xs sm:text-sm font-medium text-neutral-800 dark:text-neutral-200">
                      Vue.js, React.js, JavaScript, HTML, CSS, Tailwind CSS,
                      Bootstrap.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                    <h4 className="font-bold text-xs uppercase text-amber-600 dark:text-amber-300 tracking-wide mb-1.5">
                      Backend & APIs
                    </h4>
                    <p className="text-xs sm:text-sm font-medium text-neutral-800 dark:text-neutral-200">
                      Node.js (In Progress), Express.js (In Progress), PHP,
                      RESTful APIs
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                    <h4 className="font-bold text-xs uppercase text-amber-600 dark:text-amber-300 tracking-wide mb-1.5">
                      Databases
                    </h4>
                    <p className="text-xs sm:text-sm font-medium text-neutral-800 dark:text-neutral-200">
                      MySQL, PostgreSQL.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                    <h4 className="font-bold text-xs uppercase text-amber-600 dark:text-amber-300 tracking-wide mb-1.5">
                      Tools & Technologies
                    </h4>
                    <p className="text-xs sm:text-sm font-medium text-neutral-800 dark:text-neutral-200">
                      Git, GitHub, Vercel, C / C++ / OOP.
                    </p>
                  </div>
                </div>

                {/* Technical Proficiency Breakdown */}
                <div className="pt-2">
                  <h4 className="font-bold text-base text-neutral-900 dark:text-white mb-3">
                    Technical Proficiency & Focus Areas
                  </h4>
                  <div className="space-y-3 text-sm text-neutral-600 dark:text-neutral-300">
                    <div className="p-3.5 rounded-2xl bg-white/50 dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
                      <strong className="text-neutral-900 dark:text-white font-semibold">
                        Clean & Beautiful User Interfaces:
                      </strong>{" "}
                      Passionate about crafting visually appealing, modern, and
                      intuitive user interfaces that deliver exceptional user
                      experiences across all digital touchpoints.
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white/50 dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
                      <strong className="text-neutral-900 dark:text-white font-semibold">
                        Fully Responsive Web Development:
                      </strong>{" "}
                      Expert in designing and building fully responsive websites
                      that adapt seamlessly to any screen size—from mobile
                      phones and tablets to desktop monitors—ensuring optimal
                      layout consistency and accessibility.
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white/50 dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
                      <strong className="text-neutral-900 dark:text-white font-semibold">
                        Modern Styling Frameworks:
                      </strong>{" "}
                      Proficient in leveraging Tailwind CSS and Bootstrap to
                      create fast-loading, clean, and pixel-perfect layouts with
                      custom styling and animations.
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white/50 dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
                      <strong className="text-neutral-900 dark:text-white font-semibold">
                        Framework Mastery:
                      </strong>{" "}
                      Strong hands-on experience building dynamic,
                      component-driven single-page applications (SPAs) using
                      Vue.js and React.js.
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white/50 dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
                      <strong className="text-neutral-900 dark:text-white font-semibold">
                        Server-Side Development:
                      </strong>{" "}
                      Actively expanding backend engineering expertise in
                      building scalable server-side applications using Node.js
                      PHP and Express.js (In Progress).
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. EDUCATION */}
            <div className="relative group">
              {/* Timeline Icon Badge */}
              <div className="absolute -left-[43px] sm:-left-[51px] top-0 w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-400 text-neutral-950 font-bold flex items-center justify-center shadow-lg shadow-amber-400/25 ring-4 ring-white dark:ring-[#070b14] group-hover:scale-110 transition-transform">
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
                    d="M12 14l9-5-9-5-9 5 9 5z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                  />
                </svg>
              </div>

              <div className="p-6 sm:p-7 rounded-3xl bg-white/80 dark:bg-white/[0.04] backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-sm hover:border-amber-400/50 transition-all duration-300">
                <div className="border-b border-black/5 dark:border-white/10 pb-4 mb-4">
                  <span className="text-xs uppercase font-extrabold tracking-wider text-amber-500 dark:text-amber-300">
                    Education
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mt-0.5">
                    National University of Management (NUM)
                  </h3>
                  <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">
                    Phnom Penh, Cambodia
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <p className="text-sm sm:text-base font-semibold text-neutral-800 dark:text-neutral-200">
                    Bachelor's Degree in Information Technology
                  </p>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-300 text-xs font-bold self-start sm:self-center border border-amber-500/20">
                    Current (4th-Year Student)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ABOUT & SKILLS SUMMARY */}
        <section
          id="about"
          ref={revealAboutRef}
          className={`scroll-mt-24 sm:scroll-mt-28 space-y-8 reveal reveal-up reveal-slow ${isAboutVisible ? "visible" : ""}`}
        >
          <div className="border-b border-slate-200/80 dark:border-slate-800/80 pb-4 flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-2">
                Overview
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                About & Overview
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                Background, full-stack development, and professional summaries
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div
              className="relative p-6 sm:p-7 rounded-3xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 group hover:-translate-y-1 reveal reveal-scale reveal-delay-1"
              style={{
                opacity: isAboutVisible ? 1 : 0,
                transform: isAboutVisible ? "none" : "scale(0.88)",
                filter: isAboutVisible ? "none" : "blur(4px)",
                transitionProperty: "opacity, transform, filter",
                transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                transitionDuration: "700ms",
                transitionDelay: "80ms",
              }}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600/20 via-cyan-500/20 to-indigo-600/20 border border-blue-500/30 text-blue-500 dark:text-blue-400 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-blue-500/25 transition-all">
                <svg
                  className="w-7 h-7"
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
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                Full-Stack Architecture
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Building responsive frontend user interfaces, robust REST APIs,
                secure authentication workflows, and scalable relational
                database schemas.
              </p>
            </div>

            <div
              className="relative p-6 sm:p-7 rounded-3xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 group hover:-translate-y-1"
              style={{
                opacity: isAboutVisible ? 1 : 0,
                transform: isAboutVisible
                  ? "none"
                  : "scale(0.88) translateY(24px)",
                transitionProperty: "opacity, transform",
                transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                transitionDuration: "700ms",
                transitionDelay: "200ms",
              }}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600/20 via-purple-500/20 to-pink-600/20 border border-indigo-500/30 text-indigo-500 dark:text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-indigo-500/25 transition-all">
                <svg
                  className="w-7 h-7"
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
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                Projects & Deliverables
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                {projects.length > 0
                  ? `Featuring ${projects.length} curated project${projects.length > 1 ? "s" : ""} built with modern frameworks and practical full-stack integrations.`
                  : "Continuous development of modern web applications and real-world tools."}
              </p>
            </div>

            <div
              className="relative p-6 sm:p-7 rounded-3xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 group hover:-translate-y-1"
              style={{
                opacity: isAboutVisible ? 1 : 0,
                transform: isAboutVisible
                  ? "none"
                  : "scale(0.88) translateY(24px)",
                transitionProperty: "opacity, transform",
                transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                transitionDuration: "700ms",
                transitionDelay: "320ms",
              }}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600/20 via-pink-500/20 to-fuchsia-600/20 border border-purple-500/30 text-purple-500 dark:text-purple-400 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-purple-500/25 transition-all">
                <svg
                  className="w-7 h-7"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors">
                Certified & Verified
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                {certificates.length > 0
                  ? `Holds ${certificates.length} completed course certification${certificates.length > 1 ? "s" : ""} validating web development and software principles.`
                  : "Committed to ongoing education, certifications, and technical mastery."}
              </p>
            </div>
          </div>

          {/* Quick CV Highlight Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-purple-50/90 dark:from-[#0f172a]/90 dark:via-[#1e1b4b]/60 dark:to-[#1e1b4b]/80 border border-blue-200/80 dark:border-indigo-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl backdrop-blur-xl">
            <div className="flex items-center gap-5 text-center md:text-left">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 flex-shrink-0">
                <svg
                  className="w-7 h-7"
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
                <h4 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Looking for my Full Curriculum Vitae?
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
                  Detailed background, technical proficiency, NUM academic
                  education, and contact references.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => setCvModalOpen(true)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2 hover:scale-[1.03] active:scale-100"
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
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                <span>Look CV</span>
              </button>
              <a
                href="/Yorn_Pheareak_CV.pdf"
                download="Yorn_Pheareak_CV.pdf"
                className="px-5 py-3 rounded-xl bg-white/90 hover:bg-white dark:bg-slate-900/90 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 shadow-sm hover:scale-[1.03]"
              >
                <svg
                  className="w-4 h-4 text-blue-500"
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
                <span>Download PDF</span>
              </a>
            </div>
          </div>
        </section>

        {/* TECHNICAL SKILLS SECTION */}
        <section
          id="skills"
          ref={revealSkillsRef}
          className={`scroll-mt-24 sm:scroll-mt-28 space-y-8 reveal reveal-up ${isSkillsVisible ? "visible" : ""}`}
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-2">
                Technical Expertise
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Skills & Technologies
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                Languages, frameworks, databases, and development tools with
                proficiency levels.
              </p>
            </div>

            {/* Category Filter Pills (Apple-Grade Rounded Pills) */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSelectedSkillCategory("all")}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  selectedSkillCategory === "all"
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-md"
                    : "bg-white/80 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-300 border border-black/5 dark:border-white/10"
                }`}
              >
                All ({skills.length})
              </button>

              {skills.some((s) => s.is_featured) && (
                <button
                  onClick={() => setSelectedSkillCategory("featured")}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                    selectedSkillCategory === "featured"
                      ? "bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/25"
                      : "bg-white/80 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-300 border border-black/5 dark:border-white/10"
                  }`}
                >
                  ★ Featured
                </button>
              )}

              {skillCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedSkillCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                    selectedSkillCategory === cat
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-md"
                      : "bg-white/80 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-300 border border-black/5 dark:border-white/10"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-neutral-400 bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl rounded-3xl border border-black/5 dark:border-white/10">
              <div className="w-8 h-8 mx-auto mb-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p>Loading skills...</p>
            </div>
          ) : filteredSkills.length === 0 ? (
            <div className="p-12 text-center text-neutral-400 bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl rounded-3xl border border-black/5 dark:border-white/10">
              <p className="text-neutral-600 dark:text-slate-300">
                No skills found in this category.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
              {filteredSkills.map((skill, index) => (
                <div
                  key={skill.id}
                  className="portfolio-scroll-card portfolio-reveal-item p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-white/[0.04] backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] hover:border-amber-400/60 dark:hover:border-amber-400/50 hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-300 group flex flex-col justify-between hover:-translate-y-1"
                  style={{
                    opacity: isSkillsVisible ? 1 : 0,
                    transform: isSkillsVisible
                      ? "none"
                      : "translateY(32px) scale(0.95)",
                    transitionProperty: "opacity, transform",
                    transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                    transitionDuration: "600ms",
                    transitionDelay: `${Math.min(index * 70, 420)}ms`,
                  }}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 sm:gap-3 mb-2 sm:mb-3 min-w-0">
                      {skill.icon ? (
                        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-amber-500/10 dark:bg-white/10 border border-amber-500/20 dark:border-white/10 p-1.5 sm:p-2 flex items-center justify-center shadow-sm flex-shrink-0 group-hover:scale-105 group-hover:border-amber-400/60 transition-all duration-300">
                          <PortfolioImage
                            src={skill.icon}
                            alt={skill.name}
                            className="w-full h-full max-w-[24px] max-h-[24px] sm:max-w-[28px] sm:max-h-[28px] object-contain"
                            fallback={
                              <span className="text-amber-500 font-bold text-xs sm:text-sm">
                                {skill.name?.charAt(0)}
                              </span>
                            }
                          />
                        </div>
                      ) : (
                        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-amber-500/10 dark:bg-white/10 border border-amber-500/20 dark:border-white/10 text-amber-500 flex items-center justify-center font-bold text-xs sm:text-sm shadow-sm flex-shrink-0">
                          {skill.name?.charAt(0)}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 truncate max-w-full">
                            {skill.category}
                          </span>
                          {skill.is_featured && (
                            <span className="text-[9px] sm:text-[10px] font-bold px-1 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 flex-shrink-0">
                              ★
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-neutral-900 dark:text-white text-xs sm:text-sm mt-0.5 group-hover:text-amber-500 dark:group-hover:text-amber-300 transition-colors truncate">
                          {skill.name}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 sm:mt-3 pt-2.5 sm:pt-3 border-t border-black/5 dark:border-white/10">
                    <div className="flex items-center justify-between text-[11px] sm:text-xs mb-1.5">
                      <span className="text-neutral-500 dark:text-neutral-400 font-medium">
                        Proficiency
                      </span>
                      <span className="font-extrabold text-amber-500 dark:text-yellow-300 font-mono">
                        {skill.percentage || 80}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 sm:h-2 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden p-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 rounded-full transition-all duration-1000 ease-out shadow-sm"
                        style={{
                          width: isSkillsVisible
                            ? `${skill.percentage || 80}%`
                            : "0%",
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* PROJECTS SECTION */}
        <section
          id="projects"
          ref={revealProjectsRef}
          className={`scroll-mt-24 sm:scroll-mt-28 space-y-8 reveal reveal-up ${isProjectsVisible ? "visible" : ""}`}
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-2">
                Portfolio Showcase
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Featured Projects
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                Real-world web applications, production systems, and engineering
                work.
              </p>
            </div>

            {/* Tech Stack Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSelectedTech("all")}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  selectedTech === "all"
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-md"
                    : "bg-white/80 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-300 border border-black/5 dark:border-white/10"
                }`}
              >
                All ({projects.length})
              </button>

              {projects.some((p) => p.is_featured) && (
                <button
                  onClick={() => setSelectedTech("featured")}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                    selectedTech === "featured"
                      ? "bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/25"
                      : "bg-white/80 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-300 border border-black/5 dark:border-white/10"
                  }`}
                >
                  ★ Featured
                </button>
              )}

              {allTechStacks.map((tech) => (
                <button
                  key={tech}
                  onClick={() => setSelectedTech(tech)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                    selectedTech === tech
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-md"
                      : "bg-white/80 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-300 border border-black/5 dark:border-white/10"
                  }`}
                >
                  {tech}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 mx-auto mb-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p>Loading projects...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-slate-800">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-slate-400 dark:text-slate-600"
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
              <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
                No projects found in this category.
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Check back soon or select "All" to view available projects.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project, index) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  index={index}
                  isRevealed={isProjectsVisible}
                  onSelect={handleSelectProject}
                />
              ))}
            </div>
          )}
        </section>

        {/* CERTIFICATES SECTION */}
        <section
          id="certificates"
          ref={revealCertsRef}
          className={`scroll-mt-24 sm:scroll-mt-28 space-y-8 reveal reveal-up ${isCertsVisible ? "visible" : ""}`}
        >
          <div className="border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-semibold mb-2">
              Credentials
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Certifications & Courses
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Verified certifications, academy achievements, and completed
              training courses.
            </p>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 mx-auto mb-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p>Loading certificates...</p>
            </div>
          ) : certificates.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-slate-800">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-slate-400 dark:text-slate-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138z"
                />
              </svg>
              <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
                No certificates published yet.
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Completed certificates will appear here.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {certificates.map((cert, index) => (
                <CertificateCard
                  key={cert.id}
                  cert={cert}
                  index={index}
                  isRevealed={isCertsVisible}
                  onSelect={handleSelectCertificate}
                />
              ))}
            </div>
          )}
        </section>

        {/* CONTACT SECTION (100% Smartphone Responsive) */}
        <section
          id="contact"
          ref={revealContactRef}
          className={`scroll-mt-24 sm:scroll-mt-28 reveal reveal-scale-up ${isContactVisible ? "visible" : ""}`}
        >
          <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white/90 via-slate-50/80 to-amber-50/30 dark:from-[#0b1120]/90 dark:via-[#111827]/85 dark:to-[#1e1b4b]/80 border border-black/[0.06] dark:border-white/[0.08] p-4 sm:p-8 lg:p-12 relative overflow-hidden shadow-2xl backdrop-blur-xl">
            <div className="absolute top-0 right-0 w-72 sm:w-96 h-72 sm:h-96 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-72 sm:w-96 h-72 sm:h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 grid md:grid-cols-2 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12">
              {/* Left Column: Direct Info & Quick Copy */}
              <div className="md:col-span-1 lg:col-span-5 space-y-4 sm:space-y-6">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-300 text-xs font-bold">
                  Get In Touch
                </div>

                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-neutral-900 dark:text-white tracking-tight leading-tight">
                  Let's Build Something Great Together
                </h2>

                <p className="text-neutral-600 dark:text-neutral-300 text-xs sm:text-base leading-relaxed">
                  Have a project inquiry, job opportunity, or question? Send a
                  message directly or connect through email and phone.
                </p>

                {/* Direct Contact Cards */}
                <div className="space-y-3 pt-1">
                  {displayUser?.email && (
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-white/80 dark:bg-white/[0.04] border border-black/5 dark:border-white/10 hover:border-amber-400/50 flex items-center justify-between gap-2.5 group transition-all shadow-sm backdrop-blur-md min-w-0">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-300 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                          <svg
                            className="w-4 h-4 sm:w-5 sm:h-5"
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
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                            Email Address
                          </p>
                          <p className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white truncate">
                            {displayUser.email}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopy(displayUser.email, "email")}
                        className="px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-neutral-800 dark:text-neutral-200 text-[11px] font-bold flex-shrink-0 transition-colors border border-black/5 dark:border-white/10"
                      >
                        {copiedField === "email" ? "✓ Copied!" : "Copy"}
                      </button>
                    </div>
                  )}

                  {displayUser?.phone && (
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-white/80 dark:bg-white/[0.04] border border-black/5 dark:border-white/10 hover:border-emerald-500/50 flex items-center justify-between gap-2.5 group transition-all shadow-sm backdrop-blur-md min-w-0">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                          <svg
                            className="w-4 h-4 sm:w-5 sm:h-5"
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
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                            Phone / Telegram
                          </p>
                          <p className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white truncate">
                            {displayUser.phone}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopy(displayUser.phone, "phone")}
                        className="px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-neutral-800 dark:text-neutral-200 text-[11px] font-bold flex-shrink-0 transition-colors border border-black/5 dark:border-white/10"
                      >
                        {copiedField === "phone" ? "✓ Copied!" : "Copy"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Interactive Send Message Form */}
              <div className="md:col-span-1 lg:col-span-7 bg-white/90 dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl backdrop-blur-xl min-w-0">
                {contactSubmitted ? (
                  <div className="text-center py-8 space-y-4 animate-in zoom-in-95 duration-300">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                      <svg
                        className="w-7 h-7"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">
                      Message Sent Successfully!
                    </h3>
                    <p className="text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
                      Thank you for reaching out. Your message has been recorded
                      and I will respond to your email shortly!
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setContactSubmitted(false);
                        setContactApiError("");
                      }}
                      className="px-5 py-2.5 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-neutral-800 dark:text-neutral-200 text-xs font-bold transition-all mt-4 border border-black/5 dark:border-white/10"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={handleContactSubmit}
                    className="space-y-4 sm:space-y-5"
                  >
                    <h3 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white mb-2">
                      Send a Message
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1.5">
                          Your Name
                        </label>
                        <input
                          type="text"
                          value={contactForm.name}
                          onFocus={handleContactFocus}
                          onChange={(e) => {
                            setContactForm({
                              ...contactForm,
                              name: e.target.value,
                            });
                            if (contactErrors.name)
                              setContactErrors({ ...contactErrors, name: "" });
                          }}
                          placeholder="John Doe"
                          className={`w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl sm:rounded-2xl bg-black/5 dark:bg-white/5 text-neutral-900 dark:text-white border focus:outline-none ${
                            contactErrors.name
                              ? "border-red-500 focus:ring-red-500 bg-red-500/5"
                              : "border-black/10 dark:border-white/10 focus:border-amber-400"
                          }`}
                        />
                        {contactErrors.name && (
                          <p className="text-red-500 text-[11px] mt-1 font-medium">
                            ⚠ {contactErrors.name}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1.5">
                          Your Email
                        </label>
                        <input
                          type="email"
                          value={contactForm.email}
                          onFocus={handleContactFocus}
                          onChange={(e) => {
                            setContactForm({
                              ...contactForm,
                              email: e.target.value,
                            });
                            if (contactErrors.email)
                              setContactErrors({ ...contactErrors, email: "" });
                          }}
                          placeholder="john@example.com"
                          className={`w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl sm:rounded-2xl bg-black/5 dark:bg-white/5 text-neutral-900 dark:text-white border focus:outline-none ${
                            contactErrors.email
                              ? "border-red-500 focus:ring-red-500 bg-red-500/5"
                              : "border-black/10 dark:border-white/10 focus:border-amber-400"
                          }`}
                        />
                        {contactErrors.email && (
                          <p className="text-red-500 text-[11px] mt-1 font-medium">
                            ⚠ {contactErrors.email}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1.5">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={contactForm.subject}
                        onFocus={handleContactFocus}
                        onChange={(e) => {
                          setContactForm({
                            ...contactForm,
                            subject: e.target.value,
                          });
                          if (contactErrors.subject)
                            setContactErrors({ ...contactErrors, subject: "" });
                        }}
                        placeholder="Project Discussion / Collaboration"
                        className={`w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl sm:rounded-2xl bg-black/5 dark:bg-white/5 text-neutral-900 dark:text-white border focus:outline-none ${
                          contactErrors.subject
                            ? "border-red-500 focus:ring-red-500 bg-red-500/5"
                            : "border-black/10 dark:border-white/10 focus:border-amber-400"
                        }`}
                      />
                      {contactErrors.subject && (
                        <p className="text-red-500 text-[11px] mt-1 font-medium">
                          ⚠ {contactErrors.subject}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1.5">
                        Your Message
                      </label>
                      <textarea
                        rows={3}
                        value={contactForm.message}
                        onFocus={handleContactFocus}
                        onChange={(e) => {
                          setContactForm({
                            ...contactForm,
                            message: e.target.value,
                          });
                          if (contactErrors.message)
                            setContactErrors({ ...contactErrors, message: "" });
                        }}
                        placeholder="Hi, I would like to discuss a project..."
                        className={`w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl sm:rounded-2xl bg-black/5 dark:bg-white/5 text-neutral-900 dark:text-white border focus:outline-none ${
                          contactErrors.message
                            ? "border-red-500 focus:ring-red-500 bg-red-500/5"
                            : "border-black/10 dark:border-white/10 focus:border-amber-400"
                        }`}
                      />
                      {contactErrors.message && (
                        <p className="text-red-500 text-[11px] mt-1 font-medium">
                          ⚠ {contactErrors.message}
                        </p>
                      )}
                    </div>

                    {contactApiError && (
                      <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-medium">
                        <span className="flex-shrink-0 mt-0.5">⚠</span>
                        <span>{contactApiError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={sendingMessage}
                      className="w-full min-h-touch py-3.5 px-6 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-bold shadow-xl shadow-amber-500/25 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 transition-all text-xs sm:text-sm flex items-center justify-center gap-2"
                    >
                      {sendingMessage ? (
                        <>
                          <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
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
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#070b14]/90 backdrop-blur-xl py-12 sm:py-16 pb-safe-bottom text-center text-slate-500 dark:text-slate-400 text-sm transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col items-center justify-center gap-5 text-center">
          {/* Centered Action Links */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 text-xs font-semibold text-neutral-600 dark:text-neutral-300">
            <button
              type="button"
              onClick={() => setCvModalOpen(true)}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-400/20 via-yellow-400/20 to-amber-500/20 border border-amber-400/30 text-amber-600 dark:text-amber-300 hover:scale-105 transition-all font-bold shadow-sm"
            >
              Look CV
            </button>
            <a
              href="#hero"
              onClick={(e) => handleNavClick(e, "#hero")}
              className="px-4 py-2 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 hover:text-slate-900 dark:hover:text-white transition-all"
            >
              Back to top &uarr;
            </a>
            {!isAuthenticated && (
              <Link
                to="/login"
                className="px-4 py-2 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 hover:text-amber-600 dark:hover:text-amber-400 transition-all text-neutral-600 dark:text-neutral-400"
              >
                Admin Sign In
              </Link>
            )}
          </div>

          {/* Centered Copyright & Verified Name */}
          <p className="flex items-center justify-center gap-1.5 flex-wrap text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            <span>&copy; {new Date().getFullYear()}</span>
            <VerifiedName
              name={displayUser?.name || "Yorn Pheareak"}
              badgeSize="xs"
              nameClassName="font-bold text-slate-800 dark:text-slate-200"
            />
            <span>. All rights reserved.</span>
          </p>
        </div>
      </footer>

      {/* PROJECT DETAILS MODAL (READ-ONLY) */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedProject(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
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
                    className="w-full max-h-72 object-cover rounded-xl border border-slate-200 dark:border-slate-800"
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
                            className="w-full h-20 object-cover rounded-lg border border-slate-200 dark:border-slate-800"
                          />
                        ))}
                    </div>
                  )}
                </div>
              )}

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {selectedProject.title}
                </h3>
                {selectedProject.is_featured && (
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-xs font-bold">
                    Featured
                  </span>
                )}
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-sm mt-3 whitespace-pre-line leading-relaxed">
                {selectedProject.description}
              </p>
            </div>

            {selectedProject.tech_stack &&
              selectedProject.tech_stack.length > 0 && (
                <div>
                  <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mb-2">
                    Technologies Used
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.tech_stack.map((tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 text-xs font-medium border border-slate-200 dark:border-slate-700"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {selectedProject.links && selectedProject.links.length > 0 && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mb-3">
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedCertificate(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
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
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-black">
                <PortfolioImage
                  src={selectedCertificate.image}
                  alt={selectedCertificate.course}
                  variant="certificate"
                  className="w-full max-h-96 object-contain"
                />
              </div>
            )}

            <div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                {selectedCertificate.course}
              </h3>
              {selectedCertificate.instructor && (
                <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mt-1">
                  Issued by / Instructor: {selectedCertificate.instructor}
                </p>
              )}
              {selectedCertificate.issued_on && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Date: {formatDisplayDate(selectedCertificate.issued_on)}
                </p>
              )}
              <p className="text-slate-600 dark:text-slate-300 text-sm mt-4 whitespace-pre-line leading-relaxed">
                {selectedCertificate.description ||
                  "Certificate of completion."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CURRICULUM VITAE (CV) VIEWER & DOWNLOAD MODAL */}
      {cvModalOpen && (
        <Suspense fallback={null}>
          <CvModal
            isOpen={cvModalOpen}
            onClose={() => setCvModalOpen(false)}
            user={displayUser}
          />
        </Suspense>
      )}
    </div>
  );
};

export default Home;
