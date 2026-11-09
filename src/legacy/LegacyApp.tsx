import React, { useEffect, useRef, useState } from "react";

/* Figma asset hashes. Each frame uses its own colour variant of an icon. */
const asset = {
  sidebar: "9f969.svg",
  moon: "7260d.svg",
  logo: "39add.svg",
  grid: "3a6f4.svg",
  users: "f8694.svg",
  navBook: "63540.svg",
  navFile: "53e6b.svg",
  navChart: "adddb.svg",
  navTool: "82c42.svg",
  navChevron: "03a14.svg",
  navChevronAlt: "8e67f.svg",
  dividerTop: "67484.svg",
  dividerBottom: "230cc.svg",
  dividerVertical: "945cb.svg",
  support: "66ba6.svg",
  settings: "1dc62.svg",
  logout: "53c92.svg",
  roleChevron: "6c5d3.svg",
  dot: "6daab.svg",
  back: "a23ce.svg",
  next: "a20e6.svg",
  nextArrow: "12324.svg",
  drag: "c0b16.svg",
  unitDown: "60d5e.svg",
  unitUp: "db528.svg",
  lessonSelected: "5f31a.svg",
  lessonDefault: "8d3ff.svg",
  lessonContent: "5141e.svg",
  quiz: "b58c3.svg",
  video: "daa26.svg",
  trash: "57d8c.svg",
  plus: "4d894.svg",
  addChevron: "931a5.svg",
  upload: "6f37f.svg",
  edit: "36120.svg",
  check: "ccd15.svg",
  code: "a186b.svg",
  copy: "92d6b.svg",
  python: "fd9f3.png",
  pickerBack: "17910.svg",
  pickerFile: "fddc8.svg",
  pickerBook: "5ba75.svg",
  pickerChevron: "64ae1.svg",
  aurora: "bb16e.svg",
  auroraSmall: "693c1.svg",
  more: "58731.svg",
  close: "e5c70.svg",
  paperclip: "3e9d5.svg",
  send: "76e80.svg",
  radioOn: "36a66.svg",
  alert: "f17d8.svg",
  checkList: "3fb5b.svg",
  checkBook: "ef34a.svg",
  checkFile: "f36ac.svg",
  checkTarget: "7ad26.svg",
  checkCloud: "b3be7.svg",
  overview: "f7c6e.svg",
  clock: "876a1.svg",
  eye: "1ac78.svg",
  reviewBook: "84583.svg",
  reviewHelp: "bd184.svg",
  globe: "a33bb.svg",
  userPlus: "9284b.svg",
  calendar: "8db58.svg",
  bell: "6a7d1.svg",
  summaryFile: "7a1c4.svg",
  readyCheck: "0f19d.svg",
  info: "03691.svg",
  tipCheck: "8c67e.svg",
} as const;
type AssetName = keyof typeof asset;

