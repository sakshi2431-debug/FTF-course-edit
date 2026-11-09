import {
  activeOps,
  allItems,
  findBlock,
  findItem,
  isChangeStale,
  queuedOps,
  unitOf,
  updateItem,
} from "../state/reducer";
import { store } from "../state/store";
import type {
  AppState,
  Attachment,
  Block,
  Command,
  Continuation,
  Finding,
  GenerateUse,
  Item,
  Message,
  Operation,
  Proposal,
  ProposalChange,
} from "../state/types";
import {
  allSignatures,
  buildChecks,
  CHECK_DEFS,
  CHECK_STEPS,
  correctedBlock,
  runRules,
  staleCheckIds,
} from "./checks";
import {
  answerFor,
  editKind,
  FOLLOWUP_ANSWER,
  generateSteps,
  LARGE_STEPS,
  OUT_OF_SCOPE_ANSWER,
  routeChat,
  SMALL_STEPS,
  TOO_LARGE_ANSWER,
  transformBlock,
} from "./scripts";

/* The scripted stand-in for Aurora and its services. No network or AI calls anywhere. */

const STEP_MS = 650;
const PERSIST_KEY = "aurora-prototype-snapshot";
const ALLOWED = ["pdf", "pptx", "docx", "svg", "png"];
const MAX_BYTES = 200 * 1024 * 1024;

let counter = 0;
const uid = (prefix: string) => `${prefix}-${++counter}`;
const timers = new Set<number>();

function speedScale() {
  const speed = Number(new URLSearchParams(window.location.search).get("speed"));
  return speed > 0 ? speed : 1;
}

function after(ms: number, fn: () => void) {
  const timer = window.setTimeout(() => {
    timers.delete(timer);
    fn();
  }, ms * store.get().mock.delay * speedScale());
  timers.add(timer);
}

const reducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

function clockTime(minutes: number) {
  const total = 10 * 60 + 32 + minutes;
  const hour = Math.floor(total / 60) % 12 || 12;
  return `${hour}:${String(total % 60).padStart(2, "0")} AM`;
}

function announce(text: string) {
  store.set((s) => ({ ...s, ui: { ...s.ui, announcement: text } }));
}

function toast(text: string, tone: "success" | "error" | "info" = "success", undo?: string) {
  store.set((s) => ({ ...s, ui: { ...s.ui, toast: { text, tone, undo } } }));
  announce(text);
}

type NewMessage = Message extends infer M
  ? M extends Message
    ? Omit<M, "id" | "time">
    : never
  : never;

function addMessage(message: NewMessage): string {
  const id = uid("msg");
  store.set((s) => ({
    ...s,
    clock: s.clock + 1,
    aurora: {
      ...s.aurora,
      messages: [
        ...s.aurora.messages,
        { ...message, id, time: clockTime(s.clock) } as Message,
      ],
    },
  }));
  return id;
}

function patchMessage(id: string, patch: Record<string, unknown>) {
  store.set((s) => ({
    ...s,
    aurora: {
      ...s.aurora,
      messages: s.aurora.messages.map((m) =>
        m.id === id ? ({ ...m, ...patch } as Message) : m,
      ),
    },
  }));
}

function patchOp(id: string, patch: Partial<Operation>) {
  store.set((s) => ({
    ...s,
    operations: s.operations.map((op) => (op.id === id ? { ...op, ...patch } : op)),
  }));
}

function patchAttachment(id: string, patch: Partial<Attachment>) {
  store.set((s) => ({
    ...s,
    attachments: s.attachments.map((a) => (a.id === id ? { ...a, ...patch } : a)),
  }));
}

/* Text streaming */
function streamText(full: string) {
  const id = addMessage({ kind: "text", text: "", streaming: true, full });
  if (reducedMotion()) {
    patchMessage(id, { text: full, streaming: false });
    announce("Aurora replied");
    return;
  }
  const words = full.split(" ");
  let shown = 0;
  const tick = () => {
    const message = store.get().aurora.messages.find((m) => m.id === id);
    if (!message || message.kind !== "text" || !message.streaming) return;
    shown += 1;
    patchMessage(id, {
      text: words.slice(0, shown).join(" "),
      streaming: shown < words.length,
    });
    if (shown < words.length) after(70, tick);
    else announce("Aurora replied");
  };
  after(70, tick);
}

export function stopStream(id: string) {
  patchMessage(id, { streaming: false, stopped: true });
  announce("Aurora stopped");
}

/* Operations: named steps that complete in order */
function startOp(spec: {
  label: string;
  kind: Operation["kind"];
  itemIds: string[];
  blockId?: string;
  steps: string[];
  origin: Command;
  questionId?: string;
}) {
  /* A new request brings the in-place preview back for these items. */
  store.set((c) => ({
    ...c,
    ui: { ...c.ui, editAnyway: c.ui.editAnyway.filter((id) => !spec.itemIds.includes(id)) },
  }));
  openAurora();
  const s = store.get();
  const baseItems = Object.fromEntries(
    spec.itemIds.map((id) => [id, JSON.stringify(findItem(s.course, id) ?? null)]),
  );
  const busy = activeOps(s);
  const overlap = busy.find((op) => op.itemIds.some((id) => spec.itemIds.includes(id)));
  const op: Operation = {
    id: uid("op"),
    label: spec.label,
    kind: spec.kind,
    itemIds: spec.itemIds,
    blockId: spec.blockId,
    steps: spec.steps.map((label) => ({ label, status: "pending" })),
    status: "queued",
    origin: spec.origin,
    baseItems,
    questionId: spec.questionId,
    waitingReason: busy.length
      ? overlap
        ? `Waiting because "${overlap.label}" is changing the same item.`
        : `Waiting for "${busy[0].label}" to finish.`
      : undefined,
  };
  store.set((c) => ({ ...c, operations: [...c.operations, op] }));
  addMessage({ kind: "progress", opId: op.id });
  if (busy.length === 0) beginOp(op.id);
}

function beginOp(id: string) {
  patchOp(id, { status: "running", waitingReason: undefined });
  const op = store.get().operations.find((o) => o.id === id)!;
  announce(`Aurora started: ${op.label}`);
  stepOp(id, 0);
}

function stepOp(id: string, index: number) {
  const op = store.get().operations.find((o) => o.id === id);
  if (!op || op.status === "cancelled" || op.status === "failed") return;
  patchOp(id, {
    steps: op.steps.map((step, i) => ({
      ...step,
      status: i < index ? "done" : i === index ? "active" : "pending",
    })),
  });
  const label = op.steps[index]?.label;
  if (label) announce(label);
  const mode = store.get().mock.op;
  const trigger = index === 1 && mode !== "ok";
  if (trigger) {
    if (mode === "fail") return setTimeoutSafe(() => failOp(id, index));
    if (mode === "slow") {
      after(STEP_MS, () => {
        const current = store.get().operations.find((o) => o.id === id);
        if (current?.status === "running") {
          patchOp(id, { status: "slow" });
          announce("This is taking longer than expected");
        }
      });
      consumeMode();
      return;
    }
    if (mode === "offline") {
      consumeMode();
      after(STEP_MS, () => {
        patchOp(id, { status: "paused" });
        setConnection("offline");
      });
      return;
    }
    if (mode === "expire") {
      consumeMode();
      after(STEP_MS, () => {
        patchOp(id, { status: "paused" });
        store.set((s) => ({
          ...s,
          session: "expired",
          ui: { ...s.ui, dialog: { type: "session" } },
        }));
        announce("Your session has expired");
      });
      return;
    }
  }
  after(STEP_MS, () => {
    const current = store.get().operations.find((o) => o.id === id);
    if (!current || current.status !== "running") return;
    if (index + 1 < current.steps.length) stepOp(id, index + 1);
    else finishOp(id);
  });
}

function setTimeoutSafe(fn: () => void) {
  after(STEP_MS, fn);
}

function consumeMode() {
  store.set((s) => ({ ...s, mock: { ...s.mock, op: "ok" } }));
}

function failOp(id: string, index: number) {
  const op = store.get().operations.find((o) => o.id === id);
  if (!op || op.status !== "running") return;
  consumeMode();
  patchOp(id, {
    status: "failed",
    steps: op.steps.map((step, i) => (i === index ? { ...step, status: "failed" } : step)),
  });
  addMessage({
    kind: "error",
    text: `I couldn't finish "${op.label}". Nothing in your course changed, and your own edits are still there.`,
    retry: op.origin,
  });
  announce("Aurora couldn't finish. Nothing in your course changed");
  startNext();
}

