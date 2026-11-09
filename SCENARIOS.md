# Scenarios

Generated from `src/aurora/scenarios/registry.ts`. Run `npm run docs:scenarios` after changing it.

**148 of 148 built.** Open any scenario at `http://127.0.0.1:5173/?scenario=ID`, or from the switcher (Alt+S).

A source of `gap` means no Figma frame covers it: see `GAPS.md`. Unbuilt scenarios load the base course only.

## NAV: Navigate and select

| ID | Scenario | Status | How to trigger | What you should see | Figma source | UI reference |
| --- | --- | --- | --- | --- | --- | --- |
| NAV-01 | Select a unit or item | Built | Select any item in the course plan. | The item is highlighted and its content opens on the right. Selecting a unit expands it, and it stays expanded. | 3165:15612 | None |
| NAV-02 | Expand and collapse units | Built | Select the Data Structures name twice, then select its arrow. | Data Structures starts collapsed. Selecting its name expands it, and selecting the name again keeps it expanded. The arrow collapses it. | 3165:15612 | None |
| NAV-03 | Switch between content items | Built | Move between items, including the quiz and the video. | Starts on 2.2 Functions. Each item type shows its own content, and tabs go back to Content. The quiz uses the Create a Quiz layout: question cards, Add Options, Explanation, Generate with Aurora and Quiz settings. | 3165:15612 | None |
| NAV-04 | Open and close Aurora | Built | Select Edit, then close the panel with X or Escape. | Edit opens Aurora. The course plan swaps for lesson pickers as in Figma 3154:13244, then it closes. | 3165:15612 | None |
| NAV-05 | Return to the same editing position after closing Aurora | Built | Tab to Edit and open it. Close it again. | You're on the same item and tab, and focus returns to the control you opened Aurora from. | 3165:15612 | None |
| NAV-06 | Fix jumps to the exact item with the finding in view | Built | Select Fix on the broken video link. | The exact item opens, the block is scrolled into view and flagged, and Aurora opens with the explanation. | 3165:15612 | None |
| NAV-07 | Aurora panel and its conversation stay while switching items | Built | Change the item with the lesson pickers. | The panel stays open, the conversation stays, and the context chip updates. | 3165:15612 | None |
| NAV-08 | Add, rename, reorder (drag) and delete units and items; confirm delete; undo | Built | Use Add Lessons, Rename and the trash icon. Drag a row, or press Alt+Up or Alt+Down. Delete asks first, then Undo restores it. | The tree and counts update. Delete needs confirming and can be undone. | 3165:15612 | None |
| NAV-09 | Empty unit | Built | Look at the Data Structures unit. | The expanded unit says it has no items, and the counts show 6 items. | gap | None |
| NAV-10 | Very long titles truncate with a full title on hover and focus | Built | Hover over a long title, or tab to it. | Long titles end with an ellipsis, and the full title appears on hover and on keyboard focus. | gap | None |

## EDIT: Manual editing

| ID | Scenario | Status | How to trigger | What you should see | Figma source | UI reference |
| --- | --- | --- | --- | --- | --- | --- |
| EDIT-01 | Edit existing content | Built | Click the title or any text in the lesson and type. Press Enter in a paragraph, then type / on the empty line. | There's no edit mode and no form boxes. The text is edited where it sits. Enter starts a new block, and / or the + in the margin adds a list, code, video or question. | 3165:15612 | None |
| EDIT-02 | Save succeeds | Built | Click any text and type. | The status at the top goes from Saving to Saved. | 3165:15612 | None |
| EDIT-03 | Save fails, with retry | Built | Click any text and type, then select Retry in the error banner. | A banner says the save failed and your text stays. Retry saves it. | 3165:15612 | None |
| EDIT-04 | Leave with unsaved changes | Built | Select another item in the course plan. | A dialog asks you to keep editing, discard, or save and leave. | 3165:15612 | None |
| EDIT-05 | Undo and redo | Built | Select Undo, then Redo, or press Ctrl/Cmd+Z. | Starts with one change made. Undo restores the heading, Redo brings the change back, and each button is disabled when there's nothing to do. | gap | None |
| EDIT-06 | Autosave states: saving, saved, offline | Built | Type in the lesson. Then turn on Simulate offline in the switcher, type again, and reconnect. | The status goes Saving, Saved, Saved on this device, then Saving and Saved again. | 3165:15612 | None |
| EDIT-07 | Required field left empty | Built | Look at the empty text under the heading, then type in it. | A required message shows until the text is filled in, and validation would block publishing. | 3165:15612 | None |
| EDIT-08 | Paste formatted text from Word or Google Docs | Built | Copy formatted text from Word or Google Docs and paste it into the lesson text. | The words and bullets arrive without the fonts and colours, and a message says the formatting was removed. | 3165:15612 | None |
| EDIT-09 | Replace media inside content | Built | Hover the lesson image and select Replace image or Remove image. On the video item, click the link and change it. | The media changes and the status saves. | 3165:15612 | None |

