import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

const ForgotPassword = () => {
  const navigate = useNavigate();

  // Step flow: "request" -> "verify" -> "reset"
  const [step, setStep] = useState("request");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resetLink, setResetLink] = useState(null);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setResetLink(null);
    setLoading(true);

    try {
      const cleanIdentifier = identifier.trim();
      const { data } = await api.post("/auth/forgot-password", {
        identifier: cleanIdentifier,
        email: cleanIdentifier,
      });

      setMessage(
        data.message ||
          "A 6-digit OTP verification code has been sent to your email."
      );
      if (data.resetLink) setResetLink(data.resetLink);
      setStep("verify");
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to send OTP verification code."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const cleanIdentifier = identifier.trim();
      const { data } = await api.post("/auth/forgot-password", {
        identifier: cleanIdentifier,
        email: cleanIdentifier,
      });
      setOtp("");
      setMessage(
        data.message || "A new 6-digit OTP code has been sent to your email."
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to resend OTP verification code."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const cleanOtp = otp.replace(/\D/g, "").slice(0, 6);
    if (cleanOtp.length !== 6) {
      setError("Please enter the 6-digit OTP code from your email.");
      return;
    }

    setLoading(true);
    try {
      const cleanIdentifier = identifier.trim();
      const { data } = await api.post("/auth/verify-otp", {
        identifier: cleanIdentifier,
        email: cleanIdentifier,
        otp: cleanOtp,
      });
      setOtp(cleanOtp);
      setMessage(data.message || "OTP verified! Set your new password below.");
      setStep("reset");
    } catch (err) {
      setError(
        err.response?.data?.message || "Invalid or expired OTP code."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const cleanIdentifier = identifier.trim();
      const { data } = await api.post("/auth/reset-password", {
        identifier: cleanIdentifier,
        email: cleanIdentifier,
        otp,
        newPassword,
      });
      setMessage(
        data.message || "Password reset successfully! Redirecting to login..."
      );
      setTimeout(() => navigate("/login"), 1600);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to update password. Please try again."
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
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[
            { id: "request", label: "1. Email" },
            { id: "verify", label: "2. OTP" },
            { id: "reset", label: "3. Password" },
          ].map((item) => {
            const active = step === item.id;
            return (
              <span
                key={item.id}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                  active
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                    : "bg-slate-800/80 text-slate-400"
                }`}
              >
                {item.label}
              </span>
            );
          })}
        </div>

        {/* Header */}
        <div className="text-center mb-7">
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
            {step === "request"
              ? "Forgot Password?"
              : step === "verify"
                ? "Verify OTP Code"
                : "Set New Password"}
          </h1>
          <p className="text-slate-400 text-sm mt-1.5 leading-relaxed">
            {step === "request"
              ? "Enter your registered email or phone to receive a 6-digit OTP code"
              : step === "verify"
                ? `Enter the 6-digit OTP code sent to your email (${identifier})`
                : "Create a strong new password for your account"}
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
                <a
                  href={resetLink}
                  className="block w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl text-center shadow-md transition-all"
                >
                  Open Reset Link &rarr;
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

        {/* Step 1: Request OTP */}
        {step === "request" && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
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
                  <span>Sending OTP Code...</span>
                </>
              ) : (
                <span>Send OTP Verification Code</span>
              )}
            </button>
          </form>
        )}

        {/* Step 2: Verify 6-Digit OTP */}
        {step === "verify" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                6-Digit OTP Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full py-3.5 px-4 bg-slate-950/70 border border-slate-700 rounded-xl text-center text-2xl font-mono font-extrabold tracking-[0.5em] text-sky-400 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="000000"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-semibold shadow-lg shadow-blue-500/25 hover:from-blue-500 hover:to-purple-500 disabled:opacity-60 transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying OTP...</span>
                </>
              ) : (
                <span>Verify OTP Code</span>
              )}
            </button>

            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={() => {
                  setStep("request");
                  setError("");
                  setMessage("");
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                &larr; Change Email/Phone
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                className="text-blue-400 hover:text-blue-300 font-semibold transition-colors disabled:opacity-50"
              >
                Resend OTP
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Set New Password */}
        {step === "reset" && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 pr-14 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  placeholder="Min. 6 characters"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Confirm New Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                placeholder="Repeat new password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-60 transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <span>Set New Password</span>
              )}
            </button>
          </form>
        )}

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
