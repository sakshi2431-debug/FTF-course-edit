import type { Block } from "../state/types";

/* Mock Aurora's words. Everything here is fixed, so a scenario plays the same every time. */

export type EditKind =
  | "simplify"
  | "shorten"
  | "longer"
  | "tone"
  | "grammar"
  | "examples"
  | "improve";

export function editKind(instruction: string): EditKind {
  const text = instruction.toLowerCase();
  if (/simpl|beginner|plain/.test(text)) return "simplify";
  if (/short|concise|trim/.test(text)) return "shorten";
  if (/long|expand|more detail/.test(text)) return "longer";
  if (/tone|friend|formal/.test(text)) return "tone";
  if (/spell|grammar/.test(text)) return "grammar";
  if (/example/.test(text)) return "examples";
  return "improve";
}

const WIP_INTRO: Record<EditKind, string[]> = {
  simplify: [
    "Python is a programming language that reads almost like English. People use it to build websites, study data, and automate everyday tasks.",
    "Think of Python as a set of clear instructions for your computer. It's used for websites, data, and saving time on repeated tasks.",
  ],
  shorten: [
    "Python is a readable, high-level language used for web development, data analysis, and automation.",
    "Python is a readable language for web, data, and automation work.",
  ],
  longer: [
    "Python is a high-level, interpreted programming language known for its simplicity and readability. It is widely used for web development, data analysis, automation, and more. Because its syntax stays close to plain English, beginners can write useful programs within their first few hours.",
    "Python is a high-level, interpreted programming language known for its simplicity and readability. It is widely used for web development, data analysis, automation, and more. You'll find it everywhere from small scripts to large web services.",
  ],
  tone: [
    "Python is a friendly, easy-to-read programming language. You'll see it used everywhere, from websites to data analysis to automating the boring stuff.",
    "Python is a widely adopted, high-level programming language valued for its clarity. Organisations use it for web development, data analysis, and automation.",
  ],
  grammar: [
    "Python is a high-level, interpreted programming language that is known for its simplicity and readability. It is widely used for web development, data analysis, automation, and more.",
    "Python is a high-level, interpreted language known for simplicity and readability. It is widely used in web development, data analysis, and automation.",
  ],
  examples: [
    "Python is a high-level, interpreted programming language known for its simplicity and readability. For example, print(\"Hello\") is a complete program. It is widely used for web development, data analysis, automation, and more.",
    "Python is a high-level, interpreted programming language known for its simplicity and readability. For example, 2 + 2 runs as written. It is widely used for web development, data analysis, automation, and more.",
  ],
  improve: [
    "Python is a high-level, interpreted programming language valued for how easy it is to read. Teams use it for web development, data analysis, automation, and more.",
    "Python is an easy-to-read, high-level language. Teams rely on it for web development, data analysis, and automation.",
  ],
};

const firstSentence = (text: string) => text.split(/(?<=\.)\s+/)[0];

function rewriteText(text: string, kind: EditKind, revision: number): string {
  const variant = revision % 2 === 1 ? " Try it yourself in the next step." : "";
  switch (kind) {
    case "simplify":
      return `In simple terms: ${text}${variant}`;
    case "shorten":
      return `${firstSentence(text)}${variant}`;
    case "longer":
      return `${text} This comes up often in real projects, so it's worth practising.${variant}`;
    case "tone":
      return `Here's the good news: ${text}${variant}`;
    case "grammar":
      return `${text.trim()}${variant}`;
    case "examples":
      return `${text} For example, try changing a value and running it again.${variant}`;
    default:
      return `${text} Keep this in mind as you work through the course.${variant}`;
  }
}

export function transformBlock(block: Block, instruction: string, revision = 0): Block {
  const kind = editKind(instruction);
  switch (block.type) {
    case "intro":
    case "paragraph": {
      const scripted =
        block.id === "wip-intro" ? WIP_INTRO[kind][revision % 2] : undefined;
      const text = scripted ?? rewriteText(block.text, kind, revision);
      return { ...block, text: text === block.text ? `${text} ` : text };
    }
    case "features":
      return {
        ...block,
        items:
          kind === "shorten"
            ? block.items.slice(0, Math.max(2, block.items.length - 1))
            : [...block.items, revision ? "Used by teams of every size" : "Free and open source"],
      };
    case "code":
      return {
        ...block,
        code: `# ${revision ? "Try this version" : "Run this and read the output"}\n${block.code}`,
      };
    case "video":
      return { ...block, title: `${block.title} (updated)` };
    case "question":
      return { ...block, question: `In your own words: ${block.question}` };
  }
}