export function cancelOp(id: string) {
  const op = store.get().operations.find((o) => o.id === id);
  if (!op) return;
  patchOp(id, { status: "cancelled" });
  addMessage({
    kind: "notice",
    tone: "info",
    text: `Cancelled "${op.label}". Nothing in your course changed.`,
    actions: [],
  });
  announce("Cancelled. Nothing in your course changed");
  if (op.status !== "queued") startNext();
}

export function keepWaiting(id: string) {
  patchOp(id, { status: "running" });
  const op = store.get().operations.find((o) => o.id === id)!;
  const index = op.steps.findIndex((step) => step.status === "active");
  after(STEP_MS, () => {
    const current = store.get().operations.find((o) => o.id === id);
    if (!current || current.status !== "running") return;
    if (index + 1 < current.steps.length) stepOp(id, index + 1);
    else finishOp(id);
  });
}

function resumePaused() {
  const s = store.get();
  for (const op of s.operations.filter((o) => o.status === "paused")) {
    patchOp(op.id, { status: "running" });
    const index = op.steps.findIndex((step) => step.status === "active");
    announce(`Aurora resumed: ${op.label}`);
    after(STEP_MS, () => {
      const current = store.get().operations.find((o) => o.id === op.id);
      if (!current || current.status !== "running") return;
      if (index + 1 < current.steps.length) stepOp(op.id, index + 1);
      else finishOp(op.id);
    });
  }
}

function startNext() {
  if (activeOps(store.get()).length) return;
  const next = queuedOps(store.get())[0];
  if (next) beginOp(next.id);
}

function finishOp(id: string) {
  const s = store.get();
  const op = s.operations.find((o) => o.id === id);
  if (!op) return;
  const deleted = op.itemIds.find(
    (itemId) => op.baseItems[itemId] !== "null" && !findItem(s.course, itemId),
  );
  patchOp(id, {
    status: "done",
    steps: op.steps.map((step) => ({ ...step, status: "done" })),
  });
  if (deleted) {
    const title = (JSON.parse(op.baseItems[deleted]) as Item).title;
    addMessage({
      kind: "notice",
      tone: "warning",
      title: "That item was deleted",
      text: `You deleted "${title}" while I was editing it, so I stopped and discarded my draft.`,
      actions: [{ label: "Restore the item", command: { cmd: "restoreItem" } }],
    });
    announce("Aurora stopped because the item was deleted");
    startNext();
    return;
  }
  const conflicted = op.itemIds.find(
    (itemId) => JSON.stringify(findItem(s.course, itemId)) !== op.baseItems[itemId],
  );
  const created = deliver(op);
  if (conflicted && created) {
    store.set((c) => ({
      ...c,
      proposals: c.proposals.map((p) =>
        p.id === created
          ? {
              ...p,
              warning:
                "You edited this item while I was working. Your newer work is kept. This draft is based on the older version, so review it before applying.",
            }
          : p,
      ),
    }));
    addMessage({
      kind: "notice",
      tone: "warning",
      title: "Your edit and my draft overlap",
      text: "Your newer work is kept in the lesson. Nothing has been overwritten.",
      actions: [
        { label: "Review my change", command: { cmd: "reviewProposal", id: created } },
        { label: "Retry on your latest version", command: op.origin },
      ],
    });
    announce("Conflict detected. Your newer work is kept");
  } else if (created) {
    announce("Aurora's change is ready to review");
  }
  startNext();
}

/* Turning a finished operation into a proposal. Nothing touches the course until it's applied. */
function deliver(op: Operation): string | null {
  const origin = op.origin;
  if (origin.cmd === "small") {
    return buildSmall(origin.itemId, origin.blockId, origin.instruction, op.questionId, revisionCounts.get(op.id) ?? 0);
  }
  if (origin.cmd === "large") return buildLarge(origin.instruction, origin.itemIds, op.questionId);
  if (origin.cmd === "generate") return buildGenerated(origin.attachmentId, origin.use);
  if (origin.cmd === "quizQuestions") return buildQuizQuestions(origin.itemId);
  return null;
}

function supersedeForBlocks(changes: ProposalChange[]) {
  const keys = changes.map((c) => `${c.itemId}:${c.blockId}`);
  store.set((s) => ({
    ...s,
    proposals: s.proposals.map((p) =>
      p.status === "pending" &&
      p.changes.some((c) => keys.includes(`${c.itemId}:${c.blockId}`))
        ? { ...p, status: "superseded" }
        : p,
    ),
  }));
}

function addProposal(proposal: Omit<Proposal, "id" | "status" | "revisions"> & { revisions?: number }) {
  const id = uid("prop");
  const full: Proposal = { revisions: 0, ...proposal, id, status: "pending" };
  supersedeForBlocks(full.changes);
  store.set((s) => ({ ...s, proposals: [...s.proposals, full] }));
  addMessage({ kind: "proposal", proposalId: id });
  return id;
}

const firstEditable = (item: Item) =>
  item.blocks.find((b) => b.type === "intro" || b.type === "paragraph") ?? item.blocks[0];

function buildSmall(itemId: string, blockId: string | undefined, instruction: string, questionId?: string, revisions = 0) {
  const s = store.get();
  const item = findItem(s.course, itemId);
  if (!item) return null;
  const block = item.blocks.find((b) => b.id === blockId) ?? firstEditable(item);
  if (!block) return null;
  const id = addProposal({
    title: `Change to ${item.title}`,
    summary: instruction,
    instruction,
    basis: basisFor(s, instruction),
    kind: "small",
    questionId,
    revisions,
    changes: [
      {
        id: uid("chg"),
        itemId,
        itemTitle: item.title,
        blockId: block.id,
        before: block,
        after: transformBlock(block, instruction, revisions),
        decision: "accept",
      },
    ],
  });
  return id;
}

function buildLarge(instruction: string, itemIds: string[], questionId?: string) {
  const s = store.get();
  const partial = s.mock.partial;
  const targets = itemIds
    .map((id) => findItem(s.course, id))
    .filter((item): item is Item => Boolean(item && firstEditable(item)));
  const worked = partial ? targets.slice(0, -1) : targets;
  const failed = partial ? targets.at(-1)?.title : undefined;
  if (partial) store.set((c) => ({ ...c, mock: { ...c.mock, partial: false } }));
  return addProposal({
    title: `Changes to ${worked.length} items`,
    summary: instruction,
    instruction,
    kind: "large",
    questionId,
    failedItem: failed,
    warning: failed
      ? `I finished ${worked.length} of ${targets.length} items. "${failed}" failed and is unchanged.`
      : undefined,
    changes: worked.map((item) => {
      const block = firstEditable(item);
      return {
        id: uid("chg"),
        itemId: item.id,
        itemTitle: item.title,
        blockId: block.id,
        before: block,
        after: transformBlock(block, instruction),
        decision: "accept",
      };
    }),
  });
}

