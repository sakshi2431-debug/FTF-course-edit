import type { Block, Check, Course, Finding, Item } from "../state/types";

/* Real rules over the course data, so fixing content really does clear a finding. */
export const CHECK_DEFS = [
  { id: "structure", label: "Course structure" },
  { id: "lessons", label: "Lessons and activities" },
  { id: "files", label: "Files and links" },
  { id: "quiz", label: "Quiz settings" },
  { id: "objectives", label: "Learning objectives" },
] as const;

export const CHECK_STEPS: Record<string, string> = {
  structure: "Checking course structure",
  lessons: "Reading lessons and activities",
  files: "Opening files and links",
  quiz: "Checking quiz settings",
  objectives: "Matching content to learning objectives",
};

const items = (course: Course) => course.units.flatMap((unit) => unit.items);
const blocksOf = (item: Item, types: Block["type"][]) =>
  item.blocks.filter((block) => types.includes(block.type));

/* What each check looks at. Notes are in none of them, so editing notes needs no recheck. */
export function signature(course: Course, checkId: string): string {
  const all = items(course);
  switch (checkId) {
    case "structure":
      return JSON.stringify(
        course.units.map((u) => [u.title, u.items.map((i) => [i.id, i.title])]),
      );
    case "lessons":
      return JSON.stringify(
        all.map((i) => blocksOf(i, ["intro", "paragraph", "features", "code"])),
      );
    case "files":
      return JSON.stringify(all.map((i) => blocksOf(i, ["video"])));
    case "quiz":
      return JSON.stringify(all.map((i) => blocksOf(i, ["question"])));
    default:
      return JSON.stringify(all.map((i) => i.objectives));
  }
}

export const allSignatures = (course: Course, only?: string[] | null) =>
  Object.fromEntries(
    CHECK_DEFS.filter((c) => !only || only.includes(c.id)).map((c) => [
      c.id,
      signature(course, c.id),
    ]),
  );

export const staleCheckIds = (
  course: Course,
  signatures: Record<string, string>,
): string[] =>
  Object.keys(signatures).filter((id) => signatures[id] !== signature(course, id));

const PROBLEM_LINK = /broken/;
const NO_CAPTIONS = /no-captions/;
const SCOPE_MARKER = "Rust";

