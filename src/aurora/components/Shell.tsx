import { retrySave, setConnection } from "../mock/engine";
import { allItems } from "../state/reducer";
import { useAppState, store } from "../state/store";
import type { Step } from "../state/types";
import { Banner } from "./Feedback";
import { Icon, type IconName } from "./Icon";

/* Instructor navigation from Figma 4074:7176. These destinations are outside this prototype. */
const NAV_ITEMS: { label: string; icon: IconName }[] = [
  { label: "Home", icon: "home" },
  { label: "Student Directory", icon: "user" },
  { label: "Groups & Courses", icon: "book" },
  { label: "Reports & Insights", icon: "fileText" },
  { label: "Assistiv Flow", icon: "aiOutline" },
  { label: "Grades", icon: "checkSquare" },
];

export function Navigation() {
  return (
    <aside className="nav au-nav" aria-label="Main navigation">
      <div className="nav-content">
        <div className="nav-top">
          <div className="nav-tools">
            <button type="button" aria-disabled="true" aria-label="Collapse navigation">
              <Icon name="sidebar" />
            </button>
            <button type="button" aria-disabled="true" aria-label="Switch to dark mode">
              <Icon name="moon" />
            </button>
          </div>
          <div className="logo">
            <Icon name="logo" className="logo-mark" />
            <span className="logo-name">Assistiv</span>
          </div>
          <nav className="nav-list">
            {NAV_ITEMS.map((item) => (
              <button key={item.label} type="button" aria-disabled="true" className="nav-item">
                <span className="nav-item-label">
                  <Icon name={item.icon} />
                  {item.label}
                </span>
              </button>
            ))}
          </nav>
          <div className="divider-image">
            <Icon name="dividerTop" />
          </div>
        </div>
        <div className="nav-footer">
          <div className="nav-list">
            <button type="button" aria-disabled="true" className="nav-item nav-footer-item">
              <Icon name="support" />
              Support
            </button>
            <button type="button" aria-disabled="true" className="nav-item nav-footer-item">
              <Icon name="settings" />
              Settings
            </button>
          </div>
          <div className="divider-image">
            <Icon name="dividerBottom" />
          </div>
          <div className="account">
            <div className="account-identity">
              <div className="avatar">OR</div>
              <div>
                <div className="account-name">Olivia Rhye</div>
                <div className="account-email">olivia@untitledui.com</div>
              </div>
            </div>
            <button type="button" aria-disabled="true" aria-label="Log out">
              <Icon name="logout" />
            </button>
          </div>
        </div>
      </div>
      <div className="divider-image vertical">
        <Icon name="dividerVertical" />
      </div>
    </aside>
  );
}

const STEPS = ["Clarify", "Outline", "Plan", "Validate", "Publish"];
const CURRENT_STEP: Record<Step, number> = { plan: 2, validate: 3, publish: 4 };

function Stepper({ step }: { step: Step }) {
  const current = CURRENT_STEP[step];
  return (
    <ol className="stepper" aria-label="Course creation steps">
      {STEPS.flatMap((label, index) => {
        const state = index < current ? "done" : index === current ? "current" : "upcoming";
        const node = (
          <li
            key={label}
            className={`step au-step au-step-${state}`}
            aria-current={state === "current" ? "step" : undefined}
          >
            <span className="step-number">
              {state === "done" ? <Icon name="check" /> : index + 1}
            </span>
            <span className="au-step-label">
              {label}
              {state === "done" && <span className="visually-hidden"> (completed)</span>}
            </span>
          </li>
        );
        return index === 0
          ? [node]
          : [
              <li key={`${label}-line`} className="step-line" aria-hidden>
                <span />
              </li>,
              node,
            ];
      })}
    </ol>
  );
}

