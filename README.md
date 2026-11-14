# Web Flow Explorer

A tiny interactive tool that teaches how a web app works by following one request from the browser, through the API and server code, into the database and back.

The learner predicts what will happen, steps through the flow, and then opens **Break it** to send bad input and see real error responses.

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

- Four lessons: Add a task, Load the list, When things fail, Who talks to the database.
- The browser action starts the experience: if no guess is locked, Add (or Reload in Lesson 2) highlights the prediction and focuses the first option. Locking in then runs the request automatically.
- Seven-step (or shorter) walkthroughs with an active card, highlighted server line, database query and live JSON response.
- A collapsible Break it panel with real 400, 404, server-off and direct-database failure cases.
- Keyboard-reachable controls and an `aria-live` announcement of the active box.

There is no backend, API call or real database. A small fake server in `src/engine/server.ts` takes a request object and returns a response object, so every status code is produced by the same logic the UI displays.

## Structure

```
src/
  App.svelte                 wires the layout and the player together
  app.css                    one plain CSS file for the whole app
  engine/
    types.ts                 lesson, scenario and step shapes
    server.ts                fake in-memory HTTP server and database writes
    view.ts                  turns a step plus a server run into card views
    scenarios.ts             shared step scripts for POST, GET and failures
    player.svelte.ts         the single player store
  lessons/
    lesson1.ts ... lesson4.ts
    index.ts
  components/
    Browser.svelte
    ApiRoute.svelte
    ServerCode.svelte
    Database.svelte
    PredictionPanel.svelte
    StepControls.svelte
    BreakItPanel.svelte
    Card.svelte
    FlowArrow.svelte
```

A lesson is data: a request, a starting table, the code shown in the server card, a prediction, a main scenario and break-it scenarios. The steps are shared scripts in `engine/scenarios.ts`. The generic player renders any lesson; no component knows which lesson is active.

### Adding a lesson

1. Add a `Lesson` object in `src/lessons/`, reusing step scripts from `engine/scenarios.ts` where possible.
2. Export it from `src/lessons/index.ts`.
3. If the lesson needs a new failure shape, add a step script and a scenario, not a new component.

The UI should stay lesson-agnostic. If a lesson needs custom UI code, the data shape needs to grow instead.

## Design decisions

- The visual direction follows the supplied `First Screen` mockup: warm off-white background, Inter and JetBrains Mono, blue accent, rounded cards and a subtle glow on the active card.
- The mockup's Back button and segmented progress bar are included.
- Break it is expanded by default but still collapsible, matching the mockup's bottom row.
- Break-it scenarios are locked until the learner locks in a prediction, so the predict-before-reveal rule is enforced.
- Clicking Add (or Reload in Lesson 2) without a locked guess highlights the prediction and focuses the first option. Locking in starts the request and returns focus to the flow; locking in manually leaves the learner in control of Step.
- The lock button is never a dead control: pressing it without an answer shows “Choose an answer first.”
- Returning from a break-it case restores the main flow at the step and title where the learner left it.
- Reset returns the whole lesson to its starting state and unlocks the prediction again.
