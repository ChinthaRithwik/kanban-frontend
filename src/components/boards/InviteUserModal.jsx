import { useState, useEffect, useRef } from "react";
import { X, Mail, Loader2 } from "lucide-react";
import { inviteUser } from "../../api/boardApi";
import { useToast } from "../../context/ToastContext";

/**
 * InviteUserModal
 *
 * Props:
 *  - isOpen       {boolean}          – controls visibility
 *  - onClose      {() => void}        – called when the modal should close
 *  - boardId      {number}           – target board id
 *  - onSuccess    {() => void}        – called after a successful invite
 */
const InviteUserModal = ({ isOpen, onClose, boardId, onSuccess }) => {
  const { success, error: toastError } = useToast();

  const [email, setEmail]       = useState("");
  const [loading, setLoading]   = useState(false);
  const inputRef                = useRef(null);

  /* Reset state + auto-focus input whenever the modal opens */
  useEffect(() => {
    if (isOpen) {
      setEmail("");
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  /* Close on Escape key */
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  /* ── Handlers ──────────────────────────────────────────────── */

  const handleInvite = async () => {
    const trimmed = email.trim();
    if (!trimmed) return;

    setLoading(true);
    try {
      await inviteUser(boardId, trimmed);
      success(`Invitation sent to ${trimmed}`);
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        "Failed to send invitation. Please try again.";
      toastError(typeof msg === "string" ? msg : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !loading && email.trim()) handleInvite();
  };

  /* ── Render ────────────────────────────────────────────────── */

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Panel – stop clicks propagating to overlay */}
      <div
        className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl p-6 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-800">Invite a team member</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Email field */}
        <div className="mb-5">
          <label
            htmlFor="invite-email"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Email address
          </label>
          <div className="relative">
            <Mail
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              id="invite-email"
              ref={inputRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              placeholder="colleague@example.com"
              className="
                w-full pl-9 pr-4 py-2.5 text-sm
                border border-gray-300 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent
                placeholder:text-gray-400
                disabled:bg-gray-50 disabled:text-gray-400
                transition
              "
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="
              px-4 py-2 text-sm font-medium rounded-lg
              text-gray-600 hover:bg-gray-100 active:bg-gray-200
              transition-colors disabled:opacity-50
            "
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleInvite}
            disabled={loading || !email.trim()}
            className="
              inline-flex items-center gap-2
              px-5 py-2 text-sm font-semibold rounded-lg
              bg-violet-600 hover:bg-violet-700 active:bg-violet-800
              text-white transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
              focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-1
            "
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Inviting…
              </>
            ) : (
              "Invite"
            )}
          </button>
        </div>
      </div>

      {/* Fade-in animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in { animation: fadeIn 0.2s ease-out; }
      `}</style>
    </div>
  );
};

export default InviteUserModal;
