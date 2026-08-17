import { useEffect, useState } from "react";
import api from "../api/axios";
import DashboardNav from "../components/DashboardNav";
import ConfirmModal from "../components/ConfirmModal";
import Toast from "../components/Toast";
import { compressImageFile } from "../utils/imageCompressor";

const emptyForm = {
  course: "",
  instructor: "",
  description: "",
  issued_on: "",
  image: "",
};

const Certificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState({ type: "success", message: "" });

  const [form, setForm] = useState(emptyForm);
  const [validationErrors, setValidationErrors] = useState({});
  const [editingId, setEditingId] = useState(null);

  // Delete Confirm Modal State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/certificates/my");
      setCertificates(data.certificates || []);
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to load certificates",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const validate = () => {
    const errors = {};
    if (!form.course.trim()) {
      errors.course = "Course / Certificate name is required";
    } else if (form.course.trim().length < 3) {
      errors.course = "Course name must be at least 3 characters";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const uploadImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const compressedDataUrl = await compressImageFile(file, 1000, 800, 0.85);

      setForm((prev) => ({
        ...prev,
        image: compressedDataUrl,
      }));

      setToast({ type: "success", message: "Certificate image processed & added!" });
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
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setSaving(true);

    try {
      const payload = {
        course: form.course.trim(),
        instructor: form.instructor.trim(),
        description: form.description.trim(),
        issued_on: form.issued_on || null,
        image: form.image || null,
      };

      if (editingId) {
        await api.put(`/certificates/${editingId}`, payload);
        setToast({ type: "success", message: `Certificate "${form.course}" updated successfully!` });
      } else {
        await api.post("/certificates", payload);
        setToast({ type: "success", message: `Certificate "${form.course}" created successfully!` });
      }

      resetForm();
      fetchCertificates();
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to save certificate",
      });
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (cert) => {
    setEditingId(cert.id);
    setValidationErrors({});
    setForm({
      course: cert.course || "",
      instructor: cert.instructor || "",
      description: cert.description || "",
      issued_on: cert.issued_on ? cert.issued_on.split("T")[0] : "",
      image: cert.image || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await api.delete(`/certificates/${deleteTarget.id}`);
      setToast({
        type: "success",
        message: `Certificate "${deleteTarget.course}" deleted successfully`,
      });
      setDeleteTarget(null);
      fetchCertificates();
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to delete certificate",
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
        title="Delete Certificate"
        message={`Are you sure you want to permanently delete "${deleteTarget?.course}"?`}
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
              Certificates Management
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Upload credentials, completed course certificates, and achievement records.
            </p>
          </div>
          <span className="self-start sm:self-auto px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-semibold">
            {certificates.length} Total Certificates
          </span>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Create / Edit Form */}
          <div className="lg:col-span-5 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl h-fit">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              {editingId ? "Edit Certificate" : "Add New Certificate"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Course / Certificate Name
                </label>
                <input
                  type="text"
                  name="course"
                  value={form.course}
                  onChange={handleChange}
                  placeholder="e.g. Full Stack Web Development"
                  className={`w-full px-4 py-3 bg-slate-950/60 border rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 transition-all ${
                    validationErrors.course
                      ? "border-red-500/80 focus:ring-red-500 bg-red-500/5"
                      : "border-slate-800 focus:ring-purple-500 focus:border-transparent"
                  }`}
                  required
                />
                {validationErrors.course && (
                  <p className="text-red-400 text-xs mt-1 font-medium flex items-center gap-1">
                    <span>⚠</span> {validationErrors.course}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Instructor / Organization
                </label>
                <input
                  type="text"
                  name="instructor"
                  value={form.instructor}
                  onChange={handleChange}
                  placeholder="e.g. Programming Academy / Coursera"
                  className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Issued Date
                </label>
                <input
                  type="date"
                  name="issued_on"
                  value={form.issued_on}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Key concepts learned and verified skills..."
                  className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Certificate Image
                </label>
                <div className="space-y-2">
                  <label className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-dashed border-slate-700 bg-slate-950/40 hover:bg-slate-950 hover:border-purple-500 text-slate-400 hover:text-purple-400 text-xs font-semibold cursor-pointer transition-all">
                    <span>{uploading ? "Uploading..." : "📁 Upload Certificate Image"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={uploadImage}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                  {form.image && (
                    <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-3">
                      <img
                        src={form.image}
                        alt="Preview"
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <span className="text-xs text-slate-400 truncate flex-1 font-mono">
                        {form.image}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-purple-500/25 disabled:opacity-60 transition-all text-sm"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Certificate"
                      : "Add Certificate"}
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

          {/* Certificates List */}
          <div className="lg:col-span-7 space-y-4">
            {loading ? (
              <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl text-slate-400">
                <div className="w-8 h-8 mx-auto border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-3" />
                <p>Loading certificates...</p>
              </div>
            ) : certificates.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl text-slate-500">
                No certificates added yet. Add your certificates using the form!
              </div>
            ) : (
              <div className="space-y-4">
                {certificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 shadow-lg flex flex-col md:flex-row gap-5 justify-between group transition-all"
                  >
                    {cert.image && (
                      <div className="w-full md:w-44 h-32 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex-shrink-0">
                        <img
                          src={cert.image}
                          alt={cert.course}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}

                    <div className="flex-1 space-y-2">
                      <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">
                        {cert.course}
                      </h3>

                      {cert.instructor && (
                        <p className="text-xs text-purple-400 font-semibold">
                          {cert.instructor}
                        </p>
                      )}

                      {cert.issued_on && (
                        <p className="text-xs text-slate-500 font-mono">
                          Issued: {new Date(cert.issued_on).toLocaleDateString()}
                        </p>
                      )}

                      <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">
                        {cert.description || "No description provided."}
                      </p>

                      <div className="flex items-center gap-2 pt-3 border-t border-slate-800/80">
                        <button
                          onClick={() => startEdit(cert)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteTarget(cert)}
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

export default Certificates;
