import { useEffect, useRef, useState } from "react";
import { Icon } from "../components/Icon";
import { requestSelectionEdit } from "../mock/engine";
import { useAppState } from "../state/store";

/* Select text, then choose Ask Aurora. Ctrl or Cmd + K opens the menu straight away. */
const QUICK_ACTIONS = [
  "Improve writing",
  "Fix spelling & grammar",
  "Make longer",
  "Make shorter",
  "Simplify language",
];
const TONES = ["Friendlier tone", "More formal tone"];

type Anchor = { itemId: string; blockId: string; text: string; x: number; y: number };
type Prompt = { block: HTMLElement; text: string; rect: DOMRect };

export function SelectionMenu() {
  const state = useAppState();
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [tones, setTones] = useState(false);
  const [text, setText] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const enabled = state.ui.step === "plan" && state.role !== "read-only";
  const selectedItemId = state.ui.selectedItemId;

  useEffect(() => {
    if (!enabled || !selectedItemId) {
      setAnchor(null);
      setPrompt(null);
      return;
    }
    const openFor = (blockEl: HTMLElement, label: string, rect: DOMRect) => {
      setPrompt(null);
      returnFocus.current = document.activeElement as HTMLElement | null;
      setTones(false);
      setText("");
      setAnchor({
        itemId: selectedItemId,
        blockId: blockEl.dataset.blockId!,
        text: label,
        x: Math.max(8, Math.min(rect.left, window.innerWidth - 300)),
        y: Math.min(rect.bottom + 6, window.innerHeight - 330),
      });
      requestAnimationFrame(() => box.current?.querySelector("input")?.focus());
    };
    const onMouseUp = (event: MouseEvent) => {
      if (box.current?.contains(event.target as Node)) return;
      if ((event.target as HTMLElement).closest?.("[data-testid=selection-prompt]")) return;
      const selection = window.getSelection();
      const value = selection?.toString().trim();
      if (!selection || !value || selection.rangeCount === 0) {
        setPrompt(null);
        return;
      }
      const start = selection.anchorNode;
      const el = start instanceof HTMLElement ? start : start?.parentElement;
      const blockEl = el?.closest<HTMLElement>("[data-block-id]");
      if (!blockEl || !el?.closest("[data-testid=content]")) return;
      setPrompt({ block: blockEl, text: value, rect: selection.getRangeAt(0).getBoundingClientRect() });
    };
    /* Typing over the selection, or clicking away, removes the prompt. */
    const onSelectionChange = () => {
      if (window.getSelection()?.isCollapsed) setPrompt(null);
    };
    const onMouseDown = (event: MouseEvent) => {
      if (!box.current?.contains(event.target as Node)) setAnchor(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        const blockEl =
          (window.getSelection()?.anchorNode?.parentElement?.closest("[data-block-id]") as HTMLElement | null) ??
          document.querySelector<HTMLElement>("[data-testid=content] [data-block-id]");
        if (!blockEl) return;
        event.preventDefault();
        const selection = window.getSelection();
        const value = selection?.toString().trim() ?? "";
        openFor(
          blockEl,
          value,
          value && selection ? selection.getRangeAt(0).getBoundingClientRect() : blockEl.getBoundingClientRect(),
        );
      }
    };
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("selectionchange", onSelectionChange);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("selectionchange", onSelectionChange);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [enabled, selectedItemId]);

  if (prompt && !anchor) {
    const { block, text: selected, rect } = prompt;
    return (
      <button
        type="button"
        className="au-selection-prompt"
        data-testid="selection-prompt"
        style={{
          left: Math.max(8, Math.min(rect.left, window.innerWidth - 130)),
          top: rect.top > 44 ? rect.top - 36 : rect.bottom + 6,
        }}
        /* Keeps the selection while the prompt is pressed. */
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => {
          returnFocus.current = document.activeElement as HTMLElement | null;
          setPrompt(null);
          setTones(false);
          setText("");
          setAnchor({
            itemId: selectedItemId!,
            blockId: block.dataset.blockId!,
            text: selected,
            x: Math.max(8, Math.min(rect.left, window.innerWidth - 300)),
            y: Math.min(rect.bottom + 6, window.innerHeight - 330),
          });
          requestAnimationFrame(() => box.current?.querySelector("input")?.focus());
        }}
      >
        <Icon name="aiButton" />
        Ask Aurora
      </button>
    );
  }
  if (!anchor) return null;
  const close = () => {
    setAnchor(null);
    returnFocus.current?.focus?.();
  };
  const submit = (instruction: string) => {
    const clean = instruction.trim();
    if (!clean) return;
    window.getSelection()?.removeAllRanges();
    setAnchor(null);
    requestSelectionEdit(anchor.itemId, anchor.blockId, clean);
  };
  return (
    <div
      ref={box}
      className="au-selection"
      style={{ left: anchor.x, top: anchor.y }}
      role="dialog"
      aria-label="Ask Aurora about your selection"
      data-testid="selection-menu"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          close();
        }
      }}
    >
      <div className="au-selection-head">
        <Icon name="aiButton" />
        <p>Ask about this</p>
        <kbd>Esc</kbd>
        <button type="button" aria-label="Close" onClick={close}>
          <Icon name="close" />
        </button>
      </div>
      {anchor.text && (
        <blockquote className="au-selection-quote" title={anchor.text}>
          <span>Based on your selection</span>
          <q>{anchor.text}</q>
        </blockquote>
      )}
      <form
        className="au-selection-form"
        onSubmit={(event) => {
          event.preventDefault();
          submit(text);
        }}
      >
        <input
          className="au-input"
          aria-label="Ask Aurora to edit your selection"
          placeholder="Ask Aurora to edit this…"
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <button type="submit" className="au-send" aria-label="Send to Aurora" disabled={!text.trim()}>
          <Icon name="send" />
        </button>
      </form>
      <p className="au-selection-heading">Or choose</p>
      {QUICK_ACTIONS.map((action) => (
        <button key={action} type="button" className="au-selection-item" onClick={() => submit(action)}>
          {action}
        </button>
      ))}
      <button
        type="button"
        className="au-selection-item"
        aria-expanded={tones}
        onClick={() => setTones(!tones)}
      >
        Change tone ›
      </button>
      {tones &&
        TONES.map((tone) => (
          <button key={tone} type="button" className="au-selection-item indent" onClick={() => submit(tone)}>
            {tone}
          </button>
        ))}
      <p className="au-selection-note">Aurora shows you the change before it's applied.</p>
    </div>
  );
}
