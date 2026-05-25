import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * NameConflictModal
 *
 * A blocking modal that appears when a candidate with the same email already
 * exists in the database but with a different name. It does NOT close on
 * outside click or Escape — the user must make an explicit choice.
 *
 * Props
 * -----
 * oldName      {string}   Name currently stored in DB
 * newName      {string}   Name extracted from the newly uploaded resume
 * email        {string}   Candidate email (display only)
 * onResolve    {function} Called with { resolvedName, keepOld }
 *                         resolvedName = the final name to use
 *                         keepOld      = true if old name is kept
 * onDismiss    {function} Called if user explicitly closes (no resolution possible
 *                         here — we force a resolution, so this is unused but
 *                         provided for flexibility)
 */
const NameConflictModal = ({ oldName, newName, email, onResolve }) => {
  // 'first'  — "Update name from oldName to newName?"
  // 'second' — "Keep old or merge new into old?"
  const [screen, setScreen] = useState('first');
  const [outsideClickError, setOutsideClickError] = useState(false);
  const cardRef = useRef(null);

  // Prevent body scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Prevent Escape key from closing
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') e.preventDefault(); };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, []);

  const handleOverlayClick = (e) => {
    // If click landed outside the card, show inline error
    if (cardRef.current && !cardRef.current.contains(e.target)) {
      setOutsideClickError(true);
      // Auto-dismiss the error hint after 3 s
      setTimeout(() => setOutsideClickError(false), 3000);
    }
  };

  // ── Screen 1 handlers ───────────────────────────────────────────────────
  const handleYesUpdate = () => {
    onResolve({ resolvedName: newName, keepOld: false });
  };

  const handleNoKeepOld = () => {
    setOutsideClickError(false);
    setScreen('second');
  };

  // ── Screen 2 handlers ───────────────────────────────────────────────────
  const handleBack = () => {
    setOutsideClickError(false);
    setScreen('first');
  };

  const handleMergeOk = () => {
    // "Merge" = keep old name but still submit under the existing candidate
    onResolve({ resolvedName: oldName, keepOld: true });
  };

  return createPortal(
    <div
      id="name-conflict-modal-overlay"
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onMouseDown={handleOverlayClick}
    >
      <div
        ref={cardRef}
        id="name-conflict-modal-card"
        className="relative bg-surface rounded-2xl shadow-2xl border border-border-strong w-full max-w-md mx-4 overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header accent stripe */}
        <div className="h-1 w-full bg-gradient-to-r from-warning via-primary to-accent-hover" />

        <div className="p-6">
          {/* Icon + title */}
          <div className="flex items-start gap-4 mb-5">
            <div className="w-10 h-10 rounded-full bg-warning/10 border border-warning/20 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-warning text-xl">person_alert</span>
            </div>
            <div>
              <h3 className="font-title-page text-title-page text-text-primary leading-tight">
                {screen === 'first' ? 'Name Mismatch Detected' : 'Confirm Name to Use'}
              </h3>
              <p className="text-[12px] text-text-muted mt-0.5">
                {email}
              </p>
            </div>
          </div>

          {/* ── Screen 1 ── */}
          {screen === 'first' && (
            <>
              <div className="bg-surface-container rounded-xl p-4 mb-5 space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-label-caps text-text-muted uppercase w-20 flex-shrink-0">In Database</span>
                  <span className="font-body-bold text-text-primary bg-surface-container-highest px-3 py-1 rounded-lg border border-border-subtle">
                    {oldName}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-label-caps text-text-muted uppercase w-20 flex-shrink-0">From Resume</span>
                  <span className="font-body-bold text-primary bg-accent-soft px-3 py-1 rounded-lg border border-primary/20">
                    {newName}
                  </span>
                </div>
              </div>

              <p className="text-body-standard text-text-secondary mb-5">
                A candidate with this email already exists under a different name. Would you like to update the stored name to the one found in this resume?
              </p>

              <div className="flex gap-3">
                <button
                  id="name-conflict-no-btn"
                  onClick={handleNoKeepOld}
                  className="flex-1 py-2.5 rounded-lg border border-border-strong text-text-primary font-body-bold hover:bg-surface-container-low transition-all text-sm"
                >
                  No, Keep Old Name
                </button>
                <button
                  id="name-conflict-yes-btn"
                  onClick={handleYesUpdate}
                  className="flex-1 py-2.5 rounded-lg bg-primary text-on-primary font-body-bold hover:bg-accent-hover transition-all text-sm flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  Yes, Update Name
                </button>
              </div>
            </>
          )}

          {/* ── Screen 2 ── */}
          {screen === 'second' && (
            <>
              <div className="bg-surface-container rounded-xl p-4 mb-5 text-sm">
                <p className="text-text-secondary mb-3">
                  The resume name <span className="font-body-bold text-primary">{newName}</span> will be merged into the existing record and saved under the original name:
                </p>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-text-muted text-[18px]">badge</span>
                  <span className="font-body-bold text-text-primary">{oldName}</span>
                </div>
              </div>

              <p className="text-body-standard text-text-secondary mb-5">
                Click <strong>OK</strong> to proceed with the original name, or <strong>Back</strong> to reconsider.
              </p>

              <div className="flex gap-3">
                <button
                  id="name-conflict-back-btn"
                  onClick={handleBack}
                  className="flex-1 py-2.5 rounded-lg border border-border-strong text-text-primary font-body-bold hover:bg-surface-container-low transition-all text-sm flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                  Back
                </button>
                <button
                  id="name-conflict-ok-btn"
                  onClick={handleMergeOk}
                  className="flex-1 py-2.5 rounded-lg bg-primary text-on-primary font-body-bold hover:bg-accent-hover transition-all text-sm"
                >
                  OK, Use Old Name
                </button>
              </div>
            </>
          )}

          {/* Outside-click error banner */}
          {outsideClickError && (
            <div
              id="name-conflict-outside-error"
              className="mt-4 flex items-center gap-2 bg-danger-soft border border-danger/20 rounded-lg px-3 py-2.5 text-danger text-[12px] font-body-bold animate-in fade-in duration-200"
            >
              <span className="material-symbols-outlined text-[16px]">error</span>
              Please select an option above to continue — this dialog requires a decision.
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default NameConflictModal;