## CHAT: Conversation only

| ID | Scenario | Status | How to trigger | What you should see | Figma source | UI reference |
| --- | --- | --- | --- | --- | --- | --- |
| CHAT-01 | Ask Aurora a question | Built | Send the prefilled question. | Aurora streams an answer. | 3154:13244 | None |
| CHAT-02 | Explanation that does not change the course | Built | Send the prefilled question. | Aurora explains and says the course hasn't changed. No proposal appears. | 3154:13244 | None |
| CHAT-03 | Follow up question | Built | Send the prefilled follow up. | The answer builds on the previous one. | 3154:13244 | None |
| CHAT-04 | Response fails | Built | Send the prefilled question. | An error message with Retry appears, and the course is unchanged. | 3154:13244 | None |
| CHAT-05 | Retry | Built | Select Retry. | Aurora answers this time. | 3154:13244 | None |
| CHAT-06 | Streamed response with Stop | Built | Select Stop while the answer is streaming. | The text stops where it was and is marked Stopped. | 3154:13244 | None |
| CHAT-07 | Context chip shows what Aurora is looking at | Built | Change the item with the pickers. | The chip under the header says Looking at, followed by the current item. | 3154:13244 | None |
| CHAT-08 | Request outside Aurora's scope, or something it can't do | Built | Send the prefilled request. | Aurora says it can't do that, and explains what it can do. | 3154:13244 | None |
| CHAT-09 | History kept after closing and reopening | Built | Select Edit, close it, then open it again. | The earlier conversation is still there each time. | 3154:13244 | None |

## ASK: Aurora questions

| ID | Scenario | Status | How to trigger | What you should see | Figma source | UI reference |
| --- | --- | --- | --- | --- | --- | --- |
| ASK-01 | Answer a single choice question | Built | Choose one option. | Only one option can be selected, and Submit becomes available. | 3154:13244 | None |
| ASK-02 | Select multiple answers where appropriate | Built | Tick more than one option. | Several options stay selected. | 3154:13244 | None |
| ASK-03 | Submit | Built | Select Submit. | Your answer appears in the chat and Aurora continues. | 3154:13244 | None |
| ASK-04 | Revise an answer | Built | Select Change answer, pick another option and submit. | The card reopens with your earlier answer, and Aurora uses the new one. | 3154:13244 | None |
| ASK-05 | Aurora clarifies an ambiguous request | Built | Send the vague request. | Aurora asks what to focus on before changing anything. | 3154:13244 | None |
| ASK-06 | Skip a question | Built | Select Skip. | Aurora says it will use a default and carries on. | 3154:13244 | None |
| ASK-07 | "Other" option with free text | Built | Type your own answer, then Submit. | Submit stays disabled until there is text, then your words appear as the answer. | 3154:13244 | None |
| ASK-08 | Change an answer after Aurora already acted on it | Built | Select Change answer on the question. | A note warns that changing it replaces the current draft. Submitting replaces it with a new one. | 3154:13244 | None |

## SED: Small Aurora edit

