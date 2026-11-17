import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import DashboardNav from "../components/DashboardNav";
import ConfirmModal from "../components/ConfirmModal";
import Toast from "../components/Toast";

const DATE_FORMATTER = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState({ type: "success", message: "" });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/contact/messages");
      setMessages(data.messages || []);
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to load contact messages",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const filteredMessages = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return messages;
    return messages.filter(
      (msg) =>
        msg.name?.toLowerCase().includes(query) ||
        msg.email?.toLowerCase().includes(query) ||
        msg.subject?.toLowerCase().includes(query) ||
        msg.message?.toLowerCase().includes(query),
    );
  }, [messages, search]);

  const handleCopyEmail = (email) => {
    navigator.clipboard.writeText(email);
    setToast({ type: "info", message: `Copied ${email}` });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/contact/messages/${deleteTarget.id}`);
      setMessages((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setToast({
        type: "success",
        message: `Deleted message from "${deleteTarget.name}"`,
      });
      setDeleteTarget(null);
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to delete message",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white">
      <DashboardNav />

      <Toast
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ type: "success", message: "" })}
      />

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Message"
        message={`Are you sure you want to permanently delete the message from "${deleteTarget?.name}"?`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Visitor Messages
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Read and reply to messages sent through your portfolio contact form.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
              {messages.length} {messages.length === 1 ? "Message" : "Messages"}
            </span>
            <button
              type="button"
              onClick={fetchMessages}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by sender name, email, subject, or message..."
            className="w-full px-4 py-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Messages List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-36 rounded-2xl bg-slate-900/70 border border-slate-800 animate-pulse"
              />
            ))}
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-12 text-center space-y-2">
            <p className="text-lg font-bold text-white">
              {messages.length === 0 ? "No messages yet" : "No matching messages"}
            </p>
            <p className="text-sm text-slate-400">
              {messages.length === 0
                ? "When visitors submit the Send a Message form on your portfolio, their messages will appear here."
                : "Try adjusting your search keywords."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMessages.map((msg) => {
              const formattedDate = msg.created_at
                ? DATE_FORMATTER.format(new Date(msg.created_at))
                : "";
              const mailtoHref = `mailto:${msg.email}?subject=${encodeURIComponent(
                `Re: ${msg.subject || "Portfolio Inquiry"}`,
              )}`;

              return (
                <article
                  key={msg.id}
                  className="rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 p-5 sm:p-6 space-y-4 shadow-lg transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h2 className="text-lg font-bold text-white">{msg.subject}</h2>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <span className="font-semibold text-slate-200">{msg.name}</span>
                        <span>&bull;</span>
                        <button
                          type="button"
                          onClick={() => handleCopyEmail(msg.email)}
                          title="Copy email address"
                          className="text-blue-400 hover:text-blue-300 font-mono transition-colors"
                        >
                          {msg.email}
                        </button>
                      </div>
                    </div>

                    {formattedDate && (
                      <span className="text-xs text-slate-500 font-mono flex-shrink-0">
                        {formattedDate}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
                    {msg.message}
                  </p>

                  <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleCopyEmail(msg.email)}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
                    >
                      Copy Email
                    </button>
                    <a
                      href={mailtoHref}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-md shadow-blue-500/20"
                    >
                      Reply via Email
                    </a>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(msg)}
                      className="px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white text-xs font-semibold transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Messages;
