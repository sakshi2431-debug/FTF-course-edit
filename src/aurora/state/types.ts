/* Everything in AppState is plain JSON, so a scenario can load it as a snapshot. */

export type ItemKind = "lesson" | "content" | "quiz" | "video";

/* Where a text block's image sits. It has no block of its own, so it stays with its text. */
export type ImageLayout = "below" | "beside";

export type Block =
  | { id: string; type: "intro"; heading: string; text: string; image?: string; imageLayout?: ImageLayout }
  | { id: string; type: "paragraph"; heading: string; text: string; image?: string; imageLayout?: ImageLayout }
  | { id: string; type: "features"; heading: string; items: string[] }
  | { id: string; type: "code"; heading: string; language: string; code: string }
  | { id: string; type: "video"; title: string; url: string; duration: string }
  | {
      id: string;
      type: "question";
      question: string;
      options: string[];
      correctIndex: number | null;
      format?: "multiple" | "truefalse";
      explanation?: string;
      shuffle?: boolean;
    };

export type QuizSettings = {
  points: number;
  passPercent: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
};

export type Item = {
  quiz?: QuizSettings;
  id: string;
  title: string;
  kind: ItemKind;
  blocks: Block[];
  objectives: string[];
  notes: string;
  aiLabel?: { source?: string };
};

export type Unit = { id: string; title: string; items: Item[] };
export type Course = { id: string; code: string; title: string; units: Unit[] };

export type Step = "plan" | "validate" | "publish";
export type LessonTab = "content" | "objectives" | "notes";
export type Role = "instructor" | "no-publish" | "read-only";

/* Commands are data, so scenarios, notices and retries can all hold them. */
export type GenerateUse = "new" | "update" | "quiz";
export type Command =
  | { cmd: "chat"; text: string }
  | { cmd: "small"; itemId: string; blockId?: string; instruction: string }
  | { cmd: "large"; instruction: string; itemIds: string[] }
  | { cmd: "generate"; attachmentId: string; use: GenerateUse }
  | { cmd: "quizQuestions"; itemId: string }
  | { cmd: "upload"; name: string; size: number }
  | { cmd: "addUrl"; url: string }
  | { cmd: "validate"; only?: string[] }
  | { cmd: "openAurora" }
  | { cmd: "reviewProposal"; id: string }
  | { cmd: "keepAttachment"; id: string }
  | { cmd: "removeAttachment"; id: string }
  | { cmd: "replaceDuplicate"; id: string }
  | { cmd: "editManually"; itemId: string }
  | { cmd: "fix"; findingId: string }
  | { cmd: "selectItem"; itemId: string }
  | { cmd: "retryProposalApply"; id: string }
  | { cmd: "restoreItem" }
  | { cmd: "goOnline" }
  | { cmd: "publish" }
  | { cmd: "allowKnowledge" };

export type Message = { id: string; time: string } & (
  | { kind: "user"; text: string }
  | {
      kind: "text";
      text: string;
      streaming?: boolean;
      full?: string;
      stopped?: boolean;
    }
  | {
      kind: "question";
      prompt: string;
      counter?: string;
      multi: boolean;
      options: string[];
      allowOther: boolean;
      skippable: boolean;
      selected: string[];
      other: string;
      status: "open" | "answered" | "skipped";
      next: Continuation;
      actedOn: boolean;
      reopenNote?: string;
    }
  | { kind: "proposal"; proposalId: string }
  | { kind: "error"; text: string; retry: Command | null; manual?: string }
  | { kind: "progress"; opId: string }
  | {
      kind: "notice";
      tone: "info" | "warning" | "success" | "error";
      title?: string;
      text: string;
      actions: { label: string; command: Command }[];
      resolved?: boolean;
    }
);

export type Continuation =
  | { type: "small"; itemId: string; blockId?: string; instruction: string }
  | { type: "large"; instruction: string; byOption: Record<string, string[]> }
  | { type: "use-attachment"; attachmentId: string; attachmentName: string }
  | { type: "reply"; text: string }
  | { type: "scope"; instruction: string; itemId: string };

export type ProposalChange = {
  id: string;
  itemId: string;
  itemTitle: string;
  blockId?: string;
  before: Block | null;
  after: Block | null;
  decision: "accept" | "reject";
  newItem?: { unitId: string; item: Item };
  /* A new block added to the end of an existing item. */
  append?: boolean;
};

