import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { applyDraft, insertDraftBelow, rescopeProposal, reviseProposal } from "../mock/engine";
import { blockText } from "../mock/scripts";
import { findItem, isChangeStale } from "../state/reducer";
import { store, useAppState } from "../state/store";
import type { Block, Proposal } from "../state/types";
import { Banner } from "./Feedback";
import { Icon } from "./Icon";
import { Redline } from "./Redline";
import { askDiscard, openReview } from "./Review";

/* Aurora's suggestion sits where the section is, with the change marked and what to do next beneath it. */
export function DraftCard({
  proposal,
  renderBlock,
  canEdit,
}: {
  proposal: Proposal;
  renderBlock: (block: Block) => React.ReactNode;
  canEdit: boolean;
}) {
  const state = useAppState();
  const change = proposal.changes[0];
  const original = JSON.stringify(change.before);
  /* Every draft of this request, oldest first. The newest is the one waiting for review. */
  const drafts = state.proposals.filter(
    (p) =>
      (p.status === "superseded" || p.id === proposal.id) &&
      p.changes.length === 1 &&
      p.changes[0].blockId === change.blockId &&
      JSON.stringify(p.changes[0].before) === original,
  );
  const [page, setPage] = useState(drafts.length - 1);
  const [text, setText] = useState("");
  /* The options float over the lesson, so they close on a click away to show what's under them. */
  const [menuOpen, setMenuOpen] = useState(false);
  const [scoping, setScoping] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const more = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  /* Placed against the screen, so the lesson's scrolling area can't cut it off. */
  useLayoutEffect(() => {
    if (!menuOpen) return;
    const GAP = 4;
    const EDGE = 8;
    const fitsBelow = () =>
      more.current!.getBoundingClientRect().bottom + GAP + menu.current!.offsetHeight <=
      window.innerHeight - EDGE;
    const place = () => {
      const el = menu.current;
      const anchor = more.current?.getBoundingClientRect();
      if (!el || !anchor) return;
      const area = box.current?.closest(".ai-main")?.getBoundingClientRect();
      if (area && (anchor.bottom < area.top || anchor.top > area.bottom)) {
        setMenuOpen(false);
        return;
      }
      const below = fitsBelow();
      el.style.top = `${below ? anchor.bottom + GAP : Math.max(EDGE, anchor.top - GAP - el.offsetHeight)}px`;
      el.style.left = `${Math.max(EDGE, anchor.right - el.offsetWidth)}px`;
    };
    /* Without room below, bring the draft up first so the menu doesn't cover it. */
    if (!fitsBelow()) box.current?.querySelector(".au-draft-card")?.scrollIntoView({ block: "start" });
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [menuOpen, scoping]);
  useEffect(() => {
    if (!menuOpen) return;
    const away = (event: MouseEvent) => {
      if (box.current?.contains(event.target as Node)) return;
      setMenuOpen(false);
      setScoping(false);
    };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [menuOpen]);
  const shown = drafts[Math.min(page, drafts.length - 1)] ?? proposal;
  const after = shown.changes[0].after;
  const basis = proposal.source ? `From ${proposal.source}` : shown.basis;
  const stale = isChangeStale(state, change.itemId, change.before, change.blockId);
  const next = (instruction: string) => reviseProposal(proposal.id, instruction);
  const close = () => {
    setMenuOpen(false);
    setScoping(false);
  };
  const editMyself = () =>
    store.set((s) => ({
      ...s,
      ui: { ...s.ui, editAnyway: [...s.ui.editAnyway, change.itemId] },
    }));
  const item = findItem(state.course, change.itemId);
  const otherBlocks = item?.blocks.filter((b) => b.id !== change.blockId) ?? [];
  const ACTIONS: { label: string; run: () => void; disabled?: boolean }[] = [
    { label: "Insert below", run: () => after && insertDraftBelow(proposal.id, after), disabled: stale },
    { label: "Continue writing", run: () => next("Continue writing") },
    { label: "Make longer", run: () => next("Make longer") },
    { label: "Simplify", run: () => next("Simplify") },
  ];
  const MANAGE: { label: string; run: () => void }[] = [
    { label: "Review changes", run: () => openReview(proposal.id) },
    { label: "Try again", run: () => next(proposal.instruction) },
  ];
  return (
    <div
      ref={box}
      className="au-draft"
      data-testid="updated-bar"
      onKeyDown={(event) => {
        if (event.key === "Escape" && menuOpen) {
          event.stopPropagation();
          setMenuOpen(false);
          setScoping(false);
        }
      }}
    >
      <div className="au-draft-card">
        <p className="au-draft-label">
          <Icon name="aiButton" />
          <span className="au-draft-title">Aurora's suggested edit</span>
          <span className="au-draft-state">Not applied yet</span>
        </p>
        <div className="au-draft-result" tabIndex={0} aria-label="Aurora's suggested edit" data-testid="draft-result">
          {after && <Redline before={change.before} after={after} fallback={renderBlock} />}
        </div>
        {basis && (
          <p className="au-draft-source" data-testid="draft-source">
            Source: {basis}
          </p>
        )}
        {proposal.warning && <Banner tone="warning">{proposal.warning}</Banner>}
        {stale && (
          <Banner tone="warning" testId="stale">
            This is out of date because you edited this section. Select Try again for a new draft.
          </Banner>
        )}
        <div className="au-draft-actions">
          {canEdit && (
            <button type="button" className="button small" onClick={editMyself}>
              <Icon name="edit" />
              Edit
            </button>
          )}
          <span className="au-draft-spacer" />
          <button
            ref={more}
            type="button"
            className="au-draft-more"
            aria-label="More options"
            aria-expanded={menuOpen}
            data-testid="draft-options"
            onClick={() => (menuOpen ? close() : setMenuOpen(true))}
          >
            <Icon name="more" />
          </button>
          <button type="button" className="button small au-draft-discard" onClick={() => askDiscard(proposal.id)}>
            Discard
          </button>
          <button
            type="button"
            className="button primary small"
            disabled={stale}
            onClick={() => after && applyDraft(proposal.id, after)}
          >
            Apply
          </button>
        </div>
        <form
          className="au-draft-bar"
          onSubmit={(event) => {
            event.preventDefault();
            if (text.trim()) next(text.trim());
          }}
        >
          <Icon name="aiButton" />
          <input
            aria-label="Tell Aurora what to do next"
            placeholder="Tell Aurora what to do next…"
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
          <button type="submit" className="au-draft-send" aria-label="Send to Aurora" disabled={!text.trim()}>
            <Icon name="send" />
          </button>
          {drafts.length > 1 && (
            <span className="au-draft-pages" data-testid="draft-pages">
              <button
                type="button"
                aria-label="Previous draft"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
              >
                <Icon name="back" />
              </button>
              {Math.min(page, drafts.length - 1) + 1} of {drafts.length}
              <button
                type="button"
                aria-label="Next draft"
                disabled={page >= drafts.length - 1}
                onClick={() => setPage(page + 1)}
              >
                <Icon name="back" className="au-flip" />
              </button>
            </span>
          )}
        </form>
      </div>
      {menuOpen && (
        <div ref={menu} className="au-draft-menu" role="group" aria-label="More options for this draft">
          {scoping ? (
            <>
              <p className="au-draft-menu-title">Which section should Aurora change?</p>
              {otherBlocks.map((block) => (
                <button
                  key={block.id}
                  type="button"
                  onClick={() => {
                    close();
                    rescopeProposal(proposal.id, block.id);
                  }}
                >
                  {blockText(block).split("\n")[0]}
                </button>
              ))}
            </>
          ) : (
            <>
              {ACTIONS.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  disabled={action.disabled}
                  onClick={() => {
                    close();
                    action.run();
                  }}
                >
                  {action.label}
                </button>
              ))}
              <hr />
              {MANAGE.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => {
                    close();
                    action.run();
                  }}
                >
                  {action.label}
                </button>
              ))}
              {proposal.kind === "small" && otherBlocks.length > 0 && (
                <button type="button" onClick={() => setScoping(true)}>
                  Wrong part? Choose another section
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
