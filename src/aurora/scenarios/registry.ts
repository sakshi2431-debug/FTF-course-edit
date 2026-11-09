import { createBaseState } from "../mock/course";
import { updateItem } from "../state/reducer";
import type { AppState } from "../state/types";
import {
  applied,
  aurora,
  autorun,
  base,
  composer,
  dismiss,
  editBlock,
  howToUse,
  laterEdit,
  mock,
  panel,
  pendingLarge,
  pendingNewLesson,
  pendingSmall,
  question,
  say,
  select,
  user,
  validated,
  withAdvisory,
  withAllDefects,
  withAttachment,
  withBlocking,
} from "./builders";


export const AREAS = {
  NAV: "Navigate and select",
  EDIT: "Manual editing",
  CHAT: "Conversation only",
  ASK: "Aurora questions",
  SED: "Small Aurora edit",
  LED: "Larger Aurora edit",
  DOC: "Add a document",
  URL: "Add a video or link",
  GEN: "Generate from an attachment",
  REC: "Interrupt or recover",
  CON: "Conflicting edits",
  VAL: "Run validation",
  FIX: "Resolve a finding",
  CHG: "Change a checked course",
  PUB: "Publish",
  PERM: "Permissions and collaboration",
  FIRST: "First use and empty states",
  AI: "AI transparency",
  A11Y: "Accessibility",
  RESP: "Narrow screens",
} as const;
export type Area = keyof typeof AREAS;

/* The Figma frame each area is based on. "gap" means no frame covers it. */
const AREA_SOURCE: Record<Area, string> = {
  NAV: "3165:15612",
  EDIT: "3165:15612",
  CHAT: "3154:13244",
  ASK: "3154:13244",
  SED: "3154:13244",
  LED: "3154:13244",
  DOC: "3190:18388",
  URL: "3600:9459",
  GEN: "3012:2175",
  REC: "3012:2175",
  CON: "gap",
  VAL: "3795:5511",
  FIX: "3795:5511",
  CHG: "3795:5511",
  PUB: "3188:17126",
  PERM: "gap",
  FIRST: "gap",
  AI: "gap",
  A11Y: "gap",
  RESP: "gap",
};

const SOURCE_OVERRIDE: Record<string, string> = {
  "NAV-09": "gap",
  "NAV-10": "gap",
  "EDIT-05": "gap",
  "SED-04": "gap",
  "LED-04": "gap",
  "PUB-08": "4051:17625, 4074:7176",
};

/* The UI references chosen for specific scenarios. Behaviour only, drawn in the design system. */
export const REFERENCES = {
  "selection-menu":
    "Selection menu: select text, then ask Aurora or pick a quick action",
  "diff-review": "Before and after view with accept and reject",
  "in-place":
    "In-place status: highlighted block with an editing pill, no skeleton bars",
  "updated-state": "Finished state: the result under the highlighted original, with what to do next",
} as const;

const SCENARIO_REFERENCES: Record<string, (keyof typeof REFERENCES)[]> = {
  "SED-01": ["selection-menu"],
  "SED-02": ["in-place"],
  "SED-03": ["updated-state"],
  "SED-04": ["diff-review"],
  "SED-05": ["updated-state"],
  "SED-06": ["diff-review"],
  "SED-07": ["diff-review", "updated-state"],
  "LED-03": ["in-place"],
  "LED-04": ["diff-review"],
  "LED-07": ["diff-review"],
  "GEN-04": ["in-place"],
  "GEN-05": ["updated-state"],
  "FIX-04": ["diff-review"],
  "CON-04": ["diff-review"],
};

