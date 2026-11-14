# Web Flow Explorer

A tiny interactive tool that teaches how a web app works by following one request from the browser, through the API and server code, into the database and back.

The main lesson gives the learner a real request composer. They choose a method, path and JSON body, predict the status code, and send it. The walkthrough is generated from what the fake server actually did. The remaining lessons keep their scripted walkthroughs and **Break it** cases, and a final refresh test shows why the backend and database exist.

## Run it

```bash
npm install
npm run dev
```

Build a static copy:

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
- Lesson 1 uses the request composer: method (GET/POST/DELETE), path, JSON body, a required status prediction, and Send.
- The composer walkthrough auto-plays from the real response. Step and Back pause it for slow-motion inspection.
- A payload token follows the data through the pipeline, changing from form text to request JSON, a server object, a table row, response JSON and a list item.
- The composer presets cover a valid POST, GET, empty title, invalid JSON, unknown path and wrong method.
- Lessons 2–4 keep their scripted walkthroughs. Their browser action still highlights the prediction, and locking in starts the request.
- Seven-step (or shorter) walkthroughs with an active card, highlighted server line, database query and live JSON response.
- A collapsible Break it panel on the scripted lessons, with 400, 404, server-off and direct-database cases.
- The refresh test has two modes: **Browser only** and **Through the API and database**. The learner adds tasks, predicts what survives, then presses Refresh; browser-only tasks vanish, while API-backed tasks reload with GET /tasks.
- The API mode shows the persisted database rows and a request log, so the reload is visibly backed by data rather than a cached list.
- Keyboard-reachable controls and an `aria-live` announcement of the active box and final result.

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
  App.svelte                 wires the layout and the player together
  app.css                    one plain CSS file for the whole app
  engine/
    types.ts                 lesson, scenario, step and composer shapes
    server.ts                fake HTTP server, response contract and trace
    composer.ts              status labels, composer code, run-to-step script, result copy
    view.ts                  turns a step plus a server run into card views
    scenarios.ts             shared step scripts for the scripted lessons
    player.svelte.ts         player and composer store
    refresh.svelte.ts        refresh-test state, fake POST/GET calls and request log
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
    RefreshBackend.svelte
    RefreshPrediction.svelte
    RefreshResult.svelte
    Card.svelte
    FlowArrow.svelte
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
- Lesson 1 puts the composer above the flow so the learner starts by sending a request, not by pressing a dead button.
- The status prediction is required before Send. Pressing Send without one shows “Choose the status you expect first.” and focuses the first option.
- The composer auto-plays at 800ms per step. Pressing Step or Back pauses auto-play and switches to manual inspection.
- The payload token is rendered in the card for the layer that currently owns the data, so it visibly crosses from browser to API to server to database and back.
- The payload transition is a short slide/fade. Reduced-motion users get an instant switch.
- Composer presets are lesson data, not hand-written buttons in the UI.
- The refresh test is a separate state machine because it is about persistence across requests, not one request walkthrough. Switching modes resets the test and the simulated database.
- The refresh test makes the learner predict before Refresh. The two-sentence explanation appears only after the reload, so the result is not spoiled.
- Browser-only mode has no backend card controls and no request log. API mode shows the stored rows and every POST/GET, including the GET /tasks reload.
- Lessons 2–4 keep the mockup's Back button, segmented progress bar and Break it panel.
- Scripted break-it scenarios are locked until the learner locks in a prediction, so the predict-before-reveal rule is enforced.
- Clicking Add (or Reload in Lesson 2) without a locked guess highlights the prediction and focuses the first option. Locking in starts the request and returns focus to the flow; locking in manually leaves the learner in control of Step.
- The lock button is never a dead control: pressing it without an answer shows “Choose an answer first.”
- Returning from a break-it case restores the main flow at the step and title where the learner left it.
- Reset returns the whole lesson to its starting state, clears the composer result and unlocks the prediction again.