export function runRules(course: Course): Finding[] {
  const found: Finding[] = [];
  const add = (finding: Omit<Finding, "status">) =>
    found.push({ ...finding, status: "open" });
  for (const unit of course.units) {
    if (!unit.title.trim()) {
      add({
        id: `empty-unit-${unit.id}`,
        severity: "blocking",
        title: "Unit has no title",
        explanation: "A required field is empty, so learners would see a blank heading.",
        correction: "Add a unit title.",
        itemId: unit.items[0]?.id ?? "",
        checkId: "structure",
        flagLabel: "Blocking: unit title is empty",
      });
    }
  }
  for (const item of items(course)) {
    if (!item.title.trim()) {
      add({
        id: `empty-title-${item.id}`,
        severity: "blocking",
        title: "Item has no title",
        explanation: "A required field is empty, so learners would see a blank item.",
        correction: "Add a title for this item.",
        itemId: item.id,
        checkId: "structure",
        flagLabel: "Blocking: title is empty",
      });
    }
    for (const block of item.blocks) {
      if (block.type === "video" && PROBLEM_LINK.test(block.url)) {
        add({
          id: `broken-${block.id}`,
          severity: "blocking",
          title: item.title,
          explanation: "This video link can't be opened, so learners would see an error.",
          correction: "Replace it with the working link from your course library.",
          itemId: item.id,
          blockId: block.id,
          checkId: "files",
          flagLabel: "Blocking: broken video link",
        });
      }
      if (block.type === "video" && NO_CAPTIONS.test(block.url)) {
        add({
          id: `captions-${block.id}`,
          severity: "advisory",
          title: item.title,
          explanation: "This video has no captions, so some learners can't follow it.",
          correction: "Add captions, or dismiss this if you plan to add them later.",
          itemId: item.id,
          blockId: block.id,
          checkId: "files",
          flagLabel: "Advisory: no captions",
        });
      }
      if (block.type === "question" && block.correctIndex === null) {
        add({
          id: `answer-${block.id}`,
          severity: "blocking",
          title: item.title,
          explanation: "This question has no correct answer, so it can't be graded.",
          correction: `Mark "${block.options[0]}" as the correct answer.`,
          itemId: item.id,
          blockId: block.id,
          checkId: "quiz",
          flagLabel: "Blocking: no correct answer",
        });
      }
      if (block.type === "features") {
        const duplicate = block.items.find(
          (entry, index) => block.items.indexOf(entry) !== index,
        );
        if (duplicate) {
          add({
            id: `duplicate-${block.id}`,
            severity: "advisory",
            title: item.title,
            explanation: `"${duplicate}" appears twice in this list.`,
            correction: "Remove the repeated point.",
            itemId: item.id,
            blockId: block.id,
            checkId: "lessons",
            flagLabel: "Advisory: duplicate key feature",
          });
        }
      }
      if (
        (block.type === "paragraph" || block.type === "intro") &&
        block.text.includes(SCOPE_MARKER)
      ) {
        add({
          id: `scope-${block.id}`,
          severity: "advisory",
          title: item.title,
          explanation: "This section is about Rust, which is outside the course scope.",
          correction: "Remove the sentence about Rust.",
          itemId: item.id,
          blockId: block.id,
          checkId: "lessons",
          flagLabel: "Advisory: outside the course scope",
        });
      }
      if (
        (block.type === "paragraph" || block.type === "intro") &&
        !block.text.trim() &&
        !block.image
      ) {
        add({
          id: `empty-text-${block.id}`,
          severity: "blocking",
          title: item.title,
          explanation: "A required field is empty, so this section has no content.",
          correction: "Add text for this section.",
          itemId: item.id,
          blockId: block.id,
          checkId: "lessons",
          flagLabel: "Blocking: section is empty",
        });
      }
    }
    if (item.objectives.some((objective) => objective.startsWith("Uncovered:"))) {
      add({
        id: `objective-${item.id}`,
        severity: "advisory",
        title: item.title,
        explanation: "One learning objective isn't covered by this item's content.",
        correction: "Remove the objective, or add content that covers it.",
        itemId: item.id,
        checkId: "objectives",
        flagLabel: "Advisory: objective not covered",
      });
    }
  }
  return found;
}

export function buildChecks(findings: Finding[], incomplete: string[] = []): Check[] {
  return CHECK_DEFS.map((def) => ({
    id: def.id,
    label: def.label,
    state: incomplete.includes(def.id)
      ? "incomplete"
      : findings.some((f) => f.checkId === def.id && f.severity === "blocking")
        ? "issue"
        : "ready",
  }));
}

/* The corrected block for a finding, used by Aurora's suggested correction. */
export function correctedBlock(
  finding: Finding,
  block: Block | undefined,
  createsFinding: boolean,
): Block | null {
  if (!block) return null;
  if (block.type === "video") {
    return {
      ...block,
      url: createsFinding
        ? "https://videos.example.com/python/first-function-no-captions"
        : "https://videos.example.com/python/first-function",
    };
  }
  if (block.type === "question") return { ...block, correctIndex: 0 };
  if (block.type === "features") {
    return { ...block, items: [...new Set(block.items)] };
  }
  if (block.type === "paragraph" || block.type === "intro") {
    if (finding.id.startsWith("scope-")) {
      return {
        ...block,
        text: block.text
          .split(/(?<=\.)\s+/)
          .filter((sentence) => !sentence.includes(SCOPE_MARKER))
          .join(" "),
      };
    }
    return { ...block, text: "Add your section text here." };
  }
  return null;
}
