import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PortfolioImage from "./PortfolioImage";
import VerifiedBadge, { VerifiedName } from "./VerifiedBadge";

const DashboardNav = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navLinks = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/projects", label: "Projects" },
    { to: "/certificates", label: "Certificates" },
    { to: "/skills", label: "Skills" },
    { to: "/profile", label: "Profile" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/80 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* User Info / Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            {user?.profile_image ? (
              <PortfolioImage
                src={user.profile_image}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/50 shadow-md shadow-blue-500/20"
                fallback={
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md text-sm">
                    {user?.name?.charAt(0)?.toUpperCase() || "A"}
                  </div>
                }
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md text-sm">
                {user?.name?.charAt(0)?.toUpperCase() || "A"}
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 z-10 ring-2 ring-slate-900 rounded-full">
              <VerifiedBadge size="xs" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <VerifiedName
                name={user?.name || "Yorn Pheareak"}
                badgeSize="md"
                nameClassName="font-bold text-sm text-white"
              />
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400">
                {user?.role || "Admin"}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono truncate max-w-[150px] sm:max-w-[200px]">
              {user?.email}
            </p>
          </div>
        </div>

        {/* Desktop Navigation Actions */}
        <nav className="hidden md:flex items-center gap-1.5 sm:gap-2">
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold hover:bg-blue-500 hover:text-white transition-all flex items-center gap-1.5 shadow-sm hover:shadow-blue-500/25"
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
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            <span>Live Portfolio</span>
          </Link>

          {navLinks.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-slate-800 text-white border border-slate-700 shadow-inner"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          <button
            onClick={handleLogout}
            className="ml-1 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white text-xs font-semibold transition-all"
            title="Logout"
          >
            Logout
          </button>
        </nav>

        {/* Mobile Hamburger Toggle Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 focus:outline-none transition-all"
          aria-label="Toggle Dashboard Menu"
        >
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

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 px-4 pt-2 pb-6 space-y-3 shadow-2xl animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col space-y-1 text-sm font-medium">
            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3.5 py-2.5 rounded-xl bg-blue-500/10 text-blue-400 font-semibold text-xs flex items-center justify-between"
            >
              <span>View Live Portfolio</span>
              <span>&nearr;</span>
            </Link>

            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${
                    isActive
                      ? "bg-slate-800 text-white border border-slate-700"
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <span>{link.label}</span>
                  <span className="text-slate-500">&rarr;</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white text-xs font-semibold transition-all text-center"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default DashboardNav;
