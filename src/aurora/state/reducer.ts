import type {
  AppState,
  Block,
  Course,
  Item,
  LessonTab,
  Step,
} from "./types";

export type Action =
  | { type: "UPDATE"; fn: (state: AppState) => AppState }
  | { type: "LOAD_SNAPSHOT"; snapshot: AppState }
  | { type: "SELECT_ITEM"; itemId: string }
  | { type: "TOGGLE_UNIT"; unitId: string }
  | { type: "SET_TAB"; tab: LessonTab }
  | { type: "SET_STEP"; step: Step }
  | { type: "RENAME_ITEM"; itemId: string; title: string }
  | { type: "RENAME_UNIT"; unitId: string; title: string }
  | { type: "EDIT_BLOCK"; itemId: string; block: Block }
  | { type: "EDIT_ITEM"; itemId: string; patch: Partial<Item> }
  | { type: "SET_COURSE"; course: Course; key: string }
  | { type: "END_TYPING" }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "SAVE_FINISHED" };

const HISTORY_LIMIT = 50;

export function updateItem(
  course: Course,
  itemId: string,
  update: (item: Item) => Item,
): Course {
  return {
    ...course,
    units: course.units.map((unit) => ({
      ...unit,
      items: unit.items.map((item) => (item.id === itemId ? update(item) : item)),
    })),
  };
}

const nextSaveStatus = (state: AppState) =>
  state.conn === "offline"
    ? ("offline" as const)
    : state.mock.save === "paused"
      ? ("unsaved" as const)
      : ("saving" as const);

/* Consecutive keystrokes in one field share a key, so one undo reverts the whole edit. */
export function commit(state: AppState, course: Course, typingKey: string): AppState {
  const sameEdit = typingKey !== "" && state.history.typingKey === typingKey;
  return {
    ...state,
    course,
    save: { ...state.save, status: nextSaveStatus(state) },
    history: {
      past: sameEdit
        ? state.history.past
        : [...state.history.past, state.course].slice(-HISTORY_LIMIT),
      future: [],
      typingKey: typingKey || null,
    },
  };
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "UPDATE":
      return action.fn(state);
    case "LOAD_SNAPSHOT":
      return action.snapshot;
    case "SELECT_ITEM":
      return {
        ...state,
        ui: {
          ...state.ui,
          selectedItemId: action.itemId,
          tab: "content",
          flag:
            state.ui.flag?.itemId === action.itemId ? state.ui.flag : null,
        },
      };
    case "TOGGLE_UNIT": {
      const collapsed = state.ui.collapsedUnitIds.includes(action.unitId);
      return {
        ...state,
        ui: {
          ...state.ui,
          collapsedUnitIds: collapsed
            ? state.ui.collapsedUnitIds.filter((id) => id !== action.unitId)
            : [...state.ui.collapsedUnitIds, action.unitId],
        },
      };
    }
    case "SET_TAB":
      return { ...state, ui: { ...state.ui, tab: action.tab } };
    case "SET_STEP":
      return { ...state, ui: { ...state.ui, step: action.step } };
    case "RENAME_ITEM":
      return commit(
        state,
        updateItem(state.course, action.itemId, (item) => ({
          ...item,
          title: action.title,
        })),
        `title:${action.itemId}`,
      );
    case "RENAME_UNIT":
      return commit(
        state,
        {
          ...state.course,
          units: state.course.units.map((unit) =>
            unit.id === action.unitId ? { ...unit, title: action.title } : unit,
          ),
        },
        `unit:${action.unitId}`,
      );
    case "EDIT_BLOCK":
      return commit(
        state,
        updateItem(state.course, action.itemId, (item) => ({
          ...item,
          blocks: item.blocks.map((block) =>
            block.id === action.block.id ? action.block : block,
          ),
        })),
        `block:${action.block.id}`,
      );
    case "EDIT_ITEM":
      return commit(
        state,
        updateItem(state.course, action.itemId, (item) => ({
          ...item,
          ...action.patch,
        })),
        `item:${action.itemId}:${Object.keys(action.patch).join()}`,
      );
    case "SET_COURSE":
      return commit(state, action.course, action.key);
    case "END_TYPING":
      return { ...state, history: { ...state.history, typingKey: null } };
    case "UNDO": {
      const previous = state.history.past.at(-1);
      if (!previous) return state;
      return {
        ...state,
        course: previous,
        save: { ...state.save, status: nextSaveStatus(state) },
        history: {
          past: state.history.past.slice(0, -1),
          future: [state.course, ...state.history.future],
          typingKey: null,
        },
      };
    }
    case "REDO": {
      const [next, ...future] = state.history.future;
      if (!next) return state;
      return {
        ...state,
        course: next,
        save: { ...state.save, status: nextSaveStatus(state) },
        history: {
          past: [...state.history.past, state.course],
          future,
          typingKey: null,
        },
      };
    }
    case "SAVE_FINISHED":
      return {
        ...state,
        save: { status: "saved", savedCourse: state.course },
      };
  }
}

/* Selectors */
export const allItems = (course: Course) => course.units.flatMap((unit) => unit.items);

export const findItem = (course: Course, itemId: string | null | undefined) =>
  allItems(course).find((item) => item.id === itemId);

export const findBlock = (course: Course, itemId: string, blockId?: string) =>
  findItem(course, itemId)?.blocks.find((block) => block.id === blockId);

export const unitOf = (course: Course, itemId: string) =>
  course.units.find((unit) => unit.items.some((item) => item.id === itemId));

const plural = (count: number, one: string, many = `${one}s`) =>
  `${count} ${count === 1 ? one : many}`;

/* Every count on screen is worked out here, so the labels can't contradict each other. */
export function courseCounts(course: Course) {
  const items = allItems(course);
  const lessons = items.filter(
    (item) => item.kind === "lesson" || item.kind === "content",
  ).length;
  const quizzes = items.filter((item) => item.kind === "quiz").length;
  const videos = items.filter((item) => item.kind === "video").length;
  return {
    units: plural(course.units.length, "Unit"),
    lessons: plural(lessons, "Lesson"),
    quizzes: plural(quizzes, "Quiz", "Quizzes"),
    videos: plural(videos, "Video"),
    breakdown: [
      plural(course.units.length, "Unit"),
      plural(lessons, "Lesson"),
      plural(quizzes, "Quiz", "Quizzes"),
      plural(videos, "Video"),
    ].join(" • "),
    summary: `${plural(course.units.length, "Unit")} · ${plural(items.length, "Item")}`,
    minutes: lessons * 6 + quizzes * 4 + videos * 8,
  };
}

export const activeOps = (state: AppState) =>
  state.operations.filter((op) => ["running", "slow", "paused"].includes(op.status));

export const queuedOps = (state: AppState) =>
  state.operations.filter((op) => op.status === "queued");

export const pendingChange = (state: AppState, itemId: string, blockId: string) => {
  for (const proposal of state.proposals) {
    if (proposal.status !== "pending") continue;
    const change = proposal.changes.find(
      (c) => c.itemId === itemId && c.blockId === blockId,
    );
    if (change) return { proposal, change };
  }
  return null;
};

export const isChangeStale = (state: AppState, itemId: string, before: Block | null, blockId?: string) => {
  if (!blockId || !before) return false;
  return JSON.stringify(findBlock(state.course, itemId, blockId)) !== JSON.stringify(before);
};
