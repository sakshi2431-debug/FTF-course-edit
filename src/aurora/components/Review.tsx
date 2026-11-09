import { useState } from "react";
import {
  applyProposal,
  closeAurora,
  refreshProposal,
  rescopeProposal,
  reviseProposal,
  setChangeDecision,
  undoProposal,
} from "../mock/engine";
import { blockText, wordDiff } from "../mock/scripts";
import { findItem, isChangeStale } from "../state/reducer";
import { store, useAppState } from "../state/store";
import type { Proposal, ProposalChange } from "../state/types";
import { Banner, Modal } from "./Feedback";

/* Removed text is struck through and added text underlined, so colour isn't the only signal. */
export function DiffView({ change }: { change: ProposalChange }) {
  const before = blockText(change.before);
  const after = blockText(change.after);
  if (!change.before) {
    return (
      <div className="au-diff" data-testid="diff">
        <p className="au-diff-label">New content</p>
        <p className="au-diff-text">
          <ins>{after}</ins>
        </p>
      </div>
    );
  }
  const parts = wordDiff(before, after);
  const changed = parts
    .filter((part) => part.type !== "same")
    .reduce((total, part) => total + part.text.length, 0);
  /* A heavy rewrite is unreadable word by word, so show it as two passages. */
  if (changed / Math.max(1, before.length + after.length) > 0.4) {
    return (
      <div className="au-diff" data-testid="diff">
        <p className="au-diff-label">Before</p>
        <p className="au-diff-text">
          <del>{before}</del>
        </p>
        <p className="au-diff-label">After</p>
        <p className="au-diff-text">
          <ins>{after}</ins>
        </p>
      </div>
    );
  }
  return (
    <div className="au-diff" data-testid="diff">
      <p className="au-diff-label">Before and after</p>
      <p className="au-diff-text">
        {parts.map((part, index) =>
          part.type === "added" ? (
            <ins key={index}>
              <span className="visually-hidden">Added: </span>
              {part.text}
            </ins>
          ) : part.type === "removed" ? (
            <del key={index}>
              <span className="visually-hidden">Removed: </span>
              {part.text}
            </del>
          ) : (
            <span key={index}>{part.text}</span>
          ),
        )}
      </p>
    </div>
  );
}

export const openReview = (id: string) =>
  store.set((s) => ({ ...s, ui: { ...s.ui, reviewProposalId: id } }));

export const askDiscard = (id: string) =>
  store.set((s) => ({ ...s, ui: { ...s.ui, dialog: { type: "discard-proposal", id } } }));

const STATUS_LABEL: Record<Proposal["status"], string> = {
  pending: "Waiting for your review",
  applied: "Applied",
  discarded: "Discarded. Your original is unchanged",
  superseded: "Replaced by a newer draft",
  undone: "Undone",
  inserted: "Added below your original",
};

