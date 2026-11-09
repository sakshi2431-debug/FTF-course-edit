import { useState } from "react";
import { staleCheckIds } from "../mock/checks";
import { dismissFinding, fixFinding, openFindings, runValidation } from "../mock/engine";
import { store, useAppState } from "../state/store";
import type { Finding } from "../state/types";
import { Icon } from "./Icon";

export function SeverityIcon({ severity }: { severity: Finding["severity"] }) {
  return severity === "blocking" ? (
    <span className="au-icon-blocking" />
  ) : (
    <Icon name="alert" className="au-note-icon" />
  );
}

/* Flag in content: border plus an icon and a text label, never colour alone. */
export function FlagLabel({ finding }: { finding: Finding }) {
  return (
    <p className={`au-flag-label ${finding.severity}`} data-testid="flag">
      <SeverityIcon severity={finding.severity} />
      {finding.flagLabel}
    </p>
  );
}

export function FindingCard({ finding }: { finding: Finding }) {
  const [why, setWhy] = useState(false);
  const blocking = finding.severity === "blocking";
  return (
    <div className={`check-row attention au-finding ${finding.severity}`} data-testid="finding" data-finding={finding.id}>
      <SeverityIcon severity={finding.severity} />
      <div className="check-text">
        <div className="check-title">
          {finding.title}
          <span className={`au-severity ${finding.severity}`}>
            {blocking ? "Blocking" : "Advisory"}
          </span>
        </div>
        <div className="check-description">{finding.explanation}</div>
        {finding.status === "fixed" && (
          <div className="au-fixed-note" data-testid="fixed-note">
            Fixed. Recheck to confirm.
          </div>
        )}
        {why && (
          <div className="au-why" role="status" data-testid="why-blocking">
            Blocking issues can't be dismissed, because learners would hit this
            problem. Fix it to publish.
          </div>
        )}
      </div>
      <div className="au-finding-actions">
        <button
          type="button"
          className="fix-button"
          aria-label={`Fix ${finding.title}: ${finding.flagLabel}`}
          onClick={() => fixFinding(finding.id)}
        >
          Fix
        </button>
        <button
          type="button"
          className="au-link"
          aria-label={`Dismiss ${finding.title}: ${finding.flagLabel}`}
          aria-disabled={blocking}
          onClick={() => (blocking ? setWhy(true) : dismissFinding(finding.id))}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

/* Count by severity, plus previous and next. Shown while working through findings. */
export function FindingsNavigator() {
  const state = useAppState();
  const open = openFindings(state);
  const flag = state.ui.flag;
  if (!flag) return null;
  const index = open.findIndex((f) => f.id === flag.findingId);
  const blocking = open.filter((f) => f.severity === "blocking").length;
  const advisory = open.length - blocking;
  const stale = staleCheckIds(state.course, state.validation.signatures);
  const go = (delta: number) => {
    if (!open.length) return;
    const next = open[(index + delta + open.length) % open.length];
    fixFinding(next.id);
  };
  return (
    <nav className="au-navigator" aria-label="Findings" data-testid="navigator">
      <span className="au-nav-counts">
        <span className="au-severity blocking">{blocking} blocking</span>
        <span className="au-severity advisory">{advisory} advisory</span>
      </span>
      <span className="au-nav-position" data-testid="navigator-position">
        {index >= 0 ? `${index + 1} of ${open.length}` : `${open.length} open`}
      </span>
      <button type="button" className="button small" disabled={open.length < 2} onClick={() => go(-1)}>
        Previous
      </button>
      <button type="button" className="button small" disabled={open.length < 2} onClick={() => go(1)}>
        Next
      </button>
      {stale.length > 0 && (
        <button
          type="button"
          className="button small"
          onClick={() => {
            store.set((s) => ({ ...s, ui: { ...s.ui, step: "validate", flag: null } }));
            runValidation(stale);
          }}
        >
          Recheck
        </button>
      )}
      <button
        type="button"
        className="button small"
        onClick={() => store.set((s) => ({ ...s, ui: { ...s.ui, step: "validate", flag: null } }))}
      >
        Back to checks
      </button>
    </nav>
  );
}