function buildGenerated(attachmentId: string, use: GenerateUse) {
  const s = store.get();
  const attachment = s.attachments.find((a) => a.id === attachmentId);
  const source = attachment?.name ?? "your attachment";
  const selected = findItem(s.course, s.ui.selectedItemId) ?? allItems(s.course)[0];
  const unitId = unitOf(s.course, selected.id)?.id ?? s.course.units[0].id;
  const contradicts = /contradict/i.test(source);
  if (use === "update") {
    const block = firstEditable(selected);
    const after: Block =
      block.type === "intro" || block.type === "paragraph"
        ? {
            ...block,
            text: contradicts
              ? `${block.text} According to ${source}, Python is compiled before it runs.`
              : `${block.text} ${source} adds that Python is used in most introductory programming courses.`,
          }
        : block;
    return addProposal({
      title: `Update ${selected.title}`,
      summary: `From ${source}`,
      instruction: `Update from ${source}`,
      kind: "generate",
      source,
      warning: contradicts
        ? `${source} says Python is compiled before it runs, but this lesson says it is interpreted. Check which is right before applying.`
        : undefined,
      changes: [
        {
          id: uid("chg"),
          itemId: selected.id,
          itemTitle: selected.title,
          blockId: block.id,
          before: block,
          after,
          decision: "accept",
        },
      ],
    });
  }
  const itemId = uid("generated");
  const quiz = use === "quiz";
  const item: Item = {
    id: itemId,
    title: quiz ? `Quiz: ${source.replace(/\.[a-z]+$/i, "")}` : `New lesson: ${source.replace(/\.[a-z]+$/i, "")}`,
    kind: quiz ? "quiz" : "lesson",
    objectives: [quiz ? "Check understanding of the source" : "Summarise the key ideas in the source"],
    notes: "",
    aiLabel: { source },
    blocks: quiz
      ? [
          {
            id: `${itemId}-q1`,
            type: "question",
            question: "Which statement about Python is true?",
            options: ["It reads close to plain English", "It only runs on Linux", "It has no libraries"],
            correctIndex: 0,
          },
          {
            id: `${itemId}-q2`,
            type: "question",
            question: "What does a function let you do?",
            options: ["Reuse steps by name", "Change file formats", "Skip errors"],
            correctIndex: 0,
          },
        ]
      : [
          {
            id: `${itemId}-p`,
            type: "paragraph",
            heading: "Key ideas",
            text: `This lesson summarises the main ideas from ${source}: why readable code matters, and how small programs grow into useful tools.`,
          },
        ],
  };
  return addProposal({
    title: quiz ? "New quiz" : "New lesson",
    summary: `From ${source}`,
    instruction: `Generate from ${source}`,
    kind: "generate",
    source,
    changes: [
      {
        id: uid("chg"),
        itemId,
        itemTitle: item.title,
        before: null,
        after: item.blocks[0],
        decision: "accept",
        newItem: { unitId, item },
      },
    ],
  });
}

/* Generate on the quiz screen: drafts questions from the course and waits for approval. */
export function generateQuizQuestions(itemId: string) {
  openAurora();
  addMessage({ kind: "user", text: "Generate questions for this quiz" });
  startOp({
    label: "Generating questions",
    kind: "generate",
    itemIds: [itemId],
    steps: ["Reading your lessons", "Drafting questions"],
    origin: { cmd: "quizQuestions", itemId },
  });
}

function buildQuizQuestions(itemId: string) {
  const item = findItem(store.get().course, itemId);
  const questions: Block[] = [
    {
      id: uid("question"),
      type: "question",
      format: "multiple",
      question: "What does a variable do in Python?",
      options: ["Stores a value under a name", "Prints text to the screen", "Ends the program"],
      correctIndex: 0,
    },
    {
      id: uid("question"),
      type: "question",
      format: "truefalse",
      question: "Python code has to be compiled by hand before it runs.",
      options: ["True", "False"],
      correctIndex: 1,
    },
  ];
  return addProposal({
    title: "2 new questions",
    summary: "Drafted from your lessons. Nothing is added until you apply it.",
    instruction: "Generate questions for this quiz",
    kind: "generate",
    changes: questions.map((after, index) => ({
      id: uid("chg"),
      itemId,
      itemTitle: `${item?.title ?? "Quiz"}, question ${(item?.blocks.length ?? 0) + index + 1}`,
      before: null,
      after,
      decision: "accept" as const,
      append: true,
    })),
  });
}

/* The result under a selection: apply the draft on screen, or keep both versions. */
export function applyDraft(id: string, after: Block) {
  store.set((s) => ({
    ...s,
    proposals: s.proposals.map((p) =>
      p.id === id ? { ...p, changes: p.changes.map((c) => ({ ...c, after })) } : p,
    ),
  }));
  applyProposal(id);
}

export function insertDraftBelow(id: string, after: Block) {
  const s = store.get();
  const proposal = s.proposals.find((p) => p.id === id);
  const change = proposal?.changes[0];
  if (!change?.blockId) return;
  const added: Block = { ...after, id: uid("block") };
  const course = updateItem(s.course, change.itemId, (item) => {
    const at = item.blocks.findIndex((b) => b.id === change.blockId);
    return {
      ...item,
      blocks: [...item.blocks.slice(0, at + 1), added, ...item.blocks.slice(at + 1)],
    };
  });
  store.dispatch({ type: "SET_COURSE", course, key: "" });
  store.set((c) => ({
    ...c,
    proposals: c.proposals.map((p) => (p.id === id ? { ...p, status: "inserted" } : p)),
  }));
  announce("Aurora's draft was added below your original");
}

/* Applying, rejecting and revising */
export function applyProposal(id: string, onlyAccepted = false) {
  const s = store.get();
  const proposal = s.proposals.find((p) => p.id === id);
  if (!proposal) return;
  if (proposal.kind === "fix" && s.mock.fixApply === "fail-once") {
    store.set((c) => ({ ...c, mock: { ...c.mock, fixApply: "ok" } }));
    addMessage({
      kind: "error",
      text: "I couldn't apply that correction. Your course hasn't changed. Try again, or fix it yourself.",
      retry: { cmd: "retryProposalApply", id },
      manual: proposal.changes[0]?.itemId,
    });
    announce("Aurora's correction failed");
    return;
  }
  const accepted = proposal.changes.filter(
    (c) => !onlyAccepted || c.decision === "accept",
  );
  let course = s.course;
  for (const change of accepted) {
    if (change.append && change.after) {
      const added = change.after;
      course = updateItem(course, change.itemId, (item) => ({
        ...item,
        blocks: [...item.blocks, added],
      }));
    } else if (change.newItem) {
      const { unitId, item } = change.newItem;
      course = {
        ...course,
        units: course.units.map((u) =>
          u.id === unitId ? { ...u, items: [...u.items, item] } : u,
        ),
      };
    } else if (change.after) {
      const after = change.after;
      course = updateItem(course, change.itemId, (item) => ({
        ...item,
        aiLabel: { source: proposal.source ?? item.aiLabel?.source },
        blocks: item.blocks.map((b) => (b.id === after.id ? after : b)),
      }));
    }
  }
  store.dispatch({ type: "SET_COURSE", course, key: "" });
  store.set((c) => ({
    ...c,
    proposals: c.proposals.map((p) =>
      p.id === id
        ? { ...p, status: "applied", changes: p.changes.map((ch) => (accepted.includes(ch) ? ch : { ...ch, decision: "reject" })) }
        : p,
    ),
    ui: {
      ...c.ui,
      reviewProposalId: null,
      selectedItemId: accepted[0]?.newItem ? accepted[0].newItem.item.id : c.ui.selectedItemId,
    },
    validation: proposal.findingId
      ? {
          ...c.validation,
          findings: c.validation.findings.map((f) =>
            f.id === proposal.findingId || proposal.changes.length > 1
              ? markFixedIfAffected(f, proposal)
              : f,
          ),
        }
      : c.validation,
    attachments: c.attachments.map((a) =>
      proposal.source === a.name
        ? { ...a, generatedItemIds: [...a.generatedItemIds, ...accepted.map((ch) => ch.itemId)] }
        : a,
    ),
  }));
  toast(
    accepted.length > 1 ? `Applied ${accepted.length} changes` : "Change applied",
    "success",
    id,
  );
}

function markFixedIfAffected(finding: Finding, proposal: Proposal): Finding {
  return proposal.changes.some((c) => c.blockId === finding.blockId) || finding.id === proposal.findingId
    ? { ...finding, status: "fixed" }
    : finding;
}

export function discardProposal(id: string) {
  store.set((s) => ({
    ...s,
    proposals: s.proposals.map((p) => (p.id === id ? { ...p, status: "discarded" } : p)),
    ui: { ...s.ui, reviewProposalId: null, dialog: null },
  }));
  toast("Change discarded. Your original is unchanged", "info");
}

export function undoProposal(id: string) {
  store.dispatch({ type: "UNDO" });
  const s = store.get();
  const proposal = s.proposals.find((p) => p.id === id);
  store.set((c) => ({
    ...c,
    proposals: c.proposals.map((p) => (p.id === id ? { ...p, status: "undone" } : p)),
    ui: {
      ...c.ui,
      toast: null,
      selectedItemId: findItem(c.course, c.ui.selectedItemId)
        ? c.ui.selectedItemId
        : allItems(c.course)[0]?.id ?? null,
    },
  }));
  announce("Aurora's change was undone");
}

