import React, { useEffect, useRef } from "react";
import {
  confirmRemoveAttachment,
  deleteItem,
  deleteUnit,
  discardProposal,
  discardUnsaved,
  publishCourse,
  saveThenLeave,
  signBackIn,
  undoLast,
  undoProposal,
} from "../mock/engine";
import { courseCounts } from "../state/reducer";
import { store, useAppState } from "../state/store";
import type { Dialog as DialogType } from "../state/types";

const closeDialog = () => store.set((s) => ({ ...s, ui: { ...s.ui, dialog: null } }));

/* Live regions, so progress and results are announced to screen readers. */
export function Announcer() {
  const { announcement } = useAppState().ui;
  return (
    <div className="visually-hidden" role="status" aria-live="polite" data-testid="announcer">
      {announcement}
    </div>
  );
}

export function Toast() {
  const { toast } = useAppState().ui;
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(
      () => store.set((s) => ({ ...s, ui: { ...s.ui, toast: null } })),
      8000,
    );
    return () => clearTimeout(timer);
  }, [toast]);
  if (!toast) return null;
  return (
    <div className={`au-toast ${toast.tone}`} role="status" data-testid="toast">
      <span>{toast.text}</span>
      {toast.undo && (
        <button
          type="button"
          className="au-link"
          onClick={() =>
            toast.undo === "history" ? undoLast() : undoProposal(toast.undo!)
          }
        >
          Undo
        </button>
      )}
    </div>
  );
}

export function Banner({
  tone,
  children,
  actions,
  testId,
}: {
  tone: "info" | "warning" | "error" | "success";
  children: React.ReactNode;
  actions?: React.ReactNode;
  testId?: string;
}) {
  return (
    <div
      className={`au-banner ${tone}`}
      role={tone === "error" ? "alert" : "status"}
      data-testid={testId}
    >
      <span className="au-banner-text">{children}</span>
      {actions && <span className="au-banner-actions">{actions}</span>}
    </div>
  );
}

export function Modal({
  title,
  children,
  actions,
  onClose,
  wide,
}: {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  onClose?: () => void;
  wide?: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    box.current?.querySelector<HTMLElement>("[data-autofocus],button,input")?.focus();
    return () => {
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape" && onClose) {
      event.stopPropagation();
      onClose();
    }
    if (event.key !== "Tab" || !box.current) return;
    const focusable = [
      ...box.current.querySelectorAll<HTMLElement>(
        "button:not(:disabled),input,textarea,select,a[href]",
      ),
    ];
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
  return (
    <div className="au-modal-backdrop">
      <div
        ref={box}
        className={`au-modal ${wide ? "wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onKeyDown={onKeyDown}
      >
        <h2 className="au-modal-title">{title}</h2>
        <div className="au-modal-body">{children}</div>
        {actions && <div className="au-modal-actions">{actions}</div>}
      </div>
    </div>
  );
}

function DialogContent({ dialog }: { dialog: DialogType }) {
  const state = useAppState();
  switch (dialog.type) {
    case "delete":
      return (
        <Modal
          title={`Delete ${dialog.title}?`}
          onClose={closeDialog}
          actions={
            <>
              <button type="button" className="button" data-autofocus onClick={closeDialog}>
                Cancel
              </button>
              <button
                type="button"
                className="button au-danger"
                onClick={() =>
                  dialog.kind === "item" ? deleteItem(dialog.id) : deleteUnit(dialog.id)
                }
              >
                Delete
              </button>
            </>
          }
        >
          <p>
            {dialog.kind === "unit"
              ? "This removes the unit and every item in it."
              : "This removes the item and its content."}{" "}
            You can undo this straight after.
          </p>
        </Modal>
      );
    case "leave":
      return (
        <Modal
          title="Leave with unsaved changes?"
          onClose={closeDialog}
          actions={
            <>
              <button type="button" className="button" data-autofocus onClick={closeDialog}>
                Keep editing
              </button>
              <button
                type="button"
                className="button au-danger"
                onClick={() => discardUnsaved(dialog.then)}
              >
                Discard changes
              </button>
              <button
                type="button"
                className="button primary"
                onClick={() => saveThenLeave(dialog.then)}
              >
                Save and leave
              </button>
            </>
          }
        >
          <p>Your latest changes to this item haven't been saved.</p>
        </Modal>
      );
    case "discard-proposal":
      return (
        <Modal
          title="Discard Aurora's change?"
          onClose={closeDialog}
          actions={
            <>
              <button type="button" className="button" data-autofocus onClick={closeDialog}>
                Keep reviewing
              </button>
              <button
                type="button"
                className="button au-danger"
                onClick={() => discardProposal(dialog.id)}
              >
                Discard
              </button>
            </>
          }
        >
          <p>Your original stays as it is.</p>
        </Modal>
      );
    case "remove-attachment": {
      const attachment = state.attachments.find((a) => a.id === dialog.id);
      return (
        <Modal
          title={`Remove ${attachment?.name ?? "attachment"}?`}
          onClose={closeDialog}
          actions={
            <>
              <button type="button" className="button" data-autofocus onClick={closeDialog}>
                Cancel
              </button>
              <button
                type="button"
                className="button au-danger"
                onClick={() => confirmRemoveAttachment(dialog.id, false)}
              >
                Remove content too
              </button>
              <button
                type="button"
                className="button primary"
                onClick={() => confirmRemoveAttachment(dialog.id, true)}
              >
                Keep the content
              </button>
            </>
          }
        >
          <p>Aurora made content from this file. Do you want to keep that content?</p>
        </Modal>
      );
    }
    case "publish": {
      const counts = courseCounts(state.course);
      const live = state.live;
      return (
        <Modal
          title={live ? "Republish this course?" : "Publish this course?"}
          onClose={closeDialog}
          actions={
            <>
              <button type="button" className="button" data-autofocus onClick={closeDialog}>
                Cancel
              </button>
              <button type="button" className="button primary" onClick={publishCourse}>
                {live ? "Republish" : "Publish"}
              </button>
            </>
          }
        >
          {live ? (
            <p>
              {live.enrolled} enrolled learners will see your changes straight away.
              Their progress is kept.
            </p>
          ) : (
            <p>
              {state.course.title} ({counts.summary}) goes live for{" "}
              {state.publish.settings.visibility === "Public"
                ? "anyone with the link"
                : "your organisation"}
              . You can still make changes afterwards.
            </p>
          )}
        </Modal>
      );
    }
    case "session":
      return (
        <Modal
          title="Your session has expired"
          actions={
            <button type="button" className="button primary" data-autofocus onClick={signBackIn}>
              Sign in again
            </button>
          }
        >
          <p>
            Your work is safe. Sign in again and Aurora will carry on from where it
            stopped.
          </p>
        </Modal>
      );
  }
}

export function Dialogs() {
  const { dialog } = useAppState().ui;
  return dialog ? <DialogContent dialog={dialog} /> : null;
}
