import { useState } from "react";
import { EditableText, focusField } from "../components/EditableText";
import { Icon } from "../components/Icon";
import { generateQuizQuestions } from "../mock/engine";
import { findItem } from "../state/reducer";
import { store, useAppState } from "../state/store";
import type { Block, Item } from "../state/types";

type Question = Extract<Block, { type: "question" }>;

export const blocksOf = (itemId: string) => findItem(store.get().course, itemId)?.blocks ?? [];

export function setBlocks(itemId: string, blocks: Block[]) {
  store.dispatch({ type: "END_TYPING" });
  store.dispatch({ type: "EDIT_ITEM", itemId, patch: { blocks } });
  store.dispatch({ type: "END_TYPING" });
}

let count = 0;
export const newBlockId = () => `block-${Date.now()}-${++count}`;

/* Questions start collapsed except the first one and any you've just added. */
const openOnAdd = new Set<string>();
let draggedId: string | null = null;

export function addQuestion(itemId: string, format: "multiple" | "truefalse") {
  const id = newBlockId();
  const block: Question = {
    id,
    type: "question",
    format,
    question: "",
    options: format === "truefalse" ? ["True", "False"] : ["", ""],
    correctIndex: null,
  };
  openOnAdd.add(id);
  setBlocks(itemId, [...blocksOf(itemId), block]);
  focusField(`${id}:question`);
}