function Icon({ name, className }: { name: AssetName; className?: string }) {
  return <img className={className} src={`/assets/${asset[name]}`} alt="" />;
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

/* A control that appears in the frames but has no destination in this scope. */
function Inert({ children, ...rest }: ButtonProps) {
  return (
    <button type="button" aria-disabled="true" {...rest}>
      {children}
    </button>
  );
}

type Screen = "sidebar" | "ai-chat" | "validate" | "publish";
const screens: Screen[] = ["sidebar", "ai-chat", "validate", "publish"];
const go = (screen: Screen) => {
  window.location.hash = `/${screen}`;
};
const screenFromHash = (): Screen => {
  const value = window.location.hash.replace("#/", "") as Screen;
  return screens.includes(value) ? value : "sidebar";
};

/* Shared frame: navigation, page header and stepper */
function Navigation() {
  const items: { label: string; icon: AssetName; chevron?: AssetName }[] = [
    { label: "Institute Overview", icon: "grid" },
    { label: "Users and Roles", icon: "users", chevron: "navChevron" },
    { label: "Courses & Groups", icon: "navBook" },
    { label: "Reports & Insights", icon: "navFile", chevron: "navChevronAlt" },
    { label: "AI Usage", icon: "navChart" },
    { label: "System setup", icon: "navTool", chevron: "navChevronAlt" },
  ];
  return (
    <aside className="nav" aria-label="Main navigation">
      <div className="nav-content">
        <div className="nav-top">
          <div className="nav-tools">
            <Inert aria-label="Collapse navigation">
              <Icon name="sidebar" />
            </Inert>
            <Inert aria-label="Switch to dark mode">
              <Icon name="moon" />
            </Inert>
          </div>
          <div className="logo">
            <Icon name="logo" className="logo-mark" />
            <span className="logo-name">Assistiv</span>
          </div>
          <nav className="nav-list">
            {items.map((item) => (
              <Inert
                key={item.label}
                className={`nav-item ${item.chevron ? "has-menu" : ""}`}
              >
                <span className="nav-item-label">
                  <Icon name={item.icon} />
                  {item.label}
                </span>
                {item.chevron && <Icon name={item.chevron} />}
              </Inert>
            ))}
          </nav>
          <div className="divider-image">
            <Icon name="dividerTop" />
          </div>
        </div>
        <div className="nav-footer">
          <div className="nav-list">
            <Inert className="nav-item nav-footer-item">
              <Icon name="support" />
              Support
            </Inert>
            <Inert className="nav-item nav-footer-item">
              <Icon name="settings" />
              Settings
            </Inert>
          </div>
          <div className="divider-image">
            <Icon name="dividerBottom" />
          </div>
          <div className="account">
            <div className="account-identity">
              <div className="avatar">OR</div>
              <div>
                <div className="account-name">Olivia Rhye</div>
                <div className="account-email">olivia@untitledui.com</div>
              </div>
            </div>
            <Inert aria-label="Log out">
              <Icon name="logout" />
            </Inert>
          </div>
        </div>
      </div>
      <div className="divider-image vertical">
        <Icon name="dividerVertical" />
      </div>
    </aside>
  );
}

function PageHeader({
  step,
  breadcrumb,
  roleLabel,
}: {
  step: number;
  breadcrumb: React.ReactNode;
  roleLabel?: boolean;
}) {
  const steps = ["Clarify", "Outline", "Plan", "Validate", "Publish"];
  return (
    <>
      <header className="topbar">
        <div className="breadcrumb">{breadcrumb}</div>
        <div className={`role ${roleLabel ? "with-label" : ""}`}>
          {roleLabel && <span>Active Role:</span>}
          <Inert className="role-menu">
            <span className="badge">Admin Mode</span>
            <Icon name="roleChevron" />
          </Inert>
        </div>
      </header>
      <div className="stepper-row">
        <ol className="stepper">
          {steps.flatMap((label, index) => {
            const active = index < step;
            const node = (
              <li
                key={label}
                className={`step ${active ? "active" : ""} ${index === 0 ? "first" : ""}`}
                aria-current={index === step - 1 ? "step" : undefined}
              >
                <span className="step-number">{index + 1}</span>
                <span>{label}</span>
              </li>
            );
            return index === 0
              ? [node]
              : [
                  <li key={`${label}-line`} className="step-line" aria-hidden>
                    <span />
                  </li>,
                  node,
                ];
          })}
        </ol>
        <span className="badge with-dot">
          <Icon name="dot" />
          Collecting
        </span>
      </div>
    </>
  );
}

function Button({
  children,
  variant,
  className = "",
  ...rest
}: ButtonProps & { variant?: "primary" | "soft" }) {
  return (
    <button
      type="button"
      className={`button ${variant ?? ""} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

function EditorBreadcrumb() {
  return (
    <>
      Instructor / <a href="#/sidebar">Create New Course</a>
    </>
  );
}

/* Lesson content */
type PlanKind = "lesson" | "content" | "quiz" | "video";
type PlanItem = { id: string; title: string; kind: PlanKind };
type PlanUnit = { id: string; title: string; items: PlanItem[] };
const initialPlan: PlanUnit[] = [
  {
    id: "introduction",
    title: "Introduction to Python",
    items: [
      { id: "what-is-python", title: "1.1 What is Python?", kind: "lesson" },
      { id: "fly-python", title: "1.2 Fly Python Online", kind: "lesson" },
      { id: "quiz", title: "Quiz", kind: "quiz" },
    ],
  },
  {
    id: "basics",
    title: "Python Basics",
    items: [
      { id: "content", title: "Content", kind: "content" },
      { id: "functions", title: "Functions", kind: "lesson" },
      { id: "video", title: "Video", kind: "video" },
    ],
  },
  { id: "data-structures", title: "Data Structures", items: [] },
];
const FRAME_LESSON = "what-is-python";
const LESSON_TEXT =
  "Python is a high-level, interpreted programming language known for its simplicity and readability. It is widely used for web development, data analysis, automation, and more.";

function LessonBody({ item }: { item?: PlanItem }) {
  if (item?.id !== FRAME_LESSON) {
    return <p className="empty-state">No content yet.</p>;
  }
  return (
    <>
      <div className="lesson-intro">
        <div className="lesson-intro-text">
          <h3 className="lesson-heading">What is Python?</h3>
          <p className="lesson-paragraph">{LESSON_TEXT}</p>
        </div>
        <Icon name="python" className="lesson-image" />
      </div>
      <div className="lesson-features">
        <h4 className="lesson-subheading">Key features</h4>
        <ul className="feature-list">
          {[
            "Easy to learn and readable syntax",
            "Versatile and used in multiple domains",
            "Cross-platform — runs on Windows, Mac, and Linux",
            "Versatile and used in multiple domains",
          ].map((feature, index) => (
            <li
              key={index}
              className={`feature ${index === 2 ? "default-text" : ""}`}
            >
              <span className="checkbox">
                <Icon name="check" />
              </span>
              {feature}
            </li>
          ))}
        </ul>
      </div>
      <div className="lesson-examples">
        <h4 className="lesson-subheading">Examples</h4>
        <div className="code-margin">
          <div className="code">
            <div className="code-language">
              <Icon name="code" />
              python
            </div>
            <div className="code-line">
              <code>
                print<span className="code-punctuation">(</span>
                <span className="code-string">"Hello, World!"</span>
                <span className="code-punctuation">)</span>
              </code>
              <button
                type="button"
                aria-label="Copy example"
                onClick={() =>
                  navigator.clipboard?.writeText('print("Hello, World!")')
                }
              >
                <Icon name="copy" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const planIcon = (item: PlanItem, selected: boolean): AssetName => {
  if (item.kind === "quiz") return "quiz";
  if (item.kind === "video") return "video";
  if (selected) return "lessonSelected";
  return item.kind === "content" ? "lessonContent" : "lessonDefault";
};

function CoursePlan({
  plan,
  setPlan,
  selected,
  setSelected,
}: {
  plan: PlanUnit[];
  setPlan: React.Dispatch<React.SetStateAction<PlanUnit[]>>;
  selected: string;
  setSelected: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState<string[]>(["data-structures"]);
  const added = useRef(0);
  const allItems = plan.flatMap((unit) => unit.items);

  function remove(id: string) {
    const next = plan.map((unit) => ({
      ...unit,
      items: unit.items.filter((item) => item.id !== id),
    }));
    setPlan(next);
    const first = next.flatMap((unit) => unit.items)[0];
    if (first) setSelected(first.id);
  }

  function addLesson() {
    added.current += 1;
    const unit = plan[0];
    const lessonCount = unit.items.filter((i) => i.kind === "lesson").length;
    const item: PlanItem = {
      id: `new-lesson-${added.current}`,
      title: `1.${lessonCount + 1} New lesson`,
      kind: "lesson",
    };
    setPlan(
      plan.map((u) =>
        u.id === unit.id ? { ...u, items: [...u.items, item] } : u,
      ),
    );
    setCollapsed((ids) => ids.filter((id) => id !== unit.id));
    setSelected(item.id);
  }

  return (
    <aside className="plan" aria-label="Course plan">
      <div className="plan-header">
        <span className="plan-title">Course plan</span>
        <span className="plan-subtitle">4 Section • 3 Section• 2 Modules</span>
      </div>
      <div className="plan-body">
        {plan.map((unit) => {
          const open = !collapsed.includes(unit.id);
          return (
            <div className="plan-unit" key={unit.id}>
              <button
                type="button"
                className="plan-unit-row"
                aria-expanded={open}
                onClick={() =>
                  setCollapsed((ids) =>
                    open
                      ? [...ids, unit.id]
                      : ids.filter((id) => id !== unit.id),
                  )
                }
              >
                <Icon name="drag" />
                <span className="plan-unit-name">{unit.title}</span>
                <Icon name={open ? "unitDown" : "unitUp"} />
              </button>
              {open &&
                unit.items.map((item) => {
                  const isSelected = item.id === selected;
                  return (
                    <div
                      key={item.id}
                      className={`plan-lesson kind-${item.kind} ${isSelected ? "selected" : ""}`}
                    >
                      <button
                        type="button"
                        className="plan-lesson-select"
                        aria-current={isSelected ? "true" : undefined}
                        onClick={() => setSelected(item.id)}
                      >
                        <Icon name={planIcon(item, isSelected)} />
                        {item.title}
                      </button>
                      {isSelected && allItems.length > 1 && (
                        <button
                          type="button"
                          className="plan-lesson-delete"
                          aria-label={`Delete ${item.title}`}
                          onClick={() => remove(item.id)}
                        >
                          <Icon name="trash" />
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
          );
        })}
        <div className="plan-add">
          <Button variant="soft" onClick={addLesson}>
            <span className="plan-add-label">
              <Icon name="plus" />
              Add Lessons
            </span>
            <Icon name="addChevron" />
          </Button>
        </div>
      </div>
    </aside>
  );
}

/* Screen: Lesson Editor (Sidebar), Figma 3165:15612 */
function LessonEditorSidebar({
  plan,
  setPlan,
  selected,
  setSelected,
}: {
  plan: PlanUnit[];
  setPlan: React.Dispatch<React.SetStateAction<PlanUnit[]>>;
  selected: string;
  setSelected: (id: string) => void;
}) {
  const [tab, setTab] = useState("Content");
  const item = plan.flatMap((u) => u.items).find((i) => i.id === selected);
  const tabs = ["Content", "Learning Objectives", "Notes"];
  return (
    <>
      <PageHeader step={3} breadcrumb={<EditorBreadcrumb />} />
      <div className="editor sidebar-layout">
        <CoursePlan
          plan={plan}
          setPlan={setPlan}
          selected={selected}
          setSelected={(id) => {
            setSelected(id);
            setTab("Content");
          }}
        />
        <main className="editor-main">
          <div className="outline-header">
            <h1 className="outline-title">Course outline</h1>
            <span className="outline-count">5 Modules · 20 Lessons</span>
            <Inert className="button">
              <Icon name="upload" />
              Import outline
            </Inert>
          </div>
          <section className="lesson">
            <div className="lesson-title-row">
              <h2 className="lesson-editing">Editing: {item?.title}</h2>
              <Button onClick={() => go("ai-chat")}>
                <Icon name="edit" />
                Edit
              </Button>
            </div>
            <div className="tabs" role="tablist" aria-label="Lesson sections">
              {tabs.map((name) => (
                <button
                  key={name}
                  type="button"
                  role="tab"
                  className="tab"
                  aria-selected={tab === name}
                  onClick={() => setTab(name)}
                >
                  <span className="tab-label">{name}</span>
                  <span className="tab-indicator" />
                </button>
              ))}
            </div>
            <div className="tabs-spacer" />
            {tab === "Content" ? (
              <LessonBody item={item} />
            ) : (
              <p className="empty-state">
                {tab === "Notes"
                  ? "No notes yet."
                  : "No learning objectives yet."}
              </p>
            )}
          </section>
        </main>
      </div>
      <footer className="page-footer">
        <Inert className="button semibold">
          <Icon name="back" />
          Back
        </Inert>
        <Button variant="primary" onClick={() => go("validate")}>
          Validate
          <Icon name="next" />
        </Button>
      </footer>
    </>
  );
}

/* Screen: Lesson Editor (AI Chat), Figma 3154:13244 */
type ChatMessage = { id: number; from: "user" | "aurora"; text: string };
const chatTime = () =>
  new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

function LessonEditorChat({ item }: { item?: PlanItem }) {
  const [audience, setAudience] = useState("Some background");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<(ChatMessage & { time: string })[]>(
    [],
  );
  const nextId = useRef(0);
  const log = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length && log.current) {
      log.current.scrollTop = log.current.scrollHeight;
    }
  }, [messages]);

  function send(text: string) {
    const clean = text.trim();
    if (!clean) return;
    const time = chatTime();
    setMessages((current) => [
      ...current,
      { id: nextId.current++, from: "user", text: clean, time },
      {
        id: nextId.current++,
        from: "aurora",
        text: "This prototype can't edit the lesson yet, so your draft is unchanged.",
        time,
      },
    ]);
    setDraft("");
  }

  return (
    <>
      <PageHeader step={3} breadcrumb={<EditorBreadcrumb />} />
      <div className="editor ai-layout">
        <main className="editor-main ai-main">
          <div className="lesson-picker">
            <div className="lesson-picker-title">
              <button
                type="button"
                aria-label="Back to course plan"
                onClick={() => go("sidebar")}
              >
                <Icon name="pickerBack" />
              </button>
              <span>Select Lessons</span>
            </div>
            <div className="lesson-picker-row">
              <Inert className="picker unit">
                <span className="picker-label">
                  <Icon name="pickerFile" />
                  Introduction to Python
                </span>
                <Icon name="pickerChevron" />
              </Inert>
              <Inert className="picker lesson-choice">
                <span className="picker-label">
                  <Icon name="pickerBook" />
                  Welcome to the Fabrication Floor
                </span>
                <Icon name="pickerChevron" />
              </Inert>
            </div>
          </div>
          <section className="lesson">
            <h1 className="lesson-editing">Editing: {item?.title}</h1>
            <div className="tabs-spacer" />
            <LessonBody item={item} />
            {item?.id === FRAME_LESSON && (
              <p className="lesson-paragraph">{LESSON_TEXT}</p>
            )}
          </section>
        </main>
        <aside className="chat" aria-label="Aurora AI Course Assistant">
          <div>
            <div className="chat-header">
              <div className="chat-identity">
                <Icon name="aurora" />
                <div>
                  <div className="chat-name">Aurora</div>
                  <div className="chat-role">AI Course Assistant</div>
                </div>
              </div>
              <div className="chat-actions">
                <Inert aria-label="More options">
                  <Icon name="more" />
                </Inert>
                <button
                  type="button"
                  aria-label="Close Aurora"
                  onClick={() => go("sidebar")}
                >
                  <Icon name="close" />
                </button>
              </div>
            </div>
            <div className="chat-rule" />
          </div>
          <div className="chat-messages" aria-live="polite" ref={log}>
            <div className="message-user">
              <div className="bubble">
                <p className="bubble-text">
                  Can you make the explanation simpler for beginners?
                </p>
                <span className="bubble-time">10:32 AM</span>
              </div>
            </div>
            <AuroraMessage
              text={
                "Sure! I can help you refine this lesson.\nWhat would you like to change or improve?"
              }
              time="10:32 AM"
            />
            <fieldset className="question">
              <legend className="visually-hidden">
                1/6 Who is the primary audience for this course?
              </legend>
              <p className="question-title" aria-hidden>
                1/6 Who is the primary audience for this course?
              </p>
              <div className="question-options">
                {[
                  "Complete beginners",
                  "Some background",
                  "Advanced practitioners",
                  "Mixed experience",
                ].map((option) => (
                  <label
                    key={option}
                    className={`question-option ${audience === option ? "checked" : ""}`}
                  >
                    <input
                      className="visually-hidden"
                      type="radio"
                      name="audience"
                      checked={audience === option}
                      onChange={() => setAudience(option)}
                    />
                    <span className="radio-mark">
                      {audience === option ? (
                        <Icon name="radioOn" />
                      ) : (
                        <span className="radio-off" />
                      )}
                    </span>
                    {option}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="chips">
              {[
                "Shorten more",
                "Add examples",
                "Add an Example",
                "Change Tone",
              ].map((label) => (
                <button
                  key={label}
                  type="button"
                  className="chip"
                  onClick={() => send(label)}
                >
                  {label}
                </button>
              ))}
            </div>
            {messages.map((message) =>
              message.from === "user" ? (
                <div className="message-user" key={message.id}>
                  <div className="bubble">
                    <p className="bubble-text">{message.text}</p>
                    <span className="bubble-time">{message.time}</span>
                  </div>
                </div>
              ) : (
                <AuroraMessage
                  key={message.id}
                  text={message.text}
                  time={message.time}
                />
              ),
            )}
          </div>
          <form
            className="composer"
            onSubmit={(event) => {
              event.preventDefault();
              send(draft);
            }}
          >
            <textarea
              aria-label="Ask Aurora to edit this lesson"
              placeholder="Ask Aurora to edit this lesson"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  send(draft);
                }
              }}
            />
            <div className="composer-actions">
              <Inert aria-label="Attach a file">
                <Icon name="paperclip" />
              </Inert>
              <button type="submit" aria-label="Send message">
                <Icon name="send" />
              </button>
            </div>
          </form>
        </aside>
      </div>
      <footer className="page-footer">
        <Button className="semibold" onClick={() => go("sidebar")}>
          <Icon name="back" />
          Back
        </Button>
        <Button variant="primary" onClick={() => go("validate")}>
          Validate
          <Icon name="next" />
        </Button>
      </footer>
    </>
  );
}

function AuroraMessage({ text, time }: { text: string; time: string }) {
  return (
    <div className="message-aurora">
      <div className="aurora-avatar">
        <Icon name="auroraSmall" />
      </div>
      <div className="aurora-body">
        <p className="aurora-text">{text}</p>
        <span className="aurora-time">{time}</span>
      </div>
    </div>
  );
}

/* Screen: Validate Course, Figma 3795:5511 */
const ISSUES = [
  {
    id: "video",
    title: "Safety demonstration",
    description: "Video link cannot be opened.",
    check: "Files and links",
  },
  {
    id: "answer",
    title: "Final knowledge check",
    description: "Select a correct answer.",
    check: "Quiz settings",
  },
];
const CHECKS: { label: string; icon: AssetName }[] = [
  { label: "Course structure", icon: "checkList" },
  { label: "Lessons and activities", icon: "checkBook" },
  { label: "Files and links", icon: "checkFile" },
  { label: "Quiz settings", icon: "checkTarget" },
  { label: "Your changes were saved", icon: "checkCloud" },
];

function ValidateCourse({
  fixed,
  setFixed,
}: {
  fixed: string[];
  setFixed: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const open = ISSUES.filter((issue) => !fixed.includes(issue.id));
  const firstFix = useRef<HTMLButtonElement>(null);
  return (
    <>
      <PageHeader step={4} breadcrumb={<EditorBreadcrumb />} />
      <main className="validate-title-gap">
        <div className="page-title">
          <h1>Check your course</h1>
          <p>
            We're making sure your course is complete and can be published
            correctly.
          </p>
        </div>
        <section className="section-card">
          <h2 className="section-heading">Need your attention</h2>
          <p className="section-description" role="status">
            {open.length === 0
              ? "All items are fixed."
              : `${open.length} ${open.length === 1 ? "item" : "items"} must be fixed before publishing.`}
          </p>
          {open.length > 0 && (
            <div className="attention-margin">
              <div
                className={`check-list ${open.length === ISSUES.length ? "attention-list" : ""}`}
              >
                {open.map((issue, index) => (
                  <div className="check-row attention" key={issue.id}>
                    <Icon name="alert" />
                    <div className="check-text">
                      <div className="check-title">{issue.title}</div>
                      <div className="check-description">
                        {issue.description}
                      </div>
                    </div>
                    <button
                      ref={index === 0 ? firstFix : undefined}
                      type="button"
                      className="fix-button"
                      aria-label={`Fix ${issue.title}`}
                      onClick={() => setFixed([...fixed, issue.id])}
                    >
                      Fix
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <h2 className="section-heading checks-heading">Course checks</h2>
          <div className="checks-margin">
            <div className="check-list checks-list">
              {CHECKS.map((check) => {
                const issue = open.some((i) => i.check === check.label);
                return (
                  <div className="check-row" key={check.label}>
                    <Icon name={check.icon} />
                    <span className="check-label">{check.label}</span>
                    <span
                      className={`check-status ${issue ? "issue" : "ready"}`}
                    >
                      {issue ? "1 issue" : "Ready"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
        <section className="section-card borderless">
          <h2 className="section-heading">Course summary</h2>
          <div className="summary-list">
            {(
              [
                ["checkBook", "Python Basics"],
                ["overview", "5 units"],
                ["checkFile", "20 lessons"],
                ["clock", "38 min"],
              ] as [AssetName, string][]
            ).map(([icon, label]) => (
              <div className="summary-item" key={label}>
                <Icon name={icon} />
                {label}
              </div>
            ))}
          </div>
        </section>
      </main>
      <footer className="page-footer">
        <Button className="semibold" onClick={() => go("sidebar")}>
          <Icon name="back" />
          Back
        </Button>
        <Button
          variant="primary"
          onClick={() =>
            open.length ? firstFix.current?.focus() : go("publish")
          }
        >
          Validate
          <Icon name="next" />
        </Button>
      </footer>
    </>
  );
}

/* Screen: Review & Publish, Figma 3188:17126 */
function ReviewRow({
  icon,
  title,
  description,
}: {
  icon: AssetName;
  title: string;
  description: string;
}) {
  return (
    <div className="review-row">
      <span className="review-icon">
        <Icon name={icon} />
      </span>
      <div className="review-text">
        <div className="review-text-title">{title}</div>
        <div className="review-text-description">{description}</div>
      </div>
      <Button variant="soft" onClick={() => go("sidebar")}>
        Edit
      </Button>
    </div>
  );
}

function SettingRow({
  icon,
  title,
  description,
  action,
}: {
  icon: AssetName;
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div className="setting-row">
      <Icon name={icon} />
      <div className="review-text">
        <div className="review-text-title">{title}</div>
        <div className="review-text-description">{description}</div>
      </div>
      {action}
    </div>
  );
}

function ReviewPublish() {
  const [visibility, setVisibility] = useState("Organisation");
  const [editingVisibility, setEditingVisibility] = useState(true);
  const [draftSaved, setDraftSaved] = useState(false);
  const [published, setPublished] = useState(false);
  const inertEdit = <Inert className="button soft">Edit</Inert>;
  const visibilityOptions = [
    { label: "Organisation", description: "Only enrolled users can access" },
    { label: "Public", description: "Anyone with the link can access" },
  ];
  return (
    <>
      <PageHeader
        step={5}
        roleLabel
        breadcrumb={
          <>
            Instructor /Create New Course/{" "}
            <a href="#/publish">Create Course Manually</a>
          </>
        }
      />
      <div className="review-title">
        <h1>Create a course manually</h1>
        <p>
          Start with an empty course structure and add content at your own pace.
        </p>
      </div>
      <div className="review">
        <main className="review-main">
          <section className="review-card">
            <div className="review-card-header">
              <div>
                <h2 className="review-card-title">Review your course</h2>
                <p className="review-card-description">
                  Make sure everything looks good before publishing.
                </p>
              </div>
              <Inert className="button">
                <Icon name="eye" />
                Preview course
              </Inert>
            </div>
            <ReviewRow
              icon="reviewBook"
              title="Course details"
              description="Python Basics · #P102 · 5 units"
            />
            <ReviewRow
              icon="navFile"
              title="Units & structure"
              description="5 Units · 1 activity · 1 assessment"
            />
            <ReviewRow
              icon="reviewHelp"
              title="Content"
              description="1 lesson · 1 activity · 1 assessment"
            />
          </section>
          <section className="settings">
            <h2 className="settings-title">Publish settings</h2>
            <div className="setting">
              <SettingRow
                icon="globe"
                title="Visibility"
                description={visibility}
                action={
                  <Button
                    variant="soft"
                    aria-expanded={editingVisibility}
                    onClick={() => setEditingVisibility(!editingVisibility)}
                  >
                    {editingVisibility ? "Done" : "Edit"}
                  </Button>
                }
              />
              {editingVisibility && (
                <div className="setting-panel">
                  <fieldset className="setting-options">
                    <legend className="visually-hidden">
                      Who can see and access this course?
                    </legend>
                    <div className="setting-options-title" aria-hidden>
                      Who can see and access this course?
                    </div>
                    {visibilityOptions.map((option) => (
                      <label
                        key={option.label}
                        className={`setting-option ${visibility === option.label ? "checked" : ""}`}
                      >
                        <input
                          className="visually-hidden"
                          type="radio"
                          name="visibility"
                          checked={visibility === option.label}
                          onChange={() => setVisibility(option.label)}
                        />
                        <span className="radio-mark">
                          {visibility === option.label ? (
                            <Icon name="radioOn" />
                          ) : (
                            <span className="radio-off" />
                          )}
                        </span>
                        <span>
                          <span className="setting-option-title">
                            {option.label}
                          </span>
                          <span className="review-text-description">
                            {option.description}
                          </span>
                        </span>
                      </label>
                    ))}
                  </fieldset>
                </div>
              )}
            </div>
            <div className="setting">
              <SettingRow
                icon="userPlus"
                title="Enrollment"
                description="Self enroll"
                action={inertEdit}
              />
            </div>
            <div className="setting">
              <SettingRow
                icon="calendar"
                title="Start date"
                description="Oct 11, 2025"
                action={inertEdit}
              />
            </div>
            <div className="setting">
              <SettingRow
                icon="bell"
                title="Notifications"
                description="Notify learners on publish"
                action={inertEdit}
              />
            </div>
          </section>
        </main>
        <aside className="review-side">
          <section className="side-card summary-card">
            <div className="side-heading">
              <Icon name="summaryFile" />
              <span>Course summary</span>
            </div>
            <dl className="summary-values">
              {[
                ["Course name", "Python Basics"],
                ["Course code", "#502"],
                ["Lessons", "4"],
                ["Duration", "38 min"],
                ["On this unit", "5"],
              ].map(([term, value]) => (
                <div className="summary-value" key={term}>
                  <dt>{term}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="side-card ready-card">
            <div className="side-heading">
              <Icon name="readyCheck" />
              <span>Ready to publish</span>
            </div>
            <p className="ready-primary">No missing course content</p>
            <p className="ready-secondary">
              You can still make changes after publishing.
            </p>
          </section>
          <section className="side-card tips-card">
            <div className="side-heading">
              <Icon name="info" />
              <span>Tips</span>
            </div>
            <ul className="tips-list">
              <li>
                <Icon name="tipCheck" />
                Preview the course to experience it as a learner
              </li>
              <li>
                <Icon name="tipCheck" />
                You can still make changes after publishing
              </li>
            </ul>
          </section>
        </aside>
      </div>
      <footer className="page-footer">
        <Button className="large" onClick={() => go("validate")}>
          <Icon name="back" />
          Previous
        </Button>
        <div className="footer-actions">
          <Button className="large" onClick={() => setDraftSaved(true)}>
            {draftSaved ? "Draft saved" : "Save Draft"}
          </Button>
          <Button
            variant="primary"
            className="large"
            disabled={published}
            onClick={() => setPublished(true)}
          >
            {published ? "Published" : "Publish Course"}
            <Icon name="nextArrow" />
          </Button>
        </div>
      </footer>
    </>
  );
}

export default function LegacyApp() {
  const [screen, setScreen] = useState<Screen>(screenFromHash);
  const [plan, setPlan] = useState(initialPlan);
  const [selected, setSelected] = useState(FRAME_LESSON);
  const [fixed, setFixed] = useState<string[]>([]);

  useEffect(() => {
    const onChange = () => {
      setScreen(screenFromHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  const item = plan.flatMap((u) => u.items).find((i) => i.id === selected);
  return (
    <div className="app">
      <Navigation />
      <div className="page">
        {screen === "sidebar" && (
          <LessonEditorSidebar
            plan={plan}
            setPlan={setPlan}
            selected={selected}
            setSelected={setSelected}
          />
        )}
        {screen === "ai-chat" && <LessonEditorChat item={item} />}
        {screen === "validate" && (
          <ValidateCourse fixed={fixed} setFixed={setFixed} />
        )}
        {screen === "publish" && <ReviewPublish />}
      </div>
    </div>
  );
}

