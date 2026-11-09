import React, { useEffect, useRef, useState } from "react";
import { Icon, type IconName } from "../components/Icon";
import {
  addItem,
  addUnit,
  guardedSelect,
  moveItem,
  moveUnit,
  nudgeItem,
} from "../mock/engine";
import { activeOps, courseCounts, unitOf } from "../state/reducer";
import { store, useAppState } from "../state/store";
import type { Item } from "../state/types";

const itemIcon = (item: Item, selected: boolean): IconName => {
  if (item.kind === "quiz") return "quiz";
  if (item.kind === "video") return "video";
  if (selected) return "lessonSelected";
  return item.kind === "content" ? "lessonContent" : "lessonDefault";
};

/* Arrow keys move through the tree. Left and right collapse and expand a unit. */
function onTreeKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
  const rows = [...event.currentTarget.querySelectorAll<HTMLElement>("[data-tree-row]")];
  const index = rows.indexOf(document.activeElement as HTMLElement);
  if (index < 0) return;
  const current = rows[index];
  if (event.altKey && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
    const itemId = current.dataset.itemId;
    const delta = event.key === "ArrowUp" ? -1 : 1;
    event.preventDefault();
    if (itemId) {
      nudgeItem(itemId, delta);
      requestAnimationFrame(() =>
        document.querySelector<HTMLElement>(`[data-item-id="${itemId}"]`)?.focus(),
      );
    }
    return;
  }
  const focus = (row?: HTMLElement) => {
    event.preventDefault();
    row?.focus();
  };
  if (event.key === "ArrowDown") focus(rows[index + 1]);
  if (event.key === "ArrowUp") focus(rows[index - 1]);
  if (event.key === "Home") focus(rows[0]);
  if (event.key === "End") focus(rows.at(-1));
  const unitId = current.dataset.unitId;
  const expanded = current.getAttribute("aria-expanded") === "true";
  if (event.key === "ArrowRight" && unitId && !expanded) {
    event.preventDefault();
    store.dispatch({ type: "TOGGLE_UNIT", unitId });
  }
  if (event.key === "ArrowLeft") {
    if (unitId && expanded) {
      event.preventDefault();
      store.dispatch({ type: "TOGGLE_UNIT", unitId });
    } else if (current.dataset.itemId) {
      event.preventDefault();
      const previousUnit = rows
        .slice(0, index)
        .reverse()
        .find((row) => row.dataset.unitId);
      previousUnit?.focus();
    }
  }
}

function FullTitle({ title, testId }: { title: string; testId?: string }) {
  return (
    <span className="au-truncate" title={title} data-full-title={title} data-testid={testId}>
      {title}
    </span>
  );
}

/* Keyboard users get the full title too, because title attributes only appear on hover. */
function TitleTip() {
  const [tip, setTip] = useState<{ text: string; x: number; y: number } | null>(null);
  useEffect(() => {
    const show = (event: Event) => {
      const target = event.target as HTMLElement;
      const label = target.matches?.("[data-full-title]")
        ? target
        : target.querySelector?.<HTMLElement>("[data-full-title]");
      if (label && label.scrollWidth > label.clientWidth) {
        const rect = label.getBoundingClientRect();
        setTip({ text: label.dataset.fullTitle!, x: rect.left, y: rect.bottom + 4 });
      } else setTip(null);
    };
    const hide = () => setTip(null);
    const plan = document.querySelector(".plan-body");
    plan?.addEventListener("focusin", show);
    plan?.addEventListener("focusout", hide);
    plan?.addEventListener("mouseover", show);
    plan?.addEventListener("mouseleave", hide);
    return () => {
      plan?.removeEventListener("focusin", show);
      plan?.removeEventListener("focusout", hide);
      plan?.removeEventListener("mouseover", show);
      plan?.removeEventListener("mouseleave", hide);
    };
  }, []);
  if (!tip) return null;
  return (
    <div className="au-tip" role="tooltip" data-testid="title-tip" style={{ left: tip.x, top: tip.y }}>
      {tip.text}
    </div>
  );
}

