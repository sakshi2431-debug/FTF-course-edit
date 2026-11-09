import { useEffect } from "react";
import { AuroraPanel } from "../components/AuroraPanel";
import { EditableText, focusField } from "../components/EditableText";
import { Banner } from "../components/Feedback";
import { FindingsNavigator } from "../components/Findings";
import { Icon } from "../components/Icon";
import { guardedSelect, openAurora, runValidation, addUnit } from "../mock/engine";
import { activeOps, allItems, courseCounts, findItem, unitOf } from "../state/reducer";
import { store, useAppState } from "../state/store";
import type { Item, LessonTab } from "../state/types";
import { CoursePlan } from "./CoursePlan";
import { LessonContent } from "./LessonContent";
import { SelectionMenu } from "./SelectionMenu";

const TABS: { id: LessonTab; label: string }[] = [
  { id: "content", label: "Content" },
  { id: "objectives", label: "Learning Objectives" },
  { id: "notes", label: "Notes" },
];

/* Everything in the tabs is the document itself: click and type. */
function TabPanel({ item, canEdit }: { item: Item; canEdit: boolean }) {
  const state = useAppState();
  const patch = (next: Partial<Item>) =>
    store.dispatch({ type: "EDIT_ITEM", itemId: item.id, patch: next });
  const setObjectives = (objectives: string[]) => {
    store.dispatch({ type: "END_TYPING" });
    patch({ objectives });
    store.dispatch({ type: "END_TYPING" });
  };
  if (state.ui.tab === "content") return <LessonContent item={item} canEdit={canEdit} />;
  if (state.ui.tab === "notes") {
    if (canEdit) {
      return (
        <p className="lesson-paragraph">
          <EditableText
            field="notes"
            label="Notes"
            multiline
            placeholder="Add notes for yourself"
            testId="notes-input"
            value={item.notes}
            onChange={(notes) => patch({ notes })}
          />
        </p>
      );
    }
    return item.notes ? (
      <p className="lesson-paragraph">{item.notes}</p>
    ) : (
      <p className="empty-state">No notes yet.</p>
    );
  }
  if (canEdit) {
    const lines = item.objectives.length ? item.objectives : [""];
    return (
      <ul className="au-objectives">
        {lines.map((objective, index) => (
          <li key={index}>
            <EditableText
              field={`objective:${index}`}
              label={`Objective ${index + 1}`}
              placeholder="Add a learning objective"
              testId="objective-input"
              value={objective}
              onChange={(value) =>
                patch({ objectives: lines.map((o, i) => (i === index ? value : o)) })
              }
              onEnter={(before, after) => {
                setObjectives([...lines.slice(0, index), before, after, ...lines.slice(index + 1)]);
                focusField(`objective:${index + 1}`, "start");
              }}
              onBackspaceAtStart={() => {
                if (index === 0) return;
                setObjectives([
                  ...lines.slice(0, index - 1),
                  lines[index - 1] + objective,
                  ...lines.slice(index + 1),
                ]);
                focusField(`objective:${index - 1}`, lines[index - 1].length);
              }}
            />
          </li>
        ))}
      </ul>
    );
  }
  return item.objectives.length ? (
    <ul className="au-objectives">
      {item.objectives.map((objective) => (
        <li key={objective}>{objective}</li>
      ))}
    </ul>
  ) : (
    <p className="empty-state">No learning objectives yet.</p>
  );
}

function ItemHeader({ item, canEdit }: { item: Item; canEdit: boolean }) {
  const state = useAppState();
  const instructor = state.role !== "read-only";
  const lockedByPerson = state.collab.otherEditor?.itemId === item.id;
  return (
    <div className="lesson-title-row au-title-row">
      <div className="au-title-group">
        {canEdit ? (
          <div className="au-title-field">
            <h2 className="lesson-editing">
              <EditableText
                field="item-title"
                label="Title"
                required
                placeholder="Untitled"
                value={item.title}
                onChange={(title) =>
                  store.dispatch({ type: "RENAME_ITEM", itemId: item.id, title })
                }
              />
            </h2>
          </div>
        ) : (
          <h2 className="lesson-editing au-truncate" title={item.title}>
            {item.title}
          </h2>
        )}
        {item.aiLabel && (
          <span className="au-ai-tag" data-testid="ai-label">
            <Icon name="aiButton" />
            Aurora generated
            {item.aiLabel.source ? ` from ${item.aiLabel.source}` : ""}
          </span>
        )}
      </div>
      <div className="au-title-actions">
        {instructor && (
          <>
            <button
              type="button"
              className="button"
              disabled={state.history.past.length === 0}
              onClick={() => store.dispatch({ type: "UNDO" })}
            >
              Undo
            </button>
            <button
              type="button"
              className="button"
              disabled={state.history.future.length === 0}
              onClick={() => store.dispatch({ type: "REDO" })}
            >
              Redo
            </button>
          </>
        )}
        {state.aurora.panel !== "open" && (
          <button
            type="button"
            className="button"
            data-aurora-open
            aria-label={instructor ? "Edit with Aurora" : "Ask Aurora"}
            disabled={lockedByPerson}
            onClick={openAurora}
          >
            <Icon name="aiButton" />
            {instructor ? "Edit with Aurora" : "Ask Aurora"}
          </button>
        )}
      </div>
    </div>
  );
}

