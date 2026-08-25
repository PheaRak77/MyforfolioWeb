import { useEffect, useState } from "react";
import api from "../api/axios";
import DashboardNav from "../components/DashboardNav";
import ConfirmModal from "../components/ConfirmModal";
import Toast from "../components/Toast";
import { uploadMediaImage } from "../utils/imageUploader";
import {
  hasLegacyProjectImages,
  keepPermanentImages,
} from "../utils/projectImages";
import PortfolioImage from "../components/PortfolioImage";
import { clearPublicDataCache } from "../utils/publicDataCache";

const emptyForm = {
  title: "",
  description: "",
  tech_stack: "",
  images: [],
  is_featured: false,
};

const emptyLink = {
  label: "",
  url: "",
};

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState({ type: "success", message: "" });

  const [form, setForm] = useState(emptyForm);
  const [validationErrors, setValidationErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [links, setLinks] = useState([{ ...emptyLink }]);

  // Delete Confirm Modal State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/projects/my");
      setProjects(data.projects || []);
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to load projects",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const validate = () => {
    const errors = {};
    if (!form.title.trim()) {
      errors.title = "Project title is required";
    } else if (form.title.trim().length < 3) {
      errors.title = "Project title must be at least 3 characters";
    }
    if (!form.description.trim()) {
      errors.description = "Description is required";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleLinkChange = (index, field, value) => {
    setLinks((prev) =>
      prev.map((link, i) =>
        i === index ? { ...link, [field]: value } : link,
      ),
    );
  };

  const addLink = () => {
    setLinks((prev) => [...prev, { ...emptyLink }]);
  };

  const removeLink = (index) => {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const result = await uploadMediaImage(file, "/uploads/project-image", {
        maxWidth: 1200,
        maxHeight: 900,
        quality: 0.85,
      });

      setForm((prev) => {
        const kept = keepPermanentImages(prev.images);
        return {
          ...prev,
          images: [...kept, result.url],
        };
      });

      const msg =
        result.provider === "cloudinary"
          ? "Project image uploaded to Cloudinary CDN!"
          : "Image saved — click Update Project to publish!";
      setToast({
        type: "success",
        message: msg,
      });
    } catch (err) {
      setToast({
        type: "error",
        message: err.message || "Image processing failed",
      });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setValidationErrors({});
    setLinks([{ ...emptyLink }]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setSaving(true);

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        tech_stack: form.tech_stack
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        images: form.images,
        links: links.filter((link) => link.label && link.url),
        is_featured: form.is_featured,
      };

      if (editingId) {
        await api.put(`/projects/${editingId}`, payload);
        setToast({ type: "success", message: `Project "${form.title}" updated successfully!` });
      } else {
        await api.post("/projects", payload);
        setToast({ type: "success", message: `Project "${form.title}" published successfully!` });
      }

      resetForm();
      clearPublicDataCache();
      fetchProjects();
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to save project",
      });
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (project) => {
    setEditingId(project.id);
    setValidationErrors({});
    const images = keepPermanentImages(project.images);
    setForm({
      title: project.title || "",
      description: project.description || "",
      tech_stack: (project.tech_stack || []).join(", "),
      images,
      is_featured: project.is_featured || false,
    });
    if (hasLegacyProjectImages(project.images)) {
      setToast({
        type: "error",
        message: `"${project.title}" had broken images — please re-upload screenshots below.`,
      });
    }
    setLinks(project.links?.length ? project.links : [{ ...emptyLink }]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await api.delete(`/projects/${deleteTarget.id}`);
      setToast({
        type: "success",
        message: `Project "${deleteTarget.title}" deleted successfully`,
      });
      setDeleteTarget(null);
      clearPublicDataCache();
      fetchProjects();
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to delete project",
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
        title="Delete Project"
        message={`Are you sure you want to permanently delete "${deleteTarget?.title}"? All images and links associated with it will be removed.`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        isDanger={true}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Projects Management
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Create, edit, and publish your portfolio project showcases.
            </p>
          </div>
          <span className="self-start sm:self-auto px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
            {projects.length} Total Projects
          </span>
        </div>

        {(form.images.length === 0 && editingId) ||
        hasLegacyProjectImages(projects.flatMap((p) => p.images)) ? (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm">
            <strong>Action required:</strong> Some project images were stored on Render&apos;s temporary disk and were lost after a server restart.
            Edit each project and re-upload images — new uploads are saved permanently in the database.
          </div>
        ) : null}

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Create / Edit Form */}
          <div className="lg:col-span-5 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl h-fit">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              {editingId ? "Edit Project" : "Create New Project"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Project Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. AI Hand Gesture Recognition"
                  className={`w-full px-4 py-3 bg-slate-950/60 border rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 transition-all ${
                    validationErrors.title
                      ? "border-red-500/80 focus:ring-red-500 bg-red-500/5"
                      : "border-slate-800 focus:ring-blue-500 focus:border-transparent"
                  }`}
                  required
                />
                {validationErrors.title && (
                  <p className="text-red-400 text-xs mt-1 font-medium flex items-center gap-1">
                    <span>⚠</span> {validationErrors.title}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Describe what this project does and key highlights..."
                  className={`w-full px-4 py-3 bg-slate-950/60 border rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 transition-all ${
                    validationErrors.description
                      ? "border-red-500/80 focus:ring-red-500 bg-red-500/5"
                      : "border-slate-800 focus:ring-blue-500 focus:border-transparent"
                  }`}
                />
                {validationErrors.description && (
                  <p className="text-red-400 text-xs mt-1 font-medium flex items-center gap-1">
                    <span>⚠</span> {validationErrors.description}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Tech Stack (comma separated)
                </label>
                <input
                  type="text"
                  name="tech_stack"
                  value={form.tech_stack}
                  onChange={handleChange}
                  placeholder="React, Node.js, PostgreSQL, Tailwind"
                  className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Project Images
                </label>
                <div className="space-y-2">
                  <label className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-dashed border-slate-700 bg-slate-950/40 hover:bg-slate-950 hover:border-blue-500 text-slate-400 hover:text-blue-400 text-xs font-semibold cursor-pointer transition-all">
                    <span>{uploading ? "Uploading Image..." : "📁 Upload Screenshot / Image"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={uploadImage}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                  {form.images.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {form.images.map((img, idx) => (
                        <div
                          key={idx}
                          className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 h-24"
                        >
                          <PortfolioImage
                            src={img}
                            alt={`Preview ${idx + 1}`}
                            variant="project"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                images: prev.images.filter((_, i) => i !== idx),
                              }))
                            }
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500/90 text-white text-xs font-bold"
                            title="Remove image"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-slate-500">
                    {form.images.length} image{form.images.length !== 1 ? "s" : ""} ready
                    {form.images.some((img) => img.startsWith("data:"))
                      ? " (stored permanently in database)"
                      : ""}
                  </p>
                </div>
              </div>

              {/* Links Management */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Live Demo / GitHub Links
                  </label>
                  <button
                    type="button"
                    onClick={addLink}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    + Add Link
                  </button>
                </div>

                <div className="space-y-2">
                  {links.map((link, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Label (e.g. GitHub)"
                        value={link.label}
                        onChange={(e) => handleLinkChange(index, "label", e.target.value)}
                        className="w-1/3 px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="url"
                        placeholder="https://..."
                        value={link.url}
                        onChange={(e) => handleLinkChange(index, "url", e.target.value)}
                        className="flex-1 px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {links.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLink(index)}
                          className="px-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
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
                  ★ Highlight as Featured Project
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
                      ? "Update Project"
                      : "Publish Project"}
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

          {/* Projects List */}
          <div className="lg:col-span-7 space-y-4">
            {loading ? (
              <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl text-slate-400">
                <div className="w-8 h-8 mx-auto border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
                <p>Loading projects...</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl text-slate-500">
                No projects added yet. Create your first project using the form on the left!
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 shadow-lg flex flex-col md:flex-row gap-5 justify-between group transition-all"
                  >
                    {project.images && project.images.length > 0 && (
                      <div className="w-full md:w-44 h-32 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex-shrink-0">
                        <PortfolioImage
                          src={project.images[0]}
                          alt={project.title}
                          variant="project"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          fallback={
                            <div className="w-full h-full flex items-center justify-center text-xs text-amber-400 p-2 text-center">
                              Re-upload image
                            </div>
                          }
                        />
                      </div>
                    )}

                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                          {project.title}
                        </h3>
                        {project.is_featured && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-bold">
                            ★ Featured
                          </span>
                        )}
                      </div>

                      <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">
                        {project.description || "No description provided."}
                      </p>

                      {project.tech_stack && project.tech_stack.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {project.tech_stack.map((tech) => (
                            <span
                              key={tech}
                              className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px] font-medium border border-slate-700/60"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}

                      {project.links && project.links.length > 0 && (
                        <div className="flex flex-wrap gap-3 pt-1">
                          {project.links.map((link, idx) => (
                            <a
                              key={idx}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1"
                            >
                              <span>{link.label} &rarr;</span>
                            </a>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-3 border-t border-slate-800/80">
                        <button
                          onClick={() => startEdit(project)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteTarget(project)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                        >
                          Delete
                        </button>
                      </div>
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

export default Projects;
