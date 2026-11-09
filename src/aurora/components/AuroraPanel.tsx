import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  setOwnKnowledge,
  addUrl,
  cancelOp,
  chooseOption,
  closeAurora,
  formatSize,
  keepWaiting,
  minimizeAurora,
  openAurora,
  removeAttachment,
  retryAttachment,
  reviseAnswer,
  run,
  sendChat,
  setOther,
  skipQuestion,
  stopStream,
  submitAnswer,
  uploadFile,
  validateUrl,
} from "../mock/engine";
import { activeOps, findItem } from "../state/reducer";
import { store, useAppState } from "../state/store";
import type { Attachment, Message, Operation } from "../state/types";
import { Icon, type IconName } from "./Icon";
import { ProposalCard } from "./Review";

/* Named steps from Figma 3012:2175, scaled down. Never a skeleton. */
export function ProgressSteps({
  steps,
  compact,
}: {
  steps: { label: string; status: string }[];
  compact?: boolean;
}) {
  const done = steps.filter((s) => s.status === "done").length;
  const percent = Math.round((done / Math.max(1, steps.length)) * 100);
  return (
    <div className={`au-steps ${compact ? "compact" : ""}`} data-testid="progress">
      <div
        className="au-progress-bar"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progress"
      >
        <span style={{ width: `${percent}%` }} />
      </div>
      <ol className="au-step-list">
        {steps.map((step) => (
          <li key={step.label} className={`au-step-row ${step.status}`}>
            {step.status === "done" && <Icon name="stepDone" className="au-step-icon" />}
            {step.status === "active" && <Icon name="stepActive" className="au-step-icon" />}
            {step.status === "pending" && <span className="au-step-pending" />}
            {step.status === "failed" && <span className="au-icon-blocking" />}
            <span>
              {step.label}
              {step.status === "failed" && " (failed)"}
              {step.status === "done" && <span className="visually-hidden"> (done)</span>}
              {step.status === "active" && <span className="visually-hidden"> (in progress)</span>}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* When each operation started and finished, so the elapsed time survives re-renders. */
const opStarted = new Map<string, number>();
const opFinished = new Map<string, number>();

function useElapsed(op: Operation) {
  const running = ["running", "slow", "paused"].includes(op.status);
  if (running && !opStarted.has(op.id)) opStarted.set(op.id, Date.now());
  if (!running && op.status !== "queued" && opStarted.has(op.id) && !opFinished.has(op.id)) {
    opFinished.set(op.id, Date.now());
  }
  const [, tick] = useState(0);
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => tick((n) => n + 1), 1000);
    return () => window.clearInterval(timer);
  }, [running]);
  const start = opStarted.get(op.id);
  if (!start) return null;
  return Math.max(1, Math.round(((opFinished.get(op.id) ?? Date.now()) - start) / 1000));
}

/* Aurora at work: one live line while it works, folding into "Worked for 4s" when it's done. Never a skeleton. */
function ProgressMessage({ op }: { op: Operation }) {
  const live = ["running", "slow", "paused", "queued"].includes(op.status);
  const seconds = useElapsed(op);
  /* A failure stays open, so you can see which step stopped. */
  const [open, setOpen] = useState(op.status === "failed");
  useEffect(() => {
    if (op.status === "failed") setOpen(true);
  }, [op.status]);
  const done = op.steps.filter((step) => step.status === "done").length;
  const percent = Math.round((done / Math.max(1, op.steps.length)) * 100);
  const active = op.steps.find((step) => step.status === "active");
  const summary =
    op.status === "cancelled"
      ? "Cancelled"
      : op.status === "failed"
        ? "Stopped before finishing"
        : seconds
          ? `Worked for ${seconds}s`
          : "Finished";
  const steps = op.steps;
  return (
    <div className={`au-op ${live ? "live" : "finished"}`} data-testid="op" data-status={op.status}>
      <div className="au-op-head">
        {live ? (
          <p className="au-op-title" aria-live="polite">
            <Icon name="aiButton" className="au-op-mark" />
            <span className="au-shimmer">{op.status === "queued" ? "Waiting to start" : op.label}</span>
            {seconds !== null && <span className="au-op-time">{seconds}s</span>}
          </p>
        ) : (
          <button type="button" className="au-op-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
            <Icon name="aiButton" className="au-op-mark" />
            {summary}
            <Icon name="unitDown" className={`au-op-chevron${open ? " open" : ""}`} />
          </button>
        )}
        {live && (
          <span className="au-op-actions">
            {op.status === "slow" && (
              <button type="button" className="au-link" onClick={() => keepWaiting(op.id)}>
                Keep waiting
              </button>
            )}
            <button type="button" className="au-link au-quiet" onClick={() => cancelOp(op.id)}>
              {op.status === "queued" ? "Remove from queue" : "Cancel"}
            </button>
          </span>
        )}
      </div>
      {live && op.status !== "queued" && (
        <div
          className="au-op-bar"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={active ? active.label : op.label}
        >
          <span style={{ width: `${Math.max(percent, 6)}%` }} />
        </div>
      )}
      {op.status === "queued" && (
        <p className="au-op-note" data-testid="queued">
          {op.waitingReason ?? "Waiting to start."}
        </p>
      )}
      {((live && op.status !== "queued") || open) && steps.length > 0 && (
        <ol className="au-op-steps" data-testid="progress">
          {steps.map((step) => (
            <li key={step.label} className={`au-op-step ${step.status}`}>
              {step.status === "done" && <Icon name="stepDone" className="au-op-icon" />}
              {step.status === "active" && <Icon name="loader" className="au-op-icon au-spinner" />}
              {step.status === "pending" && <span className="au-op-icon au-op-dot" />}
              {step.status === "failed" && <span className="au-icon-blocking" />}
              <span className={step.status === "active" ? "au-shimmer" : undefined}>
                {step.label}
                {step.status === "failed" && " (failed)"}
                {step.status === "done" && <span className="visually-hidden"> (done)</span>}
                {step.status === "active" && <span className="visually-hidden"> (in progress)</span>}
              </span>
            </li>
          ))}
        </ol>
      )}
      {op.status === "slow" && (
        <p className="au-op-note" data-testid="slow">
          This is taking longer than expected. You can keep working while you wait.
        </p>
      )}
      {op.status === "paused" && (
        <p className="au-op-note" data-testid="paused">
          Paused. I'll carry on when you're back.
        </p>
      )}
    </div>
  );
}

/* A question gets a card of its own: what's being asked, the choices, and one clear way to answer. */
function QuestionCard({ message }: { message: Extract<Message, { kind: "question" }> }) {
  const open = message.status === "open";
  const options = message.allowOther ? [...message.options, "Other"] : message.options;
  const [n, total] = (message.counter ?? "").split("/");
  const eyebrow = total ? `Question ${n} of ${total}` : "Question";
  const blocked =
    message.selected.length === 0 ||
    (message.selected.length === 1 && message.selected[0] === "Other" && !message.other.trim());
  return (
    <fieldset className={`question au-question ${open ? "" : "answered"}`} data-testid="question">
      <legend className="visually-hidden">{message.prompt}</legend>
      <p className="au-question-meta" aria-hidden>
        <span>{eyebrow}</span>
        <span className="au-question-tag">{message.multi ? "Choose any" : "Choose one"}</span>
      </p>
      <p className="question-title" aria-hidden>
        {message.prompt}
      </p>
      {message.reopenNote && (
        <p className="au-slow" data-testid="reopen-note">
          {message.reopenNote}
        </p>
      )}
      <div className="question-options">
        {options.map((option) => {
          const checked = message.selected.includes(option);
          return (
            <label key={option} className={`question-option ${checked ? "checked" : ""}`}>
              <input
                className="visually-hidden"
                type={message.multi ? "checkbox" : "radio"}
                name={message.id}
                disabled={!open}
                checked={checked}
                onChange={() => chooseOption(message.id, option, message.multi)}
              />
              <span className={`au-choice ${message.multi ? "square" : "round"} ${checked ? "on" : ""}`} aria-hidden>
                {checked && message.multi && <Icon name="check" />}
              </span>
              {option}
            </label>
          );
        })}
      </div>
      {open && message.selected.includes("Other") && (
        <label className="au-field">
          <span className="au-field-label">Your answer</span>
          <input
            className="au-input"
            value={message.other}
            onChange={(event) => setOther(message.id, event.target.value)}
          />
        </label>
      )}
      {open && (
        <div className="au-question-actions">
          <button
            type="button"
            className="button primary au-question-submit"
            disabled={blocked}
            onClick={() => submitAnswer(message.id)}
          >
            Submit answer
          </button>
          {message.skippable && (
            <button type="button" className="au-link au-quiet" onClick={() => skipQuestion(message.id)}>
              Skip
            </button>
          )}
        </div>
      )}
      {!open && (
        <span className="au-answered">
          {message.status === "skipped" ? "Skipped" : "Answered"}
          <button type="button" className="au-link" onClick={() => reviseAnswer(message.id)}>
            Change answer
          </button>
        </span>
      )}
    </fieldset>
  );
}

/* Aurora's replies are plain text on the page, like a document, with quiet tools underneath. */
function AuroraBubble({ time, text, children }: { time: string; text?: string; children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="message-aurora au-answer">
      {children}
      <div className="au-answer-tools">
        {text && (
          <button
            type="button"
            aria-label={copied ? "Copied" : "Copy"}
            title={copied ? "Copied" : "Copy"}
            onClick={() => {
              navigator.clipboard?.writeText(text);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1500);
            }}
          >
            <Icon name="copy" />
          </button>
        )}
        <span className="aurora-time">{time}</span>
      </div>
    </div>
  );
}

function MessageView({ message }: { message: Message }) {
  const state = useAppState();
  switch (message.kind) {
    case "user":
      return (
        <div className="message-user">
          <div className="bubble">
            <p className="bubble-text">{message.text}</p>
            <span className="bubble-time">{message.time}</span>
          </div>
        </div>
      );
    case "text":
      return (
        <AuroraBubble time={message.time} text={message.streaming ? undefined : message.text}>
          <p className="aurora-text" data-testid="aurora-text">
            {message.text}
            {message.streaming && <span className="au-caret" aria-hidden />}
            {message.stopped && <em> (Stopped)</em>}
          </p>
          {message.streaming && (
            <button type="button" className="au-stop" onClick={() => stopStream(message.id)}>
              <span aria-hidden />
              Stop
            </button>
          )}
        </AuroraBubble>
      );
    case "question":
      return <QuestionCard message={message} />;
    case "proposal": {
      const proposal = state.proposals.find((p) => p.id === message.proposalId);
      return proposal ? <ProposalCard proposal={proposal} /> : null;
    }
    case "error":
      return (
        <div className="au-note error" role="alert" data-testid="error-message">
          <span className="au-icon-blocking" />
          <div className="au-note-body">
            <p>{message.text}</p>
            <div className="au-proposal-actions">
              {message.retry && (
                <button type="button" className="button small" onClick={() => run(message.retry!)}>
                  Retry
                </button>
              )}
              {message.manual && (
                <button
                  type="button"
                  className="button small"
                  onClick={() => run({ cmd: "editManually", itemId: message.manual! })}
                >
                  Edit it myself
                </button>
              )}
            </div>
          </div>
        </div>
      );
    case "progress": {
      const op = state.operations.find((o) => o.id === message.opId);
      return op ? <ProgressMessage op={op} /> : null;
    }
    case "notice":
      return (
        <div className={`au-note ${message.tone}`} data-testid="notice">
          {message.tone === "error" && <span className="au-icon-blocking" />}
          {message.tone === "warning" && <Icon name="alert" className="au-note-icon" />}
          <div className="au-note-body">
            {message.title && <p className="au-note-title">{message.title}</p>}
            <p>{message.text}</p>
            {message.actions.length > 0 && (
              <div className="au-proposal-actions">
                {message.actions.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    className="button small"
                    onClick={() => run(action.command)}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      );
  }
}

const FILE_ICON: Record<string, IconName> = {
  pdf: "fileRed",
  pptx: "fileOrange",
  docx: "fileBlue",
};

export function AttachmentChip({ attachment }: { attachment: Attachment }) {
  const ext = attachment.name.split(".").pop()?.toLowerCase() ?? "";
  const icon: IconName =
    attachment.kind === "video" ? "videoLarge" : attachment.kind === "link" ? "link" : FILE_ICON[ext] ?? "fileBlue";
  const statusLabel: Record<Attachment["status"], string> = {
    uploading: `Uploading ${attachment.progress}%`,
    processing: "Processing",
    ready: "Ready",
    failed: "Failed",
    unsupported: "Unsupported",
  };
  return (
    <div className="au-chip" data-testid="attachment" data-status={attachment.status}>
      <div className="au-chip-row">
        <span className="au-chip-icon">
          <Icon name={icon} />
        </span>
        <div className="au-chip-text">
          <p className="au-chip-name au-truncate" title={attachment.name}>
            {attachment.name}
          </p>
          <p className="au-chip-meta">{attachment.meta}</p>
        </div>
        <span className={`au-status ${attachment.status}`}>
          {attachment.status === "ready" && <Icon name="statusCheck" />}
          {statusLabel[attachment.status]}
        </span>
        <button
          type="button"
          className="au-icon-button"
          aria-label={`Remove ${attachment.name}`}
          onClick={() => removeAttachment(attachment.id)}
        >
          <Icon name="remove" />
        </button>
      </div>
      {(attachment.status === "uploading" || attachment.status === "processing") && (
        <span className={`au-chip-progress ${attachment.status}`} aria-hidden>
          <span style={attachment.status === "uploading" ? { width: `${attachment.progress}%` } : undefined} />
        </span>
      )}
      {attachment.error && <p className="au-chip-error">{attachment.error}</p>}
      {attachment.retryable && attachment.status === "failed" && (
        <div className="au-proposal-actions">
          <button type="button" className="button small" onClick={() => retryAttachment(attachment.id)}>
            Retry
          </button>
          <button type="button" className="button small" onClick={() => removeAttachment(attachment.id)}>
            Cancel
          </button>
        </div>
      )}
      {attachment.kind !== "file" && attachment.status !== "uploading" && attachment.status !== "processing" && (
        <ReplaceUrl attachmentId={attachment.id} />
      )}
    </div>
  );
}

function ReplaceUrl({ attachmentId }: { attachmentId: string }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  if (!open) {
    return (
      <button type="button" className="au-link au-left" onClick={() => setOpen(true)}>
        Replace link
      </button>
    );
  }
  return (
    <form
      className="au-url-form"
      onSubmit={(event) => {
        event.preventDefault();
        const problem = validateUrl(url);
        setError(problem);
        if (!problem) addUrl(url, attachmentId);
      }}
    >
      <input
        className="au-input"
        aria-label="New link"
        value={url}
        onChange={(event) => setUrl(event.target.value)}
      />
      <button type="submit" className="button small">
        Replace
      </button>
      {error && <p className="au-chip-error">{error}</p>}
    </form>
  );
}

/* Line icons drawn in currentColor, so the menu can tint them. */
function MenuGlyph({ name }: { name: "upload" | "link" | "samples" | "back" | "chevron" }) {
  const paths: Record<typeof name, string> = {
    upload: "M17.5 12.5v3.33a1.67 1.67 0 0 1-1.67 1.67H4.17a1.67 1.67 0 0 1-1.67-1.67V12.5M14.17 6.67 10 2.5 5.83 6.67M10 2.5v10",
    link: "M8.33 10.83a4.17 4.17 0 0 0 6.29.45l2.5-2.5a4.17 4.17 0 0 0-5.9-5.9L9.79 4.3M11.67 9.17a4.17 4.17 0 0 0-6.29-.45l-2.5 2.5a4.17 4.17 0 0 0 5.9 5.9l1.42-1.43",
    samples: "M11.67 1.67H5a1.67 1.67 0 0 0-1.67 1.66v13.34A1.67 1.67 0 0 0 5 18.33h10a1.67 1.67 0 0 0 1.67-1.66V6.67l-5-5Zm0 0v5h5M13.33 10.83H6.67M13.33 14.17H6.67M8.33 7.5H6.67",
    back: "M15.83 10H4.17M10 4.17 4.17 10 10 15.83",
    chevron: "m7.5 15 5-5-5-5",
  };
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d={paths[name]} stroke="currentColor" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Attach: a small menu above the message box. Each row says what it adds and where from;
   links and the prototype's sample files open their own step with a way back. */
function AttachMenu({ onClose }: { onClose: () => void }) {
  const { mock } = useAppState();
  const input = useRef<HTMLInputElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<"menu" | "link" | "samples">("menu");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const away = (event: PointerEvent) => {
      const target = event.target as Element;
      if (root.current?.contains(target) || target.closest?.("[data-testid='attach']")) return;
      onClose();
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [onClose]);

  useEffect(() => {
    root.current?.querySelector<HTMLElement>("button, input")?.focus();
  }, [view]);

  const header = (title: string) => (
    <div className="au-attach-head">
      <button type="button" className="au-attach-back" aria-label="Back" onClick={() => setView("menu")}>
        <MenuGlyph name="back" />
      </button>
      <span>{title}</span>
    </div>
  );

  return (
    <div
      ref={root}
      className="au-attach-pop"
      role="group"
      aria-label="Add to Aurora"
      data-testid="attach-menu"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          if (view === "menu") onClose();
          else setView("menu");
        }
      }}
    >
      <input
        ref={input}
        className="visually-hidden"
        type="file"
        multiple
        accept=".pdf,.pptx,.docx,.svg,.png"
        tabIndex={-1}
        aria-label="Upload files"
        data-testid="file-input"
        onChange={(event) => {
          [...(event.target.files ?? [])].forEach((file) => uploadFile(file.name, file.size));
          onClose();
        }}
      />
      {view === "menu" && (
        <>
          <button type="button" className="au-attach-row" onClick={() => input.current?.click()}>
            <span className="au-attach-icon"><MenuGlyph name="upload" /></span>
            <span className="au-attach-label">Add files</span>
            <span className="au-attach-desc">PDF, PPTX, DOCX, SVG, PNG · 200 MB</span>
          </button>
          <button type="button" className="au-attach-row" data-testid="attach-link" onClick={() => setView("link")}>
            <span className="au-attach-icon"><MenuGlyph name="link" /></span>
            <span className="au-attach-label">Add a video or link</span>
            <span className="au-attach-desc">YouTube, Vimeo or a web page</span>
            <span className="au-attach-chevron"><MenuGlyph name="chevron" /></span>
          </button>
          <button type="button" className="au-attach-row" data-testid="attach-samples" onClick={() => setView("samples")}>
            <span className="au-attach-icon"><MenuGlyph name="samples" /></span>
            <span className="au-attach-label">Sample files</span>
            <span className="au-attach-desc">Try with example materials</span>
            <span className="au-attach-chevron"><MenuGlyph name="chevron" /></span>
          </button>
        </>
      )}
      {view === "samples" && (
        <>
          {header("Sample files")}
          {mock.sampleFiles.map((file) => (
            <button
              key={file.name}
              type="button"
              className="au-attach-row au-attach-row-tight"
              data-sample={file.name}
              onClick={() => {
                uploadFile(file.name, file.size);
                onClose();
              }}
            >
              <span className="au-attach-label au-truncate">{file.name}</span>
              <span className="au-attach-desc">{formatSize(file.size)}</span>
            </button>
          ))}
          <div className="au-attach-sep" />
          <button
            type="button"
            className="au-attach-row au-attach-row-tight au-attach-strong"
            data-testid="upload-all"
            onClick={() => {
              mock.sampleFiles.forEach((file) => uploadFile(file.name, file.size));
              onClose();
            }}
          >
            <span className="au-attach-label">Add all sample files</span>
          </button>
        </>
      )}
      {view === "link" && (
        <>
          {header("Add a video or link")}
          <form
            className="au-attach-form"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              const problem = validateUrl(url);
              setError(problem);
              if (!problem) {
                addUrl(url);
                onClose();
              }
            }}
          >
            <div className="au-attach-url">
              <input
                className="au-input"
                aria-label="Video or link URL"
                placeholder="https://videos.example.com/watch"
                value={url}
                aria-invalid={Boolean(error)}
                data-testid="url-input"
                onChange={(event) => {
                  setUrl(event.target.value);
                  setError(null);
                }}
              />
              <button type="submit" className="button small primary" disabled={!url.trim()}>
                Add
              </button>
            </div>
            {error && (
              <p className="au-chip-error" role="alert" data-testid="url-error">
                {error}
              </p>
            )}
          </form>
          {mock.sampleUrls.length > 0 && (
            <>
              <p className="au-attach-caption">Sample links</p>
              {mock.sampleUrls.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  className="au-attach-row au-attach-row-tight"
                  data-sample-url={sample}
                  onClick={() => {
                    setUrl(sample);
                    setError(null);
                  }}
                >
                  <span className="au-attach-label au-truncate">{sample}</span>
                </button>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}

const SUGGESTIONS = ["Shorten", "Add examples", "Change Tone"];

/* An empty conversation says what Aurora is for and offers a first step, instead of a blank box. */
function Welcome({ firstUse, readOnly }: { firstUse: boolean; readOnly: boolean }) {
  return (
    <div className="au-welcome" data-testid={firstUse ? "first-use" : "welcome"}>
      <span className="au-welcome-mark" aria-hidden>
        <Icon name="aiButton" />
      </span>
      <p className="au-welcome-title">{firstUse ? "Meet Aurora" : readOnly ? "Ask about this lesson" : "Refine this lesson"}</p>
      <p className="au-welcome-text">
        {firstUse
          ? "Your course assistant. Here's what to expect."
          : readOnly
            ? "Ask a question about what's on the page."
            : "Ask about this item, or ask me to change it. I'll show you any change before it's applied."}
      </p>
      {firstUse ? (
        <>
          <div className="au-welcome-lists">
            <div>
              <p className="au-welcome-label">I can</p>
              <ul>
                <li>Explain and edit your course content</li>
                <li>Draft lessons and quizzes from your documents and links</li>
                <li>Help you fix findings before you publish</li>
              </ul>
            </div>
            <div>
              <p className="au-welcome-label">I can't</p>
              <ul>
                <li>Change anything without showing you first</li>
                <li>Publish your course or change its settings</li>
                <li>Guarantee I'm right, so please check what I write</li>
              </ul>
            </div>
          </div>
          <button
            type="button"
            className="button primary small"
            onClick={() => store.set((s) => ({ ...s, aurora: { ...s.aurora, firstUseSeen: true } }))}
          >
            Got it
          </button>
        </>
      ) : (
        !readOnly && (
          <div className="chips au-welcome-chips">
            {SUGGESTIONS.map((label) => (
              <button key={label} type="button" className="chip" onClick={() => sendChat(label)}>
                {label}
              </button>
            ))}
          </div>
        )
      )}
    </div>
  );
}

export function AuroraPanel() {
  const state = useAppState();
  const { aurora, ui, attachments, role } = state;
  const item = findItem(state.course, ui.selectedItemId);
  const log = useRef<HTMLDivElement>(null);
  const attachOpen = ui.attachOpen;
  const setAttachOpen = (open: boolean) =>
    store.set((s) => ({ ...s, ui: { ...s.ui, attachOpen: open } }));
  const closeAttach = useCallback(() => setAttachOpen(false), []);
  const [menuOpen, setMenuOpen] = useState(false);
  const queued = state.operations.filter((op) => op.status === "queued");

  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [aurora.messages]);

  if (aurora.panel === "closed") return null;
  if (aurora.panel === "minimized") {
    const busy = activeOps(state)[0];
    return (
      <button
        type="button"
        className="au-mini"
        data-aurora-restore
        data-testid="aurora-mini"
        onClick={openAurora}
      >
        <Icon name="auroraSmall" />
        {busy ? `Aurora: ${busy.label}` : "Aurora"}
      </button>
    );
  }

  const send = () => sendChat(ui.composer);
  const setComposer = (composer: string) =>
    store.set((s) => ({ ...s, ui: { ...s.ui, composer } }));
  const readOnly = role === "read-only";

  return (
    <aside
      className="chat au-chat"
      aria-label="Aurora AI Course Assistant"
      data-testid="aurora"
      onKeyDown={(event) => {
        if (event.key === "Escape" && !state.ui.dialog) closeAurora();
      }}
    >
      <div>
        <div className="chat-header">
          <div className="chat-identity">
            <Icon name="aurora" />
            <div>
              <div className="chat-name">Aurora</div>
              <div className="chat-role">AI Course Assistant</div>
            </div>
          </div>
          <div className="chat-actions">
            <div className="au-menu-wrap">
              <button
                type="button"
                aria-label="Aurora options"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <Icon name="more" />
              </button>
              {menuOpen && (
                <div className="au-menu au-menu-wide" role="group" aria-label="Aurora options">
                  {/* Figma 3190:18388: "Allow Aurora to use its own trained sources". */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={aurora.useOwnKnowledge}
                    className="au-menu-switch"
                    data-testid="own-knowledge"
                    onClick={() => setOwnKnowledge(!aurora.useOwnKnowledge)}
                  >
                    <span>
                      Use Aurora's own knowledge
                      <small>
                        {aurora.useOwnKnowledge
                          ? "Aurora can add facts and examples it knows"
                          : "Only your course and attached materials"}
                      </small>
                    </span>
                    <span className={`au-switch${aurora.useOwnKnowledge ? " on" : ""}`} aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      minimizeAurora();
                    }}
                  >
                    Minimize
                  </button>
                </div>
              )}
            </div>
            <button type="button" aria-label="Close Aurora" onClick={closeAurora}>
              <Icon name="close" />
            </button>
          </div>
        </div>
        <div className="chat-rule" />
      </div>
      <div className="chat-messages" ref={log} data-testid="messages">
        {(!aurora.firstUseSeen || aurora.messages.length === 0) && (
          <Welcome firstUse={!aurora.firstUseSeen} readOnly={readOnly} />
        )}
        {aurora.messages.map((message) => (
          <MessageView key={message.id} message={message} />
        ))}
      </div>
      {/* Suggestions step aside while a question waits or Aurora is working, so there's one thing to do. */}
      {!readOnly &&
        aurora.messages.length > 0 &&
        activeOps(state).length === 0 &&
        !aurora.messages.some((m) => m.kind === "question" && m.status === "open") && (
        <div className="chips au-suggest">
          {SUGGESTIONS.map((label) => (
            <button key={label} type="button" className="chip" onClick={() => sendChat(label)}>
              {label}
            </button>
          ))}
        </div>
      )}
      {queued.length > 0 && (
        <ol className="au-queue" data-testid="queue" aria-label="Requests waiting">
          {queued.map((op, index) => (
            <li key={op.id}>
              {index + 1}. {op.label}
            </li>
          ))}
        </ol>
      )}
      {/* One card: what Aurora is looking at, what you've attached, and what you'll ask. */}
      <div className="au-composer-card">
        {attachOpen && <AttachMenu onClose={closeAttach} />}
        <div className="au-context">
          <span className="au-context-chip au-truncate" data-testid="context-chip" title={item?.title}>
            <Icon name="lessonDefault" />
            <span className="visually-hidden">Looking at: </span>
            {item?.title ?? "No item selected"}
          </span>
        </div>
        {attachments.length > 0 && (
          <div className="au-chips" data-testid="attachments">
            {attachments.map((attachment) => (
              <AttachmentChip key={attachment.id} attachment={attachment} />
            ))}
          </div>
        )}
        <form
          className="composer au-composer"
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
        >
          <textarea
            aria-label={readOnly ? "Ask Aurora about this lesson" : "Ask Aurora to edit this lesson"}
            placeholder={readOnly ? "Ask about this lesson…" : "Ask Aurora to edit this lesson…"}
            value={ui.composer}
            onChange={(event) => setComposer(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                send();
              }
            }}
          />
          <div className="composer-actions">
            {!readOnly && (
              <button
                type="button"
                className="au-attach-button"
                aria-label="Attach a file or link"
                aria-expanded={attachOpen}
                data-testid="attach"
                onClick={() => setAttachOpen(!attachOpen)}
              >
                <Icon name="paperclip" />
              </button>
            )}
            <button type="submit" className="au-send" aria-label="Send message" disabled={!ui.composer.trim()}>
              <Icon name="send" />
            </button>
          </div>
        </form>
      </div>
      <p className="au-disclaimer">Aurora can make mistakes. Check before you apply.</p>
    </aside>
  );
}
