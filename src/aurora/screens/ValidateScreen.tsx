import { useId } from "react";
import { ProgressSteps } from "../components/AuroraPanel";
import { Banner } from "../components/Feedback";
import { FindingCard } from "../components/Findings";
import { Icon, type IconName } from "../components/Icon";
import { staleCheckIds } from "../mock/checks";
import {
  cancelValidation,
  canContinueToPublish,
  fixFinding,
  keepWaitingValidation,
  openFindings,
  runValidation,
} from "../mock/engine";
import { allItems, courseCounts } from "../state/reducer";
import { store, useAppState } from "../state/store";

const CHECK_ICONS: Record<string, IconName> = {
  structure: "checkList",
  lessons: "checkBook",
  files: "checkFile",
  quiz: "checkTarget",
  objectives: "overview",
};

export function ValidateScreen() {
  const state = useAppState();
  const { validation, course } = state;
  const reason = useId();
  const open = openFindings(state);
  const blocking = open.filter((f) => f.severity === "blocking");
  const advisory = open.filter((f) => f.severity === "advisory");
  const dismissed = validation.findings.filter((f) => validation.dismissedIds.includes(f.id));
  const stale = staleCheckIds(course, validation.signatures);
  const running = validation.status === "running" || validation.status === "slow";
  const done = validation.status === "done";
  const incomplete = validation.checks.filter((c) => c.state === "incomplete");
  const allClear = done && open.length === 0 && stale.length === 0 && incomplete.length === 0;
  const canContinue = canContinueToPublish(state);
  const counts = courseCounts(course);

  const blockReason = !done
    ? "Run the checks first."
    : blocking.length
      ? `Fix ${blocking.length} blocking ${blocking.length === 1 ? "issue" : "issues"} to continue.`
      : incomplete.length
        ? "Some checks couldn't finish. Run them again to continue."
        : stale.length
          ? "You've changed the course since it was checked. Recheck to continue."
          : "";

  /* With nothing in the course, passing checks would mislead, so none run. */
  if (allItems(course).length === 0) {
    return (
      <>
        <main className="validate-title-gap">
          <div className="page-title">
            <h1>Check your course</h1>
            <p>We make sure your course is complete and can be published correctly.</p>
          </div>
          <section className="section-card au-val-nothing" data-testid="val-nothing">
            <h2 className="section-heading">Nothing to check yet</h2>
            <p className="au-muted">
              Your course has no lessons, quizzes or videos. Add some content, then come back to run the checks.
            </p>
            <button
              type="button"
              className="button primary"
              onClick={() => store.dispatch({ type: "SET_STEP", step: "plan" })}
            >
              Add content
            </button>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <main className="validate-title-gap">
        <div className="page-title">
          <h1>Check your course</h1>
          <p>We're making sure your course is complete and can be published correctly.</p>
        </div>
        <section className="section-card" data-testid="validate-card">
          {validation.status === "idle" && (
            <div className="au-val-start" data-testid="val-idle">
              <h2 className="section-heading">Ready to check</h2>
              <p className="au-muted">
                Checks look at your structure, content, links, quizzes and learning
                objectives. You need to run them before you publish.
              </p>
              <button type="button" className="button primary" onClick={() => runValidation()}>
                Start checks
              </button>
            </div>
          )}
          {running && (
            <div className="au-val-running" data-testid="val-running">
              <h2 className="section-heading">
                {validation.only
                  ? `Rechecking ${validation.only.length} affected ${validation.only.length === 1 ? "check" : "checks"}`
                  : "Checking your course"}
              </h2>
              <ProgressSteps steps={validation.progress} />
              {validation.status === "slow" && (
                <Banner
                  tone="warning"
                  testId="val-slow"
                  actions={
                    <>
                      <button type="button" className="au-link" onClick={keepWaitingValidation}>
                        Keep waiting
                      </button>
                      <button type="button" className="au-link" onClick={cancelValidation}>
                        Cancel
                      </button>
                    </>
                  }
                >
                  This is taking much longer than usual. You can keep waiting or try
                  again later.
                </Banner>
              )}
            </div>
          )}
          {done && (
            <>
              {allClear ? (
                <div className="au-all-clear" data-testid="all-clear">
                  <Icon name="readyCheck" />
                  <div>
                    <h2 className="au-all-clear-title">All checks passed</h2>
                    <p className="au-muted">Nothing needs your attention. You can publish this course.</p>
                  </div>
                </div>
              ) : (
                <div className="au-val-summary" data-testid="severity-summary">
                  <h2 className="section-heading">Results</h2>
                  <span className="au-severity blocking">{blocking.length} blocking</span>
                  <span className="au-severity advisory">{advisory.length} advisory</span>
                  {open.length > 0 && (
                    <button type="button" className="button small" onClick={() => fixFinding(open[0].id)}>
                      Go through findings
                    </button>
                  )}
                </div>
              )}
              {blocking.length > 0 && (
                <div className="au-finding-group" data-testid="blocking-group">
                  <h3 className="au-group-title">
                    <span className="au-icon-blocking" />
                    Must be fixed before publishing
                  </h3>
                  <div className="check-list">
                    {blocking.map((finding) => (
                      <FindingCard key={finding.id} finding={finding} />
                    ))}
                  </div>
                </div>
              )}
              {advisory.length > 0 && (
                <div className="au-finding-group" data-testid="advisory-group">
                  <h3 className="au-group-title">
                    <Icon name="alert" className="au-note-icon" />
                    Worth reviewing
                  </h3>
                  <div className="check-list">
                    {advisory.map((finding) => (
                      <FindingCard key={finding.id} finding={finding} />
                    ))}
                  </div>
                </div>
              )}
              {dismissed.length > 0 && (
                <details className="au-dismissed" data-testid="dismissed">
                  <summary>Dismissed ({dismissed.length})</summary>
                  <ul>
                    {dismissed.map((finding) => (
                      <li key={finding.id}>
                        {finding.title}: {finding.flagLabel}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              <div className="au-checks-head">
                <h2 className="section-heading">Course checks</h2>
                <span className="au-proposal-actions">
                  {stale.length > 0 && (
                    <button
                      type="button"
                      className="button small primary"
                      data-testid="recheck"
                      onClick={() => runValidation(stale)}
                    >
                      Recheck {stale.length} affected
                    </button>
                  )}
                  <button type="button" className="button small" onClick={() => runValidation()}>
                    Run all checks
                  </button>
                </span>
              </div>
              <div className="checks-margin">
                <div className="check-list">
                  {validation.checks.map((check) => {
                    const isStale = stale.includes(check.id) && check.state !== "incomplete";
                    const issues = open.filter((f) => f.checkId === check.id);
                    const blockingCount = issues.filter((f) => f.severity === "blocking").length;
                    const advisoryCount = issues.length - blockingCount;
                    let label = "Ready";
                    let tone = "ready";
                    if (check.state === "incomplete") {
                      label = "Couldn't finish";
                      tone = "issue";
                    } else if (isStale) {
                      label = "Needs another run";
                      tone = "issue";
                    } else if (blockingCount) {
                      label = `${blockingCount} blocking`;
                      tone = "blocking";
                    } else if (advisoryCount) {
                      label = `${advisoryCount} advisory`;
                      tone = "issue";
                    }
                    return (
                      <div className="check-row" key={check.id} data-check={check.id}>
                        <Icon name={CHECK_ICONS[check.id]} />
                        <span className="check-label">{check.label}</span>
                        <span className={`check-status ${tone}`} data-testid="check-status">
                          {label}
                        </span>
                        {check.state === "incomplete" && (
                          <button
                            type="button"
                            className="button small"
                            onClick={() => runValidation([check.id])}
                          >
                            Retry
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </section>
        <section className="section-card borderless">
          <h2 className="section-heading">Course summary</h2>
          <div className="summary-list">
            {(
              [
                ["checkBook", course.title],
                ["overview", counts.units],
                ["checkFile", counts.lessons],
                ["clock", `${counts.minutes} min`],
              ] as [IconName, string][]
            ).map(([icon, label]) => (
              <div className="summary-item" key={label}>
                <Icon name={icon} />
                {label}
              </div>
            ))}
          </div>
        </section>
      </main>
      <footer className="page-footer">
        <button
          type="button"
          className="button semibold"
          onClick={() => store.dispatch({ type: "SET_STEP", step: "plan" })}
        >
          <Icon name="back" />
          Back
        </button>
        <span className="au-continue">
          {blockReason && (
            <span id={reason} className="au-continue-reason" data-testid="continue-reason">
              {blockReason}
            </span>
          )}
          <button
            type="button"
            className="button primary"
            disabled={!canContinue}
            aria-describedby={blockReason ? reason : undefined}
            onClick={() => store.dispatch({ type: "SET_STEP", step: "publish" })}
          >
            Continue to publish
            <Icon name="next" />
          </button>
        </span>
      </footer>
    </>
  );
}