export type Proposal = {
  id: string;
  title: string;
  summary: string;
  instruction: string;
  kind: "small" | "large" | "generate" | "fix";
  status: "pending" | "applied" | "discarded" | "superseded" | "undone" | "inserted";
  changes: ProposalChange[];
  source?: string;
  /* What a draft was built from, in plain words. */
  basis?: string;
  findingId?: string;
  warning?: string;
  failedItem?: string;
  revisions: number;
  questionId?: string;
};

export type OpStep = { label: string; status: "pending" | "active" | "done" | "failed" };
export type Operation = {
  id: string;
  label: string;
  kind: "small" | "large" | "generate";
  itemIds: string[];
  blockId?: string;
  steps: OpStep[];
  status:
    | "queued"
    | "running"
    | "slow"
    | "paused"
    | "done"
    | "failed"
    | "cancelled";
  origin: Command;
  baseItems: Record<string, string>;
  waitingReason?: string;
  questionId?: string;
};

export type Attachment = {
  id: string;
  kind: "file" | "video" | "link";
  name: string;
  meta: string;
  size: number;
  status: "uploading" | "processing" | "ready" | "failed" | "unsupported";
  progress: number;
  error?: string;
  note?: string;
  generatedItemIds: string[];
  retryable?: boolean;
};

export type Severity = "blocking" | "advisory";
export type Finding = {
  id: string;
  severity: Severity;
  title: string;
  explanation: string;
  correction: string;
  itemId: string;
  blockId?: string;
  checkId: string;
  status: "open" | "fixed";
  flagLabel: string;
};

export type CheckState = "ready" | "issue" | "incomplete";
export type Check = { id: string; label: string; state: CheckState };

export type Dialog =
  | { type: "delete"; kind: "item" | "unit"; id: string; title: string }
  | { type: "leave"; then: Command }
  | { type: "discard-proposal"; id: string }
  | { type: "remove-attachment"; id: string }
  | { type: "publish" }
  | { type: "session" };

export type MockConfig = {
  delay: number;
  save: "ok" | "fail-once" | "paused";
  chat: "ok" | "fail-once";
  op: "ok" | "fail" | "slow" | "offline" | "expire";
  partial: boolean;
  validation: "ok" | "incomplete-once" | "slow";
  publish: "ok" | "fail-once";
  fixApply: "ok" | "fail-once";
  fixCreatesFinding: boolean;
  sampleFiles: { name: string; size: number }[];
  sampleUrls: string[];
  persist: boolean;
  outOfScope: boolean;
};

export type AppState = {
  course: Course;
  ui: {
    step: Step;
    selectedItemId: string | null;
    collapsedUnitIds: string[];
    tab: LessonTab;
    flag: { findingId: string; itemId: string; blockId?: string } | null;
    reviewProposalId: string | null;
    dialog: Dialog | null;
    toast: { text: string; tone: "success" | "error" | "info"; undo?: string } | null;
    announcement: string;
    planOpen: boolean;
    editAnyway: string[];
    scrollTarget: string | null;
    composer: string;
    attachOpen: boolean;
  };
  role: Role;
  live: { enrolled: number; changedItems: string[] } | null;
  conn: "online" | "offline";
  session: "active" | "expired";
  collab: { otherEditor: { name: string; itemId: string } | null; otherTab: boolean };
  save: { status: "saved" | "saving" | "unsaved" | "failed" | "offline"; savedCourse: Course };
  aurora: {
    panel: "closed" | "open" | "minimized";
    messages: Message[];
    firstUseSeen: boolean;
    /* Off: Aurora adds nothing beyond the course text and attached materials. */
    useOwnKnowledge: boolean;
  };
  attachments: Attachment[];
  proposals: Proposal[];
  operations: Operation[];
  validation: {
    status: "idle" | "running" | "slow" | "done";
    progress: OpStep[];
    checks: Check[];
    findings: Finding[];
    dismissedIds: string[];
    signatures: Record<string, string>;
    only: string[] | null;
    explainedIds: string[];
  };
  publish: {
    status: "draft" | "publishing" | "published" | "failed" | "submitted";
    settings: {
      visibility: "Organisation" | "Public";
      enrollment: string;
      startDate: string;
      notifyLearners: boolean;
      notifyAdmin: boolean;
    };
  };
  history: { past: Course[]; future: Course[]; typingKey: string | null };
  mock: MockConfig;
  autorun: Command[];
  clock: number;
};
