# Gaps to bring back into Figma

Screens and states with no Figma frame. The prototype's version is a proposal for the designer to review, built from the existing components and tokens.

## New screens and panels

| Gap | Scenarios | Built from |
| --- | --- | --- |
| Validate: idle, checking, slow, all clear and rerun states | VAL-01, VAL-02, VAL-03, VAL-09, VAL-10 | `3795:5511` card and `3012:2175` progress pattern |
| Validate: separate blocking and advisory groups | VAL-04, VAL-05, VAL-07 | `3795:5511` rows. Red uses the library's `Red` primitives. |
| Findings navigator bar | VAL-08, NAV-06 | Buttons and badges |
| Before and after review dialog | SED-04, LED-04, LED-07, FIX-10 | Library `Modal` shape. Behaviour from the Cursor reference. Focus starts on the summary, and the button names the count, such as "Apply 3 changes". Changes across several items can only be applied here. |
| Selection menu | SED-01 | Input and menu rows. Behaviour from the Notion reference. |
| In-place editing state and "Aurora's draft" bar | SED-02, SED-03, LED-03, GEN-04 | Tokens only. Behaviour from the in-place editing reference, without its skeleton bars. |
| Publish: confirm, publishing, failed, success, submitted for approval | PUB-02 to PUB-06 | `3188:17126` |
| Live course republish | PUB-08 | `4051:17631` header and `3188:17126`. Only the header of `4051:17625` was read in detail, because the frame is too large for one read. |
| First use card and empty course | FIRST-01, FIRST-02 | Cards and buttons |
| Sign in again dialog | REC-08 | Dialog |
| Narrow layouts: Aurora overlay, collapsed plan | RESP-01, RESP-02 | Existing components |

## New states on existing components

| Gap | Scenarios | Notes |
| --- | --- | --- |
| Stepper: completed, current, upcoming | All | Corrects `3165:15612`. All circles are 34px. |
| Step status badge | All | Replaces "Collecting" with Planning, Checking, Checked, Ready to review, Published. |
| Save status chip: Saved, Saving, Unsaved, Not saved, Saved on this device | EDIT-02 to EDIT-06 | Moved out of the Validate checks. |
| Lesson as a live document: text is edited where it sits, with no edit mode or form fields | EDIT-01 to EDIT-09, FIX-03 | **Replaces "Editing: 1.1" and the frames' separate edit step.** Same type styles as reading. The text cursor is the only sign of editing. |
| Adding blocks: Enter, `/` menu, + in the margin, end-of-document line | EDIT-01 | Behaviour from Notion, drawn with the add menu and existing icons. The "Add Content item" button and menu in `4065:19210` were tried and removed during prototype review. |
| Fixed layout: the navigation sticks. With Aurora open, the header and footer stay put, and the lesson and conversation scroll separately. | NAV-04, CHAT | Decided during prototype review. The frames are static, so they don't show scrolling. |
| Aurora panel on wide screens: the lesson column and panel grow, so the panel stays on the page's right edge. Quick actions fill their row. | CHAT, LED, SED | Decided during prototype review. At 1280px the layout stays as built, apart from the quick actions. |
| "Edit with Aurora" button opens Aurora. There's no separate Aurora button or edit mode. | NAV-04 | Decided during prototype review. |
| Block handle beside each block: a menu with Add a block below, Move up, Move down and Delete | EDIT-01 | Replaces the + and trash in the margin. Behaviour from Notion, using the existing drag icon. Moving is by menu, not by dragging. |
| Empty lesson and empty video | EDIT-01, NAV-03 | The empty video uses "Embed from Link" from `3600:9459`, without its Video details form. Blocks have no description field. |
| Inline required message, image controls | EDIT-07, EDIT-09 | |
| Quiz editor, built from the Create a Quiz frame image: question cards, Add Options, Explanation, Generate with Aurora, Quiz settings, Tips | NAV-03, FIX-02 | **Taken from a screenshot, not read from Figma, so spacing needs checking.** Admin Mode and the frame's navigation aren't used. |
| Result under the selection: highlighted original, result, next-step field, draft paging, action menu | SED-03, SED-05, SED-07 | Behaviour from the reference, using `--brand-50` for the highlight. Adds Review changes and Edit it myself. Apply and Discard sit on the draft, and everything else is in a floating menu under ⋯. "Replace selection" became Apply, because Aurora rewrites the whole section. The chat points to the draft and has no buttons of its own, except for new lessons and drafts away from the lesson. |
| Quiz and video content in the editor | NAV-03 | No frame shows these. |
| Empty unit | NAV-09 | |
| Row actions: rename, reorder, add menu, add unit | NAV-08 | `4051:17625` shows similar controls at page scale. |
| Unit row: selecting the name expands and never collapses. The arrow is its own control and is the only way to collapse by pointer. | NAV-01, NAV-02 | Decided during prototype review. `3165:15612` shows the arrow but no behaviour. |
| Full title tooltip | NAV-10 | |
| Attachment chip: uploading, processing, failed, unsupported | DOC-03 to DOC-11, URL-04 to URL-06 | Extends the Completed-only row in `3190:18388`. |
| Attach menu with URL field | DOC-01, URL-01, URL-02 | `3190:18388` formats copy and `3600:9459` URL row |
| Aurora messages: progress, error, notice, proposal, multi choice, Other, Skip, Change answer | CHAT, ASK, SED, LED, REC, CON | Extends `3154:13244` |
| Context chip, minimized panel, queue list | CHAT-07, NAV-04, REC-10 | |
| Lock banners, working elsewhere banner, offline, read only, collaboration banners | REC, CON, PERM | |
| "Aurora generated" label | AI-02, GEN-09 | |
| Toggle switch | PUB-01 | Colours from `3026:2859`, mapped to `Brand/600`. |