function SaveStatus() {
  const { save } = useAppState();
  const labels = {
    saved: "Saved",
    saving: "Saving…",
    unsaved: "Unsaved changes",
    failed: "Not saved",
    offline: "Saved on this device",
  };
  return (
    <span className={`au-save ${save.status}`} role="status" data-testid="save-status">
      {save.status === "saved" && <Icon name="statusCheck" />}
      {labels[save.status]}
    </span>
  );
}

function stepStatus(state: ReturnType<typeof useAppState>) {
  if (state.ui.step === "plan") return "Planning";
  if (state.ui.step === "validate") {
    if (allItems(state.course).length === 0) return "Nothing to check";
    return state.validation.status === "done" ? "Checked" : "Checking";
  }
  const labels = {
    draft: "Ready to review",
    publishing: "Publishing",
    published: "Published",
    failed: "Draft",
    submitted: "Awaiting approval",
  };
  return labels[state.publish.status];
}

/* Live course header from Figma 4051:17631, replacing the creation stepper. */
function LiveHeader() {
  const state = useAppState();
  return (
    <div className="au-live-header" data-testid="live-header">
      <div className="au-live-row">
        <h1 className="au-live-title">{state.course.title}</h1>
        <span className="au-severity live">Live</span>
      </div>
      <div className="au-live-meta">
        <span className="au-pill">{state.live?.enrolled} enrolled learners</span>
        <span className="au-live-code">Course code</span>
        <span className="au-pill">{state.course.code}</span>
      </div>
    </div>
  );
}

export function PageHeader() {
  const state = useAppState();
  return (
    <>
      {/* Figma 3165:15612: where you are and whether it's saved, then the steps and their status. */}
      <header className="au-page-head">
        <div className="au-head-row">
          <div className="breadcrumb">
            Instructor /{" "}
            <span className="au-breadcrumb-current">
              {state.live ? `Courses / ${state.course.title}` : "Create New Course"}
            </span>
          </div>
          <SaveStatus />
        </div>
        {!state.live && (
          <div className="au-head-row au-head-steps">
            <Stepper step={state.ui.step} />
            <span className="badge with-dot" data-testid="step-status">
              <Icon name="dot" />
              {stepStatus(state)}
            </span>
          </div>
        )}
      </header>
      {state.live && <LiveHeader />}
      <GlobalBanners />
    </>
  );
}

function GlobalBanners() {
  const state = useAppState();
  const { conn, save, role, collab, live } = state;
  return (
    <>
      {conn === "offline" && (
        <Banner
          tone="warning"
          testId="offline-banner"
          actions={
            <button type="button" className="au-link" onClick={() => setConnection("online")}>
              Reconnect
            </button>
          }
        >
          You're offline. Your work is saved on this device, and Aurora will carry on
          when you reconnect.
        </Banner>
      )}
      {save.status === "failed" && (
        <Banner
          tone="error"
          testId="save-failed"
          actions={
            <button type="button" className="au-link" onClick={retrySave}>
              Retry
            </button>
          }
        >
          Your changes couldn't be saved. They're still here, so nothing is lost yet.
        </Banner>
      )}
      {role === "read-only" && (
        <Banner tone="info" testId="read-only">
          You have view access, so you can read this course and ask Aurora about it,
          but you can't change it.
        </Banner>
      )}
      {collab.otherEditor && (
        <Banner tone="info" testId="other-editor">
          {collab.otherEditor.name} is also editing this course. Items they're working
          on are locked for you.
        </Banner>
      )}
      {collab.otherTab && (
        <Banner
          tone="warning"
          testId="other-tab"
          actions={
            <button
              type="button"
              className="au-link"
              onClick={() =>
                store.set((s) => ({ ...s, collab: { ...s.collab, otherTab: false } }))
              }
            >
              Use this tab
            </button>
          }
        >
          This course is open in another tab. Edit in one tab so changes don't overlap.
        </Banner>
      )}
      {live && live.changedItems.length > 0 && state.ui.step === "plan" && (
        <Banner tone="info">
          Changes stay in draft until you republish. Enrolled learners won't see them
          before then.
        </Banner>
      )}
    </>
  );
}