export function reviseProposal(id: string, text: string) {
  const s = store.get();
  const proposal = s.proposals.find((p) => p.id === id);
  const change = proposal?.changes[0];
  if (!proposal || !change || !change.before) return;
  addMessage({ kind: "user", text });
  if (needsSource(text)) return;
  const revisions = proposal.revisions + 1;
  store.set((c) => ({
    ...c,
    proposals: c.proposals.map((p) => (p.id === id ? { ...p, status: "superseded" } : p)),
  }));
  startOp({
    label: "Revising the change",
    kind: "small",
    itemIds: [change.itemId],
    blockId: change.blockId,
    steps: ["Reading your feedback", "Drafting another version"],
    origin: { cmd: "small", itemId: change.itemId, blockId: change.blockId, instruction: text },
  });
  const opId = store.get().operations.at(-1)!.id;
  revisionCounts.set(opId, revisions);
}
const revisionCounts = new Map<string, number>();

/* SED-08: Aurora changed the wrong part, so redo the same request on the right one. */
export function rescopeProposal(id: string, blockId: string) {
  const s = store.get();
  const proposal = s.proposals.find((p) => p.id === id);
  const change = proposal?.changes[0];
  if (!proposal || !change) return;
  store.set((c) => ({
    ...c,
    proposals: c.proposals.map((p) => (p.id === id ? { ...p, status: "superseded" } : p)),
  }));
  addMessage({
    kind: "notice",
    tone: "info",
    text: "Got it. I've put that part back and will make the change where you asked.",
    actions: [],
  });
  startOp({
    label: "Changing the part you chose",
    kind: "small",
    itemIds: [change.itemId],
    blockId,
    steps: SMALL_STEPS,
    origin: { cmd: "small", itemId: change.itemId, blockId, instruction: proposal.instruction },
  });
}

export function setChangeDecision(proposalId: string, changeId: string, decision: "accept" | "reject") {
  store.set((s) => ({
    ...s,
    proposals: s.proposals.map((p) =>
      p.id === proposalId
        ? { ...p, changes: p.changes.map((c) => (c.id === changeId ? { ...c, decision } : c)) }
        : p,
    ),
  }));
}

/* LED-08: rebuild an out of date proposal against the latest content. */
export function refreshProposal(id: string) {
  const proposal = store.get().proposals.find((p) => p.id === id);
  if (!proposal) return;
  store.set((s) => ({
    ...s,
    proposals: s.proposals.map((p) => (p.id === id ? { ...p, status: "superseded" } : p)),
    ui: { ...s.ui, reviewProposalId: null },
  }));
  startOp({
    label: "Updating the proposal",
    kind: "large",
    itemIds: proposal.changes.map((c) => c.itemId),
    steps: ["Reading your latest edits", "Drafting each item again"],
    origin: {
      cmd: "large",
      instruction: proposal.instruction,
      itemIds: proposal.changes.map((c) => c.itemId),
    },
  });
}

export const hasStaleChange = (proposal: Proposal) => {
  const s = store.get();
  return proposal.changes.some((c) => isChangeStale(s, c.itemId, c.before, c.blockId));
};

/* Questions */
export function chooseOption(id: string, option: string, multi: boolean) {
  const message = store.get().aurora.messages.find((m) => m.id === id);
  if (!message || message.kind !== "question") return;
  const selected = multi
    ? message.selected.includes(option)
      ? message.selected.filter((o) => o !== option)
      : [...message.selected, option]
    : [option];
  patchMessage(id, { selected });
}

export function setOther(id: string, other: string) {
  patchMessage(id, { other });
}

function continueFrom(message: Extract<Message, { kind: "question" }>, answers: string[]) {
  const next = message.next;
  const answer = answers.join(", ");
  switch (next.type) {
    case "reply":
      streamText(`Thanks, I'll keep "${answer}" in mind. ${next.text}`);
      return;
    case "small":
      patchMessage(message.id, { actedOn: true });
      startOp({
        label: "Editing this section",
        kind: "small",
        itemIds: [next.itemId],
        blockId: next.blockId,
        steps: SMALL_STEPS,
        origin: { cmd: "small", itemId: next.itemId, blockId: next.blockId, instruction: answer },
        questionId: message.id,
      });
      return;
    case "scope":
      patchMessage(message.id, { actedOn: true });
      startOp({
        label: "Editing this section",
        kind: "small",
        itemIds: [next.itemId],
        steps: SMALL_STEPS,
        origin: { cmd: "small", itemId: next.itemId, instruction: `${next.instruction}: ${answer}` },
        questionId: message.id,
      });
      return;
    case "large": {
      const s = store.get();
      const itemIds = [...new Set(answers.flatMap((a) => next.byOption[a] ?? []))];
      const ids = itemIds.length ? itemIds : allItems(s.course).slice(0, 2).map((i) => i.id);
      patchMessage(message.id, { actedOn: true });
      runLarge(next.instruction, ids, message.id);
      return;
    }
    case "use-attachment": {
      const use: GenerateUse = /quiz/i.test(answer) ? "quiz" : /update/i.test(answer) ? "update" : "new";
      patchMessage(message.id, { actedOn: true });
      runGenerate(next.attachmentId, use);
      return;
    }
  }
}

export function submitAnswer(id: string) {
  const message = store.get().aurora.messages.find((m) => m.id === id);
  if (!message || message.kind !== "question") return;
  const answers = [
    ...message.selected.filter((o) => o !== "Other"),
    ...(message.selected.includes("Other") && message.other.trim() ? [message.other.trim()] : []),
  ];
  if (answers.length === 0) return;
  const wasActedOn = message.actedOn;
  patchMessage(id, { status: "answered", reopenNote: undefined });
  addMessage({ kind: "user", text: answers.join(", ") });
  if (wasActedOn) {
    store.set((s) => ({
      ...s,
      proposals: s.proposals.map((p) =>
        p.questionId === id && p.status === "pending" ? { ...p, status: "superseded" } : p,
      ),
    }));
  }
  const updated = store.get().aurora.messages.find((m) => m.id === id);
  if (updated?.kind === "question") continueFrom(updated, answers);
}

export function skipQuestion(id: string) {
  const message = store.get().aurora.messages.find((m) => m.id === id);
  if (!message || message.kind !== "question") return;
  patchMessage(id, { status: "skipped" });
  addMessage({
    kind: "text",
    text: "No problem, I'll skip that and use a sensible default. You can change it later.",
  });
  if (message.next.type === "small" || message.next.type === "scope") {
    continueFrom(message, ["Make it simpler"]);
  }
}

export function reviseAnswer(id: string) {
  const message = store.get().aurora.messages.find((m) => m.id === id);
  if (!message || message.kind !== "question") return;
  patchMessage(id, {
    status: "open",
    reopenNote: message.actedOn
      ? "I already acted on your earlier answer. Changing it will replace my current draft. Anything you've applied stays until you undo it."
      : undefined,
  });
}

/* Chat */
export function sendChat(text: string) {
  const clean = text.trim();
  if (!clean) return;
  openAurora();
  store.set((s) => ({ ...s, ui: { ...s.ui, composer: "" } }));
  addMessage({ kind: "user", text: clean });
  const s = store.get();
  if (s.conn === "offline") {
    addMessage({
      kind: "error",
      text: "You're offline, so I can't respond right now.",
      retry: { cmd: "chat", text: clean },
    });
    return;
  }
  if (s.mock.chat === "fail-once") {
    store.set((c) => ({ ...c, mock: { ...c.mock, chat: "ok" } }));
    after(STEP_MS, () => {
      addMessage({
        kind: "error",
        text: "I couldn't get a response. Your course hasn't changed.",
        retry: { cmd: "chat", text: clean },
      });
      announce("Aurora couldn't respond");
    });
    return;
  }
  route(clean);
}

