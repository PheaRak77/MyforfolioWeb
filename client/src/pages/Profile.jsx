import { useEffect, useState } from "react";
import api from "../api/axios";
import DashboardNav from "../components/DashboardNav";
import { useAuth } from "../context/AuthContext";
import { compressImageFile } from "../utils/imageCompressor";

const Profile = () => {
  const { user, updateUser } = useAuth();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    dob: "",
    profile_image: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        phone: user.phone || "",
        dob: user.dob ? user.dob.split("T")[0] : "",
        profile_image: user.profile_image || "",
      });
    }
  }, [user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const uploadImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError("");
      // Compress to lightweight square avatar data URL (max 500x500, quality 0.85)
      const compressedDataUrl = await compressImageFile(file, 500, 500, 0.85);

      setForm((prev) => ({
        ...prev,
        profile_image: compressedDataUrl,
      }));

      setMessage("Avatar image updated! Click 'Save Profile' to apply changes.");
    } catch (err) {
      setError(err.message || "Image processing failed");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const { data } = await api.put("/users/profile", {
        ...form,
        dob: form.dob || null,
      });

      updateUser(data.user);
      setMessage("Profile updated successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white">
      <DashboardNav />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Profile Settings
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Customize your developer profile name, avatar photo, and contact details.
            </p>
          </div>
          <span className="self-start sm:self-auto px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            {user?.role} Account
          </span>
        </div>

        {/* Alerts */}
        {message && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium flex items-center gap-2">
            <span>✓</span> {message}
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-center gap-2">
            <span>⚠</span> {error}
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Section */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
                Profile Avatar
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="relative">
                  {form.profile_image ? (
                    <img
                      src={form.profile_image}
                      alt="Profile preview"
                      className="w-24 h-24 rounded-full object-cover ring-4 ring-blue-500/30 shadow-xl"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-3xl font-extrabold text-white shadow-xl">
                      {form.name?.charAt(0)?.toUpperCase() || "A"}
                    </div>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-all">
                    <span>{uploading ? "Uploading..." : "📷 Choose New Photo"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={uploadImage}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-slate-500">
                    Recommended: Square JPG, PNG, or WebP. Max 5MB.
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Fields */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Email (Read-only)
                </label>
                <input
                  type="text"
                  value={user?.email || ""}
                  disabled
                  className="w-full px-4 py-3 bg-slate-950/30 border border-slate-800/60 rounded-xl text-slate-400 text-sm cursor-not-allowed font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="e.g. 0885775771"
                  className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dob"
                  value={form.dob}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="py-3 px-8 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold shadow-lg shadow-blue-500/25 disabled:opacity-60 transition-all text-sm flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <span>Save Profile</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Profile;
