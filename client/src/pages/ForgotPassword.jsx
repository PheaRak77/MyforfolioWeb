import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

const ForgotPassword = () => {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resetLink, setResetLink] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setResetLink(null);
    setLoading(true);

    try {
      const { data } = await api.post("/auth/forgot-password", {
        identifier: identifier.trim(),
        email: identifier.trim(),
      });

      setMessage(
        data.message || "Password reset instructions generated successfully."
      );

      if (data.resetLink) {
        setResetLink(data.resetLink);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to generate password reset request."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden selection:bg-blue-600 selection:text-white">
      {/* Ambient Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Back Link */}
      <div className="w-full max-w-md mb-6 z-10">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400 transition-colors font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Login
        </Link>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Forgot Password?
          </h1>
          <p className="text-slate-400 text-sm mt-1.5 leading-relaxed">
            Enter your registered email or phone to reset your password
          </p>
        </div>

        {/* Success Alert */}
        {message && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm space-y-3">
            <div className="flex items-center gap-2 font-medium">
              <span>✓</span>
              <span>{message}</span>
            </div>
            {resetLink && (
              <div className="pt-2 border-t border-emerald-500/20">
                <p className="text-xs text-slate-300 mb-2">Click below to proceed to password reset:</p>
                <a
                  href={resetLink}
                  className="block w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl text-center shadow-md transition-all"
                >
                  Reset Password Now &rarr;
                </a>
              </div>
            )}
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2.5">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Email or Phone Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                  />
                </svg>
              </div>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter email or phone"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-semibold shadow-lg shadow-blue-500/25 hover:from-blue-500 hover:to-purple-500 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 transition-all duration-200 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generating Request...</span>
              </>
            ) : (
              <span>Request Password Reset</span>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-slate-400">
          Remember your password?{" "}
          <Link to="/login" className="text-blue-400 font-semibold hover:text-blue-300 transition-colors">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