| ID | Scenario | Status | How to trigger | What you should see | Figma source | UI reference |
| --- | --- | --- | --- | --- | --- | --- |
| SED-01 | Request a change to selected content | Built | Select some text in the lesson and choose Ask Aurora, or press Ctrl/Cmd+K. Pick a quick action or type a request. | Selecting text keeps your cursor, so you can still type over it. Ask Aurora opens a menu with a request field and quick actions. Your request appears in the chat. | 3154:13244 | Selection menu: select text, then ask Aurora or pick a quick action |
| SED-02 | Local processing on that item | Built | Watch the block while Aurora works. | The block is highlighted with an Aurora is editing pill and named steps. The text stays readable and there are no skeleton bars. | 3154:13244 | In-place status: highlighted block with an editing pill, no skeleton bars |
| SED-03 | Completed change | Built | Look at the highlighted block. | The original stays highlighted with Aurora's result under it, a field to tell Aurora what to do next, and Apply and Discard. More options are under the ⋯ button. | 3154:13244 | Finished state: the result under the highlighted original, with what to do next |
| SED-04 | Review what changed (diff) | Built | Read the review dialog. | Removed words are struck through and added words underlined, with Accept and Reject. | gap | Before and after view with accept and reject |
| SED-05 | Undo | Built | Select Undo in the chat or under the lesson. | The change is already applied. Undo restores the original and logs it. | 3154:13244 | Finished state: the result under the highlighted original, with what to do next |
| SED-06 | Request another revision | Built | Type feedback in the field on the draft and send. | Aurora drafts another version and marks the first as replaced. | 3154:13244 | Before and after view with accept and reject |
| SED-07 | Reject the change and keep the original | Built | Select Discard or Undo, then confirm. | The lesson shows your original and the proposal says Discarded. | 3154:13244 | Before and after view with accept and reject; Finished state: the result under the highlighted original, with what to do next |
| SED-08 | Change applied to the wrong part; correct the scope | Built | Select ⋯, then Wrong part?, and choose What is Python?. | Aurora puts that part back and redoes the change on the section you chose. | 3154:13244 | None |

## LED: Larger Aurora edit

| ID | Scenario | Status | How to trigger | What you should see | Figma source | UI reference |
| --- | --- | --- | --- | --- | --- | --- |
| LED-01 | Request changes across several items | Built | Send the prefilled request. | Aurora accepts a change across several items and asks which ones. | 3154:13244 | None |
| LED-02 | Aurora clarifies the affected scope | Built | Choose units and Submit. | Only the units you chose are changed. | 3154:13244 | None |
| LED-03 | Aurora prepares a proposed revision | Built | Watch the panel. | Named steps complete in order, and affected blocks show the editing pill. | 3154:13244 | In-place status: highlighted block with an editing pill, no skeleton bars |
| LED-04 | Review the proposal | Built | Read each item in the dialog. | Every affected item has its own before and after, with Accept and Reject. | gap | Before and after view with accept and reject |
| LED-05 | Apply all | Built | Select Apply 3 changes. | All 3 items change, a message offers Undo. | 3154:13244 | None |
| LED-06 | Discard | Built | Select Discard all and confirm. | Nothing in the course changes. | 3154:13244 | None |
| LED-07 | Partial apply: accept some items, reject others | Built | Choose Accept or Reject per item, then Apply. | The button says Apply 2 of 3, and only accepted items change. | 3154:13244 | Before and after view with accept and reject |
| LED-08 | Proposal out of date because the instructor edited an affected item | Built | Look at the proposal in the chat. | It says it is out of date, Apply is disabled, and Update the proposal redrafts it. | 3154:13244 | None |
| LED-09 | Request too large; Aurora asks to narrow it | Built | Send the prefilled request. | Aurora says it is too much for one go and asks which part to start with. | 3154:13244 | None |

## DOC: Add a document

| ID | Scenario | Status | How to trigger | What you should see | Figma source | UI reference |
| --- | --- | --- | --- | --- | --- | --- |
| DOC-01 | Choose or upload a file | Built | Select Choose from your computer, or a sample file. | The menu lists formats and the 200 MB limit, and the file appears as a chip. | 3190:18388 | None |
| DOC-02 | Remove it before processing | Built | Select X on the chip while it uploads. | The upload stops and the chip goes away. | 3190:18388 | None |
| DOC-03 | Upload and processing states | Built | Watch the chip. | It moves through Uploading with a percentage, Processing, then Ready. | 3190:18388 | None |
| DOC-04 | Unsupported file type | Built | Look at the chip. | It says Unsupported and lists the formats that work. | 3190:18388 | None |
| DOC-05 | Upload failure | Built | Wait for the upload to stop. | The chip says Failed, with Retry and Cancel. | 3190:18388 | None |
| DOC-06 | Processing failure | Built | Wait for processing to stop. | The chip says Failed and explains the file uploaded but couldn't be read. | 3190:18388 | None |
| DOC-07 | Retry or cancel | Built | When it fails, select Retry or Cancel. | Retry uploads it through to Ready. Cancel removes it. | 3190:18388 | None |
| DOC-08 | Several files at once | Built | Watch the chips. | Each file has its own status, and Aurora asks one question once all are ready. | 3190:18388 | None |
| DOC-09 | File too large | Built | Look at the chip. | It says Unsupported and explains the 200 MB limit. | 3190:18388 | None |
| DOC-10 | Duplicate file | Built | Read the message. | Aurora says the file is already attached and offers Use existing or Replace it. | 3190:18388 | None |
| DOC-11 | Scanned or password protected PDF with no readable text | Built | Wait for processing. Then attach the Password protected sample. | The chip explains there is no readable text and what to do. The password protected file gets its own explanation. | 3190:18388 | None |
| DOC-12 | Document unrelated to the course; Aurora flags it before using it | Built | Wait for it to finish. | Before using it, Aurora flags that it seems unrelated and asks to use or remove it. | 3190:18388 | None |
| DOC-13 | Remove an attachment later; ask whether to keep content generated from it | Built | Select X on the attachment. | A dialog asks whether to keep the content made from it. | 3190:18388 | None |