export function ProposalCard({ proposal }: { proposal: Proposal }) {
  const state = useAppState();
  const [revising, setRevising] = useState(false);
  const [text, setText] = useState("");
  const [scoping, setScoping] = useState(false);
  const pending = proposal.status === "pending";
  const single = proposal.changes.length === 1 ? proposal.changes[0] : null;
  const stale = proposal.changes.some((c) =>
    isChangeStale(state, c.itemId, c.before, c.blockId),
  );
  const item = single ? findItem(state.course, single.itemId) : null;
  /* A draft of an existing section is decided in the lesson. The chat only points to it. */
  const inLesson =
    pending &&
    state.ui.step === "plan" &&
    !!single?.blockId &&
    !!single.before &&
    !state.ui.editAnyway.includes(single.itemId) &&
    !!item?.blocks.some((b) => b.id === single.blockId);
  const goToDraft = () => {
    if (!single?.blockId) return;
    const target = single.blockId;
    if (window.matchMedia("(max-width: 1099px)").matches) closeAurora();
    store.set((s) => ({
      ...s,
      ui: { ...s.ui, selectedItemId: single.itemId, tab: "content", scrollTarget: target },
    }));
    requestAnimationFrame(() => {
      document
        .querySelector<HTMLElement>(`[data-block-id="${target}"] .au-draft-result`)
        ?.focus({ preventScroll: true });
    });
  };

  return (
    <div className={`au-proposal ${pending ? "" : "closed"}`} data-testid="proposal">
      <div className="au-proposal-head">
        <p className="au-proposal-title">{proposal.title}</p>
        <p className="au-muted">{proposal.summary}</p>
        {proposal.source && (
          <p className="au-source" data-testid="source">
            Source: {proposal.source}
          </p>
        )}
      </div>
      {!pending && (
        <p className="au-proposal-status" data-testid="proposal-status">
          {STATUS_LABEL[proposal.status]}
        </p>
      )}
      {pending && proposal.warning && <Banner tone="warning">{proposal.warning}</Banner>}
      {pending && stale && (
        <Banner
          tone="warning"
          testId="stale"
          actions={
            <button type="button" className="au-link" onClick={() => refreshProposal(proposal.id)}>
              Update the proposal
            </button>
          }
        >
          This is out of date because you edited an affected item.
        </Banner>
      )}
      {inLesson && (
        <p className="au-proposal-status" data-testid="draft-pointer">
          Your draft is ready in the lesson.{" "}
          <button type="button" className="au-link" onClick={goToDraft}>
            Go to draft
          </button>
        </p>
      )}
      {pending && single && !inLesson && <DiffView change={single} />}
      {pending && !single && (
        <ul className="au-change-list">
          {proposal.changes.map((change) => (
            <li key={change.id}>{change.itemTitle}</li>
          ))}
        </ul>
      )}
      {pending && !inLesson && (
        <div className="au-proposal-actions">
          <button
            type="button"
            className="button primary small"
            disabled={stale}
            onClick={() => (single ? applyProposal(proposal.id) : openReview(proposal.id))}
          >
            {single ? "Apply" : "Review"}
          </button>
          <button type="button" className="button small" onClick={() => askDiscard(proposal.id)}>
            Discard
          </button>
          {single && (
            <button
              type="button"
              className="button small"
              aria-expanded={revising}
              onClick={() => setRevising(!revising)}
            >
              Revise
            </button>
          )}
        </div>
      )}
      {pending && !inLesson && single && item && item.blocks.length > 1 && proposal.kind === "small" && (
        <button
          type="button"
          className="au-link au-left"
          aria-expanded={scoping}
          onClick={() => setScoping(!scoping)}
        >
          Wrong part? Choose another section
        </button>
      )}
      {pending && !inLesson && scoping && item && (
        <ul className="au-scope-list">
          {item.blocks
            .filter((b) => b.id !== single?.blockId)
            .map((block) => (
              <li key={block.id}>
                <button
                  type="button"
                  className="button small au-full"
                  onClick={() => rescopeProposal(proposal.id, block.id)}
                >
                  {blockText(block).split("\n")[0]}
                </button>
              </li>
            ))}
        </ul>
      )}
      {pending && !inLesson && revising && (
        <form
          className="au-revise"
          onSubmit={(event) => {
            event.preventDefault();
            if (text.trim()) reviseProposal(proposal.id, text.trim());
          }}
        >
          <label className="au-field">
            <span className="au-field-label">What should change?</span>
            <input
              className="au-input"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="For example, make it shorter"
            />
          </label>
          <button type="submit" className="button small">
            Send
          </button>
        </form>
      )}
      {proposal.status === "applied" && (
        <button type="button" className="au-link au-left" onClick={() => undoProposal(proposal.id)}>
          Undo
        </button>
      )}
    </div>
  );
}

/* Before and after review across several items, with partial apply. */
export function ReviewDialog() {
  const state = useAppState();
  const proposal = state.proposals.find((p) => p.id === state.ui.reviewProposalId);
  if (!proposal) return null;
  const close = () => store.set((s) => ({ ...s, ui: { ...s.ui, reviewProposalId: null } }));
  const accepted = proposal.changes.filter((c) => c.decision === "accept").length;
  const total = proposal.changes.length;
  const stale = proposal.changes.some((c) =>
    isChangeStale(state, c.itemId, c.before, c.blockId),
  );
  return (
    <Modal
      wide
      title={proposal.title}
      onClose={close}
      actions={
        <>
          <button type="button" className="button" onClick={close}>
            Back
          </button>
          <button type="button" className="button" onClick={() => askDiscard(proposal.id)}>
            Discard all
          </button>
          <button
            type="button"
            className="button primary"
            disabled={stale || accepted === 0}
            onClick={() => applyProposal(proposal.id, true)}
          >
            {accepted === total
              ? `Apply ${total} ${total === 1 ? "change" : "changes"}`
              : `Apply ${accepted} of ${total} changes`}
          </button>
        </>
      }
    >
      <p className="au-muted" tabIndex={-1} data-autofocus>
        {proposal.summary}
      </p>
      {proposal.warning && <Banner tone="warning">{proposal.warning}</Banner>}
      {stale && (
        <Banner
          tone="warning"
          testId="stale"
          actions={
            <button type="button" className="au-link" onClick={() => refreshProposal(proposal.id)}>
              Update the proposal
            </button>
          }
        >
          This proposal is out of date because you edited an affected item.
        </Banner>
      )}
      <div className="au-review-list">
        {proposal.changes.map((change) => (
          <section className="au-review-row" key={change.id} data-testid="review-row">
            <div className="au-review-head">
              <h3 className="au-review-title">
                {change.itemTitle}
                {isChangeStale(state, change.itemId, change.before, change.blockId) && (
                  <span className="au-stale-tag">Out of date</span>
                )}
              </h3>
              <fieldset className="au-decision">
                <legend className="visually-hidden">Decision for {change.itemTitle}</legend>
                {(["accept", "reject"] as const).map((decision) => (
                  <label key={decision} className={change.decision === decision ? "checked" : ""}>
                    <input
                      className="visually-hidden"
                      type="radio"
                      name={`decision-${change.id}`}
                      checked={change.decision === decision}
                      onChange={() => setChangeDecision(proposal.id, change.id, decision)}
                    />
                    {decision === "accept" ? "Accept" : "Reject"}
                  </label>
                ))}
              </fieldset>
            </div>
            <DiffView change={change} />
          </section>
        ))}
      </div>
    </Modal>
  );
}