/* id | title | phase it is planned for */
const INVENTORY = `
NAV-01|Select a unit or item|1
NAV-02|Expand and collapse units|1
NAV-03|Switch between content items|1
NAV-04|Open and close Aurora|3
NAV-05|Return to the same editing position after closing Aurora|3
NAV-06|Fix jumps to the exact item with the finding in view|3
NAV-07|Aurora panel and its conversation stay while switching items|3
NAV-08|Add, rename, reorder (drag) and delete units and items; confirm delete; undo|3
NAV-09|Empty unit|1
NAV-10|Very long titles truncate with a full title on hover and focus|5
EDIT-01|Edit existing content|1
EDIT-02|Save succeeds|3
EDIT-03|Save fails, with retry|4
EDIT-04|Leave with unsaved changes|4
EDIT-05|Undo and redo|1
EDIT-06|Autosave states: saving, saved, offline|4
EDIT-07|Required field left empty|5
EDIT-08|Paste formatted text from Word or Google Docs|5
EDIT-09|Replace media inside content|5
CHAT-01|Ask Aurora a question|3
CHAT-02|Explanation that does not change the course|3
CHAT-03|Follow up question|3
CHAT-04|Response fails|4
CHAT-05|Retry|4
CHAT-06|Streamed response with Stop|3
CHAT-07|Context chip shows what Aurora is looking at|3
CHAT-08|Request outside Aurora's scope, or something it can't do|5
CHAT-09|History kept after closing and reopening|3
ASK-01|Answer a single choice question|3
ASK-02|Select multiple answers where appropriate|3
ASK-03|Submit|3
ASK-04|Revise an answer|3
ASK-05|Aurora clarifies an ambiguous request|3
ASK-06|Skip a question|5
ASK-07|"Other" option with free text|3
ASK-08|Change an answer after Aurora already acted on it|5
SED-01|Request a change to selected content|3
SED-02|Local processing on that item|3
SED-03|Completed change|3
SED-04|Review what changed (diff)|3
SED-05|Undo|3
SED-06|Request another revision|3
SED-07|Reject the change and keep the original|3
SED-08|Change applied to the wrong part; correct the scope|5
LED-01|Request changes across several items|3
LED-02|Aurora clarifies the affected scope|3
LED-03|Aurora prepares a proposed revision|3
LED-04|Review the proposal|3
LED-05|Apply all|3
LED-06|Discard|3
LED-07|Partial apply: accept some items, reject others|5
LED-08|Proposal out of date because the instructor edited an affected item|4
LED-09|Request too large; Aurora asks to narrow it|5
DOC-01|Choose or upload a file|3
DOC-02|Remove it before processing|3
DOC-03|Upload and processing states|3
DOC-04|Unsupported file type|4
DOC-05|Upload failure|4
DOC-06|Processing failure|4
DOC-07|Retry or cancel|4
DOC-08|Several files at once|5
DOC-09|File too large|5
DOC-10|Duplicate file|5
DOC-11|Scanned or password protected PDF with no readable text|5
DOC-12|Document unrelated to the course; Aurora flags it before using it|5
DOC-13|Remove an attachment later; ask whether to keep content generated from it|5
URL-01|Enter a URL|3
URL-02|Correct an invalid URL|3
URL-03|Process an accessible resource|3
URL-04|Inaccessible or unsupported resource|4
URL-05|Replace or remove it|3
URL-06|Private link or one that needs a login|5
URL-07|Video with no transcript or captions|5
URL-08|Very long video; Aurora says what part it will use|5
GEN-01|Specify how to use the attachment|3
GEN-02|Generate a new item|3
GEN-03|Update an existing item|3
GEN-04|Progress|3
GEN-05|Inspect the result|3
GEN-06|Undo the addition or change|3
GEN-07|Attachment contradicts existing content|5
GEN-08|Generate a quiz from a document|3
GEN-09|Generated content shows its source attachment|3
REC-01|Cancel an operation|4
REC-02|Operation fails|4
REC-03|Operation takes longer than expected|4
REC-04|Partial completion|4
REC-05|Navigate away and return|4
REC-06|Recover without losing existing work|4
REC-07|Connection drops mid operation|4
REC-08|Session expires during processing|4
REC-09|Page refreshed while Aurora is working|4
REC-10|Several requests sent quickly; queue them with visible order|4
CON-01|Instructor edits an item while Aurora is processing the same item|4
CON-02|Conflict detected|4
CON-03|Newer work preserved|4
CON-04|Review or retry Aurora's change|4
CON-05|Instructor deletes the item Aurora is editing|4
CON-06|Two Aurora operations touch the same item|4
VAL-01|Start checks|3
VAL-02|Checking status|3
VAL-03|All checks pass|3
VAL-04|Advisory findings appear|3
VAL-05|Blocking issues appear|3
VAL-06|Some checks cannot complete|4
VAL-07|Summary with count by severity|3
VAL-08|Move between findings with previous and next|3
VAL-09|Validation takes much longer than expected|4
VAL-10|Rerun only affected checks|3
VAL-11|Nothing to validate yet|4
FIX-01|Select Fix|3
FIX-02|Open the exact content with Aurora's explanation|3
FIX-03|Edit manually|3
FIX-04|Apply Aurora's suggested correction|3
FIX-05|Dismiss an advisory finding|3
FIX-06|Recheck|3
FIX-07|A fix creates a new finding|5
FIX-08|Aurora's suggested correction fails|4
FIX-09|Try to dismiss a blocking issue|3
FIX-10|One fix resolves several findings|5
FIX-11|Dismissed advisory stays dismissed|3
CHG-01|Edit content after validation|3
CHG-02|Affected checks marked as needing another run|3
CHG-03|Recheck before publishing where required|3
CHG-04|Edit that affects no check; no recheck needed|5
CHG-05|Edit reverted to the checked version|5
PUB-01|Review the course summary and settings|3
PUB-02|Confirm publishing|3
PUB-03|Publishing succeeds|3
PUB-04|Publishing fails|4
PUB-05|Retry while preserving the draft|4
PUB-06|Instructor without publish rights submits for approval|5
PUB-07|Summary lists dismissed advisories|3
PUB-08|Edit a live course with enrolled learners, then republish|5
PERM-01|Read only role opens the editor|5
PERM-02|Another instructor is editing the same course|5
PERM-03|Same course open in two tabs|5
FIRST-01|First time Aurora opens: what it can and can't do|5
FIRST-02|Course with no content yet|5
AI-02|Label on Aurora generated content|3
AI-04|Aurora's own knowledge turned off|4
A11Y-01|Focus moves into Aurora when it opens and back when it closes|6
A11Y-02|Progress and results announced through live regions|6
A11Y-03|Flags use icon and text, not color alone|6
A11Y-04|Reduced motion respected for all animation|6
A11Y-05|Full keyboard operation of the tree, editor, Aurora panel, dialogs and findings navigator|6
RESP-01|Aurora panel becomes an overlay|6
RESP-02|Course plan sidebar collapses|6
`;

type Playable = {
  start: () => AppState;
  trigger: string;
  see: string;
};

const SLOW = { delay: 4 };
const SMALL = { cmd: "small", itemId: "what-is-python", blockId: "wip-intro", instruction: "Make it simpler" } as const;
const LARGE_IDS = ["what-is-python", "why-python", "functions"];
const LARGE = { cmd: "large", instruction: "Simplify the lessons in Unit 1 and Unit 2", itemIds: LARGE_IDS } as const;
const samples = (...files: [string, number][]) => ({
  sampleFiles: files.map(([name, size]) => ({ name, size })),
});
const MB = 1024 * 1024;
const upload = (name: string, size = 2 * MB) => ({ cmd: "upload", name, size }) as const;
const addUrl = (url: string) => ({ cmd: "addUrl", url }) as const;
const FIX_VIDEO = { cmd: "fix", findingId: "broken-fv-video" } as const;
const attachOpen = (s: AppState): AppState => ({ ...s, ui: { ...s.ui, attachOpen: true } });

function liveCourse(): AppState {
  return validated(
    {
      ...base(),
      live: { enrolled: 124, changedItems: ["1.1 What is Python?"] },
    },
    "plan",
  );
}

