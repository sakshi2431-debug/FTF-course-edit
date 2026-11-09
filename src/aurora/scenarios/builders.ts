import { allSignatures, buildChecks, runRules } from "../mock/checks";
import { createBaseState } from "../mock/course";
import { transformBlock } from "../mock/scripts";
import { findBlock, findItem, updateItem } from "../state/reducer";
import type {
  AppState,
  Attachment,
  Block,
  Item,
  Message,
  Proposal,
  ProposalChange,
} from "../state/types";

/* Pure helpers that assemble a scenario's starting snapshot. */

export const base = createBaseState;
let seq = 0;
const sid = (prefix: string) => `seed-${prefix}-${++seq}`;

export const panel = (s: AppState): AppState => ({
  ...s,
  aurora: { ...s.aurora, panel: "open" },
});

export const select = (s: AppState, itemId: string): AppState => ({
  ...s,
  ui: { ...s.ui, selectedItemId: itemId },
});

export const composer = (s: AppState, text: string): AppState =>
  panel({ ...s, ui: { ...s.ui, composer: text } });

export const mock = (s: AppState, patch: Partial<AppState["mock"]>): AppState => ({
  ...s,
  mock: { ...s.mock, ...patch },
});

export const autorun = (s: AppState, ...commands: AppState["autorun"]): AppState => ({
  ...s,
  autorun: commands,
});

export const say = (s: AppState, message: Record<string, unknown>): AppState => ({
  ...s,
  clock: s.clock + 1,
  aurora: {
    ...s.aurora,
    messages: [
      ...s.aurora.messages,
      {
        ...message,
        id: sid("msg"),
        time: `10:${String(32 + s.clock).padStart(2, "0")} AM`,
      } as Message,
    ],
  },
});

export const user = (s: AppState, text: string) => say(s, { kind: "user", text });
export const aurora = (s: AppState, text: string) => say(s, { kind: "text", text });

export const question = (s: AppState, fields: Record<string, unknown>): AppState =>
  say(s, {
    kind: "question",
    multi: false,
    allowOther: false,
    skippable: false,
    selected: [],
    other: "",
    status: "open",
    actedOn: false,
    ...fields,
  });

export function editBlock(s: AppState, itemId: string, blockId: string, patch: Record<string, unknown>): AppState {
  const course = updateItem(s.course, itemId, (item) => ({
    ...item,
    blocks: item.blocks.map((b) => (b.id === blockId ? ({ ...b, ...patch } as Block) : b)),
  }));
  return { ...s, course, save: { ...s.save, savedCourse: course } };
}

const changeFor = (s: AppState, itemId: string, blockId: string, instruction: string): ProposalChange => {
  const block = findBlock(s.course, itemId, blockId)!;
  return {
    id: sid("chg"),
    itemId,
    itemTitle: findItem(s.course, itemId)!.title,
    blockId,
    before: block,
    after: transformBlock(block, instruction),
    decision: "accept",
  };
};

const addProposal = (s: AppState, proposal: Proposal): AppState =>
  say({ ...s, proposals: [...s.proposals, proposal] }, { kind: "proposal", proposalId: proposal.id });

export function pendingSmall(
  s: AppState,
  instruction = "Make it simpler",
  itemId = "what-is-python",
  blockId = "wip-intro",
  extra: Partial<Proposal> = {},
): AppState {
  const item = findItem(s.course, itemId)!;
  return addProposal(panel(user(s, instruction)), {
    id: "prop-seed",
    title: `Change to ${item.title}`,
    summary: instruction,
    instruction,
    basis: /example|long|continue|explain|\badd\b/i.test(instruction)
      ? "Your text and Aurora's own knowledge"
      : "Your text only. Aurora reworded what's there, without adding anything",
    kind: "small",
    status: "pending",
    revisions: 0,
    changes: [changeFor(s, itemId, blockId, instruction)],
    ...extra,
  });
}

export function pendingLarge(s: AppState, review = true): AppState {
  const instruction = "Simplify the lessons in Unit 1 and Unit 2";
  const next = addProposal(panel(user(s, instruction)), {
    id: "prop-seed",
    title: "Changes to 3 items",
    summary: instruction,
    instruction,
    kind: "large",
    status: "pending",
    revisions: 0,
    changes: [
      changeFor(s, "what-is-python", "wip-intro", instruction),
      changeFor(s, "why-python", "why-intro", instruction),
      changeFor(s, "functions", "fn-intro", instruction),
    ],
  });
  return { ...next, ui: { ...next.ui, reviewProposalId: review ? "prop-seed" : null } };
}