function route(text: string) {
  const s = store.get();
  const itemId = s.ui.selectedItemId;
  const firstReady = s.attachments.find((a) => a.status === "ready");
  if (firstReady && /quiz/i.test(text)) {
    runGenerate(firstReady.id, "quiz");
    return;
  }
  switch (routeChat(text)) {
    case "too-large":
      addMessage({
        kind: "question",
        prompt: TOO_LARGE_ANSWER,
        multi: false,
        options: s.course.units.map((u) => u.title),
        allowOther: false,
        skippable: false,
        selected: [],
        other: "",
        status: "open",
        actedOn: false,
        next: {
          type: "large",
          instruction: text,
          byOption: Object.fromEntries(
            s.course.units.map((u) => [u.title, u.items.filter((i) => i.kind !== "video" && i.kind !== "quiz").map((i) => i.id)]),
          ),
        },
      });
      return;
    case "large":
      addMessage({ kind: "text", text: "I can do that across several items. First, let's confirm which ones." });
      addMessage({
        kind: "question",
        prompt: "Which units should I change?",
        multi: true,
        options: s.course.units.map((u) => u.title),
        allowOther: false,
        skippable: false,
        selected: [],
        other: "",
        status: "open",
        actedOn: false,
        next: {
          type: "large",
          instruction: text,
          byOption: Object.fromEntries(
            s.course.units.map((u) => [u.title, u.items.filter((i) => i.kind !== "video" && i.kind !== "quiz").map((i) => i.id)]),
          ),
        },
      });
      return;
    case "out-of-scope":
      streamText(OUT_OF_SCOPE_ANSWER);
      return;
    case "ambiguous":
      if (itemId) {
        addMessage({
          kind: "question",
          prompt: "What should I focus on in this section?",
          multi: false,
          options: ["Make it simpler", "Make it shorter", "Add examples", "Change the tone"],
          allowOther: true,
          skippable: true,
          selected: [],
          other: "",
          status: "open",
          actedOn: false,
          next: { type: "small", itemId, instruction: text },
        });
      }
      return;
    case "small":
      if (itemId) runSmall(itemId, undefined, text);
      return;
    case "followup":
      streamText(FOLLOWUP_ANSWER);
      return;
    default:
      streamText(answerFor(text));
  }
}

/* Rewording uses only what's on the page. Adding material needs a source: attached materials, or Aurora's own knowledge. */
const addsMaterial = (instruction: string) =>
  ["examples", "longer"].includes(editKind(instruction)) || /continue|explain|\badd\b/i.test(instruction);
const readyMaterials = (s: AppState) => s.attachments.filter((a) => a.status === "ready").map((a) => a.name);

function basisFor(s: AppState, instruction: string) {
  if (!addsMaterial(instruction)) return "Your text only. Aurora reworded what's there, without adding anything";
  const parts = ["Your text", ...readyMaterials(s)];
  if (s.aurora.useOwnKnowledge) parts.push("Aurora's own knowledge");
  return parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}` : parts[0];
}

/* With its own knowledge off and nothing attached, Aurora says so instead of inventing material. */
function needsSource(instruction: string) {
  const s = store.get();
  if (!addsMaterial(instruction) || s.aurora.useOwnKnowledge || readyMaterials(s).length) return false;
  addMessage({
    kind: "notice",
    tone: "info",
    title: "I need a source for this",
    text: "Adding new material needs a source, and Aurora's own knowledge is off. Attach a file or link, or turn Aurora's own knowledge back on.",
    actions: [{ label: "Turn on Aurora's own knowledge", command: { cmd: "allowKnowledge" } }],
  });
  announce("Aurora needs a source for this request");
  return true;
}

export function setOwnKnowledge(on: boolean) {
  store.set((s) => ({ ...s, aurora: { ...s.aurora, useOwnKnowledge: on } }));
  toast(
    on ? "Aurora can use its own knowledge" : "Aurora will only use your course and attached materials",
    "info",
  );
}

export function runSmall(itemId: string, blockId: string | undefined, instruction: string) {
  openAurora();
  if (needsSource(instruction)) return;
  startOp({
    label: "Editing this section",
    kind: "small",
    itemIds: [itemId],
    blockId,
    steps: SMALL_STEPS,
    origin: { cmd: "small", itemId, blockId, instruction },
  });
}

/* From the selection menu: shows the request in the chat as well. */
export function requestSelectionEdit(itemId: string, blockId: string, instruction: string) {
  openAurora();
  addMessage({ kind: "user", text: instruction });
  runSmall(itemId, blockId, instruction);
}

function runLarge(instruction: string, itemIds: string[], questionId?: string) {
  startOp({
    label: "Preparing a proposed revision",
    kind: "large",
    itemIds,
    steps: LARGE_STEPS,
    origin: { cmd: "large", instruction, itemIds },
    questionId,
  });
}

function runGenerate(attachmentId: string, use: GenerateUse) {
  const s = store.get();
  const selected = s.ui.selectedItemId ?? allItems(s.course)[0]?.id;
  startOp({
    label: use === "quiz" ? "Generating a quiz" : use === "update" ? "Updating from your document" : "Generating a new lesson",
    kind: "generate",
    itemIds: use === "update" && selected ? [selected] : [],
    steps: generateSteps(use),
    origin: { cmd: "generate", attachmentId, use },
  });
}

/* Panel */
let panelReturnFocus: HTMLElement | null = null;

export function openAurora() {
  const s = store.get();
  if (s.aurora.panel !== "open") {
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      panelReturnFocus = document.activeElement;
    }
    store.set((c) => ({ ...c, aurora: { ...c.aurora, panel: "open" } }));
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLTextAreaElement>(".composer textarea")?.focus();
    });
  }
}

export function closeAurora() {
  store.set((s) => ({ ...s, aurora: { ...s.aurora, panel: "closed" } }));
  const target = panelReturnFocus;
  window.requestAnimationFrame(() => {
    if (target?.isConnected) target.focus();
    else document.querySelector<HTMLElement>("[data-aurora-open]")?.focus();
  });
}

export function minimizeAurora() {
  store.set((s) => ({ ...s, aurora: { ...s.aurora, panel: "minimized" } }));
  window.requestAnimationFrame(() => {
    document.querySelector<HTMLElement>("[data-aurora-restore]")?.focus();
  });
}

/* Attachments */
const extension = (name: string) => name.split(".").pop()?.toLowerCase() ?? "";

export function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function uploadFile(name: string, size: number, opts: { replaceId?: string } = {}) {
  const s = store.get();
  const duplicate = s.attachments.find((a) => a.name === name && a.id !== opts.replaceId);
  if (duplicate) {
    addMessage({
      kind: "notice",
      tone: "warning",
      title: "Duplicate file",
      text: `${name} is already attached. Use the existing copy, or replace it with this one?`,
      actions: [
        { label: "Use existing", command: { cmd: "keepAttachment", id: duplicate.id } },
        { label: "Replace it", command: { cmd: "replaceDuplicate", id: duplicate.id } },
      ],
    });
    announce(`${name} is already attached`);
    return;
  }
  const id = uid("att");
  const attachment: Attachment = {
    id,
    kind: "file",
    name,
    meta: formatSize(size),
    size,
    status: "uploading",
    progress: 0,
    generatedItemIds: [],
  };
  if (!ALLOWED.includes(extension(name))) {
    attachment.status = "unsupported";
    attachment.error = `.${extension(name)} files aren't supported. Use PDF, PPTX, DOCX, SVG or PNG.`;
    store.set((c) => ({ ...c, attachments: [...c.attachments, attachment] }));
    announce(`${name} isn't a supported file type`);
    return;
  }
  if (size > MAX_BYTES) {
    attachment.status = "unsupported";
    attachment.error = "This file is over the 200 MB limit. Split it or compress it, then try again.";
    store.set((c) => ({ ...c, attachments: [...c.attachments, attachment] }));
    announce(`${name} is too large`);
    return;
  }
  store.set((c) => ({ ...c, attachments: [...c.attachments, attachment] }));
  announce(`Uploading ${name}`);
  progressUpload(id, 0);
}

function progressUpload(id: string, progress: number) {
  const attachment = store.get().attachments.find((a) => a.id === id);
  if (!attachment) return;
  if (/upload-fail/i.test(attachment.name) && progress >= 50 && !failedOnce.has(id)) {
    failedOnce.add(id);
    patchAttachment(id, {
      status: "failed",
      retryable: true,
      error: "The upload stopped because of a connection problem.",
    });
    announce(`${attachment.name} failed to upload`);
    return;
  }
  if (progress >= 100) {
    patchAttachment(id, { status: "processing", progress: 100 });
    announce(`Processing ${attachment.name}`);
    after(STEP_MS * 1.5, () => finishProcessing(id));
    return;
  }
  const next = progress + 25;
  patchAttachment(id, { status: "uploading", progress: next });
  after(STEP_MS / 2, () => progressUpload(id, next));
}
const failedOnce = new Set<string>();