/* Enter adds a line and Backspace at the start joins it to the line above. */
export function lineKeys(
  id: string,
  prefix: "item" | "option",
  lines: string[],
  index: number,
  commit: (next: string[], removedAt?: number) => void,
) {
  return {
    onEnter: (before: string, after: string) => {
      commit([...lines.slice(0, index), before, after, ...lines.slice(index + 1)]);
      focusField(`${id}:${prefix}:${index + 1}`, "start");
    },
    onBackspaceAtStart: () => {
      if (index === 0) return;
      commit(
        [...lines.slice(0, index - 1), lines[index - 1] + lines[index], ...lines.slice(index + 1)],
        index,
      );
      focusField(`${id}:${prefix}:${index - 1}`, lines[index - 1].length);
    },
  };
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="au-quiz-toggle">
      <span>{label}</span>
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

/* The question card from the Create a Quiz frame. */
export function QuestionCard({ block, item }: { block: Question; item: Item }) {
  const state = useAppState();
  const index = item.blocks.findIndex((b) => b.id === block.id);
  const flagged = state.ui.flag?.blockId === block.id;
  const [toggled, setToggled] = useState<boolean | null>(null);
  const open = toggled ?? (flagged || index === 0 || openOnAdd.has(block.id));
  const number = index + 1;
  const trueFalse = block.format === "truefalse";
  const save = (next: Question) =>
    store.dispatch({ type: "EDIT_BLOCK", itemId: item.id, block: next });
  const structural = (next: Question) =>
    setBlocks(item.id, blocksOf(item.id).map((b) => (b.id === next.id ? next : b)));
  const complete =
    !!block.question.trim() &&
    block.correctIndex !== null &&
    block.options.every((option) => option.trim());
  const duplicate = () => {
    const id = newBlockId();
    const blocks = blocksOf(item.id);
    const at = blocks.findIndex((b) => b.id === block.id);
    openOnAdd.add(id);
    setBlocks(item.id, [...blocks.slice(0, at + 1), { ...block, id }, ...blocks.slice(at + 1)]);
    focusField(`${id}:question`);
  };
  const remove = () => setBlocks(item.id, blocksOf(item.id).filter((b) => b.id !== block.id));
  const points = item.quiz?.points ?? 1;
  const questionInvalid = !block.question.trim();

  return (
    <div
      className={`au-q-card ${open ? "open" : ""}`}
      data-testid="question-card"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        if (!draggedId || draggedId === block.id) return;
        const blocks = blocksOf(item.id);
        const moving = blocks.find((b) => b.id === draggedId);
        if (!moving) return;
        const rest = blocks.filter((b) => b.id !== draggedId);
        const at = rest.findIndex((b) => b.id === block.id);
        setBlocks(item.id, [...rest.slice(0, at), moving, ...rest.slice(at)]);
        draggedId = null;
      }}
    >
      <div className="au-q-row">
        <span
          className="au-q-drag"
          draggable
          aria-hidden="true"
          onDragStart={() => {
            draggedId = block.id;
          }}
        >
          <Icon name="drag" />
        </span>
        <span className="au-q-number">{number}</span>
        <span className="au-q-type">{trueFalse ? "True/False" : "Multiple choice"}</span>
        <span className="au-q-summary au-truncate" title={block.question}>
          {!open && (block.question || "No question yet")}
        </span>
        <span className="au-q-points">
          {points} {points === 1 ? "pt" : "pts"}
        </span>
        <button
          type="button"
          className="au-q-icon"
          aria-label={`${open ? "Collapse" : "Edit"} question ${number}`}
          aria-expanded={open}
          onClick={() => setToggled(!open)}
        >
          <Icon name="edit" />
        </button>
        <button type="button" className="au-q-icon" aria-label={`Duplicate question ${number}`} onClick={duplicate}>
          <Icon name="copy" />
        </button>
        <button type="button" className="au-q-icon" aria-label={`Delete question ${number}`} onClick={remove}>
          <Icon name="trash" />
        </button>
        <span className="au-q-status">
          {complete ? (
            <>
              <Icon name="statusCheck" />
              <span className="visually-hidden">Complete</span>
            </>
          ) : (
            <span className="au-q-incomplete">Incomplete</span>
          )}
        </span>
      </div>
      {open && (
        <div className="au-q-body">
          <label className="au-field">
            <span className="au-field-label">Question text</span>
            <textarea
              className={`au-input ${questionInvalid ? "invalid" : ""}`}
              rows={3}
              placeholder="Enter question"
              aria-invalid={questionInvalid || undefined}
              data-edit={`${block.id}:question`}
              value={block.question}
              onChange={(event) => save({ ...block, question: event.target.value })}
              onBlur={() => store.dispatch({ type: "END_TYPING" })}
            />
          </label>
          <div className="au-q-options">
            <div className="au-q-options-head">
              <span className="au-field-label">Answer options</span>
              <span className="au-field-label">Correct answer</span>
            </div>
            {block.options.map((option, at) => (
              <div className="au-q-option" key={at}>
                <span className="au-q-letter">{String.fromCharCode(65 + at)}</span>
                {trueFalse ? (
                  <span className="au-q-option-text">{option}</span>
                ) : (
                  <EditableText
                    field={`${block.id}:option:${at}`}
                    label={`Option ${at + 1}`}
                    className="au-q-option-text"
                    placeholder={`Option ${at + 1}`}
                    value={option}
                    onChange={(value) =>
                      save({ ...block, options: block.options.map((c, i) => (i === at ? value : c)) })
                    }
                    {...lineKeys(block.id, "option", block.options, at, (options, removedAt) => {
                      const correct = block.correctIndex;
                      let correctIndex = correct;
                      if (correct !== null) {
                        if (removedAt !== undefined) {
                          if (removedAt === correct) correctIndex = removedAt - 1;
                          else if (removedAt < correct) correctIndex = correct - 1;
                        } else if (at < correct) correctIndex = correct + 1;
                      }
                      structural({ ...block, options, correctIndex });
                    })}
                  />
                )}
                {!trueFalse && block.options.length > 2 && (
                  <button
                    type="button"
                    className="au-q-icon"
                    aria-label={`Remove option ${at + 1}`}
                    onClick={() => {
                      const correct = block.correctIndex;
                      structural({
                        ...block,
                        options: block.options.filter((_, i) => i !== at),
                        correctIndex:
                          correct === null || correct === at ? null : correct > at ? correct - 1 : correct,
                      });
                    }}
                  >
                    <Icon name="remove" />
                  </button>
                )}
                <input
                  type="radio"
                  name={`correct-${block.id}`}
                  aria-label={`Mark option ${String.fromCharCode(65 + at)} as the correct answer`}
                  checked={block.correctIndex === at}
                  onChange={() => save({ ...block, correctIndex: at })}
                />
              </div>
            ))}
            {!trueFalse && (
              <button
                type="button"
                className="au-q-add"
                onClick={() => {
                  structural({ ...block, options: [...block.options, ""] });
                  focusField(`${block.id}:option:${block.options.length}`, "start");
                }}
              >
                <Icon name="plus" />
                Add Options
              </button>
            )}
          </div>
          <label className="au-field">
            <span className="au-field-label">Explanation (optional)</span>
            <textarea
              className="au-input"
              rows={3}
              placeholder="Explanation"
              value={block.explanation ?? ""}
              onChange={(event) => save({ ...block, explanation: event.target.value })}
              onBlur={() => store.dispatch({ type: "END_TYPING" })}
            />
          </label>
          <div className="au-q-settings">
            <span className="au-field-label">Question settings</span>
            <Toggle
              label="Shuffle options"
              checked={block.shuffle ?? false}
              onChange={(shuffle) => save({ ...block, shuffle })}
            />
          </div>
          <div className="au-q-foot">
            <button type="button" onClick={duplicate}>
              <Icon name="copy" />
              Duplicate
            </button>
            <button type="button" className="danger" onClick={remove}>
              <Icon name="trash" />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function QuizHeader({ item }: { item: Item }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="au-quiz-head">
      <span className="au-quiz-total" data-testid="quiz-total">
        Total questions in this Quiz: {item.blocks.length}
      </span>
      <div className="au-quiz-add">
        <button
          type="button"
          className="button soft"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <Icon name="plus" />
          Add questions
        </button>
        {open && (
          <div className="au-add-menu au-quiz-menu" role="group" aria-label="Question type">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                addQuestion(item.id, "multiple");
              }}
            >
              Multiple choice
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                addQuestion(item.id, "truefalse");
              }}
            >
              True/False
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function QuizRail({ item }: { item: Item }) {
  const settings = {
    points: 1,
    passPercent: 70,
    shuffleQuestions: true,
    shuffleOptions: true,
    ...item.quiz,
  };
  const patch = (next: Partial<typeof settings>) =>
    store.dispatch({
      type: "EDIT_ITEM",
      itemId: item.id,
      patch: { quiz: { ...settings, ...next } },
    });
  return (
    <aside className="au-quiz-rail" aria-label="Quiz tools">
      <section className="au-rail-card">
        <h3 className="au-rail-title">Generate questions with Aurora</h3>
        <p className="au-muted">Let Aurora create questions based on your content.</p>
        <button
          type="button"
          className="button soft au-full"
          onClick={() => generateQuizQuestions(item.id)}
        >
          <Icon name="aiButton" />
          Generate
        </button>
      </section>
      <section className="au-rail-card">
        <h3 className="au-rail-title">
          <Icon name="fileText" />
          Quiz settings
        </h3>
        <label className="au-field">
          <span className="au-field-label">Points per question</span>
          <span className="au-unit-input">
            <span>pts</span>
            <input
              type="number"
              min={0}
              value={settings.points}
              onChange={(event) => patch({ points: Number(event.target.value) })}
              onBlur={() => store.dispatch({ type: "END_TYPING" })}
            />
          </span>
        </label>
        <label className="au-field">
          <span className="au-field-label">Passing score</span>
          <span className="au-unit-input">
            <span>%</span>
            <input
              type="number"
              min={0}
              max={100}
              value={settings.passPercent}
              onChange={(event) => patch({ passPercent: Number(event.target.value) })}
              onBlur={() => store.dispatch({ type: "END_TYPING" })}
            />
          </span>
        </label>
        <Toggle
          label="Shuffle questions"
          checked={settings.shuffleQuestions}
          onChange={(shuffleQuestions) => patch({ shuffleQuestions })}
        />
        <Toggle
          label="Shuffle options"
          checked={settings.shuffleOptions}
          onChange={(shuffleOptions) => patch({ shuffleOptions })}
        />
      </section>
      <section className="au-rail-card tips">
        <h3 className="au-rail-tips-title">Tips for adding content</h3>
        <ul>
          <li>Mix different question types to keep learners engaged.</li>
          <li>Review your quiz before publishing.</li>
        </ul>
      </section>
    </aside>
  );
}