## URL: Add a video or link

| ID | Scenario | Status | How to trigger | What you should see | Figma source | UI reference |
| --- | --- | --- | --- | --- | --- | --- |
| URL-01 | Enter a URL | Built | Open attach, type a URL or pick a sample, then Add. | The link appears as a chip and is checked. | 3600:9459 | None |
| URL-02 | Correct an invalid URL | Built | Pick the sample, select Add, then correct it. | An inline error explains the problem and clears as you type. | 3600:9459 | None |
| URL-03 | Process an accessible resource | Built | Watch the chip. | It moves from Processing to Ready, then Aurora asks how to use it. | 3600:9459 | None |
| URL-04 | Inaccessible or unsupported resource | Built | Look at the chip. | It says Failed and that the link can't be opened. | 3600:9459 | None |
| URL-05 | Replace or remove it | Built | Select Replace link, or X. | Replace checks the new link in its place. X removes it. | 3600:9459 | None |
| URL-06 | Private link or one that needs a login | Built | Look at the chip. | It explains the link needs a login and what to do instead. | 3600:9459 | None |
| URL-07 | Video with no transcript or captions | Built | Read the note. | Aurora says there is no transcript and what it can still use. | 3600:9459 | None |
| URL-08 | Very long video; Aurora says what part it will use | Built | Read the note. | Aurora says it's 4 hours long and that it will use the first 30 minutes. | 3600:9459 | None |

## GEN: Generate from an attachment

| ID | Scenario | Status | How to trigger | What you should see | Figma source | UI reference |
| --- | --- | --- | --- | --- | --- | --- |
| GEN-01 | Specify how to use the attachment | Built | Choose how to use the attachment. | Aurora asks before using it: new lesson, update the current item, or quiz. | 3012:2175 | None |
| GEN-02 | Generate a new item | Built | Select Submit, then Apply. | A new lesson is proposed, then added to the current unit and selected. | 3012:2175 | None |
| GEN-03 | Update an existing item | Built | Select Submit, then Apply. | A draft under the current section, applied only when you select Apply. | 3012:2175 | None |
| GEN-04 | Progress | Built | Watch the panel. | Named steps: Reading your document, Finding relevant sections, Drafting the content. | 3012:2175 | In-place status: highlighted block with an editing pill, no skeleton bars |
| GEN-05 | Inspect the result | Built | Read the proposal. | It shows the new content and its source before anything is added. | 3012:2175 | Finished state: the result under the highlighted original, with what to do next |
| GEN-06 | Undo the addition or change | Built | Select Undo in the chat. | The added lesson is removed and the counts go back. | 3012:2175 | None |
| GEN-07 | Attachment contradicts existing content | Built | Select Submit. | The proposal warns that the document contradicts the lesson. | 3012:2175 | None |
| GEN-08 | Generate a quiz from a document | Built | Send the prefilled request, then Apply. | Aurora drafts a quiz with correct answers set, added as a new item. | 3012:2175 | None |
| GEN-09 | Generated content shows its source attachment | Built | Look at the item title. | It carries an Aurora generated label naming the source file. | 3012:2175 | None |

## REC: Interrupt or recover