/* The state straight after a proposal was applied, so Undo can be tried immediately. */
export function applied(s: AppState): AppState {
  const proposal = s.proposals.at(-1)!;
  let course = s.course;
  for (const change of proposal.changes) {
    if (change.newItem) {
      const { unitId, item } = change.newItem;
      course = {
        ...course,
        units: course.units.map((u) => (u.id === unitId ? { ...u, items: [...u.items, item] } : u)),
      };
    } else if (change.after) {
      const after = change.after;
      course = updateItem(course, change.itemId, (item) => ({
        ...item,
        aiLabel: { source: proposal.source },
        blocks: item.blocks.map((b) => (b.id === after.id ? after : b)),
      }));
    }
  }
  return {
    ...s,
    course,
    save: { ...s.save, savedCourse: course },
    history: { past: [s.course], future: [], typingKey: null },
    proposals: s.proposals.map((p) => (p.id === proposal.id ? { ...p, status: "applied" } : p)),
  };
}

export const attachment = (overrides: Partial<Attachment> = {}): Attachment => ({
  id: "att-seed",
  kind: "file",
  name: "Crash Course Python.pdf",
  meta: "2.4 MB",
  size: 2516582,
  status: "ready",
  progress: 100,
  generatedItemIds: [],
  ...overrides,
});

export const withAttachment = (s: AppState, overrides: Partial<Attachment> = {}): AppState =>
  panel({ ...s, attachments: [...s.attachments, attachment(overrides)] });

export const howToUse = (s: AppState, selected: string[] = []): AppState =>
  question(s, {
    prompt: "How should I use Crash Course Python.pdf?",
    options: ["Create a new lesson", "Update the current item", "Create a quiz"],
    selected,
    next: { type: "use-attachment", attachmentId: "att-seed", attachmentName: "Crash Course Python.pdf" },
  });

export function pendingNewLesson(s: AppState): AppState {
  const source = "Crash Course Python.pdf";
  const item: Item = {
    id: "generated-seed",
    title: "New lesson: Crash Course Python",
    kind: "lesson",
    objectives: ["Summarise the key ideas in the source"],
    notes: "",
    aiLabel: { source },
    blocks: [
      {
        id: "generated-seed-p",
        type: "paragraph",
        heading: "Key ideas",
        text: `This lesson summarises the main ideas from ${source}: why readable code matters, and how small programs grow into useful tools.`,
      },
    ],
  };
  return addProposal(panel(s), {
    id: "prop-seed",
    title: "New lesson",
    summary: `From ${source}`,
    instruction: `Generate from ${source}`,
    kind: "generate",
    status: "pending",
    revisions: 0,
    source,
    changes: [
      {
        id: "chg-seed",
        itemId: item.id,
        itemTitle: item.title,
        before: null,
        after: item.blocks[0],
        decision: "accept",
        newItem: { unitId: "introduction", item },
      },
    ],
  });
}

/* Course defects, so the real rules produce real findings. */
export function withBlocking(s: AppState): AppState {
  let next = editBlock(s, "functions-video", "fv-video", {
    url: "https://videos.example.com/python/broken-link",
  });
  next = editBlock(next, "intro-quiz", "iq-1", { correctIndex: null });
  return next;
}

export function withAdvisory(s: AppState): AppState {
  let next = editBlock(s, "what-is-python", "wip-features", {
    items: [
      "Easy to learn and readable syntax",
      "Versatile and used in multiple domains",
      "Cross-platform — runs on Windows, Mac, and Linux",
      "Versatile and used in multiple domains",
    ],
  });
  next = editBlock(next, "why-python", "why-intro", {
    text: "Python lets you express ideas in fewer lines of code than many other languages. Rust is also worth learning for systems work.",
  });
  const course = updateItem(next.course, "variables", (item) => ({
    ...item,
    objectives: [...item.objectives, "Uncovered: Explain mutable and immutable types"],
  }));
  return { ...next, course, save: { ...next.save, savedCourse: course } };
}

export const withAllDefects = (s: AppState) => withAdvisory(withBlocking(s));

export function validated(s: AppState, step: AppState["ui"]["step"] = "validate"): AppState {
  const findings = runRules(s.course);
  return {
    ...s,
    ui: {
      ...s.ui,
      step,
      collapsedUnitIds: [],
    },
    validation: {
      ...s.validation,
      status: "done",
      findings,
      checks: buildChecks(findings),
      signatures: allSignatures(s.course),
    },
  };
}

export const dismiss = (s: AppState, ...ids: string[]): AppState => ({
  ...s,
  validation: { ...s.validation, dismissedIds: [...s.validation.dismissedIds, ...ids] },
});

/* An edit made after checks ran: unlike editBlock, it counts as a change since validation. */
export function laterEdit(s: AppState, itemId: string, blockId: string, patch: Record<string, unknown>): AppState {
  return {
    ...s,
    course: updateItem(s.course, itemId, (item) => ({
      ...item,
      blocks: item.blocks.map((b) => (b.id === blockId ? ({ ...b, ...patch } as Block) : b)),
    })),
    history: { past: [s.course, ...s.history.past], future: [], typingKey: null },
  };
}
