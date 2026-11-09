import type { AppState, Course } from "../state/types";

/* One Python course used everywhere, so no screen shows unrelated mock data. */
export const baseCourse: Course = {
  id: "python-101",
  code: "#P102",
  title: "Python Basics",
  units: [
    {
      id: "introduction",
      title: "Introduction to Python",
      items: [
        {
          id: "what-is-python",
          title: "1.1 What is Python?",
          kind: "lesson",
          objectives: [
            "Describe what Python is and where it is used",
            "Run a first Python program",
          ],
          notes: "Keep this lesson short. Most learners are new to programming.",
          blocks: [
            {
              id: "wip-intro",
              type: "intro",
              heading: "What is Python?",
              text: "Python is a high-level, interpreted programming language known for its simplicity and readability. It is widely used for web development, data analysis, automation, and more.",
            },
            {
              id: "wip-features",
              type: "features",
              heading: "Key features",
              items: [
                "Easy to learn and readable syntax",
                "Versatile and used in multiple domains",
                "Cross-platform — runs on Windows, Mac, and Linux",
                "Large standard library and active community",
              ],
            },
            {
              id: "wip-code",
              type: "code",
              heading: "Examples",
              language: "python",
              code: 'print("Hello, World!")',
            },
          ],
        },
        {
          id: "why-python",
          title: "1.2 Why Python?",
          kind: "lesson",
          objectives: ["Explain why teams choose Python for new projects"],
          notes: "",
          blocks: [
            {
              id: "why-intro",
              type: "paragraph",
              heading: "Why Python?",
              text: "Python lets you express ideas in fewer lines of code than many other languages. That makes it a good first language and a practical tool for experienced developers.",
            },
            {
              id: "why-features",
              type: "features",
              heading: "Where it is used",
              items: [
                "Web back ends",
                "Data analysis and machine learning",
                "Scripting and automation",
              ],
            },
          ],
        },
        {
          id: "intro-quiz",
          title: "Quiz: Python basics",
          kind: "quiz",
          objectives: ["Check understanding of Unit 1"],
          notes: "",
          blocks: [
            {
              id: "iq-1",
              type: "question",
              question: "What kind of language is Python?",
              options: ["Interpreted", "Assembly", "Markup"],
              correctIndex: 0,
            },
            {
              id: "iq-2",
              type: "question",
              question: "Which function prints text to the screen?",
              options: ["echo()", "print()", "write()"],
              correctIndex: 1,
            },
          ],
        },
      ],
    },
    {
      id: "basics",
      title: "Python Basics",
      items: [
        {
          id: "variables",
          title: "2.1 Variables and types",
          kind: "content",
          objectives: ["Create variables and identify common types"],
          notes: "",
          blocks: [
            {
              id: "var-intro",
              type: "paragraph",
              heading: "Variables and types",
              text: "A variable stores a value under a name. Python works out the type from the value, so you don't declare it yourself.",
            },
            {
              id: "var-code",
              type: "code",
              heading: "Examples",
              language: "python",
              code: 'name = "Ada"\nage = 36\nprint(name, age)',
            },
          ],
        },
        {
          id: "functions",
          title: "2.2 Functions",
          kind: "lesson",
          objectives: ["Define and call a function with arguments"],
          notes: "",
          blocks: [
            {
              id: "fn-intro",
              type: "paragraph",
              heading: "Functions",
              text: "A function groups steps under a name so you can reuse them. Define one with def, then call it by name.",
            },
            {
              id: "fn-code",
              type: "code",
              heading: "Examples",
              language: "python",
              code: 'def greet(name):\n    return "Hello, " + name\n\nprint(greet("Ada"))',
            },
          ],
        },
        {
          id: "functions-video",
          title: "Video: Writing your first function",
          kind: "video",
          objectives: ["Follow along and write a function"],
          notes: "",
          blocks: [
            {
              id: "fv-video",
              type: "video",
              title: "Writing your first function",
              url: "https://videos.example.com/python/first-function",
              duration: "8 min",
            },
          ],
        },
      ],
    },
    {
      id: "data-structures",
      title: "Data Structures",
      items: [
        {
          id: "lists",
          title: "3.1 Lists and tuples",
          kind: "lesson",
          objectives: ["Choose between a list and a tuple"],
          notes: "",
          blocks: [
            {
              id: "lists-intro",
              type: "paragraph",
              heading: "Lists and tuples",
              text: "Lists hold an ordered collection you can change. Tuples hold an ordered collection you can't.",
            },
          ],
        },
        {
          id: "dictionaries",
          title: "3.2 Dictionaries",
          kind: "lesson",
          objectives: ["Store and read values by key"],
          notes: "",
          blocks: [
            {
              id: "dict-intro",
              type: "paragraph",
              heading: "Dictionaries",
              text: "A dictionary maps keys to values, so you can look up a value without knowing its position.",
            },
          ],
        },
        {
          id: "structures-quiz",
          title: "Quiz: Data structures",
          kind: "quiz",
          objectives: ["Check understanding of Unit 3"],
          notes: "",
          blocks: [
            {
              id: "sq-1",
              type: "question",
              question: "Which structure can't be changed after it is created?",
              options: ["List", "Tuple", "Dictionary"],
              correctIndex: 1,
            },
          ],
        },
      ],
    },
  ],
};

export function createBaseState(): AppState {
  const course = structuredClone(baseCourse);
  return {
    course,
    ui: {
      step: "plan",
      selectedItemId: "what-is-python",
      collapsedUnitIds: ["data-structures"],
      tab: "content",
      flag: null,
      reviewProposalId: null,
      dialog: null,
      toast: null,
      announcement: "",
      planOpen: false,
      editAnyway: [],
      scrollTarget: null,
      composer: "",
      attachOpen: false,
    },
    role: "instructor",
    live: null,
    conn: "online",
    session: "active",
    collab: { otherEditor: null, otherTab: false },
    save: { status: "saved", savedCourse: course },
    aurora: {
      panel: "closed",
      messages: [],
      firstUseSeen: true,
      useOwnKnowledge: true,
    },
    attachments: [],
    proposals: [],
    operations: [],
    validation: {
      status: "idle",
      progress: [],
      checks: [],
      findings: [],
      dismissedIds: [],
      signatures: {},
      only: null,
      explainedIds: [],
    },
    publish: {
      status: "draft",
      settings: {
        visibility: "Organisation",
        enrollment: "Self enroll",
        startDate: "Oct 11, 2025",
        notifyLearners: true,
        notifyAdmin: false,
      },
    },
    history: { past: [], future: [], typingKey: null },
    mock: {
      delay: 1,
      save: "ok",
      chat: "ok",
      op: "ok",
      partial: false,
      validation: "ok",
      publish: "ok",
      fixApply: "ok",
      fixCreatesFinding: false,
      sampleFiles: [
        { name: "Crash Course Python.pdf", size: 2516582 },
        { name: "Python Basics Slides.pptx", size: 4404019 },
        { name: "Python Exercises.docx", size: 159744 },
      ],
      sampleUrls: [
        "https://videos.example.com/python/intro",
        "https://docs.python.org/3/tutorial/",
      ],
      persist: false,
      outOfScope: false,
    },
    autorun: [],
    clock: 0,
  };
}