| ID | Scenario | Status | How to trigger | What you should see | Figma source | UI reference |
| --- | --- | --- | --- | --- | --- | --- |
| REC-01 | Cancel an operation | Built | Select Cancel in the panel. | Aurora stops and says nothing in your course changed. | 3012:2175 | None |
| REC-02 | Operation fails | Built | Wait, then select Retry. | The failed step is marked, an error says nothing changed, and Retry succeeds. | 3012:2175 | None |
| REC-03 | Operation takes longer than expected | Built | Wait, then choose Keep waiting or Cancel. | A message says this is taking longer than expected. | 3012:2175 | None |
| REC-04 | Partial completion | Built | Wait, then select Review. | The proposal says 2 of 3 items finished and names the one that failed. | 3012:2175 | None |
| REC-05 | Navigate away and return | Built | Close the panel, select another item, then use the banner to go back. | A banner says Aurora is still working elsewhere. The result is waiting when you return. | 3012:2175 | None |
| REC-06 | Recover without losing existing work | Built | Wait for it to fail. | Your own earlier edit to Key features is still in the lesson. | 3012:2175 | None |
| REC-07 | Connection drops mid operation | Built | Wait, then select Reconnect. | An offline banner appears, the operation shows Paused, and it resumes after reconnecting. | 3012:2175 | None |
| REC-08 | Session expires during processing | Built | Wait, then select Sign in again. | A dialog says your work is safe. After signing in, Aurora carries on. | 3012:2175 | None |
| REC-09 | Page refreshed while Aurora is working | Built | Refresh the page while Aurora works. | Aurora says it picked up where it left off, and finishes. | 3012:2175 | None |
| REC-10 | Several requests sent quickly; queue them with visible order | Built | Watch the numbered list above the composer. | Requests run one at a time in the order shown, and queued ones can be removed. | 3012:2175 | None |

## CON: Conflicting edits

| ID | Scenario | Status | How to trigger | What you should see | Figma source | UI reference |
| --- | --- | --- | --- | --- | --- | --- |
| CON-01 | Instructor edits an item while Aurora is processing the same item | Built | Select Edit anyway in the lock banner, then type in the block. | A lock banner says Aurora is updating this section, and you can choose to edit anyway. | gap | None |
| CON-02 | Conflict detected | Built | Read the notice. | Aurora says your edit and its draft overlap. | gap | None |
| CON-03 | Newer work preserved | Built | Read the lesson. | The lesson shows your newer text. Aurora's older draft didn't overwrite it. | gap | None |
| CON-04 | Review or retry Aurora's change | Built | Read the review, close it, then select Retry on your latest version. | You can compare Aurora's draft, then have it redraft from your latest text. | gap | Before and after view with accept and reject |
| CON-05 | Instructor deletes the item Aurora is editing | Built | Delete 1.1 while Aurora works. Close the panel first to reach the trash icon. | Aurora stops, discards its draft, and offers to restore the item. | gap | None |
| CON-06 | Two Aurora operations touch the same item | Built | Watch the second request. | It waits and says why. It then runs on the same block and replaces the first draft. | gap | None |

## VAL: Run validation

| ID | Scenario | Status | How to trigger | What you should see | Figma source | UI reference |
| --- | --- | --- | --- | --- | --- | --- |
| VAL-01 | Start checks | Built | Select Start checks. | The idle state explains the checks and offers Start checks. | 3795:5511 | None |
| VAL-02 | Checking status | Built | Watch the card. | Named checks complete in order with a progress bar. | 3795:5511 | None |
| VAL-03 | All checks pass | Built | Look at the results. | All checks passed, and Continue to publish is enabled. | 3795:5511 | None |
| VAL-04 | Advisory findings appear | Built | Look at Worth reviewing. | Amber advisories with Fix and Dismiss. Continue to publish stays enabled. | 3795:5511 | None |
| VAL-05 | Blocking issues appear | Built | Look at Must be fixed. | Red blocking issues with icon and text. Continue to publish is disabled, with the reason beside it. | 3795:5511 | None |
| VAL-06 | Some checks cannot complete | Built | Wait, then select Retry on Files and links. | That check says Couldn't finish and blocks publishing until it passes. | 3795:5511 | None |
| VAL-07 | Summary with count by severity | Built | Look at Results. | The count of blocking and advisory findings. | 3795:5511 | None |
| VAL-08 | Move between findings with previous and next | Built | Use Previous and Next in the bar. | Each one opens its item with the finding in view, with a position such as 1 of 5. | 3795:5511 | None |
| VAL-09 | Validation takes much longer than expected | Built | Wait, then choose Keep waiting or Cancel. | A message says it's taking much longer than usual. | 3795:5511 | None |
| VAL-10 | Rerun only affected checks | Built | Select Recheck 1 affected. | Only Files and links reruns. The other checks keep their results. | 3795:5511 | None |
| VAL-11 | Nothing to validate yet | Built | Select Add content. | With nothing in the course, no checks run. It says why and takes you back to the course plan. | 3795:5511 | None |