function finishProcessing(id: string) {
  const attachment = store.get().attachments.find((a) => a.id === id);
  if (!attachment || attachment.status !== "processing") return;
  if (/process-fail/i.test(attachment.name) && !failedOnce.has(id)) {
    failedOnce.add(id);
    patchAttachment(id, {
      status: "failed",
      retryable: true,
      error: "I uploaded this file but couldn't read it.",
    });
    announce(`${attachment.name} couldn't be processed`);
    return;
  }
  if (/scanned|password/i.test(attachment.name)) {
    patchAttachment(id, {
      status: "failed",
      retryable: false,
      error: /password/i.test(attachment.name)
        ? "This PDF is password protected, so I can't read it. Remove the password and upload it again."
        : "This looks like a scanned PDF with no readable text. Upload a version with selectable text.",
    });
    announce(`${attachment.name} has no readable text`);
    return;
  }
  patchAttachment(id, { status: "ready" });
  announce(`${attachment.name} is ready`);
  afterAttachmentReady(id);
}

function afterAttachmentReady(id: string) {
  const s = store.get();
  const attachment = s.attachments.find((a) => a.id === id)!;
  if (s.attachments.some((a) => a.status === "uploading" || a.status === "processing")) return;
  if (/unrelated/i.test(attachment.name)) {
    addMessage({
      kind: "notice",
      tone: "warning",
      title: "This may not belong in this course",
      text: `${attachment.name} seems to be about accounting, not Python. Do you still want to use it?`,
      actions: [
        { label: "Use it anyway", command: { cmd: "keepAttachment", id } },
        { label: "Remove it", command: { cmd: "removeAttachment", id } },
      ],
    });
    return;
  }
  askHowToUse(id);
}

function askHowToUse(id: string) {
  const s = store.get();
  const ready = s.attachments.filter((a) => a.status === "ready");
  const attachment = s.attachments.find((a) => a.id === id)!;
  const name = ready.length > 1 ? `these ${ready.length} files` : attachment.name;
  addMessage({
    kind: "question",
    prompt: `How should I use ${name}?`,
    multi: false,
    options: ["Create a new lesson", "Update the current item", "Create a quiz"],
    allowOther: false,
    skippable: false,
    selected: [],
    other: "",
    status: "open",
    actedOn: false,
    next: { type: "use-attachment", attachmentId: id, attachmentName: attachment.name },
  });
}

export function retryAttachment(id: string) {
  patchAttachment(id, { status: "uploading", progress: 0, error: undefined });
  progressUpload(id, 0);
}

export function removeAttachment(id: string) {
  const attachment = store.get().attachments.find((a) => a.id === id);
  if (!attachment) return;
  if (attachment.generatedItemIds.length) {
    store.set((s) => ({ ...s, ui: { ...s.ui, dialog: { type: "remove-attachment", id } } }));
    return;
  }
  store.set((s) => ({ ...s, attachments: s.attachments.filter((a) => a.id !== id) }));
  announce(`${attachment.name} removed`);
}

export function confirmRemoveAttachment(id: string, keepContent: boolean) {
  const s = store.get();
  const attachment = s.attachments.find((a) => a.id === id);
  if (!attachment) return;
  let course = s.course;
  if (!keepContent) {
    course = {
      ...course,
      units: course.units.map((u) => ({
        ...u,
        items: u.items.filter((i) => !attachment.generatedItemIds.includes(i.id) || i.aiLabel?.source !== attachment.name),
      })),
    };
    store.dispatch({ type: "SET_COURSE", course, key: "" });
  }
  store.set((c) => ({
    ...c,
    attachments: c.attachments.filter((a) => a.id !== id),
    ui: {
      ...c.ui,
      dialog: null,
      selectedItemId: findItem(c.course, c.ui.selectedItemId) ? c.ui.selectedItemId : allItems(c.course)[0]?.id ?? null,
    },
  }));
  toast(keepContent ? "Attachment removed. Generated content kept" : "Attachment and generated content removed", "info");
}

export type UrlProblem = string | null;
export function validateUrl(url: string): UrlProblem {
  const clean = url.trim();
  if (!clean) return "Enter a URL.";
  if (!/^https?:\/\/[^\s.]+\.[^\s]+/i.test(clean)) {
    return "That isn't a valid URL. It should start with https:// and include a domain.";
  }
  return null;
}