export function blockText(block: Block | null | undefined): string {
  if (!block) return "";
  switch (block.type) {
    case "intro":
    case "paragraph":
      return [block.heading, block.text].filter(Boolean).join("\n");
    case "features":
      return [block.heading, ...block.items].filter(Boolean).join("\n");
    case "code":
      return block.code;
    case "video":
      return `${block.title}\n${block.url}`;
    case "question":
      return [
        block.question,
        ...block.options.map(
          (option, index) =>
            `${option}${index === block.correctIndex ? " (correct answer)" : ""}`,
        ),
      ].join("\n");
  }
}

export type DiffPart = { type: "same" | "added" | "removed"; text: string };

/* Word level diff, using longest common subsequence. */
export function wordDiff(before: string, after: string): DiffPart[] {
  const a = before.split(/(\s+)/);
  const b = after.split(/(\s+)/);
  const table = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0),
  );
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i][j] =
        a[i] === b[j]
          ? table[i + 1][j + 1] + 1
          : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  const parts: DiffPart[] = [];
  const push = (type: DiffPart["type"], text: string) => {
    const last = parts.at(-1);
    if (last?.type === type) last.text += text;
    else parts.push({ type, text });
  };
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      push("same", a[i]);
      i++;
      j++;
    } else if (j < b.length && (i >= a.length || table[i][j + 1] >= table[i + 1][j])) {
      push("added", b[j++]);
    } else {
      push("removed", a[i++]);
    }
  }
  return parts;
}

export type ChatRoute =
  | "too-large"
  | "large"
  | "out-of-scope"
  | "ambiguous"
  | "small"
  | "followup"
  | "question";

export function routeChat(text: string): ChatRoute {
  const t = text.toLowerCase().trim();
  if (/\b(entire|whole) course\b|\beverything\b/.test(t)) return "too-large";
  if (/all lessons|every lesson|across|several|all of unit|unit \d/.test(t)) return "large";
  if (/\b(publish|enroll|enrol|email|grades?|invoice|translate the website)\b/.test(t))
    return "out-of-scope";
  if (/^(make it better|improve this|improve it|fix it|fix this|change this|update this)\b/.test(t))
    return "ambiguous";
  if (/shorten|simpl|shorter|longer|expand|add examples?|change tone|\btone\b|rewrite|grammar|spelling|concise/.test(t))
    return "small";
  if (/^(and|what about|can you explain more|tell me more|why is that|how so)\b/.test(t))
    return "followup";
  return "question";
}

export function answerFor(text: string): string {
  const t = text.toLowerCase();
  if (/interpret/.test(t)) {
    return "Interpreted means Python runs your code line by line, without a separate compile step. That's why beginners can see results straight away.\n\nThis is only an explanation, so your course hasn't changed.";
  }
  if (/audience|who/.test(t)) {
    return "This lesson suits people who are new to programming. It avoids jargon and starts with a one line program.\n\nThis is only an explanation, so your course hasn't changed.";
  }
  return "This lesson introduces what Python is, where it is used, and how to run a first program. It takes about 6 minutes.\n\nThis is only an explanation, so your course hasn't changed.";
}

export const FOLLOWUP_ANSWER =
  "Building on my last answer: because each line runs as soon as it is reached, an error only stops the program at that line. Learners can fix it and run again straight away.\n\nYour course still hasn't changed.";

export const OUT_OF_SCOPE_ANSWER =
  "I can't do that. I can only help with this course's content: explaining it, editing it, and drafting from your materials. You can change publishing and enrollment in the Publish step.";

export const TOO_LARGE_ANSWER =
  "That's too much to rewrite well in one go, and it would be hard to review. Which part should I start with?";

export const SMALL_STEPS = [
  "Reading the selected content",
  "Drafting the change",
  "Checking it still fits the lesson",
];
export const LARGE_STEPS = [
  "Reading the affected items",
  "Planning the changes",
  "Drafting each item",
  "Checking consistency across items",
];
export const generateSteps = (use: string) => [
  "Reading your document",
  "Finding relevant sections",
  use === "quiz" ? "Drafting the quiz" : "Drafting the content",
];