## FIX: Resolve a finding

| ID | Scenario | Status | How to trigger | What you should see | Figma source | UI reference |
| --- | --- | --- | --- | --- | --- | --- |
| FIX-01 | Select Fix | Built | Select Fix on any finding. | You go to the content with the finding in view. | 3795:5511 | None |
| FIX-02 | Open the exact content with Aurora's explanation | Built | Read the block and the panel. | The flag names the problem. Aurora explains it and suggests a correction. | 3795:5511 | None |
| FIX-03 | Edit manually | Built | Change the video link yourself, right in the flagged block. | The flagged block is editable in place, and the check then needs another run. | 3795:5511 | None |
| FIX-04 | Apply Aurora's suggested correction | Built | Select Apply on Aurora's correction. | A before and after, then the finding says Fixed. Recheck to confirm. | 3795:5511 | Before and after view with accept and reject |
| FIX-05 | Dismiss an advisory finding | Built | Select Dismiss on an advisory. | It moves to Dismissed, and a message says it will be in the publish summary. | 3795:5511 | None |
| FIX-06 | Recheck | Built | Select Recheck 1 affected. | The check reruns and the fixed finding disappears. | 3795:5511 | None |
| FIX-07 | A fix creates a new finding | Built | Select Apply, Back to checks, then Recheck. | The broken link clears, and a new advisory says the new video has no captions. | 3795:5511 | None |
| FIX-08 | Aurora's suggested correction fails | Built | Select Apply. | An error offers Retry and Edit it myself, and the course is unchanged. | 3795:5511 | None |
| FIX-09 | Try to dismiss a blocking issue | Built | Select Dismiss on a blocking issue. | It stays, and a message explains why it can't be dismissed. | 3795:5511 | None |
| FIX-10 | One fix resolves several findings | Built | Select Review, then Apply, then recheck. | One correction covers both places the link is used, and both findings clear. | 3795:5511 | None |
| FIX-11 | Dismissed advisory stays dismissed | Built | Select Recheck 1 affected. | The dismissed advisory doesn't come back after the recheck. | 3795:5511 | None |

## CHG: Change a checked course

| ID | Scenario | Status | How to trigger | What you should see | Figma source | UI reference |
| --- | --- | --- | --- | --- | --- | --- |
| CHG-01 | Edit content after validation | Built | Click the lesson text and change it, then select Validate. | Your edit saves as usual on a course that has already passed. | 3795:5511 | None |
| CHG-02 | Affected checks marked as needing another run | Built | Look at Course checks. | Lessons and activities says Needs another run. The other checks stay Ready. | 3795:5511 | None |
| CHG-03 | Recheck before publishing where required | Built | Look at the publish screen, then select Go to checks and recheck. | Publishing is blocked until the affected check has run again. | 3795:5511 | None |
| CHG-04 | Edit that affects no check; no recheck needed | Built | Look at Course checks. | A notes change touched no check, so everything stays Ready and no recheck is needed. | 3795:5511 | None |
| CHG-05 | Edit reverted to the checked version | Built | Select Undo, then Validate. | With the checked version restored, the checks go back to Ready without a recheck. | 3795:5511 | None |

## PUB: Publish