const BUILT: Record<string, Playable> = {
  "NAV-01": { start: base, trigger: "Select any item in the course plan.", see: "The item is highlighted and its content opens on the right. Selecting a unit expands it, and it stays expanded." },
  "NAV-02": { start: base, trigger: "Select the Data Structures name twice, then select its arrow.", see: "Data Structures starts collapsed. Selecting its name expands it, and selecting the name again keeps it expanded. The arrow collapses it." },
  "NAV-03": { start: () => select(base(), "functions"), trigger: "Move between items, including the quiz and the video.", see: "Starts on 2.2 Functions. Each item type shows its own content, and tabs go back to Content. The quiz uses the Create a Quiz layout: question cards, Add Options, Explanation, Generate with Aurora and Quiz settings." },
  "NAV-04": { start: base, trigger: "Select Edit, then close the panel with X or Escape.", see: "Edit opens Aurora. The course plan swaps for lesson pickers as in Figma 3154:13244, then it closes." },
  "NAV-05": { start: () => select(base(), "functions"), trigger: "Tab to Edit and open it. Close it again.", see: "You're on the same item and tab, and focus returns to the control you opened Aurora from." },
  "NAV-06": { start: () => validated(withAllDefects(base())), trigger: "Select Fix on the broken video link.", see: "The exact item opens, the block is scrolled into view and flagged, and Aurora opens with the explanation." },
  "NAV-07": { start: () => aurora(user(panel(base()), "What does this lesson cover?"), "It introduces Python and a first program."), trigger: "Change the item with the lesson pickers.", see: "The panel stays open, the conversation stays, and the context chip updates." },
  "NAV-08": { start: base, trigger: "Use Add Lessons, Rename and the trash icon. Drag a row, or press Alt+Up or Alt+Down. Delete asks first, then Undo restores it.", see: "The tree and counts update. Delete needs confirming and can be undone." },
  "NAV-09": { start: () => { const s = base(); s.course.units[2].items = []; return { ...s, ui: { ...s.ui, collapsedUnitIds: [] } }; }, trigger: "Look at the Data Structures unit.", see: "The expanded unit says it has no items, and the counts show 6 items." },
  "NAV-10": { start: () => { const s = base(); s.course.units[0].items[1].title = "1.2 Why Python is such a popular first language for people who have never written code before"; s.course.units[0].title = "Introduction to Python and how to get the most out of this course"; return s; }, trigger: "Hover over a long title, or tab to it.", see: "Long titles end with an ellipsis, and the full title appears on hover and on keyboard focus." },
  "EDIT-01": { start: base, trigger: "Click the title or any text in the lesson and type. Press Enter in a paragraph, then type / on the empty line.", see: "There's no edit mode and no form boxes. The text is edited where it sits. Enter starts a new block, and / or the + in the margin adds a list, code, video or question." },
  "EDIT-02": { start: () => base(), trigger: "Click any text and type.", see: "The status at the top goes from Saving to Saved." },
  "EDIT-03": { start: () => mock(base(), { save: "fail-once" }), trigger: "Click any text and type, then select Retry in the error banner.", see: "A banner says the save failed and your text stays. Retry saves it." },
  "EDIT-04": { start: () => { const s = mock(base(), { save: "paused" }); const edited = laterEdit(s, "what-is-python", "wip-intro", { heading: "What is Python, really?" }); return { ...edited, save: { ...edited.save, status: "unsaved" } }; }, trigger: "Select another item in the course plan.", see: "A dialog asks you to keep editing, discard, or save and leave." },
  "EDIT-05": { start: () => { const s = laterEdit(base(), "what-is-python", "wip-intro", { heading: "What is Python, and who is it for?" }); return s; }, trigger: "Select Undo, then Redo, or press Ctrl/Cmd+Z.", see: "Starts with one change made. Undo restores the heading, Redo brings the change back, and each button is disabled when there's nothing to do." },
  "EDIT-06": { start: () => base(), trigger: "Type in the lesson. Then turn on Simulate offline in the switcher, type again, and reconnect.", see: "The status goes Saving, Saved, Saved on this device, then Saving and Saved again." },
  "EDIT-07": { start: () => editBlock(base(), "what-is-python", "wip-intro", { text: "" }), trigger: "Look at the empty text under the heading, then type in it.", see: "A required message shows until the text is filled in, and validation would block publishing." },
  "EDIT-08": { start: () => base(), trigger: "Copy formatted text from Word or Google Docs and paste it into the lesson text.", see: "The words and bullets arrive without the fonts and colours, and a message says the formatting was removed." },
  "EDIT-09": { start: () => base(), trigger: "Hover the lesson image and select Replace image or Remove image. On the video item, click the link and change it.", see: "The media changes and the status saves." },
  "CHAT-01": { start: () => composer(base(), "What does interpreted mean?"), trigger: "Send the prefilled question.", see: "Aurora streams an answer." },
  "CHAT-02": { start: () => composer(base(), "What is this lesson about?"), trigger: "Send the prefilled question.", see: "Aurora explains and says the course hasn't changed. No proposal appears." },
  "CHAT-03": { start: () => composer(aurora(user(panel(base()), "What does interpreted mean?"), "Interpreted means Python runs your code line by line."), "Why is that useful?"), trigger: "Send the prefilled follow up.", see: "The answer builds on the previous one." },
  "CHAT-04": { start: () => mock(composer(base(), "What does interpreted mean?"), { chat: "fail-once" }), trigger: "Send the prefilled question.", see: "An error message with Retry appears, and the course is unchanged." },
  "CHAT-05": { start: () => say(user(panel(base()), "What does interpreted mean?"), { kind: "error", text: "I couldn't get a response. Your course hasn't changed.", retry: { cmd: "chat", text: "What does interpreted mean?" } }), trigger: "Select Retry.", see: "Aurora answers this time." },
  "CHAT-06": { start: () => autorun(mock(panel(base()), { delay: 3 }), { cmd: "chat", text: "What does interpreted mean?" }), trigger: "Select Stop while the answer is streaming.", see: "The text stops where it was and is marked Stopped." },
  "CHAT-07": { start: () => panel(base()), trigger: "Change the item with the pickers.", see: "The chip under the header says Looking at, followed by the current item." },
  "CHAT-08": { start: () => composer(base(), "Email all my learners"), trigger: "Send the prefilled request.", see: "Aurora says it can't do that, and explains what it can do." },
  "CHAT-09": { start: () => aurora(user(base(), "What does this lesson cover?"), "It introduces Python and a first program."), trigger: "Select Edit, close it, then open it again.", see: "The earlier conversation is still there each time." },
  "ASK-01": { start: () => question(panel(base()), { counter: "1/2", prompt: "What should this lesson focus on?", options: ["Plain definitions", "Real-world uses", "Hands-on practice"], next: { type: "reply", text: "I'll focus the next draft on that." } }), trigger: "Choose one option.", see: "Only one option can be selected, and Submit becomes available." },
  "ASK-02": { start: () => question(panel(base()), { prompt: "Which sections should I simplify?", multi: true, options: ["Introduction", "Key features", "Examples"], next: { type: "reply", text: "I'll simplify those sections next." } }), trigger: "Tick more than one option.", see: "Several options stay selected." },
  "ASK-03": { start: () => question(panel(base()), { prompt: "What should this lesson focus on?", options: ["Plain definitions", "Real-world uses", "Hands-on practice"], selected: ["Real-world uses"], next: { type: "reply", text: "I'll focus the next draft on that." } }), trigger: "Select Submit.", see: "Your answer appears in the chat and Aurora continues." },
  "ASK-04": { start: () => aurora(user(question(panel(base()), { prompt: "What should this lesson focus on?", options: ["Plain definitions", "Real-world uses", "Hands-on practice"], selected: ["Real-world uses"], status: "answered", next: { type: "reply", text: "I'll use your new answer." } }), "Real-world uses"), "Thanks, I'll keep that in mind."), trigger: "Select Change answer, pick another option and submit.", see: "The card reopens with your earlier answer, and Aurora uses the new one." },
  "ASK-05": { start: () => composer(base(), "Make it better"), trigger: "Send the vague request.", see: "Aurora asks what to focus on before changing anything." },
  "ASK-06": { start: () => question(panel(base()), { prompt: "What should I focus on in this section?", options: ["Make it simpler", "Make it shorter", "Add examples"], skippable: true, next: { type: "small", itemId: "what-is-python", blockId: "wip-intro", instruction: "Make it simpler" } }), trigger: "Select Skip.", see: "Aurora says it will use a default and carries on." },
  "ASK-07": { start: () => question(panel(base()), { prompt: "What should I focus on in this section?", options: ["Make it simpler", "Make it shorter"], allowOther: true, selected: ["Other"], next: { type: "reply", text: "I'll use that." } }), trigger: "Type your own answer, then Submit.", see: "Submit stays disabled until there is text, then your words appear as the answer." },
  "ASK-08": { start: () => { const s = question(panel(base()), { prompt: "What should I focus on in this section?", options: ["Make it simpler", "Make it shorter", "Add examples"], selected: ["Make it simpler"], status: "answered", actedOn: true, next: { type: "small", itemId: "what-is-python", blockId: "wip-intro", instruction: "Make it simpler" } }); const id = s.aurora.messages[0].id; return pendingSmall(s, "Make it simpler", "what-is-python", "wip-intro", { questionId: id }); }, trigger: "Select Change answer on the question.", see: "A note warns that changing it replaces the current draft. Submitting replaces it with a new one." },
  "SED-01": { start: base, trigger: "Select some text in the lesson and choose Ask Aurora, or press Ctrl/Cmd+K. Pick a quick action or type a request.", see: "Selecting text keeps your cursor, so you can still type over it. Ask Aurora opens a menu with a request field and quick actions. Your request appears in the chat." },
  "SED-02": { start: () => autorun(mock(base(), SLOW), SMALL), trigger: "Watch the block while Aurora works.", see: "The block is highlighted with an Aurora is editing pill and named steps. The text stays readable and there are no skeleton bars." },
  "SED-03": { start: () => pendingSmall(base()), trigger: "Look at the highlighted block.", see: "The original stays highlighted with Aurora's result under it, a field to tell Aurora what to do next, and Apply and Discard. More options are under the ⋯ button." },
  "SED-04": { start: () => { const s = pendingSmall(base()); return { ...s, ui: { ...s.ui, reviewProposalId: "prop-seed" } }; }, trigger: "Read the review dialog.", see: "Removed words are struck through and added words underlined, with Accept and Reject." },
  "SED-05": { start: () => applied(pendingSmall(base())), trigger: "Select Undo in the chat or under the lesson.", see: "The change is already applied. Undo restores the original and logs it." },
  "SED-06": { start: () => pendingSmall(base()), trigger: "Type feedback in the field on the draft and send.", see: "Aurora drafts another version and marks the first as replaced." },
  "SED-07": { start: () => pendingSmall(base()), trigger: "Select Discard or Undo, then confirm.", see: "The lesson shows your original and the proposal says Discarded." },
  "SED-08": { start: () => pendingSmall(base(), "Make it simpler", "what-is-python", "wip-features"), trigger: "Select ⋯, then Wrong part?, and choose What is Python?.", see: "Aurora puts that part back and redoes the change on the section you chose." },
  "LED-01": { start: () => composer(base(), "Simplify all lessons in Unit 1"), trigger: "Send the prefilled request.", see: "Aurora accepts a change across several items and asks which ones." },
  "LED-02": { start: () => question(aurora(user(panel(base()), "Simplify all lessons in Unit 1"), "I can do that across several items. First, let's confirm which ones."), { prompt: "Which units should I change?", multi: true, options: ["Introduction to Python", "Python Basics", "Data Structures"], next: { type: "large", instruction: "Simplify all lessons", byOption: { "Introduction to Python": ["what-is-python", "why-python"], "Python Basics": ["variables", "functions"], "Data Structures": ["lists", "dictionaries"] } } }), trigger: "Choose units and Submit.", see: "Only the units you chose are changed." },
  "LED-03": { start: () => autorun(mock(base(), SLOW), LARGE), trigger: "Watch the panel.", see: "Named steps complete in order, and affected blocks show the editing pill." },
  "LED-04": { start: () => pendingLarge(base()), trigger: "Read each item in the dialog.", see: "Every affected item has its own before and after, with Accept and Reject." },
  "LED-05": { start: () => pendingLarge(base()), trigger: "Select Apply 3 changes.", see: "All 3 items change, a message offers Undo." },
  "LED-06": { start: () => pendingLarge(base()), trigger: "Select Discard all and confirm.", see: "Nothing in the course changes." },
  "LED-07": { start: () => { const s = pendingLarge(base()); s.proposals[0].changes[1].decision = "reject"; return s; }, trigger: "Choose Accept or Reject per item, then Apply.", see: "The button says Apply 2 of 3, and only accepted items change." },
  "LED-08": { start: () => { const s = pendingLarge(base(), false); return laterEdit(s, "why-python", "why-intro", { text: "My own rewrite of this section." }); }, trigger: "Look at the proposal in the chat.", see: "It says it is out of date, Apply is disabled, and Update the proposal redrafts it." },
  "LED-09": { start: () => composer(base(), "Rewrite the entire course"), trigger: "Send the prefilled request.", see: "Aurora says it is too much for one go and asks which part to start with." },
  "DOC-01": { start: () => attachOpen(panel(base())), trigger: "Select Choose from your computer, or a sample file.", see: "The menu lists formats and the 200 MB limit, and the file appears as a chip." },
  "DOC-02": { start: () => autorun(mock(panel(base()), { delay: 5 }), upload("Crash Course Python.pdf")), trigger: "Select X on the chip while it uploads.", see: "The upload stops and the chip goes away." },
  "DOC-03": { start: () => autorun(mock(panel(base()), { delay: 2 }), upload("Crash Course Python.pdf")), trigger: "Watch the chip.", see: "It moves through Uploading with a percentage, Processing, then Ready." },
  "DOC-04": { start: () => autorun(panel(base()), upload("Lecture recording.exe")), trigger: "Look at the chip.", see: "It says Unsupported and lists the formats that work." },
  "DOC-05": { start: () => autorun(panel(base()), upload("Upload-fail Week 1.pdf")), trigger: "Wait for the upload to stop.", see: "The chip says Failed, with Retry and Cancel." },
  "DOC-06": { start: () => autorun(panel(base()), upload("Process-fail Week 2.pdf")), trigger: "Wait for processing to stop.", see: "The chip says Failed and explains the file uploaded but couldn't be read." },
  "DOC-07": { start: () => autorun(panel(base()), upload("Upload-fail Week 1.pdf")), trigger: "When it fails, select Retry or Cancel.", see: "Retry uploads it through to Ready. Cancel removes it." },
  "DOC-08": { start: () => autorun(mock(panel(base()), samples(["Crash Course Python.pdf", 2.4 * MB], ["Python Basics Slides.pptx", 4.2 * MB], ["Python Exercises.docx", 0.15 * MB])), upload("Crash Course Python.pdf"), upload("Python Basics Slides.pptx"), upload("Python Exercises.docx")), trigger: "Watch the chips.", see: "Each file has its own status, and Aurora asks one question once all are ready." },
  "DOC-09": { start: () => autorun(panel(base()), upload("Full course video archive.pdf", 260 * MB)), trigger: "Look at the chip.", see: "It says Unsupported and explains the 200 MB limit." },
  "DOC-10": { start: () => autorun(withAttachment(base()), upload("Crash Course Python.pdf")), trigger: "Read the message.", see: "Aurora says the file is already attached and offers Use existing or Replace it." },
  "DOC-11": { start: () => autorun(mock(panel(base()), samples(["Password protected.pdf", 1.2 * MB])), upload("Scanned handout.pdf")), trigger: "Wait for processing. Then attach the Password protected sample.", see: "The chip explains there is no readable text and what to do. The password protected file gets its own explanation." },
  "DOC-12": { start: () => autorun(panel(base()), upload("Unrelated accounting notes.pdf")), trigger: "Wait for it to finish.", see: "Before using it, Aurora flags that it seems unrelated and asks to use or remove it." },
  "DOC-13": { start: () => { const s = applied(pendingNewLesson(withAttachment(base()))); return { ...s, attachments: s.attachments.map((a) => ({ ...a, generatedItemIds: ["generated-seed"] })) }; }, trigger: "Select X on the attachment.", see: "A dialog asks whether to keep the content made from it." },
  "URL-01": { start: () => attachOpen(panel(base())), trigger: "Open attach, type a URL or pick a sample, then Add.", see: "The link appears as a chip and is checked." },
  "URL-02": { start: () => attachOpen(mock(panel(base()), { sampleUrls: ["youtube dot com/watch"] })), trigger: "Pick the sample, select Add, then correct it.", see: "An inline error explains the problem and clears as you type." },
  "URL-03": { start: () => autorun(mock(panel(base()), { delay: 2 }), addUrl("https://videos.example.com/python/intro")), trigger: "Watch the chip.", see: "It moves from Processing to Ready, then Aurora asks how to use it." },
  "URL-04": { start: () => autorun(panel(base()), addUrl("https://videos.example.com/404/intro")), trigger: "Look at the chip.", see: "It says Failed and that the link can't be opened." },
  "URL-05": { start: () => withAttachment(base(), { kind: "video", name: "videos.example.com/python/intro", meta: "Video link" }), trigger: "Select Replace link, or X.", see: "Replace checks the new link in its place. X removes it." },
  "URL-06": { start: () => autorun(panel(base()), addUrl("https://videos.example.com/private/intro")), trigger: "Look at the chip.", see: "It explains the link needs a login and what to do instead." },
  "URL-07": { start: () => autorun(panel(base()), addUrl("https://videos.example.com/no-captions/intro")), trigger: "Read the note.", see: "Aurora says there is no transcript and what it can still use." },
  "URL-08": { start: () => autorun(panel(base()), addUrl("https://videos.example.com/long/full-course")), trigger: "Read the note.", see: "Aurora says it's 4 hours long and that it will use the first 30 minutes." },
  "GEN-01": { start: () => howToUse(withAttachment(base())), trigger: "Choose how to use the attachment.", see: "Aurora asks before using it: new lesson, update the current item, or quiz." },
  "GEN-02": { start: () => howToUse(withAttachment(base()), ["Create a new lesson"]), trigger: "Select Submit, then Apply.", see: "A new lesson is proposed, then added to the current unit and selected." },
  "GEN-03": { start: () => howToUse(withAttachment(base()), ["Update the current item"]), trigger: "Select Submit, then Apply.", see: "A draft under the current section, applied only when you select Apply." },
  "GEN-04": { start: () => autorun(mock(withAttachment(base()), SLOW), { cmd: "generate", attachmentId: "att-seed", use: "new" }), trigger: "Watch the panel.", see: "Named steps: Reading your document, Finding relevant sections, Drafting the content." },
  "GEN-05": { start: () => pendingNewLesson(withAttachment(base())), trigger: "Read the proposal.", see: "It shows the new content and its source before anything is added." },
  "GEN-06": { start: () => applied(pendingNewLesson(withAttachment(base()))), trigger: "Select Undo in the chat.", see: "The added lesson is removed and the counts go back." },
  "GEN-07": { start: () => withAttachment(howToUse(withAttachment(base(), { id: "att-seed", name: "Contradicts lesson.pdf" }), ["Update the current item"]), { id: "unused", name: "Python Exercises.docx", meta: "156 KB" }), trigger: "Select Submit.", see: "The proposal warns that the document contradicts the lesson." },
  "GEN-08": { start: () => composer(withAttachment(base()), "Create a quiz from this document"), trigger: "Send the prefilled request, then Apply.", see: "Aurora drafts a quiz with correct answers set, added as a new item." },
  "GEN-09": { start: () => { const s = applied(pendingNewLesson(withAttachment(base()))); return select(s, "generated-seed"); }, trigger: "Look at the item title.", see: "It carries an Aurora generated label naming the source file." },
  "REC-01": { start: () => autorun(mock(base(), { delay: 5 }), SMALL), trigger: "Select Cancel in the panel.", see: "Aurora stops and says nothing in your course changed." },
  "REC-02": { start: () => autorun(mock(base(), { op: "fail" }), SMALL), trigger: "Wait, then select Retry.", see: "The failed step is marked, an error says nothing changed, and Retry succeeds." },
  "REC-03": { start: () => autorun(mock(base(), { op: "slow" }), SMALL), trigger: "Wait, then choose Keep waiting or Cancel.", see: "A message says this is taking longer than expected." },
  "REC-04": { start: () => autorun(mock(base(), { partial: true }), LARGE), trigger: "Wait, then select Review.", see: "The proposal says 2 of 3 items finished and names the one that failed." },
  "REC-05": { start: () => autorun(mock(base(), { delay: 5 }), SMALL), trigger: "Close the panel, select another item, then use the banner to go back.", see: "A banner says Aurora is still working elsewhere. The result is waiting when you return." },
  "REC-06": { start: () => autorun(mock(laterEdit(base(), "what-is-python", "wip-features", { heading: "Key features you should know" }), { op: "fail" }), SMALL), trigger: "Wait for it to fail.", see: "Your own earlier edit to Key features is still in the lesson." },
  "REC-07": { start: () => autorun(mock(base(), { op: "offline" }), SMALL), trigger: "Wait, then select Reconnect.", see: "An offline banner appears, the operation shows Paused, and it resumes after reconnecting." },
  "REC-08": { start: () => autorun(mock(base(), { op: "expire" }), SMALL), trigger: "Wait, then select Sign in again.", see: "A dialog says your work is safe. After signing in, Aurora carries on." },
  "REC-09": { start: () => autorun(mock(base(), { delay: 5, persist: true }), SMALL), trigger: "Refresh the page while Aurora works.", see: "Aurora says it picked up where it left off, and finishes." },
  "REC-10": { start: () => autorun(mock(panel(base()), SLOW), { cmd: "small", itemId: "what-is-python", blockId: "wip-intro", instruction: "Make it simpler" }, { cmd: "small", itemId: "why-python", blockId: "why-intro", instruction: "Make it shorter" }, { cmd: "small", itemId: "functions", blockId: "fn-intro", instruction: "Add examples" }), trigger: "Watch the numbered list above the composer.", see: "Requests run one at a time in the order shown, and queued ones can be removed." },
  "CON-01": { start: () => autorun(mock(base(), { delay: 6 }), SMALL), trigger: "Select Edit anyway in the lock banner, then type in the block.", see: "A lock banner says Aurora is updating this section, and you can choose to edit anyway." },
  "CON-02": { start: () => { const s = pendingSmall(base(), "Make it simpler", "what-is-python", "wip-intro", { warning: "You edited this item while I was working. Your newer work is kept. This draft is based on the older version, so review it before applying." }); const e = laterEdit(s, "what-is-python", "wip-intro", { text: "Python is my favourite first language. I wrote this while Aurora was working." }); return say(e, { kind: "notice", tone: "warning", title: "Your edit and my draft overlap", text: "Your newer work is kept in the lesson. Nothing has been overwritten.", actions: [{ label: "Review my change", command: { cmd: "reviewProposal", id: "prop-seed" } }, { label: "Retry on your latest version", command: SMALL }] }); }, trigger: "Read the notice.", see: "Aurora says your edit and its draft overlap." },
  "CON-03": { start: () => { const s = pendingSmall(base()); const e = laterEdit(s, "what-is-python", "wip-intro", { text: "Python is my favourite first language. I wrote this while Aurora was working." }); return { ...e, proposals: e.proposals.map((p) => ({ ...p, status: "superseded" as const })) }; }, trigger: "Read the lesson.", see: "The lesson shows your newer text. Aurora's older draft didn't overwrite it." },
  "CON-04": { start: () => { const s = pendingSmall(base()); const e = laterEdit(s, "what-is-python", "wip-intro", { text: "Python is my favourite first language. I wrote this while Aurora was working." }); return say({ ...e, ui: { ...e.ui, reviewProposalId: "prop-seed" } }, { kind: "notice", tone: "warning", title: "Your edit and my draft overlap", text: "Your newer work is kept.", actions: [{ label: "Retry on your latest version", command: SMALL }] }); }, trigger: "Read the review, close it, then select Retry on your latest version.", see: "You can compare Aurora's draft, then have it redraft from your latest text." },
  "CON-05": { start: () => autorun(mock(base(), { delay: 6 }), SMALL), trigger: "Delete 1.1 while Aurora works. Close the panel first to reach the trash icon.", see: "Aurora stops, discards its draft, and offers to restore the item." },
  "CON-06": { start: () => autorun(mock(panel(base()), SLOW), { cmd: "small", itemId: "what-is-python", blockId: "wip-intro", instruction: "Make it simpler" }, { cmd: "small", itemId: "what-is-python", blockId: "wip-intro", instruction: "Make it shorter" }), trigger: "Watch the second request.", see: "It waits and says why. It then runs on the same block and replaces the first draft." },
  "VAL-01": { start: () => ({ ...withAllDefects(base()), ui: { ...base().ui, step: "validate" as const } }), trigger: "Select Start checks.", see: "The idle state explains the checks and offers Start checks." },
  "VAL-02": { start: () => autorun(mock({ ...base(), ui: { ...base().ui, step: "validate" as const } }, SLOW), { cmd: "validate" }), trigger: "Watch the card.", see: "Named checks complete in order with a progress bar." },
  "VAL-03": { start: () => validated(base()), trigger: "Look at the results.", see: "All checks passed, and Continue to publish is enabled." },
  "VAL-04": { start: () => validated(withAdvisory(base())), trigger: "Look at Worth reviewing.", see: "Amber advisories with Fix and Dismiss. Continue to publish stays enabled." },
  "VAL-05": { start: () => validated(withBlocking(base())), trigger: "Look at Must be fixed.", see: "Red blocking issues with icon and text. Continue to publish is disabled, with the reason beside it." },
  "VAL-06": { start: () => autorun(mock({ ...base(), ui: { ...base().ui, step: "validate" as const } }, { validation: "incomplete-once" }), { cmd: "validate" }), trigger: "Wait, then select Retry on Files and links.", see: "That check says Couldn't finish and blocks publishing until it passes." },
  "VAL-07": { start: () => validated(withAllDefects(base())), trigger: "Look at Results.", see: "The count of blocking and advisory findings." },
  "VAL-08": { start: () => autorun(validated(withAllDefects(base())), { cmd: "fix", findingId: "broken-fv-video" }), trigger: "Use Previous and Next in the bar.", see: "Each one opens its item with the finding in view, with a position such as 1 of 5." },
  "VAL-09": { start: () => autorun(mock({ ...base(), ui: { ...base().ui, step: "validate" as const } }, { validation: "slow" }), { cmd: "validate" }), trigger: "Wait, then choose Keep waiting or Cancel.", see: "A message says it's taking much longer than usual." },
  "VAL-10": { start: () => laterEdit(validated(base()), "functions-video", "fv-video", { title: "Your first function" }), trigger: "Select Recheck 1 affected.", see: "Only Files and links reruns. The other checks keep their results." },
  "VAL-11": { start: () => { const s = base(); s.course.units = []; s.ui.selectedItemId = null; return { ...s, ui: { ...s.ui, step: "validate" as const } }; }, trigger: "Select Add content.", see: "With nothing in the course, no checks run. It says why and takes you back to the course plan." },
  "FIX-01": { start: () => validated(withAllDefects(base())), trigger: "Select Fix on any finding.", see: "You go to the content with the finding in view." },
  "FIX-02": { start: () => autorun(validated(withAllDefects(base())), FIX_VIDEO), trigger: "Read the block and the panel.", see: "The flag names the problem. Aurora explains it and suggests a correction." },
  "FIX-03": { start: () => autorun(validated(withAllDefects(base())), FIX_VIDEO, { cmd: "editManually", itemId: "functions-video" }), trigger: "Change the video link yourself, right in the flagged block.", see: "The flagged block is editable in place, and the check then needs another run." },
  "FIX-04": { start: () => autorun(validated(withAllDefects(base())), FIX_VIDEO), trigger: "Select Apply on Aurora's correction.", see: "A before and after, then the finding says Fixed. Recheck to confirm." },
  "FIX-05": { start: () => validated(withAdvisory(base())), trigger: "Select Dismiss on an advisory.", see: "It moves to Dismissed, and a message says it will be in the publish summary." },
  "FIX-06": { start: () => { const s = validated(withBlocking(base())); const e = laterEdit(s, "functions-video", "fv-video", { url: "https://videos.example.com/python/first-function" }); return { ...e, validation: { ...e.validation, findings: e.validation.findings.map((f) => (f.id === "broken-fv-video" ? { ...f, status: "fixed" as const } : f)) } }; }, trigger: "Select Recheck 1 affected.", see: "The check reruns and the fixed finding disappears." },
  "FIX-07": { start: () => autorun(mock(validated(withBlocking(base())), { fixCreatesFinding: true }), FIX_VIDEO), trigger: "Select Apply, Back to checks, then Recheck.", see: "The broken link clears, and a new advisory says the new video has no captions." },
  "FIX-08": { start: () => autorun(mock(validated(withBlocking(base())), { fixApply: "fail-once" }), FIX_VIDEO), trigger: "Select Apply.", see: "An error offers Retry and Edit it myself, and the course is unchanged." },
  "FIX-09": { start: () => validated(withBlocking(base())), trigger: "Select Dismiss on a blocking issue.", see: "It stays, and a message explains why it can't be dismissed." },
  "FIX-10": { start: () => { let s = withBlocking(base()); s = { ...s, course: updateItem(s.course, "lists", (item) => ({ ...item, blocks: [...item.blocks, { id: "lists-video", type: "video", title: "Lists in practice", url: "https://videos.example.com/python/broken-link", duration: "4 min" }] })) }; return autorun(validated(s), FIX_VIDEO); }, trigger: "Select Review, then Apply, then recheck.", see: "One correction covers both places the link is used, and both findings clear." },
  "FIX-11": { start: () => { const s = dismiss(validated(withAdvisory(base())), "duplicate-wip-features"); return laterEdit(s, "why-python", "why-intro", { text: "Python lets you express ideas in fewer lines of code than many other languages." }); }, trigger: "Select Recheck 1 affected.", see: "The dismissed advisory doesn't come back after the recheck." },
  "CHG-01": { start: () => validated(base(), "plan"), trigger: "Click the lesson text and change it, then select Validate.", see: "Your edit saves as usual on a course that has already passed." },
  "CHG-02": { start: () => laterEdit(validated(base()), "what-is-python", "wip-intro", { text: "Python is a language I changed after checking." }), trigger: "Look at Course checks.", see: "Lessons and activities says Needs another run. The other checks stay Ready." },
  "CHG-03": { start: () => { const s = laterEdit(validated(base()), "what-is-python", "wip-intro", { text: "Python is a language I changed after checking." }); return { ...s, ui: { ...s.ui, step: "publish" as const } }; }, trigger: "Look at the publish screen, then select Go to checks and recheck.", see: "Publishing is blocked until the affected check has run again." },
  "CHG-04": { start: () => { const s = validated(base()); const course = updateItem(s.course, "what-is-python", (item) => ({ ...item, notes: "Updated note: remember to demo the print function." })); return { ...s, course }; }, trigger: "Look at Course checks.", see: "A notes change touched no check, so everything stays Ready and no recheck is needed." },
  "CHG-05": { start: () => { const s = laterEdit(validated(base(), "plan"), "what-is-python", "wip-intro", { text: "Python is a language I changed after checking." }); return (s); }, trigger: "Select Undo, then Validate.", see: "With the checked version restored, the checks go back to Ready without a recheck." },
  "PUB-01": { start: () => validated(base(), "publish"), trigger: "Read the summary and open each setting.", see: "Counts come from the course, and each setting can be changed." },
  "PUB-02": { start: () => { const s = validated(base(), "publish"); return { ...s, ui: { ...s.ui, dialog: { type: "publish" as const } } }; }, trigger: "Read the dialog.", see: "It says what goes live and to whom, with Cancel and Publish." },
  "PUB-03": { start: () => autorun(validated(base(), "publish"), { cmd: "publish" }), trigger: "Wait a moment.", see: "Your course is published, with who can see it." },
  "PUB-04": { start: () => autorun(mock(validated(base(), "publish"), { publish: "fail-once" }), { cmd: "publish" }), trigger: "Wait a moment.", see: "An error says publishing failed, your draft is safe, and nothing went live." },
  "PUB-05": { start: () => { const s = validated(base(), "publish"); return { ...s, publish: { ...s.publish, status: "failed" as const } }; }, trigger: "Select Retry.", see: "It publishes this time, and the draft and settings are unchanged." },
  "PUB-06": { start: () => ({ ...validated(base(), "publish"), role: "no-publish" as const }), trigger: "Select Submit for approval.", see: "A banner explains you lack publish rights, and the course goes to an admin." },
  "PUB-07": { start: () => dismiss(validated(withAdvisory(base()), "publish"), "duplicate-wip-features", "scope-why-intro"), trigger: "Look at the right column.", see: "Dismissed advisories are listed in the summary." },
  "PUB-08": { start: liveCourse, trigger: "Edit something, then Validate, Continue to publish, and Republish course.", see: "A live header shows enrolled learners. Republish says what learners will notice, and their progress is kept." },
  "PERM-01": { start: () => ({ ...base(), role: "read-only" as const }), trigger: "Open the editor and try Aurora.", see: "A banner says view only. The text can't be edited, and plan actions and Validate are gone, but Ask Aurora still answers questions." },
  "PERM-02": { start: () => select({ ...base(), collab: { otherEditor: { name: "Jordan Lee", itemId: "why-python" }, otherTab: false } }, "why-python"), trigger: "Try to edit 1.2, then select 1.1.", see: "1.2 is read only while Jordan Lee edits it. Other items can still be edited." },
  "PERM-03": { start: () => ({ ...base(), collab: { otherEditor: null, otherTab: true } }), trigger: "Select Use this tab. You can also open this URL in a second tab.", see: "A banner warns the course is open elsewhere. A real second tab triggers it too." },
  "FIRST-01": { start: () => { const s = panel(base()); return { ...s, aurora: { ...s.aurora, firstUseSeen: false } }; }, trigger: "Read the card, then select Got it.", see: "It says what Aurora can and can't do, including that it shows changes first." },
  "FIRST-02": { start: () => { const s = base(); s.course.units = []; s.ui.selectedItemId = null; return s; }, trigger: "Select Add your first unit, or Ask Aurora.", see: "An empty state explains how to start, with counts of 0." },
  "AI-02": { start: () => applied(pendingSmall(base())), trigger: "Look at the item title.", see: "It carries an Aurora generated label." },
  "AI-04": { start: () => { const s = panel(base()); return { ...s, aurora: { ...s.aurora, useOwnKnowledge: false } }; }, trigger: "Select Add examples, then Shorten.", see: "Adding examples needs a source, so Aurora asks for one and offers to turn its own knowledge back on. Shortening still works, and its draft says it used your text only." },
  "A11Y-01": { start: base, trigger: "Tab to Edit and press Enter, then press Escape.", see: "Focus moves into the composer on open and back to Edit on close." },
  "A11Y-02": { start: () => autorun(mock(base(), SLOW), SMALL), trigger: "Use a screen reader while Aurora works.", see: "Each named step and the result are announced through a live region." },
  "A11Y-03": { start: () => autorun(validated(withAllDefects(base())), FIX_VIDEO), trigger: "Look at the flag, or view it in greyscale.", see: "Flags have a border, an icon and a text label. Diffs use underline and strikethrough too." },
  "A11Y-04": { start: () => autorun(mock(base(), SLOW), SMALL), trigger: "Turn on reduced motion in your system settings.", see: "Spinners stop, scrolling jumps, and streamed text appears at once." },
  "A11Y-05": { start: base, trigger: "Use the tree with arrow keys, Alt+arrows to reorder, Ctrl/Cmd+K for the selection menu, and Tab and Escape in dialogs.", see: "Everything works without a mouse, and focus stays inside dialogs." },
  "RESP-01": { start: () => panel(base()), trigger: "Make the window narrower than 1100px.", see: "The Aurora panel becomes an overlay on the right." },
  "RESP-02": { start: base, trigger: "Make the window narrower than 900px, then select Show course plan.", see: "The course plan collapses behind a button." },
};

export type Scenario = {
  id: string;
  title: string;
  area: Area;
  phase: number;
  source: string;
  references: string[];
  built: boolean;
  trigger: string;
  see: string;
  start: () => AppState;
};


export const SCENARIOS: Scenario[] = INVENTORY.trim()
  .split("\n")
  .map((line) => {
    const [id, title, phase] = line.split("|");
    const area = id.split("-")[0] as Area;
    const built = BUILT[id];
    return {
      id,
      title,
      area,
      phase: Number(phase),
      source: SOURCE_OVERRIDE[id] ?? AREA_SOURCE[area],
      references: (SCENARIO_REFERENCES[id] ?? []).map((key) => REFERENCES[key]),
      built: Boolean(built),
      trigger: built?.trigger ?? `Planned for Phase ${phase}.`,
      see: built?.see ?? "Not built yet. Loads the base course only.",
      start: built?.start ?? createBaseState,
    };
  });

export const findScenario = (id: string | null) =>
  SCENARIOS.find((scenario) => scenario.id === id);
