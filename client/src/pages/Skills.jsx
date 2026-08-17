import { useEffect, useState } from "react";
import api from "../api/axios";
import DashboardNav from "../components/DashboardNav";
import ConfirmModal from "../components/ConfirmModal";
import Toast from "../components/Toast";

const emptyForm = {
  name: "",
  category: "Backend",
  percentage: 80,
  level: "Advanced",
  color: "#3B82F6",
  icon: "",
  is_featured: true,
  display_order: 0,
};

const CATEGORIES = ["Backend", "Frontend", "Database", "Tools", "Other"];
const LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];

const Skills = () => {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ type: "success", message: "" });

  const [form, setForm] = useState(emptyForm);
  const [validationErrors, setValidationErrors] = useState({});
  const [editingId, setEditingId] = useState(null);

  // Delete Confirm Modal State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/skills/my");
      setSkills(data.skills || []);
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to load skills",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const validate = () => {
    const errors = {};
    if (!form.name.trim()) {
      errors.name = "Skill name is required";
    } else if (form.name.trim().length < 2) {
      errors.name = "Skill name must be at least 2 characters";
    }
    if (form.percentage < 0 || form.percentage > 100) {
      errors.percentage = "Percentage must be between 0 and 100";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setValidationErrors({});
  };

  const startEdit = (skill) => {
    setEditingId(skill.id);
    setValidationErrors({});
    setForm({
      name: skill.name || "",
      category: skill.category || "Backend",
      percentage: skill.percentage ?? 80,
      level: skill.level || "Advanced",
      color: skill.color || "#3B82F6",
      icon: skill.icon || "",
      is_featured: skill.is_featured ?? true,
      display_order: skill.display_order ?? 0,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);

    try {
      if (editingId) {
        await api.put(`/skills/${editingId}`, form);
        setToast({ type: "success", message: `Skill "${form.name}" updated successfully!` });
      } else {
        await api.post("/skills", form);
        setToast({ type: "success", message: `Skill "${form.name}" created successfully!` });
      }

      resetForm();
      fetchSkills();
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to save skill",
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await api.delete(`/skills/${deleteTarget.id}`);
      setToast({
        type: "success",
        message: `Skill "${deleteTarget.name}" deleted successfully`,
      });
      setDeleteTarget(null);
      fetchSkills();
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to delete skill",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white">
      <DashboardNav />

      {/* Toast Notification */}
      <Toast
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ type: "success", message: "" })}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Skill"
        message={`Are you sure you want to permanently remove "${deleteTarget?.name}" from your portfolio skills?`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        isDanger={true}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Skills Management
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Add, edit, and organize your technical skills and proficiency percentages.
            </p>
          </div>
          <span className="self-start sm:self-auto px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            {skills.length} Total Skills
          </span>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Create / Edit Form */}
          <div className="lg:col-span-5 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl h-fit">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              {editingId ? "Edit Skill" : "Add New Skill"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Skill Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Node.js, React, PostgreSQL"
                  className={`w-full px-4 py-3 bg-slate-950/60 border rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 transition-all ${
                    validationErrors.name
                      ? "border-red-500/80 focus:ring-red-500 bg-red-500/5"
                      : "border-slate-800 focus:ring-blue-500 focus:border-transparent"
                  }`}
                  required
                />
                {validationErrors.name && (
                  <p className="text-red-400 text-xs mt-1 font-medium flex items-center gap-1">
                    <span>⚠</span> {validationErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Category
                </label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-slate-900 text-white">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Icon (SVG / Image URL)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="url"
                    name="icon"
                    value={form.icon}
                    onChange={handleChange}
                    placeholder="https://cdn.jsdelivr.net/.../logo.svg"
                    className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  {form.icon && (
                    <div className="w-11 h-11 p-1.5 rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-center flex-shrink-0">
                      <img src={form.icon} alt="" className="w-full h-full object-contain" />
                    </div>
                  )}
                </div>

                {/* Quick Icon Presets */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "Node.js", url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" },
                    { label: "Express", url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg" },
                    { label: "React", url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" },
                    { label: "JS", url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg" },
                    { label: "Postgres", url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg" },
                    { label: "Tailwind", url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg" },
                    { label: "HTML5", url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg" },
                    { label: "Git", url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg" },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, icon: preset.url }))}
                      className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-800 hover:bg-blue-600 hover:text-white border border-slate-700 text-slate-300 transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Proficiency Percentage
                  </label>
                  <span className="text-sm font-extrabold text-blue-400 font-mono">
                    {form.percentage}%
                  </span>
                </div>
                <input
                  type="range"
                  name="percentage"
                  min="0"
                  max="100"
                  value={form.percentage}
                  onChange={handleChange}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Level
                  </label>
                  <select
                    name="level"
                    value={form.level}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl} className="bg-slate-900 text-white">
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Order
                  </label>
                  <input
                    type="number"
                    name="display_order"
                    value={form.display_order}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_featured"
                  name="is_featured"
                  checked={form.is_featured}
                  onChange={handleChange}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="is_featured" className="text-xs text-slate-300 font-medium">
                  Featured (Highlight on portfolio)
                </label>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-blue-500/25 disabled:opacity-60 transition-all text-sm"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Skill"
                      : "Add Skill"}
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-3 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Skills List */}
          <div className="lg:col-span-7 space-y-4">
            {loading ? (
              <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl text-slate-400">
                <div className="w-8 h-8 mx-auto border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
                <p>Loading skills...</p>
              </div>
            ) : skills.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl text-slate-500">
                No skills added yet. Fill out the form to add your first skill!
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {skills.map((skill) => (
                  <div
                    key={skill.id}
                    className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between group transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-3">
                          {skill.icon ? (
                            <div className="w-10 h-10 p-1.5 rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                              <img src={skill.icon} alt={skill.name} className="w-full h-full object-contain" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold flex items-center justify-center flex-shrink-0">
                              {skill.name?.charAt(0)}
                            </div>
                          )}

                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                {skill.category}
                              </span>
                              {skill.is_featured && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  ★
                                </span>
                              )}
                            </div>
                            <h3 className="text-base font-bold text-white mt-1 group-hover:text-blue-400 transition-colors">
                              {skill.name}
                            </h3>
                          </div>
                        </div>

                        <span className="text-base font-extrabold text-blue-400 font-mono">
                          {skill.percentage}%
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden my-3 border border-slate-800">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${skill.percentage}%` }}
                        />
                      </div>

                      <p className="text-xs text-slate-400">
                        Level: <span className="font-semibold text-slate-200">{skill.level || "Advanced"}</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-slate-800/80">
                      <button
                        onClick={() => startEdit(skill)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(skill)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Skills;
