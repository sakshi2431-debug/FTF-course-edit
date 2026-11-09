import React, { useLayoutEffect, useRef, useState } from "react";
import { store } from "../state/store";

/* Pasted Word and Docs text keeps its words and bullets, not its styling. */
export function cleanPastedHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("li").forEach((li) => {
    li.textContent = `• ${li.textContent?.trim()}\n`;
  });
  doc.querySelectorAll("p,div,h1,h2,h3,br").forEach((el) => el.append("\n"));
  return (doc.body.textContent ?? "").replace(/\n{2,}/g, "\n").trim();
}

function caretOffset(el: HTMLElement): { start: number; end: number } | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  if (!el.contains(range.startContainer)) return null;
  const before = range.cloneRange();
  before.selectNodeContents(el);
  before.setEnd(range.startContainer, range.startOffset);
  const start = before.toString().length;
  return { start, end: start + range.toString().length };
}

function placeCaret(el: HTMLElement, offset: number) {
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  let left = offset;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    const length = node.textContent?.length ?? 0;
    if (left <= length) {
      range.setStart(node, left);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      return;
    }
    left -= length;
    node = walker.nextNode();
  }
  range.selectNodeContents(el);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

/* Moves the cursor into a field after the document has re-rendered. */
export function focusField(field: string, at: "start" | "end" | number = "end") {
  requestAnimationFrame(() => {
    const el = document.querySelector<HTMLElement>(`[data-edit="${field}"]`);
    if (!el) return;
    el.focus();
    if (!el.isContentEditable) return;
    const length = el.textContent?.length ?? 0;
    placeCaret(el, at === "start" ? 0 : at === "end" ? length : at);
  });
}

type Props = {
  field: string;
  value: string;
  label: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
  required?: boolean;
  /* Draws the value when the field isn't being typed in, such as code colours. */
  highlight?: (value: string) => string;
  /* Enter without Shift. Receives the text on either side of the cursor. */
  onEnter?: (before: string, after: string) => void;
  onBackspaceAtStart?: () => void;
  onSlash?: () => void;
  testId?: string;
};

/* Text you click into and type, with the same look as reading it. No box and no edit mode. */
export function EditableText({
  field,
  value,
  label,
  onChange,
  className = "",
  placeholder,
  multiline,
  required,
  highlight,
  onEnter,
  onBackspaceAtStart,
  onSlash,
  testId,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [focused, setFocused] = useState(false);
  const focusedRef = useRef(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!focusedRef.current && highlight) {
      el.innerHTML = highlight(value);
      return;
    }
    if (el.textContent !== value) {
      el.textContent = value;
      if (focusedRef.current) placeCaret(el, value.length);
    }
  }, [value, highlight]);

  const empty = !value;
  const invalid = required && !value.trim();

  const onKeyDown = (event: React.KeyboardEvent<HTMLSpanElement>) => {
    const el = event.currentTarget;
    const mod = event.metaKey || event.ctrlKey;
    /* The course history is the one undo, so typing and Aurora's changes share it. */
    if (mod && event.key.toLowerCase() === "z") {
      event.preventDefault();
      store.dispatch({ type: "END_TYPING" });
      store.dispatch({ type: event.shiftKey ? "REDO" : "UNDO" });
      return;
    }
    if (event.key === "Escape") {
      el.blur();
      return;
    }
    if (event.key === "Enter" && !event.shiftKey) {
      if (onEnter) {
        event.preventDefault();
        const caret = caretOffset(el) ?? { start: value.length, end: value.length };
        onEnter(value.slice(0, caret.start), value.slice(caret.end));
      } else if (!multiline) {
        event.preventDefault();
        el.blur();
      }
      return;
    }
    if (event.key === "Enter" && !multiline) {
      event.preventDefault();
      return;
    }
    if (event.key === "Backspace" && onBackspaceAtStart) {
      const caret = caretOffset(el);
      if (caret && caret.start === 0 && caret.end === 0) {
        event.preventDefault();
        onBackspaceAtStart();
      }
    }
  };

  const onPaste = (event: React.ClipboardEvent<HTMLSpanElement>) => {
    event.preventDefault();
    const html = event.clipboardData.getData("text/html");
    const text = html ? cleanPastedHtml(html) : event.clipboardData.getData("text/plain");
    const el = event.currentTarget;
    const caret = caretOffset(el) ?? { start: value.length, end: value.length };
    const inserted = multiline ? text : text.replace(/\s*\n\s*/g, " ");
    el.textContent = value.slice(0, caret.start) + inserted + value.slice(caret.end);
    placeCaret(el, caret.start + inserted.length);
    onChange(el.textContent);
    if (html) {
      store.set((s) => ({
        ...s,
        ui: {
          ...s.ui,
          toast: { text: "Pasted your text and removed its formatting. Bullets are kept.", tone: "info" },
        },
      }));
    }
  };

  return (
    <>
      <span
        ref={ref}
        className={`au-editable ${empty ? "is-empty" : ""} ${className}`}
        contentEditable="plaintext-only"
        suppressContentEditableWarning
        role="textbox"
        tabIndex={0}
        aria-label={label}
        aria-multiline={multiline || undefined}
        aria-invalid={invalid || undefined}
        data-edit={field}
        data-placeholder={placeholder}
        data-testid={testId}
        spellCheck
        onFocus={() => {
          focusedRef.current = true;
          setFocused(true);
        }}
        onBlur={(event) => {
          focusedRef.current = false;
          setFocused(false);
          store.dispatch({ type: "END_TYPING" });
          if (highlight) event.currentTarget.innerHTML = highlight(value);
        }}
        onInput={(event) => {
          const raw = event.currentTarget.textContent ?? "";
          const text = raw === "\n" ? "" : raw;
          if (text === "/" && onSlash) {
            event.currentTarget.textContent = "";
            onSlash();
            return;
          }
          onChange(text);
        }}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
      />
      {invalid && !focused && (
        <span className="au-field-error" role="alert" data-testid="required-error">
          {label} is required.
        </span>
      )}
    </>
  );
}
