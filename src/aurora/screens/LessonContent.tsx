import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { EditableText, focusField } from "../components/EditableText";
import { FlagLabel } from "../components/Findings";
import { Icon } from "../components/Icon";
import { openAurora, undoProposal } from "../mock/engine";
import { DraftCard } from "../components/DraftCard";
import { activeOps, pendingChange } from "../state/reducer";
import { store, useAppState } from "../state/store";
import type { Block, ImageLayout, Item } from "../state/types";
import { askDiscard, openReview } from "../components/Review";
import {
  addQuestion,
  blocksOf,
  lineKeys,
  newBlockId as newId,
  QuestionCard,
  QuizHeader,
  QuizRail,
  setBlocks,
} from "./QuizEditor";

/* Colours strings and punctuation the way the frame's code sample does. */
function CodeText({ code }: { code: string }) {
  return (
    <code className="au-code-text">
      {code.split(/("[^"]*"|[()[\]{}:,=])/).map((part, index) =>
        part.startsWith('"') ? (
          <span key={index} className="code-string">
            {part}
          </span>
        ) : /^[()[\]{}:,=]$/.test(part) ? (
          <span key={index} className="code-punctuation">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </code>
  );
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  return (
    <div className="code-margin">
      <div className="code">
        <div className="code-language">
          <Icon name="code" />
          {language}
        </div>
        <div className="code-line au-code-line">
          <CodeText code={code} />
          <button
            type="button"
            aria-label="Copy example"
            onClick={() => navigator.clipboard?.writeText(code)}
          >
            <Icon name="copy" />
          </button>
        </div>
      </div>
    </div>
  );
}

function LessonImage({ image }: { image: string }) {
  return <img className="lesson-image au-replaced-image" src={image} alt="" />;
}

const imageClass = (layout: ImageLayout = "beside") => `lesson-intro au-with-image au-image-${layout}`;

export function ViewBlock({ block }: { block: Block }) {
  switch (block.type) {
    case "intro":
    case "paragraph": {
      const text = (
        <div className={`lesson-intro-text${block.type === "paragraph" ? " au-paragraph" : ""}`}>
          <h3 className="lesson-heading">{block.heading}</h3>
          <p className="lesson-paragraph">{block.text}</p>
        </div>
      );
      if (!block.image) return block.type === "intro" ? <div className="lesson-intro">{text}</div> : text;
      return (
        <div className={imageClass(block.imageLayout)}>
          {text}
          <figure className="au-figure">
            <LessonImage image={block.image} />
          </figure>
        </div>
      );
    }
    case "features":
      return (
        <div className="lesson-features">
          <h4 className="lesson-subheading">{block.heading}</h4>
          <ul className="feature-list">
            {block.items.map((feature, index) => (
              <li key={index} className="feature">
                <span className="checkbox">
                  <Icon name="check" />
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      );
    case "code":
      return (
        <div className="lesson-examples">
          <h4 className="lesson-subheading">{block.heading}</h4>
          <CodeBlock language={block.language} code={block.code} />
        </div>
      );
    case "video":
      return (
        <div className="au-video">
          <span className="au-video-icon">
            <Icon name="videoLarge" />
          </span>
          <div>
            <p className="au-video-title">{block.title}</p>
            <p className="au-muted">
              {[block.duration, block.url].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
      );
    case "question":
      return (
        <div className="au-question">
          <p className="au-question-title">{block.question}</p>
          <ul className="au-question-options">
            {block.options.map((option, index) => (
              <li key={index} className={index === block.correctIndex ? "correct" : undefined}>
                {option}
                {index === block.correctIndex && (
                  <span className="au-correct-label">Correct answer</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      );
  }
}

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* The same colours as CodeText, for code you can type into. */
const highlightCode = (code: string) =>
  code
    .split(/("[^"]*"|[()[\]{}:,=])/)
    .map((part) =>
      part.startsWith('"')
        ? `<span class="code-string">${escapeHtml(part)}</span>`
        : /^[()[\]{}:,=]$/.test(part)
          ? `<span class="code-punctuation">${escapeHtml(part)}</span>`
          : escapeHtml(part),
    )
    .join("");

/* A heading is optional on a text section, so this keeps an empty one open while you fill it in. */
const openHeadings = new Set<string>();

type AddKind = "text" | "heading" | "list" | "code" | "video" | "question";

const ADD_OPTIONS: { kind: AddKind; label: string }[] = [
  { kind: "text", label: "Text" },
  { kind: "heading", label: "Heading and text" },
  { kind: "list", label: "List" },
  { kind: "code", label: "Code" },
  { kind: "video", label: "Video" },
  { kind: "question", label: "Question" },
];

function buildBlock(kind: AddKind): { block: Block; field: string } {
  const id = newId();
  switch (kind) {
    case "text":
      return { block: { id, type: "paragraph", heading: "", text: "" }, field: `${id}:text` };
    case "heading":
      openHeadings.add(id);
      return { block: { id, type: "paragraph", heading: "", text: "" }, field: `${id}:heading` };
    case "list":
      return { block: { id, type: "features", heading: "", items: [""] }, field: `${id}:item:0` };
    case "code":
      return { block: { id, type: "code", heading: "", language: "Python", code: "" }, field: `${id}:code` };
    case "video":
      return { block: { id, type: "video", title: "", url: "", duration: "" }, field: `${id}:url-input` };
    case "question":
      return {
        block: { id, type: "question", format: "multiple", question: "", options: ["", ""], correctIndex: null },
        field: `${id}:question`,
      };
  }
}

function isBlank(block: Block): boolean {
  switch (block.type) {
    case "intro":
      return false;
    case "paragraph":
      return !block.heading.trim() && !block.text.trim() && !block.image;
    case "features":
      return !block.heading.trim() && block.items.every((item) => !item.trim());
    case "code":
      return !block.heading.trim() && !block.code.trim();
    case "video":
      return !block.title.trim() && !block.url.trim();
    case "question":
      return false;
  }
}

/* Where a new block goes: after a block, in place of an empty one, or at the end. */
type MenuAt = { afterId: string | null; replaceId?: string };

/* Arrow keys move through a menu and Escape closes it. */
/* Near the bottom of the view a menu opens upward, so opening it doesn't scroll the page. */
function useOpenUpward(menu: React.RefObject<HTMLDivElement | null>, open = true) {
  useLayoutEffect(() => {
    const el = menu.current;
    const anchor = el?.parentElement?.getBoundingClientRect();
    if (!open || !el || !anchor) return;
    const scroller = el.closest(".ai-main");
    const area =
      scroller && getComputedStyle(scroller).overflowY !== "visible"
        ? scroller.getBoundingClientRect()
        : { top: 0, bottom: window.innerHeight };
    const noRoomBelow = el.getBoundingClientRect().bottom > area.bottom;
    const roomAbove = anchor.top - el.offsetHeight >= area.top;
    el.classList.toggle("au-menu-up", noRoomBelow && roomAbove);
  }, [menu, open]);
}

function menuKeys(event: React.KeyboardEvent<HTMLDivElement>, onClose: () => void) {
  const buttons = [...event.currentTarget.querySelectorAll("button:not(:disabled)")] as HTMLButtonElement[];
  const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
  if (event.key === "ArrowDown") {
    event.preventDefault();
    buttons[(index + 1) % buttons.length].focus();
  }
  if (event.key === "ArrowUp") {
    event.preventDefault();
    buttons[(index - 1 + buttons.length) % buttons.length].focus();
  }
  if (event.key === "Escape") {
    event.stopPropagation();
    onClose();
  }
}

function placeBlock(itemId: string, at: MenuAt, block: Block) {
  const blocks = blocksOf(itemId);
  let next: Block[];
  if (at.replaceId) next = blocks.map((b) => (b.id === at.replaceId ? block : b));
  else if (at.afterId) {
    const index = blocks.findIndex((b) => b.id === at.afterId);
    next = [...blocks.slice(0, index + 1), block, ...blocks.slice(index + 1)];
  } else next = [...blocks, block];
  setBlocks(itemId, next);
}

function addBlock(itemId: string, at: MenuAt, kind: AddKind) {
  const { block, field } = buildBlock(kind);
  placeBlock(itemId, at, block);
  focusField(field, "start");
}

/* An image joins the text it was added after. With no free text there, it starts a new text block. */
function addImage(itemId: string, at: MenuAt, image: string, imageLayout: ImageLayout) {
  const blocks = blocksOf(itemId);
  const targetId = at.replaceId ?? at.afterId ?? blocks[blocks.length - 1]?.id;
  const target = blocks.find((b) => b.id === targetId);
  if (target && (target.type === "paragraph" || target.type === "intro") && !target.image) {
    setBlocks(itemId, blocks.map((b) => (b.id === target.id ? { ...target, image, imageLayout } : b)));
    return;
  }
  const id = newId();
  placeBlock(itemId, at, { id, type: "paragraph", heading: "", text: "", image, imageLayout });
  focusField(`${id}:text`, "start");
}

const readImage = (file: File, done: (image: string) => void) => {
  const reader = new FileReader();
  reader.onload = () => done(String(reader.result));
  reader.readAsDataURL(file);
};

const IMAGE_LAYOUTS: { layout: ImageLayout; label: string }[] = [
  { layout: "below", label: "Below the text" },
  { layout: "beside", label: "Beside the text" },
];

function LayoutThumb({ layout }: { layout: ImageLayout }) {
  return (
    <span className={`au-layout-thumb ${layout}`} aria-hidden>
      <span className="au-layout-lines">
        <i />
        <i />
      </span>
      <b />
    </span>
  );
}

function AddMenu({
  itemId,
  at,
  onClose,
}: {
  itemId: string;
  at: MenuAt;
  onClose: () => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  /* Choosing an image is a second step in the same menu. Nothing is added until a file is picked. */
  const [placingImage, setPlacingImage] = useState(false);
  const layout = useRef<ImageLayout>("below");
  useOpenUpward(box);
  useEffect(() => {
    box.current?.querySelector("button")?.focus();
    box.current?.scrollIntoView({ block: "nearest" });
    const away = (event: MouseEvent) => {
      if (!box.current?.contains(event.target as Node)) onClose();
    };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [onClose]);
  useEffect(() => {
    box.current?.querySelector("button")?.focus();
  }, [placingImage]);
  const fromDocument = () => {
    onClose();
    openAurora();
    store.set((s) => ({ ...s, ui: { ...s.ui, attachOpen: true } }));
  };
  return (
    <div
      ref={box}
      className={`au-add-menu au-block-menu${placingImage ? " au-add-image" : ""}`}
      role="menu"
      aria-label={placingImage ? "Where should the image go?" : "Add to this lesson"}
      data-testid="add-menu"
      onKeyDown={(event) => {
        if (placingImage && event.key === "Escape") {
          event.stopPropagation();
          setPlacingImage(false);
          return;
        }
        menuKeys(event, onClose);
      }}
    >
      {placingImage ? (
        <>
          <p className="au-add-menu-title">Where should the image go?</p>
          {IMAGE_LAYOUTS.map((option) => (
            <button
              key={option.layout}
              type="button"
              role="menuitem"
              onClick={() => {
                layout.current = option.layout;
                input.current?.click();
              }}
            >
              <LayoutThumb layout={option.layout} />
              {option.label}
            </button>
          ))}
          <input
            ref={input}
            className="visually-hidden"
            type="file"
            accept="image/*"
            tabIndex={-1}
            aria-label="Choose an image"
            data-testid="image-input"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              readImage(file, (image) => {
                onClose();
                addImage(itemId, at, image, layout.current);
              });
            }}
          />
        </>
      ) : (
        <>
          {ADD_OPTIONS.map((option) => (
            <button
              key={option.kind}
              type="button"
              role="menuitem"
              onClick={() => {
                onClose();
                addBlock(itemId, at, option.kind);
              }}
            >
              {option.label}
            </button>
          ))}
          <button type="button" role="menuitem" onClick={() => setPlacingImage(true)}>
            Image
          </button>
          <button type="button" role="menuitem" onClick={fromDocument}>
            From a document
          </button>
        </>
      )}
    </div>
  );
}

/* The handle beside a block. Delete sits in its menu, so one stray click can't remove a block. */
function BlockHandle({
  block,
  item,
  onAddBelow,
}: {
  block: Block;
  item: Item;
  onAddBelow: () => void;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLSpanElement>(null);
  const handle = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  useOpenUpward(menu, open);
  const close = () => {
    setOpen(false);
    handle.current?.focus();
  };
  useEffect(() => {
    if (!open) return;
    box.current?.querySelector<HTMLButtonElement>("[role=menuitem]")?.focus();
    box.current?.querySelector("[role=menu]")?.scrollIntoView({ block: "nearest" });
    const away = (event: MouseEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [open]);
  const blocks = item.blocks;
  const index = blocks.findIndex((b) => b.id === block.id);
  const move = (by: number) => {
    const next = [...blocksOf(item.id)];
    const from = next.findIndex((b) => b.id === block.id);
    const [moved] = next.splice(from, 1);
    next.splice(from + by, 0, moved);
    setBlocks(item.id, next);
    close();
  };
  return (
    <span ref={box} className={`au-block-tools ${open ? "is-open" : ""}`}>
      <button
        ref={handle}
        type="button"
        aria-label="Block options"
        aria-haspopup="menu"
        aria-expanded={open}
        data-testid="block-handle"
        onClick={() => setOpen(!open)}
      >
        <Icon name="drag" />
      </button>
      {open && (
        <div
          ref={menu}
          className="au-add-menu au-block-menu"
          role="menu"
          aria-label="Block options"
          data-testid="block-menu"
          onKeyDown={(event) => menuKeys(event, close)}
        >
          <button
            type="button"
            role="menuitem"
            data-testid="add-below"
            onClick={() => {
              setOpen(false);
              onAddBelow();
            }}
          >
            Add a block below
          </button>
          <button type="button" role="menuitem" disabled={index <= 0} onClick={() => move(-1)}>
            Move up
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={index >= blocks.length - 1}
            onClick={() => move(1)}
          >
            Move down
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setBlocks(item.id, blocksOf(item.id).filter((b) => b.id !== block.id));
              store.set((s) => ({
                ...s,
                ui: { ...s.ui, toast: { text: "Block deleted. Select Undo to bring it back.", tone: "info" } },
              }));
            }}
          >
            Delete
          </button>
        </div>
      )}
    </span>
  );
}

/* Adding a video, from Figma 3600:9459. */
function VideoEmbed({ field, onEmbed }: { field: string; onEmbed: (url: string) => void }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const errorId = `${field}-error`;
  const submit = () => {
    const clean = url.trim();
    if (!clean) {
      setError("Paste a video link first.");
      return;
    }
    const full = /^https?:\/\//i.test(clean) ? clean : `https://${clean}`;
    let valid = !/\s/.test(clean);
    try {
      valid = valid && new URL(full).hostname.includes(".");
    } catch {
      valid = false;
    }
    if (!valid) {
      setError("That doesn't look like a link. Try one like https://youtube.com/watch?v=abc123.");
      return;
    }
    onEmbed(full);
  };
  return (
    <form
      className="au-embed"
      data-testid="video-embed"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <span className="au-video-icon">
        <Icon name="videoLarge" />
      </span>
      <p className="au-embed-title">Embed from Link</p>
      <p className="au-muted">Paste a video URL to embed it directly in your lesson.</p>
      <div className="au-embed-row">
        <input
          className={`au-input ${error ? "invalid" : ""}`}
          aria-label="Video link"
          aria-invalid={!!error || undefined}
          aria-describedby={error ? errorId : undefined}
          data-edit={field}
          placeholder="https://youtube.com/watch?v=..."
          value={url}
          onChange={(event) => {
            setUrl(event.target.value);
            setError("");
          }}
        />
        <button
          type="submit"
          className="button primary"
          onMouseDown={(event) => event.preventDefault()}
        >
          Embed
        </button>
      </div>
      {error && (
        <p className="au-field-error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

/* A lesson with nothing in it says so, and offers the ways to begin. */
function EmptyLesson({ item }: { item: Item }) {
  const fromDocument = () => {
    openAurora();
    store.set((s) => ({ ...s, ui: { ...s.ui, attachOpen: true } }));
  };
  return (
    <div className="au-start" data-testid="empty-lesson">
      <p className="au-muted">This lesson is empty. Start it one of these ways:</p>
      <button type="button" onClick={() => focusField(`${item.id}:add-line`)}>
        <Icon name="edit" />
        Write it yourself
      </button>
      <button type="button" onClick={openAurora}>
        <Icon name="aiButton" />
        Draft with Aurora
      </button>
      <button type="button" onClick={fromDocument}>
        <Icon name="paperclip" />
        Use a document
      </button>
    </div>
  );
}

/* Options float over the image, so an image takes up no more room while you edit than when you read. */
function ImageControls({
  block,
  save,
}: {
  block: Extract<Block, { type: "intro" | "paragraph" }>;
  save: (next: Block) => void;
}) {
  const [open, setOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const box = useRef<HTMLSpanElement>(null);
  const handle = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  useOpenUpward(menu, open);
  useEffect(() => {
    if (!open) return;
    menu.current?.querySelector("button")?.focus();
    const away = (event: MouseEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [open]);
  const close = () => {
    setOpen(false);
    handle.current?.focus();
  };
  const other: ImageLayout = (block.imageLayout ?? "beside") === "beside" ? "below" : "beside";
  return (
    <span ref={box} className={`au-image-tools${open ? " is-open" : ""}`} data-testid="media-field">
      <button
        ref={handle}
        type="button"
        className="au-image-more"
        aria-label="Image options"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <Icon name="more" />
      </button>
      {open && (
        <div
          ref={menu}
          className="au-add-menu au-block-menu"
          role="menu"
          aria-label="Image options"
          onKeyDown={(event) => menuKeys(event, close)}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              close();
              save({ ...block, imageLayout: other });
            }}
          >
            {other === "below" ? "Move below the text" : "Move beside the text"}
          </button>
          <button type="button" role="menuitem" onClick={() => input.current?.click()}>
            Replace image
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              close();
              const { image: _image, imageLayout: _layout, ...rest } = block;
              save(rest);
            }}
          >
            Remove image
          </button>
        </div>
      )}
      <input
        ref={input}
        className="visually-hidden"
        type="file"
        accept="image/*"
        tabIndex={-1}
        aria-label="Choose an image"
        data-testid="replace-image-input"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          readImage(file, (image) => {
            close();
            save({ ...block, image });
          });
        }}
      />
    </span>
  );
}

function EditBlock({
  block,
  item,
  onSlash,
}: {
  block: Block;
  item: Item;
  onSlash: () => void;
}) {
  const save = (next: Block) => store.dispatch({ type: "EDIT_BLOCK", itemId: item.id, block: next });
  const structural = (next: Block) =>
    setBlocks(item.id, blocksOf(item.id).map((b) => (b.id === next.id ? next : b)));

  switch (block.type) {
    case "intro":
    case "paragraph": {
      const showHeading =
        block.type === "intro" || !!block.heading || openHeadings.has(block.id);
      const text = (
        <p className="lesson-paragraph">
          <EditableText
            field={`${block.id}:text`}
            label="Text"
            multiline
            required={block.type === "intro" || !!block.heading}
            placeholder={block.image ? "Write something" : "Write something, or type / to add a block"}
            value={block.text}
            onChange={(value) => save({ ...block, text: value })}
            onSlash={!block.text && !block.heading && !block.image ? onSlash : undefined}
            onEnter={(before, after) => {
              const id = newId();
              const blocks = blocksOf(item.id);
              const index = blocks.findIndex((b) => b.id === block.id);
              setBlocks(item.id, [
                ...blocks.slice(0, index),
                { ...block, text: before },
                { id, type: "paragraph", heading: "", text: after },
                ...blocks.slice(index + 1),
              ]);
              focusField(`${id}:text`, "start");
            }}
            onBackspaceAtStart={() => {
              if (showHeading) {
                focusField(`${block.id}:heading`);
                return;
              }
              /* Merging into the text above would quietly lose this block's image. */
              if (block.image) return;
              const blocks = blocksOf(item.id);
              const index = blocks.findIndex((b) => b.id === block.id);
              const previous = blocks[index - 1];
              if (previous && (previous.type === "paragraph" || previous.type === "intro")) {
                setBlocks(
                  item.id,
                  blocks
                    .filter((b) => b.id !== block.id)
                    .map((b) =>
                      b.id === previous.id ? { ...previous, text: previous.text + block.text } : b,
                    ),
                );
                focusField(`${previous.id}:text`, previous.text.length);
              } else if (!block.text) {
                setBlocks(item.id, blocks.filter((b) => b.id !== block.id));
              }
            }}
          />
        </p>
      );
      const heading = showHeading && (
        <h3 className="lesson-heading">
          <EditableText
            field={`${block.id}:heading`}
            label="Heading"
            required={block.type === "intro"}
            placeholder="Heading"
            value={block.heading}
            onChange={(value) => save({ ...block, heading: value })}
            onEnter={(before, after) => {
              structural({ ...block, heading: before, text: after + block.text });
              focusField(`${block.id}:text`, "start");
            }}
          />
        </h3>
      );
      const body = (
        <div className={`lesson-intro-text${block.type === "paragraph" ? " au-paragraph" : ""}`}>
          {heading}
          {text}
        </div>
      );
      if (!block.image) return block.type === "intro" ? <div className="lesson-intro">{body}</div> : body;
      return (
        <div className={imageClass(block.imageLayout)}>
          {body}
          <figure className="au-figure">
            <LessonImage image={block.image} />
            <ImageControls block={block} save={structural} />
          </figure>
        </div>
      );
    }
    case "features":
      return (
        <div className="lesson-features">
          <h4 className="lesson-subheading">
            <EditableText
              field={`${block.id}:heading`}
              label="List heading"
              placeholder="List heading"
              value={block.heading}
              onChange={(value) => save({ ...block, heading: value })}
              onEnter={() => focusField(`${block.id}:item:0`, "start")}
            />
          </h4>
          <ul className="feature-list">
            {block.items.map((feature, index) => (
              <li key={index} className="feature">
                <span className="checkbox">
                  <Icon name="check" />
                </span>
                <EditableText
                  field={`${block.id}:item:${index}`}
                  label={`Point ${index + 1}`}
                  placeholder="List item"
                  value={feature}
                  onChange={(value) =>
                    save({ ...block, items: block.items.map((c, i) => (i === index ? value : c)) })
                  }
                  {...lineKeys(block.id, "item", block.items, index, (items) =>
                    structural({ ...block, items }),
                  )}
                />
              </li>
            ))}
          </ul>
        </div>
      );
    case "code":
      return (
        <div className="lesson-examples">
          <h4 className="lesson-subheading">
            <EditableText
              field={`${block.id}:heading`}
              label="Code heading"
              placeholder="Heading"
              value={block.heading}
              onChange={(value) => save({ ...block, heading: value })}
              onEnter={() => focusField(`${block.id}:code`, "start")}
            />
          </h4>
          <div className="code-margin">
            <div className="code">
              <div className="code-language">
                <Icon name="code" />
                {block.language}
              </div>
              <div className="code-line au-code-line">
                <code className="au-code-text">
                  <EditableText
                    field={`${block.id}:code`}
                    label={`Code (${block.language})`}
                    multiline
                    placeholder="Write your code"
                    highlight={highlightCode}
                    value={block.code}
                    onChange={(value) => save({ ...block, code: value })}
                  />
                </code>
                <button
                  type="button"
                  aria-label="Copy example"
                  onClick={() => navigator.clipboard?.writeText(block.code)}
                >
                  <Icon name="copy" />
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    case "video":
      if (!block.url) {
        return (
          <VideoEmbed
            field={`${block.id}:url-input`}
            onEmbed={(url) => {
              save({ ...block, url });
              if (!block.title) focusField(`${block.id}:title`);
            }}
          />
        );
      }
      return (
        <div className="au-video">
          <span className="au-video-icon">
            <Icon name="videoLarge" />
          </span>
          <div className="au-video-fields">
            <p className="au-video-title">
              <EditableText
                field={`${block.id}:title`}
                label="Video title"
                required
                placeholder="Video title"
                value={block.title}
                onChange={(value) => save({ ...block, title: value })}
                onEnter={() => focusField(`${block.id}:url`, "start")}
              />
            </p>
            <p className="au-muted">
              <EditableText
                field={`${block.id}:url`}
                label="Video URL"
                required
                placeholder="Paste the video link"
                value={block.url}
                onChange={(value) => {
                  save({ ...block, url: value });
                  if (!value) focusField(`${block.id}:url-input`);
                }}
              />
            </p>
            {block.duration && <p className="au-muted">{block.duration}</p>}
          </div>
        </div>
      );
    case "question":
      return <QuestionCard block={block} item={item} />;
  }
}

function BlockFrame({
  block,
  item,
  canEdit,
  menu,
  setMenu,
}: {
  block: Block;
  item: Item;
  canEdit: boolean;
  menu: MenuAt | null;
  setMenu: (menu: MenuAt | null) => void;
}) {
  const state = useAppState();
  const editAnyway = state.ui.editAnyway.includes(item.id);
  const pending = editAnyway ? null : pendingChange(state, item.id, block.id);
  /* A single change shows as a result under the original. Several go through the review dialog. */
  const drafted = pending && pending.proposal.changes.length === 1 ? pending.proposal : null;
  const running = activeOps(state).find(
    (op) => op.itemIds.includes(item.id) && (op.blockId === block.id || (!op.blockId && op.kind !== "small")),
  );
  const editingThis = activeOps(state).find(
    (op) => op.kind === "small" && !op.blockId && op.itemIds.includes(item.id),
  );
  const showRunning = running ?? (editingThis && item.blocks[0]?.id === block.id ? editingThis : undefined);
  const flag = state.ui.flag;
  const finding =
    flag?.blockId === block.id
      ? state.validation.findings.find((f) => f.id === flag.findingId)
      : undefined;
  const activeStep = showRunning?.steps.find((step) => step.status === "active")?.label;
  const editable = canEdit && !pending && (!showRunning || editAnyway);
  const classes = [
    "au-block",
    editable ? "au-block-live" : "",
    showRunning ? "working" : "",
    drafted ? "drafted" : pending ? "updated" : "",
    finding ? `au-flagged ${finding.severity}` : "",
  ].join(" ");
  const menuHere = menu && (menu.afterId === block.id || menu.replaceId === block.id);
  return (
    <div
      className={classes}
      data-block-id={block.id}
      data-item-id-owner={item.id}
      tabIndex={finding ? -1 : undefined}
      onBlur={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node)) return;
        openHeadings.delete(block.id);
        const id = block.id;
        /* An empty block you've left behind disappears, the way a blank line does. */
        requestAnimationFrame(() => {
          const live = blocksOf(item.id).find((b) => b.id === id);
          if (
            live &&
            isBlank(live) &&
            !document.querySelector(`[data-block-id="${id}"] :focus`) &&
            !document.querySelector("[data-testid=add-menu]")
          ) {
            setBlocks(item.id, blocksOf(item.id).filter((b) => b.id !== id));
          }
        });
      }}
    >
      {finding && <FlagLabel finding={finding} />}
      {showRunning && (
        <div className="au-pill-row" data-testid="editing-pill">
          <span className="au-editing-pill">
            <Icon name="aiButton" className="au-pill-icon" />
            Aurora is editing…
            <Icon name="loader" className="au-spinner small" />
          </span>
          {activeStep && <span className="au-muted">{activeStep}</span>}
        </div>
      )}
      {pending && !drafted && (
        <div className="au-updated-bar" data-testid="updated-bar">
          <span className="au-updated-label">
            <Icon name="aiButton" />
            Aurora's draft. Not applied yet.
          </span>
          <span className="au-proposal-actions">
            <button
              type="button"
              className="button primary small"
              onClick={() => openReview(pending.proposal.id)}
            >
              Review changes
            </button>
            {canEdit && (
              <button
                type="button"
                className="button small"
                onClick={() =>
                  store.set((s) => ({
                    ...s,
                    ui: { ...s.ui, editAnyway: [...s.ui.editAnyway, item.id] },
                  }))
                }
              >
                Edit it myself
              </button>
            )}
            <button type="button" className="button small" onClick={() => askDiscard(pending.proposal.id)}>
              Discard
            </button>
          </span>
        </div>
      )}
      {editable ? (
        <>
          {block.type !== "question" && (
            <BlockHandle block={block} item={item} onAddBelow={() => setMenu({ afterId: block.id })} />
          )}
          <EditBlock
            block={block}
            item={item}
            onSlash={() => setMenu({ afterId: null, replaceId: block.id })}
          />
        </>
      ) : (
        !drafted && <ViewBlock block={pending?.change.after ?? block} />
      )}
      {drafted && (
        <DraftCard
          key={drafted.id}
          proposal={drafted}
          canEdit={canEdit}
          renderBlock={(after) => <ViewBlock block={after} />}
        />
      )}
      {menuHere && <AddMenu itemId={item.id} at={menu} onClose={() => setMenu(null)} />}
    </div>
  );
}

/* The line at the end of the document. Type to keep writing, or / for other blocks. */
function AddLine({
  item,
  menu,
  setMenu,
}: {
  item: Item;
  menu: MenuAt | null;
  setMenu: (menu: MenuAt | null) => void;
}) {
  return (
    <div className="au-add-line" data-testid="add-line">
      <button
        type="button"
        className="au-add-plus"
        aria-label="Add a block"
        aria-expanded={!!menu && !menu.afterId && !menu.replaceId}
        data-testid="add-line-plus"
        onMouseDown={(event) => event.stopPropagation()}
        onClick={() => setMenu(menu && !menu.afterId && !menu.replaceId ? null : { afterId: null })}
      >
        <Icon name="plus" />
      </button>
      <EditableText
        field={`${item.id}:add-line`}
        label="Add to this lesson"
        multiline
        placeholder="Keep writing, or press / for lists, images, code and more"
        value=""
        onSlash={() => setMenu({ afterId: null })}
        onChange={(value) => {
          if (!value) return;
          const id = newId();
          setBlocks(item.id, [
            ...blocksOf(item.id),
            { id, type: "paragraph", heading: "", text: value },
          ]);
          const line = document.querySelector<HTMLElement>(`[data-edit="${item.id}:add-line"]`);
          if (line) line.textContent = "";
          focusField(`${id}:text`);
        }}
      />
      {menu && !menu.afterId && !menu.replaceId && (
        <AddMenu itemId={item.id} at={menu} onClose={() => setMenu(null)} />
      )}
    </div>
  );
}

export function LessonContent({ item, canEdit }: { item: Item; canEdit: boolean }) {
  const state = useAppState();
  const [menu, setMenu] = useState<MenuAt | null>(null);
  const undo = state.proposals.find(
    (p) => p.status === "applied" && p.changes.some((c) => c.itemId === item.id),
  );
  if (item.blocks.length === 0 && !canEdit) {
    return <p className="empty-state">This item has no content yet.</p>;
  }
  const frames = item.blocks.map((block) => (
    <BlockFrame
      key={block.id}
      block={block}
      item={item}
      canEdit={canEdit}
      menu={menu}
      setMenu={setMenu}
    />
  ));
  if (item.kind === "quiz" && canEdit) {
    return (
      <div className="au-quiz" data-testid="content">
        <div className="au-quiz-main">
          <QuizHeader item={item} />
          {frames}
          <button
            type="button"
            className="au-q-add-question"
            onClick={() => addQuestion(item.id, "multiple")}
          >
            <Icon name="plus" />
            Add Question
          </button>
        </div>
        <QuizRail item={item} />
      </div>
    );
  }
  if (item.kind === "video" && canEdit && item.blocks.length === 0) {
    return (
      <div className="au-view-list" data-testid="content">
        <VideoEmbed
          field={`${item.id}:url-input`}
          onEmbed={(url) =>
            setBlocks(item.id, [
              {
                id: newId(),
                type: "video",
                title: item.title.replace(/^Video:\s*/, ""),
                url,
                duration: "",
              },
            ])
          }
        />
      </div>
    );
  }
  return (
    <div className="au-view-list" data-testid="content">
      {canEdit && item.blocks.length === 0 && <EmptyLesson item={item} />}
      {frames}
      {canEdit && <AddLine item={item} menu={menu} setMenu={setMenu} />}
      {undo && state.history.past.length > 0 && (
        <button
          type="button"
          className="au-link au-left"
          data-testid="undo-applied"
          onClick={() => undoProposal(undo.id)}
        >
          Undo Aurora's last change
        </button>
      )}
    </div>
  );
}