function InlineRename({
  value,
  label,
  onSave,
  onDone,
}: {
  value: string;
  label: string;
  onSave: (value: string) => void;
  onDone: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    input.current?.focus();
    input.current?.select();
  }, []);
  return (
    <input
      ref={input}
      className="au-input au-rename"
      aria-label={label}
      value={value}
      onChange={(event) => onSave(event.target.value)}
      onBlur={onDone}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === "Enter" || event.key === "Escape") onDone();
      }}
    />
  );
}

export function CoursePlan() {
  const state = useAppState();
  const { course, ui, role } = state;
  const [renaming, setRenaming] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const canEdit = role !== "read-only";
  const busyIds = activeOps(state).flatMap((op) => op.itemIds);
  const selectedUnit =
    unitOf(course, ui.selectedItemId ?? "")?.id ?? course.units.at(-1)?.id ?? "";
  const dragged = useRef<{ type: "item" | "unit"; id: string } | null>(null);

  const finishRename = () => {
    setRenaming(null);
    store.dispatch({ type: "END_TYPING" });
  };
  const confirmDelete = (kind: "item" | "unit", id: string, title: string) =>
    store.set((s) => ({ ...s, ui: { ...s.ui, dialog: { type: "delete", kind, id, title } } }));

  return (
    <aside
      className={`plan au-plan ${ui.planOpen ? "open" : ""}`}
      aria-label="Course plan"
      data-testid="course-plan"
    >
      <button
        type="button"
        className="au-plan-toggle"
        aria-expanded={ui.planOpen}
        data-testid="plan-toggle"
        onClick={() => store.set((s) => ({ ...s, ui: { ...s.ui, planOpen: !s.ui.planOpen } }))}
      >
        {ui.planOpen ? "Hide course plan" : "Show course plan"}
      </button>
      <div className="plan-header">
        <span className="plan-title">Course plan</span>
        <span className="plan-subtitle" data-testid="plan-counts">
          {courseCounts(course).breakdown}
        </span>
      </div>
      <div className="plan-body" onKeyDown={onTreeKeyDown}>
        {course.units.map((unit, unitIndex) => {
          const open = !ui.collapsedUnitIds.includes(unit.id);
          return (
            <div
              className="plan-unit"
              key={unit.id}
              data-unit={unit.id}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const drag = dragged.current;
                if (drag?.type === "unit") moveUnit(drag.id, unitIndex);
                if (drag?.type === "item") moveItem(drag.id, unit.id, unit.items.length);
                dragged.current = null;
              }}
            >
              <div className="au-unit-head">
                {canEdit && (
                  <span
                    className="au-drag"
                    draggable
                    data-testid="drag-unit"
                    onDragStart={(event) => {
                      dragged.current = { type: "unit", id: unit.id };
                      event.dataTransfer.effectAllowed = "move";
                    }}
                  >
                    <Icon name="drag" />
                  </span>
                )}
                {renaming === unit.id ? (
                  <InlineRename
                    value={unit.title}
                    label="Unit title"
                    onSave={(title) =>
                      store.dispatch({ type: "RENAME_UNIT", unitId: unit.id, title })
                    }
                    onDone={finishRename}
                  />
                ) : (
                  <button
                    type="button"
                    className="plan-unit-row"
                    aria-expanded={open}
                    data-tree-row
                    data-unit-id={unit.id}
                    onClick={() => {
                      /* Selecting a unit never closes it. Only the arrow collapses. */
                      if (!open) store.dispatch({ type: "TOGGLE_UNIT", unitId: unit.id });
                    }}
                  >
                    <span className="plan-unit-name au-truncate" title={unit.title} data-full-title={unit.title}>
                      {unit.title}
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  className="au-unit-toggle"
                  aria-label={`${open ? "Collapse" : "Expand"} ${unit.title}`}
                  data-testid="unit-toggle"
                  onClick={() => store.dispatch({ type: "TOGGLE_UNIT", unitId: unit.id })}
                >
                  <Icon name={open ? "unitUp" : "unitDown"} />
                </button>
                {canEdit && (
                  <span className="au-row-actions">
                    <button
                      type="button"
                      className="au-rename-action"
                      aria-label={`Rename ${unit.title}`}
                      onClick={() => setRenaming(unit.id)}
                    >
                      <Icon name="edit" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${unit.title}`}
                      onClick={() => confirmDelete("unit", unit.id, unit.title)}
                    >
                      <Icon name="trash" />
                    </button>
                  </span>
                )}
              </div>
              {open && unit.items.length === 0 && (
                <p className="au-plan-empty">No items in this unit yet.</p>
              )}
              {open &&
                unit.items.map((item, itemIndex) => {
                  const selected = item.id === ui.selectedItemId;
                  return (
                    <div
                      key={item.id}
                      className={`plan-lesson kind-${item.kind} ${selected ? "selected" : ""}`}
                      draggable={canEdit && renaming !== item.id}
                      data-testid="plan-item"
                      data-item={item.id}
                      onDragStart={(event) => {
                        event.stopPropagation();
                        dragged.current = { type: "item", id: item.id };
                        event.dataTransfer.effectAllowed = "move";
                      }}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        const drag = dragged.current;
                        if (drag?.type === "item") moveItem(drag.id, unit.id, itemIndex);
                        dragged.current = null;
                      }}
                    >
                      {renaming === item.id ? (
                        <InlineRename
                          value={item.title}
                          label="Item title"
                          onSave={(title) =>
                            store.dispatch({ type: "RENAME_ITEM", itemId: item.id, title })
                          }
                          onDone={finishRename}
                        />
                      ) : (
                        <button
                          type="button"
                          className="plan-lesson-select"
                          aria-current={selected ? "true" : undefined}
                          data-tree-row
                          data-item-id={item.id}
                          onClick={() => guardedSelect(item.id)}
                        >
                          <Icon name={itemIcon(item, selected)} />
                          <FullTitle title={item.title} />
                          {busyIds.includes(item.id) && (
                            <Icon name="loader" className="au-spinner small" />
                          )}
                        </button>
                      )}
                      {canEdit && selected && renaming !== item.id && (
                        <span className="au-row-actions always">
                          <button
                            type="button"
                            className="au-rename-action"
                            aria-label={`Rename ${item.title}`}
                            onClick={() => setRenaming(item.id)}
                          >
                            <Icon name="edit" />
                          </button>
                          <button
                            type="button"
                            className="plan-lesson-delete"
                            aria-label={`Delete ${item.title}`}
                            onClick={() => confirmDelete("item", item.id, item.title)}
                          >
                            <Icon name="trash" />
                          </button>
                        </span>
                      )}
                    </div>
                  );
                })}
            </div>
          );
        })}
        {canEdit && (
          <div className="plan-add">
            <button
              type="button"
              className="button soft"
              aria-expanded={addOpen}
              onClick={() => setAddOpen(!addOpen)}
            >
              <span className="plan-add-label">
                <Icon name="plus" />
                Add Lessons
              </span>
              <Icon name="addChevron" />
            </button>
            {addOpen && (
              <div className="au-add-menu" role="group" aria-label="Add to the selected unit">
                {(
                  [
                    ["Lesson", "lesson"],
                    ["Quiz", "quiz"],
                    ["Video", "video"],
                  ] as const
                ).map(([label, kind]) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => {
                      setAddOpen(false);
                      if (selectedUnit) addItem(selectedUnit, kind);
                    }}
                  >
                    {label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setAddOpen(false);
                    addUnit();
                  }}
                >
                  Unit
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <TitleTip />
    </aside>
  );
}
