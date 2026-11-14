import type { Box, Stage, Task } from '../engine/types'

export const V2_LESSON = {
  id: 'add-a-task',
  title: 'Add a task',
}
export const DEFAULT_TITLE = 'Buy milk'
export const INITIAL_TASKS: Task[] = [
  { id: 1, title: 'Write project notes' },
  { id: 2, title: 'Review pull request' },
]

export type V2Depth = 1 | 2 | 3

export const DEPTH_OPTIONS: Array<{ level: V2Depth; label: string }> = [
  { level: 1, label: 'Use the app' },
  { level: 2, label: 'Behind the scenes' },
  { level: 3, label: 'Under the hood' },
]

export type StoryActor = 'Browser' | 'Server' | 'Database'

export interface StoryStep {
  id: string
  short: string
  actor: StoryActor
  tone: 'browser' | 'server' | 'database'
  box: Box
  stage: Stage
  line?: number
  text: string
}

export function storySteps(title: string): StoryStep[] {
  const safeTitle = title.trim() || DEFAULT_TITLE
  return [
    {
      id: 'send',
      short: 'Browser sends request',
      actor: 'Browser',
      tone: 'browser',
      box: 'browser',
      stage: 'send',
      text: `You pressed Add. The browser packs "${safeTitle}" into a request and sends it to the server.`,
    },
    {
      id: 'route',
      short: 'Server finds the code',
      actor: 'Server',
      tone: 'server',
      box: 'api',
      stage: 'route',
      line: 1,
      text: 'The server receives it and finds which code should handle a request to add a task.',
    },
    {
      id: 'code',
      short: 'Server code saves it',
      actor: 'Server',
      tone: 'server',
      box: 'server',
      stage: 'code',
      line: 3,
      text: 'That code checks the task has a title, then asks the database to save it.',
    },
    {
      id: 'store',
      short: 'Database stores it',
      actor: 'Database',
      tone: 'database',
      box: 'database',
      stage: 'db',
      line: 3,
      text: 'The database stores the task as a new row, so it is still there tomorrow.',
    },
    {
      id: 'respond',
      short: 'Response comes back',
      actor: 'Server',
      tone: 'server',
      box: 'server',
      stage: 'respond',
      line: 4,
      text: 'The server sends back a response saying it worked, and the browser updates the list.',
    },
  ]
}

export const V2_CODE_LINES = [
  'const { title } = req.body;',
  'if (!title) return 400;',
  'const task = db.insert(title);',
  'res.status(201).json(task);',
]

export const TUTOR_QUESTIONS = [
  'Why does the browser send a request instead of saving the task itself?',
  'How does the server know which code should run for this request?',
  'Why does the server check the title before saving?',
  `At this step the server runs INSERT INTO tasks (title) VALUES ('{title}'); and the database creates row 3. How does the database choose the id?`,
  'How does the browser know the request worked?',
]

export const APP_COPY = {
  label: 'WHAT THE USER SEES',
  brand: 'Web Flow Explorer',
  context: 'Add a task',
  appTitle: 'My tasks',
  appSubtitle: 'Three things to do today.',
  inputLabel: 'New task',
  add: 'Add',
  emptyError: 'A task needs a title.',
  caption:
    'This is all a user ever sees. Everything else happens out of sight.',
  anchorCaption: 'The browser is waiting for a reply.',
  anchorDone: 'The list is up to date.',
  pending: 'Sending…',
  saved: 'Saved',
  browserUrl: 'my-tasks.app',
}

export const TRY_COPY = {
  title: 'Try it yourself',
  stepOne: 'Press Add to save "Buy milk".',
  stepTwo: 'Then clear the box and press Add again. What happens?',
  note: "The server here is pretend and runs in your browser, so you can't break anything.",
  button: 'Look behind the scenes',
  subtext: 'Replays what you just did, one step at a time.',
}

export const STORY_COPY = {
  title: 'Behind the scenes',
  stepOf: 'Step {step} of 5',
  note:
    'A request is a message the browser sends to the server, asking it to do something. A response is the reply.',
  details: 'See the exact details →',
  back: 'Back',
  step: 'Step',
  replay: 'Replay',
  tryEmpty: 'Try an empty task',
  done: 'Done',
}

export const DETAIL_COPY = {
  back: '← Back to the story',
  title: 'Under the hood',
  subtitle: 'The exact things being passed around at this step.',
  jump: 'JUMP TO ANOTHER STEP',
  request: 'THE REQUEST THAT ARRIVED',
  response: 'THE RESPONSE IT WILL SEND',
  code: 'THE CODE RUNNING NOW',
  table: 'THE TASKS TABLE',
  requestSent: 'THE REQUEST THE BROWSER SENT',
  formValue: 'WHAT THE FORM HELD',
  route: 'THE ROUTE THAT MATCHED',
  routeCheck: 'WHAT THE ROUTER CHECKED',
  sql: 'WHAT THE SERVER ASKED THE DATABASE',
  tableBefore: 'TABLE BEFORE',
  tableAfter: 'TABLE AFTER',
  responseSent: 'THE RESPONSE THE SERVER SENT',
  browserList: 'THE LIST THE BROWSER SHOWS',
  checkTitle: 'When an AI builds this for you, check',
  stepBack: '← Step {step} details',
  stepNext: 'Step {step} details →',
  titleCaption: 'title is "{title}" right now.',
  sqlExplanation:
    'A database speaks its own language, called SQL. This line says: add one row to the tasks table.',
  idNote:
    'Notice the server never said 3. The database picked the id itself, and that id goes back to the browser in the response.',
}

export const TUTOR_COPY = {
  title: 'Confused? Ask a tutor',
  stepChip: 'Step {step} of 5',
  promptLabel: 'PROMPT PREVIEW',
  copy: 'Copy prompt',
  edit: 'Edit',
  done: 'Done',
  paste: 'Paste it into any AI chat you use.',
  copied: 'Prompt copied.',
  copyFallback: 'Prompt selected. Press Ctrl/Cmd+C.',
}

export const CHECKLIST = {
  send: [
    'The browser sends data; it does not write to the database.',
    'The page stays responsive while the request is in flight.',
    'The request contains only what the server needs.',
  ],
  route: [
    'The route matches on method and path before any handler runs.',
    'An unknown path never reaches server code or the database.',
    'The handler is chosen by the server, not by the browser.',
  ],
  code: [
    'The title is checked before it is saved.',
    'A bad request gets an error, not a crash.',
    'The browser never talks to the database directly.',
  ],
  store: [
    'Only the server code talks to the database.',
    'The title goes in as a value, not pasted into the SQL text.',
    'The database picks ids, not the browser.',
  ],
  respond: [
    'The browser updates from the response, not from a hidden database connection.',
    'A successful response carries the saved task back.',
    'A failed request would show an error instead of a saved row.',
  ],
}

export const VERSION_COPY = {
  classic: {
    label: 'Classic',
    description:
      'The original step-by-step flow. Press Step and follow one request through four boxes.',
  },
  explorer: {
    label: 'Explorer',
    description:
      'Start inside the app, then go behind the scenes and deeper, one step at a time.',
  },
}

export const DEFAULT_VIEW = 'classic' as const
export type ViewName = 'classic' | 'explorer'