| ID | Scenario | Status | How to trigger | What you should see | Figma source | UI reference |
| --- | --- | --- | --- | --- | --- | --- |
| PUB-01 | Review the course summary and settings | Built | Read the summary and open each setting. | Counts come from the course, and each setting can be changed. | 3188:17126 | None |
| PUB-02 | Confirm publishing | Built | Read the dialog. | It says what goes live and to whom, with Cancel and Publish. | 3188:17126 | None |
| PUB-03 | Publishing succeeds | Built | Wait a moment. | Your course is published, with who can see it. | 3188:17126 | None |
| PUB-04 | Publishing fails | Built | Wait a moment. | An error says publishing failed, your draft is safe, and nothing went live. | 3188:17126 | None |
| PUB-05 | Retry while preserving the draft | Built | Select Retry. | It publishes this time, and the draft and settings are unchanged. | 3188:17126 | None |
| PUB-06 | Instructor without publish rights submits for approval | Built | Select Submit for approval. | A banner explains you lack publish rights, and the course goes to an admin. | 3188:17126 | None |
| PUB-07 | Summary lists dismissed advisories | Built | Look at the right column. | Dismissed advisories are listed in the summary. | 3188:17126 | None |
| PUB-08 | Edit a live course with enrolled learners, then republish | Built | Edit something, then Validate, Continue to publish, and Republish course. | A live header shows enrolled learners. Republish says what learners will notice, and their progress is kept. | 4051:17625, 4074:7176 | None |

## PERM: Permissions and collaboration

| ID | Scenario | Status | How to trigger | What you should see | Figma source | UI reference |
| --- | --- | --- | --- | --- | --- | --- |
| PERM-01 | Read only role opens the editor | Built | Open the editor and try Aurora. | A banner says view only. The text can't be edited, and plan actions and Validate are gone, but Ask Aurora still answers questions. | gap | None |
| PERM-02 | Another instructor is editing the same course | Built | Try to edit 1.2, then select 1.1. | 1.2 is read only while Jordan Lee edits it. Other items can still be edited. | gap | None |
| PERM-03 | Same course open in two tabs | Built | Select Use this tab. You can also open this URL in a second tab. | A banner warns the course is open elsewhere. A real second tab triggers it too. | gap | None |

## FIRST: First use and empty states

| ID | Scenario | Status | How to trigger | What you should see | Figma source | UI reference |
| --- | --- | --- | --- | --- | --- | --- |
| FIRST-01 | First time Aurora opens: what it can and can't do | Built | Read the card, then select Got it. | It says what Aurora can and can't do, including that it shows changes first. | gap | None |
| FIRST-02 | Course with no content yet | Built | Select Add your first unit, or Ask Aurora. | An empty state explains how to start, with counts of 0. | gap | None |

## AI: AI transparency

| ID | Scenario | Status | How to trigger | What you should see | Figma source | UI reference |
| --- | --- | --- | --- | --- | --- | --- |
| AI-02 | Label on Aurora generated content | Built | Look at the item title. | It carries an Aurora generated label. | gap | None |
| AI-04 | Aurora's own knowledge turned off | Built | Select Add examples, then Shorten. | Adding examples needs a source, so Aurora asks for one and offers to turn its own knowledge back on. Shortening still works, and its draft says it used your text only. | gap | None |

## A11Y: Accessibility

| ID | Scenario | Status | How to trigger | What you should see | Figma source | UI reference |
| --- | --- | --- | --- | --- | --- | --- |
| A11Y-01 | Focus moves into Aurora when it opens and back when it closes | Built | Tab to Edit and press Enter, then press Escape. | Focus moves into the composer on open and back to Edit on close. | gap | None |
| A11Y-02 | Progress and results announced through live regions | Built | Use a screen reader while Aurora works. | Each named step and the result are announced through a live region. | gap | None |
| A11Y-03 | Flags use icon and text, not color alone | Built | Look at the flag, or view it in greyscale. | Flags have a border, an icon and a text label. Diffs use underline and strikethrough too. | gap | None |
| A11Y-04 | Reduced motion respected for all animation | Built | Turn on reduced motion in your system settings. | Spinners stop, scrolling jumps, and streamed text appears at once. | gap | None |
| A11Y-05 | Full keyboard operation of the tree, editor, Aurora panel, dialogs and findings navigator | Built | Use the tree with arrow keys, Alt+arrows to reorder, Ctrl/Cmd+K for the selection menu, and Tab and Escape in dialogs. | Everything works without a mouse, and focus stays inside dialogs. | gap | None |

## RESP: Narrow screens

| ID | Scenario | Status | How to trigger | What you should see | Figma source | UI reference |
| --- | --- | --- | --- | --- | --- | --- |
| RESP-01 | Aurora panel becomes an overlay | Built | Make the window narrower than 1100px. | The Aurora panel becomes an overlay on the right. | gap | None |
| RESP-02 | Course plan sidebar collapses | Built | Make the window narrower than 900px, then select Show course plan. | The course plan collapses behind a button. | gap | None |
