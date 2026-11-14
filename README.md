# Web Flow Explorer

A tiny interactive tool that teaches how a web app works by following one request from the browser, through the API and server code, into the database and back.

The main lesson gives the learner a real request composer. They choose a method, path and JSON body and send it. The walkthrough is generated from what the fake server actually did. The remaining lessons keep their scripted walkthroughs and **Break it** cases, and a final refresh test shows why the backend and database exist.

The layout separates the **client/browser** (blue), **server/backend** (ink) and **database** (amber) into three stacked zones, with labelled HTTP and database boundaries. Technical terms have an info icon that opens a plain-language explanation; the icons are keyboard reachable.

Every lesson also has a collapsible **Ask a tutor** panel. It builds a ready-to-copy prompt from the lesson state — no AI call or backend — and lets the learner review it before copying.

Prediction and lock-in UI is currently hidden behind `SHOW_PREDICTIONS = false`; Add, Reload, Send and Refresh run immediately. See [Prediction UI](#prediction-ui).

## Classic and Explorer

The app has two experience modes, selected from the quiet **Classic / Explorer** control in the top bar:

- **Classic** is the original five-lesson flow. Its components, lesson data and styles are unchanged.
- **Explorer** is the new v2 walkthrough for adding a task. It starts inside the app, shrinks the app into an anchor beside the explanation, and then opens the wire details for one step at a time. Use the depth control or keys `1`, `2` and `3`; `Esc` moves back one depth.

The mode is stored in the URL hash (`#classic` or `#explorer`) and in `localStorage`, falling back to Classic when storage is unavailable. Explorer is the default for new visitors; Classic remains available from the toggle and at `#classic`.

The v2 prompt preview still uses the shared tutor engine: `buildSnapshot()` and `buildPrompt()` build the prompt; v2 only supplies the current story step, request, response and evidence. `tests/v2.test.mjs` covers the five-step story, step-3 and step-4 evidence, title validation and the step-specific tutor prompt.

## Run it

```bash
npm install
npm run dev
```

Run the engine tests:

```bash
npm test
```

The tests use Node's built-in test runner; there are no test dependencies. Build a static copy:

```bash
npm run build
npm run preview
```

The build uses a relative base (`base: './'`), so the `dist/` folder can be hosted at the root of a domain or under a GitHub Pages project path without changes.

## Deploy to GitHub Pages

The workflow in `.github/workflows/deploy.yml` builds the app and publishes `dist/` on every push to `main`, or when run manually from the Actions tab.

1. Push the repo to GitHub.
2. Open the repo's **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Push to `main`, or run **Deploy to GitHub Pages** from the **Actions** tab.

The first deployment can take a minute. The site will be available at `https://<owner>.github.io/web-dev-explorer/`.

## What is in version one

- Five lessons: Add a task, Load the list, When things fail, Who talks to the database, and What survives a refresh?
- The UI is split into three stacked zones: **Client / browser** (the composer and app UI), **Server / backend** (the API router and server handler) and **Database** (the tasks table). The HTTP request/response boundary and the server-only database connection are labelled between them.
- Lesson 1 uses the request composer: method (GET/POST/DELETE), path, JSON body, and Send. An Endpoint line shows the effective method and URL as the learner edits.
- The composer walkthrough auto-plays from the real response at 2 seconds per step. Step and Back pause it for slow-motion inspection.
- Technical terms have info icons: the client, server and database zones, each card, HTTP requests and responses, methods, paths, endpoints, JSON, refresh modes, and the result. Clicking or tapping an icon opens a short explanation in an accessible popover.
- A payload token follows the data through the pipeline, changing from form text to request JSON, a server object, a table row, response JSON and a list item.
- The composer presets cover a valid POST, GET, empty title, invalid JSON, unknown path and wrong method.
- Lessons 2–4 keep their scripted walkthroughs. Add or Reload starts the request immediately; prediction UI is hidden.
- Seven-step (or shorter) walkthroughs with an active card, highlighted server line, database query and live JSON response.
- A collapsible Break it panel on the scripted lessons, with 400, 404, server-off and direct-database cases.
- The refresh test has two modes: **Browser only** and **Through the API and database**. The learner adds tasks, then presses Refresh; browser-only tasks vanish, while API-backed tasks reload with GET /tasks.
- The refresh test uses the same zone model. The browser app is in the client zone; the server request log and the persisted tasks table are separate Server and Database cards. Browser-only mode shows the server and database zones as unused instead of hiding the distinction.
- API mode shows the persisted database rows and every POST/GET, so the reload is visibly backed by data rather than a cached list.
- The **Ask a tutor** panel offers three prompt choices, an optional one-line question, and term buttons for terms visible on the current screen. It shows a read-only prompt preview and a **Copy prompt** button.
- Copy uses `navigator.clipboard` when available. If the clipboard is unavailable, it selects the preview text and announces “Prompt selected. Press Ctrl/Cmd+C.” The copy confirmation is announced through an `aria-live` status.
- Keyboard-reachable controls, keyboard-reachable info icons, and an `aria-live` announcement of the active box, final result and copy status.

## Ask a tutor

The tutor panel is a prompt builder, not an AI feature. It fills a fixed template from the current lesson state and never sends anything over the network.

- `buildSnapshot(input)` in `src/engine/tutor.ts` is a pure function. Because the app state uses Svelte runes, the caller passes the current player/view/refresh values explicitly.
- `buildPrompt(snapshot, choice, userText)` is a pure function. It emits the tutor role, relevant context, the chosen question, and the instructions in that order.
- `src/engine/tutorPrompt.json` holds the prompt wording and panel labels. Tuning roles, question text, instructions, status labels or outcome wording does not require changing builder code.
- The context is filtered: database rows are omitted when the request never reached the database, errors include their response body, successful response bodies are skipped when the database rows already show the same data, and term questions only include the matching detail.
- `termsForSnapshot(snapshot)` derives the term buttons from what is visible. The composer adds method, path, endpoint, request body and JSON.
- The preview is read-only. Copy uses `navigator.clipboard`; if it is unavailable, the panel selects the preview text so the learner can use Ctrl/Cmd+C. Both outcomes are announced in an `aria-live` status.
- `tests/tutor.test.mjs` covers composer success, validation failure, 404, term filtering, refresh state, missing predictions, user text and section order.

## Prediction UI

Prediction and lock-in are still implemented, but hidden with `SHOW_PREDICTIONS = false` in `src/engine/features.ts`. With the flag off, every Add, Reload, Send and Refresh runs immediately and no prediction or lock-in controls are rendered. Set the flag to `true` to restore the status prediction, the scripted lock-in gate and the refresh-test prediction.

There is no backend, API call or real database. A small fake server in `src/engine/server.ts` takes a request object and returns a response object, so every status code is produced by the same logic the UI displays.

### Fake server contract

`handleRequest({ method, path, body }, tasks, options)` interprets a real wire request and returns both the response and a trace of how far it got:

- `GET /tasks` → `200` with the task array
- `POST /tasks` with a valid title → `201` with the new row
- `POST /tasks` with an empty, missing or non-string title → `400` validation error
- `POST /tasks` with invalid or empty JSON → `400` parse error
- unknown path → `404`
- known path with an unsupported method (for example `DELETE /tasks`) → `405`
- server off → no response and a `timeout` failure

The trace records `matched`, `methodAllowed`, `parsed`, `failure` and `reached.api/server/database`, so the animation can stop at the layer where the request actually failed. `simulate(requestSpec, tasks, options)` adapts the scripted lesson data onto the same server.

`stepsForRun(run)` in `src/engine/composer.ts` turns that trace into the composer walkthrough. A 404 or 405 gets route and response steps only; invalid JSON and validation stop in server code; only a successful write gets a database step.

### Payload shapes

Each composer step can carry a `Payload` with a target box, a shape, a label, a value and one plain sentence. The successful create flow is:

1. `Form field text` in the browser
2. `JSON string in the request` in the API card
3. `JavaScript object on the server` in the server card
4. `Row in the table` in the database card
5. `JSON string in the response` in the API card
6. `List item in the browser` in the browser card

A GET starts its payload at the database rows and returns the response array and list items. A failure stops the token at the layer that failed; it never shows a row or response payload that did not happen.

`PayloadToken.svelte` slides and fades the token into the matching card over 160ms. When `prefers-reduced-motion: reduce` is set, the duration is 0.

## Structure

```
src/
  App.svelte                 Classic: wires the layout and the player together
  AppRoot.svelte             switches Classic and Explorer, hash + storage
  app.css                    one plain CSS file for the whole app
  v2/
    App.svelte               Explorer shell, depth and step state
    v2.css                   Explorer layout and components
    content.ts               Explorer copy, five-step story, checklists
    evidence.ts              pure per-step evidence builder
    tutor.ts                 Explorer adapter over the shared tutor engine
    VersionToggle.svelte     Classic / Explorer control and menu
    TaskApp.svelte           full browser app and compact anchor
    StoryCard.svelte         five-step Behind the scenes card
    StepRail.svelte          per-step rail for Under the hood
    EvidenceCard.svelte      request / response / code / table receipts
    TutorCard.svelte         prompt preview, edit and copy
  engine/
    types.ts                 lesson, scenario, step and composer shapes
    server.ts                fake HTTP server, response contract and trace
    composer.ts              status labels, composer code, run-to-step script, result copy
    view.ts                  turns a step plus a server run into card views
    scenarios.ts             shared step scripts for the scripted lessons
    player.svelte.ts         player and composer store
    refresh.svelte.ts        refresh-test state, fake POST/GET calls and request log
    features.ts              temporary feature flags (predictions are currently off)
    zones.ts                 shared zone and boundary teaching copy
    tutor.ts                 pure snapshot and prompt builders, current-screen terms
    tutorPrompt.json         prompt wording and tutor-panel labels
  lessons/
    lesson1.ts ... lesson5.ts
    index.ts
  components/
    Browser.svelte
    ApiRoute.svelte
    ServerCode.svelte
    Database.svelte
    RequestComposer.svelte
    ComposerFields.svelte
    StatusPrediction.svelte
    ComposerPresets.svelte
    ResultPanel.svelte
    PayloadToken.svelte
    PredictionPanel.svelte
    StepControls.svelte
    BreakItPanel.svelte
    RefreshTest.svelte
    RefreshBrowser.svelte
    RefreshServer.svelte
    RefreshDatabase.svelte
    RefreshPrediction.svelte
    RefreshResult.svelte
    InfoTip.svelte
    TutorPanel.svelte
    Zone.svelte
    ZoneBoundary.svelte
    Card.svelte
    FlowArrow.svelte
tests/
  tutor.test.mjs
  v2.test.mjs
```

A scripted lesson is data: a request, a starting table, the code shown in the server card, a prediction, a main scenario and break-it scenarios. Lesson 1 also has a `composer` config with its default method, path, body and presets. Lesson 5 has a `refresh` config with its two modes, per-mode predictions and two-sentence explanations. The generated composer steps and refresh-test state are engine logic, not hand-written UI.

### Adding a lesson

1. Add a `Lesson` object in `src/lessons/`, reusing step scripts from `engine/scenarios.ts` where possible.
2. Export it from `src/lessons/index.ts`.
3. If the lesson needs a new failure shape, add a step script and a scenario, not a new component.
4. For a composer lesson, add a `composer` config with defaults and presets. The shared `handleRequest` and `stepsForRun` do the rest.
5. For a refresh-test lesson, add a `refresh` config with modes, predictions and explanations. `RefreshTestStore` and the refresh components do the rest.

The UI should stay lesson-agnostic. If a lesson needs custom UI code, the data shape needs to grow instead.

## Design decisions

- The visual direction follows the supplied `First Screen` mockup: warm off-white background, Inter and JetBrains Mono, blue accent, rounded cards and a subtle glow on the active card.
- The page is organised as three stacked zones with subtle accents: client/browser (blue), server/backend (ink) and database (amber). The composer sits in the client zone beside the browser app; the API router and server handler share the server zone; the tasks table sits alone in the database zone.
- The boundaries are explicit teaching moments: **HTTP request / response** between client and server, and **Database connection · server only** between server and database.
- Technical terms use a small info icon that opens a native popover. The popover is in the top layer, so it is never clipped by a card; it works with mouse, touch and keyboard, and closes with Escape or the Close button.
- The database card is called **Tasks table** so it is distinct from the **Database** zone, both visually and as an accessible landmark.
- Lesson 1 puts the composer inside the client zone, beside the browser app, so the learner starts by sending a request while seeing both client-side pieces together.
- Ask a tutor is local prompt assembly: no AI service, no API call, no prefilled chat links. The preview is part of the lesson, so the learner sees the context before copying.
- The prompt builder is pure and testable. The component only supplies the current snapshot, choice, term and optional user text.
- The term picker is deliberately scoped to the current screen rather than a global glossary. Terms are buttons, not automatic links, so choosing one is a clear action.
- Copying is a browser-only convenience. The fallback keeps the feature usable in insecure or restricted contexts by selecting the prompt text instead of failing silently.
- When `SHOW_PREDICTIONS` is enabled, the status prediction is required before Send. Pressing Send without one shows “Choose the status you expect first.” and focuses the first option.
- The composer auto-plays at 2 seconds per step. Pressing Step or Back pauses auto-play and switches to manual inspection.
- The payload token is rendered in the card for the layer that currently owns the data, so it visibly crosses from browser to API to server to database and back.
- The payload transition is a short slide/fade. Reduced-motion users get an instant switch.
- Composer presets are lesson data, not hand-written buttons in the UI.
- The refresh test is a separate state machine because it is about persistence across requests, not one request walkthrough. Switching modes resets the test and the simulated database.
- When predictions are enabled, the refresh test asks for a prediction before Refresh. The two-sentence explanation appears only after the reload, so the result is not spoiled.
- Browser-only mode shows the Server and Database cards as unused, with no request log or rows. API mode splits the request log and the stored rows into separate Server and Database cards, so the learner can see that the reload goes through the backend to persisted data.
- Lessons 2–4 keep the mockup's Back button, segmented progress bar and Break it panel.
- When predictions are enabled, scripted break-it scenarios are locked until the learner locks in a prediction, so the predict-before-reveal rule is enforced.
- When predictions are enabled, clicking Add (or Reload in Lesson 2) without a locked guess highlights the prediction and focuses the first option. Locking in starts the request and returns focus to the flow; locking in manually leaves the learner in control of Step.
- When predictions are enabled, the lock button is never a dead control: pressing it without an answer shows “Choose an answer first.”
- Returning from a break-it case restores the main flow at the step and title where the learner left it.
- Reset returns the whole lesson to its starting state, clears the composer result and unlocks the prediction again.
