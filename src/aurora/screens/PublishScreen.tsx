import React, { useState } from "react";
import { Banner } from "../components/Feedback";
import { Icon, type IconName } from "../components/Icon";
import { canContinueToPublish, publishCourse, submitForApproval } from "../mock/engine";
import { courseCounts } from "../state/reducer";
import { store, useAppState } from "../state/store";
import type { AppState } from "../state/types";

type Settings = AppState["publish"]["settings"];
const setSettings = (patch: Partial<Settings>) =>
  store.set((s) => ({
    ...s,
    publish: { ...s.publish, settings: { ...s.publish.settings, ...patch } },
  }));
const toPlan = () => store.dispatch({ type: "SET_STEP", step: "plan" });

function ReviewRow({ icon, title, description }: { icon: IconName; title: string; description: string }) {
  return (
    <div className="review-row">
      <span className="review-icon">
        <Icon name={icon} />
      </span>
      <div className="review-text">
        <div className="review-text-title">{title}</div>
        <div className="review-text-description">{description}</div>
      </div>
      <button
        type="button"
        className="button soft"
        aria-label={`Edit ${title}`}
        onClick={toPlan}
      >
        Edit
      </button>
    </div>
  );
}

function SettingRow({
  icon,
  title,
  summary,
  children,
}: {
  icon: IconName;
  title: string;
  summary: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="setting" data-setting={title}>
      <div className="setting-row">
        <Icon name={icon} />
        <div className="review-text">
          <div className="review-text-title">{title}</div>
          <div className="review-text-description" data-testid={`${title}-summary`}>
            {summary}
          </div>
        </div>
        <button
          type="button"
          className="button soft"
          aria-expanded={open}
          aria-label={`${open ? "Finish editing" : "Edit"} ${title}`}
          onClick={() => setOpen(!open)}
        >
          {open ? "Done" : "Edit"}
        </button>
      </div>
      {open && <div className="setting-panel">{children}</div>}
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="au-toggle-row">
      <div>
        <div className="au-toggle-label">{label}</div>
        <div className="au-muted">{description}</div>
      </div>
      <button
        type="button"
        role="switch"
        className={`au-toggle ${checked ? "on" : ""}`}
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
      >
        <span />
      </button>
    </div>
  );
}

function Success() {
  const state = useAppState();
  const submitted = state.publish.status === "submitted";
  const live = state.live;
  return (
    <div className="au-placeholder au-success" data-testid="publish-success">
      <Icon name="readyCheck" />
      <h1 className="outline-title">
        {submitted
          ? "Submitted for approval"
          : live
            ? "Your changes are live"
            : "Your course is published"}
      </h1>
      <p className="au-muted">
        {submitted
          ? "Your admin will review this course. You'll get a notification when they've decided."
          : live
            ? `${live.enrolled} enrolled learners can see your changes, and their progress is kept.`
            : `${state.course.title} is now available to ${
                state.publish.settings.visibility === "Public" ? "anyone with the link" : "your organisation"
              }.`}
      </p>
      <div className="au-proposal-actions">
        <button type="button" className="button" onClick={toPlan}>
          Back to course
        </button>
      </div>
    </div>
  );
}