## Corrections to the frames

| Frame | Change |
| --- | --- |
| All AI flow frames | "Admin Mode" removed. Navigation uses the instructor version from `4074:7176`. |
| `3165:15612` | Counts come from the data: 3 Units, 6 Lessons, 2 Quizzes, 1 Video, 9 Items. "1.2 Fly Python Online" is now "1.2 Why Python?". The duplicated key feature is replaced. Data Structures has items. |
| `3154:13244` | The Clarify question is replaced with lesson editing questions. The duplicate "Add an Example" chip is gone. The pickers use this course's data. |
| `3795:5511` | Blocking is red and advisory amber, in separate groups. "Your changes were saved" is no longer a check, and is replaced by Learning objectives. The button is "Continue to publish", disabled with its reason. |
| `3190:18388` | The 5 step stepper is used, and missing statuses are added. |
| `3600:9459` | Its quiz subtitle and email placeholder are not used. |
| Lesson content frames | Lesson body text uses Text sm (14px) instead of Text xs (12px), because people read and write it at length. Subheadings use Text md semibold (16px) to stay above it. |
| Lesson content frames | The Python logo beside "What is Python?" is removed, so the lesson text takes the full width. Instructors add their own image from the + menu. |
| Course plan frames | Unit chevrons are swapped: up when a unit is open, down when it's closed. The frames show the reverse. |
| `3154:13244` | The quick action "Shorten more" is "Shorten", because it appears before anything has been shortened. |
| `3795:5511`, `3188:17126` | "Check your course" and "Review and publish" share one title style: Text lg semibold with a Text sm subtitle, in the same position. The frames differ in size and position. |
| Create a Quiz | The second "Points per questions" (%, 70) is labelled "Passing score", assumed to be a typo. "Enter questions" is "Enter question". The bottom Edit button is left out, because the open card is already editable and the pencil at the top collapses it. |

## New screens from feedback

| State | Scenario | Notes |
| --- | --- | --- |
| Aurora's suggested edit as a redline | SED-03 | The card takes the section's place. Added words are highlighted in brand blue and removed words are struck through. A brand gradient edge, a "Source" line, and Edit · Discard · Apply. Based on a reference the user supplied, not a frame. |
| Use Aurora's own knowledge (switch in Aurora's options) | AI-04 | Mirrors the "Allow Aurora to use its own trained sources" toggle in 3190:18388. When it's off and nothing is attached, Aurora asks for a source instead of adding material. Rewording still works. |
| Aurora panel restyle | FIRST-01, ASK-01, GEN-04, REC-02, DOC-03, SED-01 | Based on references the user supplied, in Assistiv tokens. Replies are plain text with a copy button, and the user's messages sit in a soft grey bubble. An empty panel shows a welcome with suggestions. Live work is one shimmering line with a timer, a thin progress bar and its steps, and it folds to "Worked for Ns" when done. Questions are cards with "Question 1 of 2", a "Choose one" tag and a full-width Submit answer. The composer is one card holding the context chip, files with upload progress, and a round send button, with a one-line disclaimer underneath. Ask about this shows a quoted selection and a rounded field. |
| Nothing to validate | VAL-11 | Validate stays available on an empty course. No checks run: the page says why and offers Add content. |

## Layout changes from the frames

| Area | Change |
| --- | --- |
| Page header | Same layout as the frames, a step smaller: 28px circles, 48px lines and 12px between rows. "Admin Mode" is replaced by the save status. |
| Icons and buttons | Icons are 16px inside controls and 20px leading a row. Standard buttons are 32px tall instead of 36px. |
| Images | New: Image in the + menu, with a choice of Below the text or Beside the text. Options float over the image: move, replace, remove. No frame exists for any of this. |

## Tokens added

- `--red-100` to `--red-800`: read from the library's `Red` primitives. The library search found no variables named `error` or `success`.
- `--sds-color-yellow-100`: from `3012:2175`.
- `--shadow-overlay` and `--frame-backdrop`: for dialogs and menus. **No frame defines these, so they are new values for the designer to confirm.**

## UI references used

These are followed for behaviour only, and are drawn with the Assistiv design system.

| Reference | Scenarios | Note |
| --- | --- | --- |
| Notion-style selection menu | SED-01 | Select text and choose Ask Aurora, or press Ctrl/Cmd+K. Selecting doesn't move the cursor, so typing still replaces the text. |
| Cursor-style before and after review | SED-04, SED-06, SED-07, LED-04, LED-07, FIX-04, CON-04 | Heavy rewrites show separate Before and After passages, because a word by word diff is unreadable. |
| In-place editing status | SED-02, LED-03, GEN-04 | **Its grey placeholder bars are not used, because the brief bans skeleton loaders.** The existing text stays visible with named steps. |
| "Updated by AI" finished state | GEN-05, LED-05 | Replaced for single changes by the result under the selection. Still used where several items change. |
| Result under the selection, with "Tell AI what to do next" and "1 of 2" | SED-03, SED-05, SED-07 | Apply, Insert below, Continue writing, Make longer, Simplify, Try again and Discard all work. Aurora rewrites the whole highlighted section, not only the selected words, so "Replace selection" is called Apply and the draft says what it replaces. |

## Assumptions to confirm

- The course is **Python Basics, #P102**. `3188:17126` pairs that name with #P102 in one place and uses #502 in another.
- Courses go unit → item, with no module level. `4074:7176` and `4051:17625` show a sub-unit level whose rows repeat placeholder text.
- Aurora's edits wait for approval, and one request runs at a time, with the rest queued.