export function addUrl(url: string, replaceId?: string) {
  const clean = url.trim();
  const id = uid("att");
  const isVideo = /video|youtube|vimeo|watch/i.test(clean);
  const attachment: Attachment = {
    id,
    kind: isVideo ? "video" : "link",
    name: clean.replace(/^https?:\/\//, "").slice(0, 44),
    meta: isVideo ? "Video link" : "Web link",
    size: 0,
    status: "processing",
    progress: 100,
    generatedItemIds: [],
  };
  store.set((s) => ({
    ...s,
    attachments: [...s.attachments.filter((a) => a.id !== replaceId), attachment],
  }));
  announce("Checking the link");
  after(STEP_MS, () => {
    if (!store.get().attachments.some((a) => a.id === id)) return;
    if (/private|login/i.test(clean)) {
      patchAttachment(id, {
        status: "failed",
        error: "This link needs a login, so I can't open it. Make it viewable by anyone with the link, or upload the file instead.",
      });
      announce("This link needs a login");
    } else if (/404|unavailable/i.test(clean)) {
      patchAttachment(id, { status: "failed", error: "I can't open this link. Check it still works, then try again." });
      announce("This link can't be opened");
    } else if (/\.exe|unsupported/i.test(clean)) {
      patchAttachment(id, { status: "unsupported", error: "I can't read this kind of link. Use a web page or a video." });
      announce("This link isn't supported");
    } else {
      const note = /no-captions/i.test(clean)
        ? "This video has no transcript or captions, so I can only use its title and description."
        : /long/i.test(clean)
          ? "This video is 4 hours long. I'll use the first 30 minutes unless you tell me which part to use."
          : undefined;
      patchAttachment(id, { status: "ready", note });
      announce(note ?? "The link is ready");
      if (note) {
        addMessage({ kind: "notice", tone: "warning", text: note, actions: [] });
      }
      askHowToUse(id);
    }
  });
}

/* Validation */
export function runValidation(only?: string[] | null) {
  const ids = only?.length ? only : CHECK_DEFS.map((c) => c.id as string);
  store.set((c) => ({
    ...c,
    validation: {
      ...c.validation,
      status: "running",
      only: only?.length ? only : null,
      progress: ids.map((id) => ({ label: CHECK_STEPS[id], status: "pending" })),
    },
  }));
  announce(only?.length ? `Rechecking ${only.length} checks` : "Checking your course");
  const step = (index: number) => {
    store.set((c) => ({
      ...c,
      validation: {
        ...c.validation,
        progress: c.validation.progress.map((p, i) => ({
          ...p,
          status: i < index ? "done" : i === index ? "active" : "pending",
        })),
      },
    }));
    if (store.get().mock.validation === "slow" && index === 1) {
      store.set((c) => ({ ...c, mock: { ...c.mock, validation: "ok" } }));
      after(STEP_MS, () => {
        store.set((c) => ({ ...c, validation: { ...c.validation, status: "slow" } }));
        announce("Checks are taking longer than expected");
      });
      return;
    }
    after(STEP_MS * 0.8, () => {
      if (store.get().validation.status === "idle") return;
      if (index + 1 < ids.length) step(index + 1);
      else finishValidation(only ?? null);
    });
  };
  step(0);
  resumeSlowValidation = () => {
    store.set((c) => ({ ...c, validation: { ...c.validation, status: "running" } }));
    after(STEP_MS * 0.8, () => step(2));
  };
}
let resumeSlowValidation: (() => void) | null = null;
export const keepWaitingValidation = () => resumeSlowValidation?.();

export function cancelValidation() {
  store.set((s) => ({
    ...s,
    validation: { ...s.validation, status: s.validation.checks.length ? "done" : "idle", progress: [] },
  }));
  announce("Checks cancelled");
}

function finishValidation(only: string[] | null) {
  const s = store.get();
  const incompleteMode = s.mock.validation === "incomplete-once";
  const fresh = runRules(s.course);
  const findings = only
    ? [
        ...s.validation.findings.filter((f) => !only.includes(f.checkId)),
        ...fresh.filter((f) => only.includes(f.checkId)),
      ]
    : fresh;
  const visible = findings.map((f) => ({ ...f, status: "open" as const }));
  store.set((c) => ({
    ...c,
    mock: incompleteMode ? { ...c.mock, validation: "ok" } : c.mock,
    validation: {
      ...c.validation,
      status: "done",
      progress: [],
      only: null,
      findings: visible,
      checks: buildChecks(visible, incompleteMode ? ["files"] : []),
      signatures: {
        ...c.validation.signatures,
        ...allSignatures(c.course, only),
        ...(incompleteMode ? { files: "" } : {}),
      },
    },
  }));
  const dismissed = store.get().validation.dismissedIds;
  const open = visible.filter((f) => !dismissed.includes(f.id));
  const blocking = open.filter((f) => f.severity === "blocking").length;
  const advisory = open.length - blocking;
  announce(
    open.length === 0
      ? "All checks passed"
      : `Checks finished: ${blocking} blocking, ${advisory} advisory`,
  );
}

export function openFindings(state: AppState) {
  return state.validation.findings.filter(
    (f) => !state.validation.dismissedIds.includes(f.id),
  );
}

export function canContinueToPublish(state: AppState) {
  const v = state.validation;
  if (v.status !== "done") return false;
  if (v.checks.some((c) => c.state === "incomplete")) return false;
  if (staleCheckIds(state.course, v.signatures).length) return false;
  return !openFindings(state).some((f) => f.severity === "blocking");
}

export function fixFinding(findingId: string) {
  const s = store.get();
  const finding = s.validation.findings.find((f) => f.id === findingId);
  if (!finding) return;
  const unit = unitOf(s.course, finding.itemId);
  store.set((c) => ({
    ...c,
    ui: {
      ...c.ui,
      step: "plan",
      selectedItemId: finding.itemId,
      tab: finding.blockId ? "content" : "objectives",
      flag: { findingId, itemId: finding.itemId, blockId: finding.blockId },
      scrollTarget: finding.blockId ?? null,
      collapsedUnitIds: c.ui.collapsedUnitIds.filter((id) => id !== unit?.id),
    },
  }));
  openAurora();
  if (s.validation.explainedIds.includes(findingId)) return;
  store.set((c) => ({
    ...c,
    validation: { ...c.validation, explainedIds: [...c.validation.explainedIds, findingId] },
  }));
  addMessage({
    kind: "notice",
    tone: finding.severity === "blocking" ? "error" : "warning",
    title: finding.flagLabel,
    text: `${finding.explanation} Suggested correction: ${finding.correction}`,
    actions: [{ label: "Edit it myself", command: { cmd: "editManually", itemId: finding.itemId } }],
  });
  const fresh = store.get();
  const block = findBlock(fresh.course, finding.itemId, finding.blockId);
  const after = correctedBlock(finding, block, fresh.mock.fixCreatesFinding);
  if (block && after) {
    const sameUrl =
      block.type === "video"
        ? allItems(fresh.course).flatMap((item) =>
            item.blocks
              .filter((b) => b.type === "video" && b.url === block.url && b.id !== block.id)
              .map((b) => ({ item, block: b })),
          )
        : [];
    addProposal({
      title: sameUrl.length ? "Correction for 2 findings" : `Correction for ${finding.title}`,
      summary: sameUrl.length ? "This one link is used in two places, so one fix resolves both." : finding.correction,
      instruction: finding.correction,
      kind: "fix",
      findingId,
      changes: [
        {
          id: uid("chg"),
          itemId: finding.itemId,
          itemTitle: finding.title,
          blockId: block.id,
          before: block,
          after,
          decision: "accept",
        },
        ...sameUrl.map(({ item, block: other }) => ({
          id: uid("chg"),
          itemId: item.id,
          itemTitle: item.title,
          blockId: other.id,
          before: other,
          after: { ...other, url: (after as Extract<Block, { type: "video" }>).url } as Block,
          decision: "accept" as const,
        })),
      ],
    });
  }
}

export function dismissFinding(id: string) {
  const finding = store.get().validation.findings.find((f) => f.id === id);
  if (!finding || finding.severity === "blocking") return;
  store.set((s) => ({
    ...s,
    validation: { ...s.validation, dismissedIds: [...s.validation.dismissedIds, id] },
    ui: { ...s.ui, flag: s.ui.flag?.findingId === id ? null : s.ui.flag },
  }));
  toast("Advisory dismissed. It's listed in your publish summary", "info");
}

/* Saving */
export function retrySave() {
  store.set((s) => ({ ...s, save: { ...s.save, status: "saving" }, mock: { ...s.mock, save: "ok" } }));
}

export function saveTick() {
  const s = store.get();
  if (s.mock.save === "fail-once") {
    store.set((c) => ({ ...c, save: { ...c.save, status: "failed" }, mock: { ...c.mock, save: "ok" } }));
    announce("Your changes couldn't be saved");
    return;
  }
  store.dispatch({ type: "SAVE_FINISHED" });
}

export function setConnection(conn: "online" | "offline") {
  const s = store.get();
  if (s.conn === conn) return;
  store.set((c) => ({
    ...c,
    conn,
    save: {
      ...c.save,
      status:
        conn === "offline"
          ? c.save.status === "saved"
            ? "saved"
            : "offline"
          : c.save.status === "offline"
            ? "saving"
            : c.save.status,
    },
  }));
  announce(conn === "offline" ? "You're offline. Your work is safe on this device" : "You're back online");
  if (conn === "online") resumePaused();
}

export function signBackIn() {
  store.set((s) => ({ ...s, session: "active", ui: { ...s.ui, dialog: null } }));
  announce("You're signed in again");
  resumePaused();
}

/* Navigation guard for unsaved work */
export function guardedSelect(itemId: string) {
  const s = store.get();
  if (s.save.status === "failed" || s.save.status === "unsaved") {
    store.set((c) => ({
      ...c,
      ui: { ...c.ui, dialog: { type: "leave", then: { cmd: "selectItem", itemId } } },
    }));
    return;
  }
  store.dispatch({ type: "SELECT_ITEM", itemId });
}

export function discardUnsaved(then: Command) {
  store.set((s) => ({
    ...s,
    course: s.save.savedCourse,
    save: { ...s.save, status: "saved" },
    mock: { ...s.mock, save: s.mock.save === "paused" ? "ok" : s.mock.save },
    ui: { ...s.ui, dialog: null },
  }));
  run(then);
}

export function saveThenLeave(then: Command) {
  store.set((s) => ({ ...s, mock: { ...s.mock, save: "ok" }, ui: { ...s.ui, dialog: null } }));
  store.dispatch({ type: "SAVE_FINISHED" });
  run(then);
}

/* Publish */
export function publishCourse() {
  const s = store.get();
  store.set((c) => ({
    ...c,
    publish: { ...c.publish, status: "publishing" },
    ui: { ...c.ui, dialog: null },
  }));
  announce(s.live ? "Republishing your course" : "Publishing your course");
  after(STEP_MS * 2, () => {
    const current = store.get();
    if (current.mock.publish === "fail-once") {
      store.set((c) => ({
        ...c,
        mock: { ...c.mock, publish: "ok" },
        publish: { ...c.publish, status: "failed" },
      }));
      announce("Publishing failed. Your draft is safe");
      return;
    }
    store.set((c) => ({ ...c, publish: { ...c.publish, status: "published" } }));
    announce(current.live ? "Your changes are live" : "Your course is published");
  });
}

export function submitForApproval() {
  store.set((s) => ({ ...s, publish: { ...s.publish, status: "submitted" }, ui: { ...s.ui, dialog: null } }));
  announce("Submitted for approval");
}

/* Course plan actions */
let lastDeleted: Item | null = null;

export function deleteItem(id: string) {
  const s = store.get();
  const item = findItem(s.course, id);
  lastDeleted = item ?? null;
  const course = {
    ...s.course,
    units: s.course.units.map((u) => ({ ...u, items: u.items.filter((i) => i.id !== id) })),
  };
  store.dispatch({ type: "SET_COURSE", course, key: "" });
  store.set((c) => ({
    ...c,
    ui: {
      ...c.ui,
      dialog: null,
      selectedItemId: c.ui.selectedItemId === id ? allItems(c.course)[0]?.id ?? null : c.ui.selectedItemId,
    },
  }));
  toast(`Deleted ${item?.title ?? "item"}`, "info", "history");
}

export function deleteUnit(id: string) {
  const s = store.get();
  const unit = s.course.units.find((u) => u.id === id);
  const course = { ...s.course, units: s.course.units.filter((u) => u.id !== id) };
  store.dispatch({ type: "SET_COURSE", course, key: "" });
  store.set((c) => ({
    ...c,
    ui: {
      ...c.ui,
      dialog: null,
      selectedItemId: findItem(c.course, c.ui.selectedItemId) ? c.ui.selectedItemId : allItems(c.course)[0]?.id ?? null,
    },
  }));
  toast(`Deleted ${unit?.title ?? "unit"}`, "info", "history");
}

export function undoLast() {
  store.dispatch({ type: "UNDO" });
  store.set((s) => ({
    ...s,
    ui: {
      ...s.ui,
      toast: null,
      selectedItemId: findItem(s.course, s.ui.selectedItemId) ? s.ui.selectedItemId : allItems(s.course)[0]?.id ?? null,
    },
  }));
  announce("Undone");
}

export function addItem(unitId: string, kind: Item["kind"]) {
  const s = store.get();
  const unit = s.course.units.find((u) => u.id === unitId);
  if (!unit) return;
  const id = uid("item");
  const label = kind === "quiz" ? "New quiz" : kind === "video" ? "New video" : "New lesson";
  const blocks: Block[] =
    kind === "quiz"
      ? [{ id: `${id}-q`, type: "question", question: "New question", options: ["Option 1", "Option 2"], correctIndex: null }]
      : kind === "video"
        ? [{ id: `${id}-v`, type: "video", title: "New video", url: "https://videos.example.com/python/new", duration: "5 min" }]
        : [{ id: `${id}-p`, type: "paragraph", heading: "New section", text: "Add your text here." }];
  const item: Item = { id, title: label, kind, blocks, objectives: [], notes: "" };
  const course = {
    ...s.course,
    units: s.course.units.map((u) => (u.id === unitId ? { ...u, items: [...u.items, item] } : u)),
  };
  store.dispatch({ type: "SET_COURSE", course, key: "" });
  store.set((c) => ({
    ...c,
    ui: {
      ...c.ui,
      selectedItemId: id,
      tab: "content",
      collapsedUnitIds: c.ui.collapsedUnitIds.filter((u) => u !== unitId),
    },
  }));
  announce(`${label} added to ${unit.title}`);
}

export function addUnit() {
  const s = store.get();
  const id = uid("unit");
  const course = {
    ...s.course,
    units: [...s.course.units, { id, title: "New unit", items: [] }],
  };
  store.dispatch({ type: "SET_COURSE", course, key: "" });
  announce("New unit added");
}

export function moveItem(itemId: string, targetUnitId: string, targetIndex: number) {
  const s = store.get();
  const item = findItem(s.course, itemId);
  if (!item) return;
  const units = s.course.units.map((u) => ({ ...u, items: u.items.filter((i) => i.id !== itemId) }));
  const target = units.find((u) => u.id === targetUnitId);
  if (!target) return;
  target.items.splice(Math.max(0, Math.min(targetIndex, target.items.length)), 0, item);
  store.dispatch({ type: "SET_COURSE", course: { ...s.course, units }, key: "" });
  announce(`${item.title} moved`);
}

export function nudgeItem(itemId: string, delta: number) {
  const s = store.get();
  const unit = unitOf(s.course, itemId);
  if (!unit) return;
  const index = unit.items.findIndex((i) => i.id === itemId);
  moveItem(itemId, unit.id, index + delta);
}

export function moveUnit(unitId: string, targetIndex: number) {
  const s = store.get();
  const units = [...s.course.units];
  const from = units.findIndex((u) => u.id === unitId);
  if (from < 0) return;
  const [unit] = units.splice(from, 1);
  units.splice(Math.max(0, Math.min(targetIndex, units.length)), 0, unit);
  store.dispatch({ type: "SET_COURSE", course: { ...s.course, units }, key: "" });
  announce(`${unit.title} moved`);
}

/* Commands from notices, retries and scenarios */
export function run(command: Command) {
  switch (command.cmd) {
    case "chat":
      sendChat(command.text);
      return;
    case "small":
      runSmall(command.itemId, command.blockId, command.instruction);
      return;
    case "large":
      startOp({
        label: "Preparing a proposed revision",
        kind: "large",
        itemIds: command.itemIds,
        steps: LARGE_STEPS,
        origin: command,
      });
      return;
    case "generate":
      runGenerate(command.attachmentId, command.use);
      return;
    case "quizQuestions":
      generateQuizQuestions(command.itemId);
      return;
    case "upload":
      openAurora();
      uploadFile(command.name, command.size);
      return;
    case "addUrl":
      openAurora();
      addUrl(command.url);
      return;
    case "validate":
      runValidation(command.only);
      return;
    case "openAurora":
      openAurora();
      return;
    case "reviewProposal":
      store.set((s) => ({ ...s, ui: { ...s.ui, reviewProposalId: command.id } }));
      return;
    case "keepAttachment":
      askHowToUse(command.id);
      return;
    case "removeAttachment":
      removeAttachment(command.id);
      return;
    case "replaceDuplicate": {
      const old = store.get().attachments.find((a) => a.id === command.id);
      if (old) {
        store.set((s) => ({ ...s, attachments: s.attachments.filter((a) => a.id !== command.id) }));
        uploadFile(old.name, old.size);
      }
      return;
    }
    case "editManually":
      store.set((s) => ({
        ...s,
        ui: {
          ...s.ui,
          selectedItemId: command.itemId,
          tab: "content",
          editAnyway: [...s.ui.editAnyway, command.itemId],
        },
      }));
      window.requestAnimationFrame(() => {
        const block = store.get().ui.flag?.blockId;
        document
          .querySelector<HTMLElement>(
            `${block ? `[data-block-id="${block}"]` : "[data-testid=content]"} [contenteditable]`,
          )
          ?.focus();
      });
      return;
    case "fix":
      fixFinding(command.findingId);
      return;
    case "selectItem":
      store.dispatch({ type: "SELECT_ITEM", itemId: command.itemId });
      return;
    case "retryProposalApply":
      applyProposal(command.id);
      return;
    case "restoreItem":
      if (lastDeleted) undoLast();
      return;
    case "goOnline":
      setConnection("online");
      return;
    case "publish":
      publishCourse();
      return;
    case "allowKnowledge":
      setOwnKnowledge(true);
  }
}

/* Scenario lifecycle */
export function cancelAllTimers() {
  timers.forEach((timer) => window.clearTimeout(timer));
  timers.clear();
  failedOnce.clear();
  resumeSlowValidation = null;
  lastDeleted = null;
}

export function loadSnapshot(snapshot: AppState, opts: { autorun?: boolean } = {}) {
  cancelAllTimers();
  counter = 0;
  store.dispatch({
    type: "LOAD_SNAPSHOT",
    snapshot: JSON.parse(JSON.stringify(snapshot)) as AppState,
  });
  const scheduled = store.get().autorun;
  if (opts.autorun !== false && scheduled.length) {
    scheduled.forEach((command, index) => {
      after(150 + index * 120, () => run(command));
    });
  }
}

/* REC-09: keep the state across a refresh, then pick the running work back up. */
export function persistIfNeeded() {
  const s = store.get();
  if (!s.mock.persist) return;
  try {
    sessionStorage.setItem(PERSIST_KEY, JSON.stringify(s));
  } catch {
    /* The scenario still plays without storage. */
  }
}

export function restorePersisted(): boolean {
  try {
    const saved = sessionStorage.getItem(PERSIST_KEY);
    if (!saved) return false;
    const snapshot = JSON.parse(saved) as AppState;
    const running = snapshot.operations.filter((op) => ["running", "slow"].includes(op.status));
    if (!running.length) return false;
    cancelAllTimers();
    store.dispatch({ type: "LOAD_SNAPSHOT", snapshot });
    counter = 1000 + snapshot.aurora.messages.length;
    store.set((s) => ({
      ...s,
      operations: s.operations.map((op) =>
        running.some((r) => r.id === op.id) ? { ...op, status: "paused" } : op,
      ),
    }));
    addMessage({
      kind: "notice",
      tone: "info",
      text: "You refreshed the page. I'm still working on your request and picked up where I left off.",
      actions: [],
    });
    resumePaused();
    return true;
  } catch {
    return false;
  }
}

export function clearPersisted() {
  try {
    sessionStorage.removeItem(PERSIST_KEY);
  } catch {
    /* Nothing to clear without storage. */
  }
}

export type { Continuation };
