# FTF course editor

Assistiv instructor course-editing prototype.

A local React + TypeScript prototype of the Aurora course editor (Plan, Validate and Publish), for a front end developer to click through every interaction state before building it. Aurora and every service are scripted mocks: nothing calls a backend or a real AI.

## Run in VS Code

Open this folder, then run in the integrated terminal:

```sh
npm install
npm run dev
```

Open http://127.0.0.1:5173. Build with `npm run build`.

## Use the scenario switcher

Press **Alt+S**, or select **Scenarios** at the bottom right. Search by ID or name, pick a scenario, and use **Reset scenario** to start it again. The panel is a developer tool, not part of the product.

Link straight to a state with `?scenario=ID`, for example http://127.0.0.1:5173/?scenario=EDIT-05. Each scenario opens in its exact starting state. The switcher shows what to try and what you should see. **Simulate offline** in the panel drives the offline scenarios.

## Files

- `src/aurora/state/` holds the store, reducer, undo history and serializable state shape.
- `src/aurora/mock/` holds `engine.ts` (mock Aurora and its services), `checks.ts` (real validation rules over the course data), `scripts.ts` (Aurora's fixed responses) and `course.ts` (mock data).
- `src/aurora/scenarios/` holds the registry (every ID, its starting snapshot, how to trigger it and what to expect) and its snapshot builders.
- `src/aurora/components/` and `src/aurora/screens/` hold the shared components and the Plan, Validate and Publish screens.
- `SCENARIOS.md` is generated from the registry with `npm run docs:scenarios`.
- `GAPS.md` lists what has no Figma frame, plus assumptions to confirm.
- `src/tokens.css` holds every colour and text style, named after the Figma variables. No other stylesheet contains raw colours.

## Earlier screens

The four frame-exact screens remain available for comparison. They copy some frame errors that the Aurora prototype corrects.

| Screen                 | URL                                     | Figma node |
| ---------------------- | --------------------------------------- | ---------- |
| Lesson Editor — Sidebar | http://127.0.0.1:5173/#/sidebar         | 3165:15612 |
| Lesson Editor — AI Chat | http://127.0.0.1:5173/#/ai-chat         | 3154:13244 |
| Validate Course        | http://127.0.0.1:5173/#/validate        | 3795:5511  |
| Review & Publish       | http://127.0.0.1:5173/#/publish         | 3188:17126 |

File: https://www.figma.com/design/Qfo8r9g92ilUtUO6zVCggk/Assistiv---Instructors

### Boundaries of the earlier screens

Nothing connects to a backend. Aurora replies, Fix, Save Draft and Publish Course are simulated, and state resets on reload.

The frames do not define every interaction, so these are implementation choices:

- Edit on the Sidebar screen opens the AI Chat screen, because no frame shows another way to open it.
- Fix marks a Validate Course item as resolved. Validate moves focus to the first open Fix button until none remain.
- Lessons other than 1.1, and the Learning Objectives and Notes tabs, show a plain empty message because no frame defines their content.
- Controls with no destination in these four screens do nothing: global navigation, Import outline, Preview course, the lesson pickers, attach, and Edit on Enrollment, Start date and Notifications.
- The frames are 1280px desktop layouts. Narrower widths only stack content to avoid overflow; below 900px the global navigation is hidden.

## Other files

- `reference/previous-build/` keeps the earlier UI, which added features not in the frames.

## Editing a lesson

The lesson is a live document. Click any text and type, with no edit mode. Enter starts a new block, `/` or the + at the end of the document adds a list, code, video or question, the handle beside a block moves or deletes it, and Ctrl/Cmd+Z undoes. The Edit with Aurora button opens Aurora, for changing the same document by chat.