function ItemBanners({ item }: { item: Item }) {
  const state = useAppState();
  const op = activeOps(state).find((o) => o.itemIds.includes(item.id));
  const other = state.collab.otherEditor;
  return (
    <>
      {op && (
        <Banner
          tone="info"
          testId="lock-banner"
          actions={
            !state.ui.editAnyway.includes(item.id) && state.role !== "read-only" ? (
              <button
                type="button"
                className="au-link"
                onClick={() =>
                  store.set((s) => ({
                    ...s,
                    ui: { ...s.ui, editAnyway: [...s.ui.editAnyway, item.id] },
                  }))
                }
              >
                Edit anyway
              </button>
            ) : undefined
          }
        >
          Aurora is updating this section.
        </Banner>
      )}
      {other?.itemId === item.id && (
        <Banner tone="warning" testId="person-lock">
          {other.name} is editing this item, so it's read only for you until they finish.
        </Banner>
      )}
    </>
  );
}

function WorkingElsewhere() {
  const state = useAppState();
  const op = activeOps(state).find((o) => !o.itemIds.includes(state.ui.selectedItemId ?? ""));
  if (!op || !op.itemIds.length) return null;
  const item = findItem(state.course, op.itemIds[0]);
  return (
    <Banner
      tone="info"
      testId="working-elsewhere"
      actions={
        item ? (
          <button type="button" className="au-link" onClick={() => guardedSelect(item.id)}>
            Go to {item.title}
          </button>
        ) : undefined
      }
    >
      Aurora is still working: {op.label}. You can keep editing here.
    </Banner>
  );
}

/* The lesson pickers from Figma 3154:13244, using this course's own data. */
function LessonPicker() {
  const state = useAppState();
  const { course, ui } = state;
  const unit = unitOf(course, ui.selectedItemId ?? "") ?? course.units[0];
  if (!unit) return null;
  return (
    <div className="lesson-picker">
      <div className="lesson-picker-title">
        <span>Select Lessons</span>
      </div>
      <div className="lesson-picker-row">
        <label className="au-picker-label">
          <span className="visually-hidden">Unit</span>
          <select
            className="picker unit au-select"
            value={unit.id}
            data-testid="unit-picker"
            onChange={(event) => {
              const next = course.units.find((u) => u.id === event.target.value);
              if (next?.items[0]) guardedSelect(next.items[0].id);
            }}
          >
            {course.units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.title}
              </option>
            ))}
          </select>
        </label>
        <label className="au-picker-label">
          <span className="visually-hidden">Item</span>
          <select
            className="picker lesson-choice au-select"
            value={ui.selectedItemId ?? ""}
            data-testid="item-picker"
            onChange={(event) => guardedSelect(event.target.value)}
          >
            {unit.items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

function FirstContent() {
  return (
    <div className="au-placeholder" data-testid="no-content">
      <h2 className="outline-title">This course has no content yet</h2>
      <p className="au-muted">
        Start by adding a unit yourself, or ask Aurora to draft one from your
        materials.
      </p>
      <div className="au-proposal-actions">
        <button type="button" className="button primary" onClick={addUnit}>
          Add your first unit
        </button>
        <button type="button" className="button soft" onClick={openAurora}>
          <Icon name="aiButton" />
          Ask Aurora
        </button>
      </div>
    </div>
  );
}

export function PlanScreen() {
  const state = useAppState();
  const { ui, aurora, course } = state;
  const item = findItem(course, ui.selectedItemId);
  const panelOpen = aurora.panel === "open";
  const empty = allItems(course).length === 0;
  const canEdit =
    state.role !== "read-only" && state.collab.otherEditor?.itemId !== item?.id;

  useEffect(() => {
    if (!ui.scrollTarget) return;
    const target = ui.scrollTarget;
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(`[data-block-id="${target}"]`);
      el?.scrollIntoView({
        block: "center",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      });
    });
    store.set((s) => ({ ...s, ui: { ...s.ui, scrollTarget: null } }));
  }, [ui.scrollTarget]);

  const blockedValidate = state.role === "read-only";

  return (
    <>
      <FindingsNavigator />
      <WorkingElsewhere />
      <div className={`editor ${panelOpen ? "ai-layout au-ai-layout" : "sidebar-layout"}`}>
        {!panelOpen && <CoursePlan />}
        <main className={`editor-main ${panelOpen ? "ai-main" : ""}`}>
          {panelOpen ? (
            <LessonPicker />
          ) : (
            <div className="outline-header">
              <h1 className="outline-title">Course outline</h1>
              <span className="outline-count" data-testid="outline-counts">
                {courseCounts(course).summary}
              </span>
              {state.role !== "read-only" && (
                <button type="button" className="button" aria-disabled="true">
                  <Icon name="upload" />
                  Import outline
                </button>
              )}
            </div>
          )}
          {empty ? (
            <FirstContent />
          ) : item ? (
            <section className="lesson" aria-label={item.title}>
              <ItemHeader item={item} canEdit={canEdit} />
              <ItemBanners item={item} />
              <div className="tabs" role="tablist" aria-label="Item sections">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    className="tab"
                    aria-selected={ui.tab === tab.id}
                    onClick={() => store.dispatch({ type: "SET_TAB", tab: tab.id })}
                  >
                    <span className="tab-label">{tab.label}</span>
                    <span className="tab-indicator" />
                  </button>
                ))}
              </div>
              <div className="tabs-spacer" />
              <TabPanel item={item} canEdit={canEdit} />
            </section>
          ) : (
            <p className="empty-state">Select an item in the course plan.</p>
          )}
        </main>
        <AuroraPanel />
      </div>
      <SelectionMenu />
      <footer className="page-footer">
        <button type="button" className="button semibold" aria-disabled="true">
          <Icon name="back" />
          Back
        </button>
        {!blockedValidate && (
          <button
            type="button"
            className="button primary"
            onClick={() => {
              store.dispatch({ type: "SET_STEP", step: "validate" });
              if (!empty && state.validation.status === "idle") runValidation();
            }}
          >
            Validate
            <Icon name="next" />
          </button>
        )}
      </footer>
    </>
  );
}