export function PublishScreen() {
  const state = useAppState();
  const { course, publish, validation, role, live } = state;
  const counts = courseCounts(course);
  const settings = publish.settings;
  const ready = canContinueToPublish(state);
  const dismissed = validation.findings.filter((f) => validation.dismissedIds.includes(f.id));
  const publishing = publish.status === "publishing";

  if (publish.status === "published" || publish.status === "submitted") return <Success />;

  const action = role === "no-publish" ? "Submit for approval" : live ? "Republish course" : "Publish Course";
  return (
    <>
      <div className="review-title">
        <h1>{live ? "Review and republish" : "Review and publish"}</h1>
        <p>Make sure everything looks good before {live ? "learners see your changes" : "publishing"}.</p>
      </div>
      {!ready && (
        <Banner
          tone="warning"
          testId="publish-gate"
          actions={
            <button
              type="button"
              className="au-link"
              onClick={() => store.dispatch({ type: "SET_STEP", step: "validate" })}
            >
              Go to checks
            </button>
          }
        >
          Your course needs its checks to pass before you can publish.
        </Banner>
      )}
      {publish.status === "failed" && (
        <Banner
          tone="error"
          testId="publish-failed"
          actions={
            <button type="button" className="au-link" onClick={publishCourse}>
              Retry
            </button>
          }
        >
          Publishing failed. Your draft is safe and nothing has gone live.
        </Banner>
      )}
      {role === "no-publish" && (
        <Banner tone="info" testId="no-publish">
          You don't have publish rights for this course, so an admin will approve it.
        </Banner>
      )}
      <div className="review">
        <main className="review-main">
          <section className="review-card">
            <div className="review-card-header">
              <div>
                <h2 className="review-card-title">Review your course</h2>
                <p className="review-card-description">Everything here comes from your course plan.</p>
              </div>
              <button type="button" className="button" aria-disabled="true">
                <Icon name="eye" />
                Preview course
              </button>
            </div>
            <ReviewRow icon="reviewBook" title="Course details" description={`${course.title} · ${course.code} · ${counts.units}`} />
            <ReviewRow icon="units" title="Units & structure" description={counts.breakdown} />
            <ReviewRow icon="reviewHelp" title="Content" description={`${counts.lessons} · ${counts.quizzes} · ${counts.videos}`} />
          </section>
          {live && (
            <section className="au-live-changes" data-testid="live-changes">
              <h2 className="settings-title">What learners will notice</h2>
              <ul>
                {live.changedItems.map((title) => (
                  <li key={title}>{title}</li>
                ))}
              </ul>
              <p className="au-muted">
                {live.enrolled} enrolled learners keep their progress. Anyone partway
                through a changed item sees the new version next time they open it.
              </p>
            </section>
          )}
          <section className="settings">
            <h2 className="settings-title">Publish settings</h2>
            <SettingRow icon="globe" title="Visibility" summary={settings.visibility}>
              <fieldset className="setting-options">
                <legend className="visually-hidden">Who can see and access this course?</legend>
                <div className="setting-options-title" aria-hidden>
                  Who can see and access this course?
                </div>
                {(
                  [
                    ["Organisation", "Only enrolled users can access"],
                    ["Public", "Anyone with the link can access"],
                  ] as const
                ).map(([label, description]) => (
                  <label
                    key={label}
                    className={`setting-option ${settings.visibility === label ? "checked" : ""}`}
                  >
                    <input
                      className="visually-hidden"
                      type="radio"
                      name="visibility"
                      checked={settings.visibility === label}
                      onChange={() => setSettings({ visibility: label })}
                    />
                    <span className="radio-mark">
                      {settings.visibility === label ? <Icon name="radioOn" /> : <span className="radio-off" />}
                    </span>
                    <span>
                      <span className="setting-option-title">{label}</span>
                      <span className="review-text-description">{description}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
            </SettingRow>
            <SettingRow icon="userPlus" title="Enrollment" summary={settings.enrollment}>
              <label className="au-field">
                <span className="au-field-label">How do learners join?</span>
                <select
                  className="au-input"
                  value={settings.enrollment}
                  onChange={(event) => setSettings({ enrollment: event.target.value })}
                >
                  <option>Self enroll</option>
                  <option>Invite only</option>
                  <option>Assigned by admin</option>
                </select>
              </label>
            </SettingRow>
            <SettingRow icon="calendar" title="Start date" summary={settings.startDate}>
              <label className="au-field">
                <span className="au-field-label">Start date</span>
                <input
                  className="au-input"
                  value={settings.startDate}
                  onChange={(event) => setSettings({ startDate: event.target.value })}
                />
              </label>
            </SettingRow>
            <SettingRow
              icon="bell"
              title="Notifications"
              summary={
                [settings.notifyLearners && "Notify learners", settings.notifyAdmin && "Notify admin"]
                  .filter(Boolean)
                  .join(" · ") || "No notifications"
              }
            >
              <div className="au-toggles">
                <Toggle
                  label="Notify learners on publish"
                  description="Send an email to enrolled learners when the course goes live"
                  checked={settings.notifyLearners}
                  onChange={(notifyLearners) => setSettings({ notifyLearners })}
                />
                <Toggle
                  label="Notify Admin"
                  description="Alert Admins when the course is published"
                  checked={settings.notifyAdmin}
                  onChange={(notifyAdmin) => setSettings({ notifyAdmin })}
                />
              </div>
            </SettingRow>
          </section>
        </main>
        <aside className="review-side">
          <section className="side-card summary-card">
            <div className="side-heading">
              <Icon name="summaryFile" />
              <span>Course summary</span>
            </div>
            <dl className="summary-values">
              {[
                ["Course name", course.title],
                ["Course code", course.code],
                ["Lessons", counts.lessons],
                ["Duration", `${counts.minutes} min`],
                ["Units", counts.units],
              ].map(([term, value]) => (
                <div className="summary-value" key={term}>
                  <dt>{term}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </section>
          {ready && (
            <section className="side-card ready-card" data-testid="ready-card">
              <div className="side-heading">
                <Icon name="readyCheck" />
                <span>Ready to publish</span>
              </div>
              <p className="ready-primary">All required checks passed</p>
              <p className="ready-secondary">You can still make changes after publishing.</p>
            </section>
          )}
          {dismissed.length > 0 && (
            <section className="side-card au-dismissed-card" data-testid="dismissed-summary">
              <div className="side-heading">
                <Icon name="alert" />
                <span>Dismissed advisories ({dismissed.length})</span>
              </div>
              <ul>
                {dismissed.map((finding) => (
                  <li key={finding.id}>
                    {finding.title}: {finding.flagLabel.replace("Advisory: ", "")}
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section className="side-card tips-card">
            <div className="side-heading">
              <Icon name="info" />
              <span>Tips</span>
            </div>
            <ul className="tips-list">
              <li>
                <Icon name="tipCheck" />
                Preview the course to experience it as a learner
              </li>
              <li>
                <Icon name="tipCheck" />
                You can still make changes after publishing
              </li>
            </ul>
          </section>
        </aside>
      </div>
      <footer className="page-footer">
        <button
          type="button"
          className="button large"
          onClick={() => store.dispatch({ type: "SET_STEP", step: "validate" })}
        >
          <Icon name="back" />
          Previous
        </button>
        <div className="footer-actions">
          <button
            type="button"
            className="button large"
            onClick={() =>
              store.set((s) => ({
                ...s,
                ui: { ...s.ui, toast: { text: "Draft saved", tone: "success" } },
              }))
            }
          >
            Save Draft
          </button>
          <button
            type="button"
            className="button primary large"
            disabled={!ready || publishing}
            data-testid="publish-action"
            onClick={() =>
              role === "no-publish"
                ? submitForApproval()
                : store.set((s) => ({ ...s, ui: { ...s.ui, dialog: { type: "publish" } } }))
            }
          >
            {publishing ? "Publishing…" : action}
            <Icon name="nextArrow" />
          </button>
        </div>
      </footer>
    </>
  );
}
