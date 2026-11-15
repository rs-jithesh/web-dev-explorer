import type { Method, Task, Transport } from '../engine/types'
import type { Run } from '../engine/server.ts'
import {
  DEFAULT_TITLE,
  INITIAL_TASKS,
  TUTOR_QUESTIONS,
  V2_CODE_LINES,
  storySteps,
  type StoryStep,
} from './content.ts'

export type ExplorerLessonId =
  | 'add'
  | 'load'
  | 'fail'
  | 'boundary'
  | 'refresh'

export type AppMode = 'add' | 'load' | 'refresh'

export interface ExplorerCase {
  id: string
  label: string
  request: {
    method: Method
    path: string
    body: string | null
  }
  serverOn?: boolean
  databaseOn?: boolean
  transport?: Transport
}

export interface ExplorerLesson {
  id: ExplorerLessonId
  navLabel: string
  title: string
  appMode: AppMode
  appTitle: string
  appSubtitle: string
  appButton: string
  inputDefault: string
  startingTasks: Task[]
  codeLines: string[]
  cases: ExplorerCase[]
  defaultCase: string
  tryStepOne: string
  tryStepTwo: string
  tryNote: string
  trySubtext: string
}

const addCases: ExplorerCase[] = [
  {
    id: 'add',
    label: 'Add a task',
    request: {
      method: 'POST',
      path: '/tasks',
      body: JSON.stringify({ title: DEFAULT_TITLE }),
    },
  },
  {
    id: 'empty',
    label: 'Empty title',
    request: {
      method: 'POST',
      path: '/tasks',
      body: JSON.stringify({ title: '' }),
    },
  },
  {
    id: 'invalid-json',
    label: 'Invalid JSON',
    request: {
      method: 'POST',
      path: '/tasks',
      body: '{"title":',
    },
  },
  {
    id: 'not-found',
    label: 'Unknown path',
    request: {
      method: 'POST',
      path: '/task',
      body: JSON.stringify({ title: DEFAULT_TITLE }),
    },
  },
  {
    id: 'wrong-method',
    label: 'Wrong method',
    request: {
      method: 'DELETE',
      path: '/tasks',
      body: null,
    },
  },
  {
    id: 'server-off',
    label: 'Server off',
    request: {
      method: 'POST',
      path: '/tasks',
      body: JSON.stringify({ title: DEFAULT_TITLE }),
    },
    serverOn: false,
  },
  {
    id: 'database-off',
    label: 'Database off',
    request: {
      method: 'POST',
      path: '/tasks',
      body: JSON.stringify({ title: DEFAULT_TITLE }),
    },
    databaseOn: false,
  },
  {
    id: 'direct-db',
    label: 'Try the database directly',
    request: {
      method: 'POST',
      path: '/tasks',
      body: JSON.stringify({ title: DEFAULT_TITLE }),
    },
    transport: 'db',
  },
]

const loadCases: ExplorerCase[] = [
  {
    id: 'load',
    label: 'Load the list',
    request: { method: 'GET', path: '/tasks', body: null },
  },
  {
    id: 'not-found',
    label: 'Use a wrong URL',
    request: { method: 'GET', path: '/task', body: null },
  },
  {
    id: 'missing',
    label: 'Ask for a missing task',
    request: { method: 'GET', path: '/tasks/99', body: null },
  },
  {
    id: 'server-off',
    label: 'Server off',
    request: { method: 'GET', path: '/tasks', body: null },
    serverOn: false,
  },
  {
    id: 'database-off',
    label: 'Database off',
    request: { method: 'GET', path: '/tasks', body: null },
    databaseOn: false,
  },
]

const failCases: ExplorerCase[] = [
  {
    id: 'empty',
    label: 'Empty title',
    request: {
      method: 'POST',
      path: '/tasks',
      body: JSON.stringify({ title: '' }),
    },
  },
  {
    id: 'invalid-json',
    label: 'Invalid JSON',
    request: { method: 'POST', path: '/tasks', body: '{"title":' },
  },
  {
    id: 'add',
    label: 'Valid title',
    request: {
      method: 'POST',
      path: '/tasks',
      body: JSON.stringify({ title: DEFAULT_TITLE }),
    },
  },
  {
    id: 'not-found',
    label: 'Use a wrong URL',
    request: {
      method: 'POST',
      path: '/task',
      body: JSON.stringify({ title: DEFAULT_TITLE }),
    },
  },
  {
    id: 'server-off',
    label: 'Server off',
    request: {
      method: 'POST',
      path: '/tasks',
      body: JSON.stringify({ title: DEFAULT_TITLE }),
    },
    serverOn: false,
  },
  {
    id: 'database-off',
    label: 'Database off',
    request: {
      method: 'POST',
      path: '/tasks',
      body: JSON.stringify({ title: DEFAULT_TITLE }),
    },
    databaseOn: false,
  },
]

const boundaryCases: ExplorerCase[] = [
  {
    id: 'add',
    label: 'Add through the server',
    request: {
      method: 'POST',
      path: '/tasks',
      body: JSON.stringify({ title: DEFAULT_TITLE }),
    },
  },
  {
    id: 'direct-db',
    label: 'Try the database directly',
    request: {
      method: 'POST',
      path: '/tasks',
      body: JSON.stringify({ title: DEFAULT_TITLE }),
    },
    transport: 'db',
  },
]

const refreshCases: ExplorerCase[] = [
  {
    id: 'api',
    label: 'Through the API and database',
    request: { method: 'GET', path: '/tasks', body: null },
  },
]

const tasks = INITIAL_TASKS.map((task) => ({ ...task }))

export const EXPLORER_LESSONS: ExplorerLesson[] = [
  {
    id: 'add',
    navLabel: 'Add a task',
    title: 'Add a task',
    appMode: 'add',
    appTitle: 'My tasks',
    appSubtitle: 'Three things to do today.',
    appButton: 'Add',
    inputDefault: DEFAULT_TITLE,
    startingTasks: tasks,
    codeLines: V2_CODE_LINES,
    cases: addCases,
    defaultCase: 'add',
    tryStepOne: 'Press Add to save "Buy milk".',
    tryStepTwo: 'Then clear the box and press Add again. What happens?',
    tryNote:
      "The server here is pretend and runs in your browser, so you can't break anything.",
    trySubtext: 'Replays what you just did, one step at a time.',
  },
  {
    id: 'load',
    navLabel: 'Load list',
    title: 'Load the list',
    appMode: 'load',
    appTitle: 'My tasks',
    appSubtitle: 'The list needs the server.',
    appButton: 'Reload',
    inputDefault: '',
    startingTasks: tasks,
    codeLines: [
      "app.get('/tasks', (req, res) => {",
      '  const rows = db.all();',
      '  res.status(200).json(rows);',
      '});',
    ],
    cases: loadCases,
    defaultCase: 'load',
    tryStepOne: 'Press Reload to ask the server for the list.',
    tryStepTwo: 'Then look behind the scenes to see where the rows come from.',
    tryNote:
      'The list is not stored in the HTML. It has to arrive from the server.',
    trySubtext: 'Replays the request one step at a time.',
  },
  {
    id: 'fail',
    navLabel: 'When things fail',
    title: 'When things fail',
    appMode: 'add',
    appTitle: 'My tasks',
    appSubtitle: 'Send bad input and follow the error back.',
    appButton: 'Add',
    inputDefault: '',
    startingTasks: tasks,
    codeLines: V2_CODE_LINES,
    cases: failCases,
    defaultCase: 'empty',
    tryStepOne: 'Press Add with an empty title.',
    tryStepTwo: 'Follow the 400 back to the layer that rejected it.',
    tryNote:
      'The server rejects the bad request; the database is never touched.',
    trySubtext: 'Replays the failure one step at a time.',
  },
  {
    id: 'boundary',
    navLabel: 'Database boundary',
    title: 'Who talks to the database',
    appMode: 'add',
    appTitle: 'My tasks',
    appSubtitle: 'The browser never talks to the database directly.',
    appButton: 'Add',
    inputDefault: DEFAULT_TITLE,
    startingTasks: tasks,
    codeLines: V2_CODE_LINES,
    cases: boundaryCases,
    defaultCase: 'add',
    tryStepOne: 'Press Add and follow the trusted server path.',
    tryStepTwo: 'Then try the database directly from the browser.',
    tryNote:
      'The API is the browser’s only door. The database accepts the server only.',
    trySubtext: 'Replays the boundary one step at a time.',
  },
  {
    id: 'refresh',
    navLabel: 'Refresh test',
    title: 'What survives a refresh?',
    appMode: 'refresh',
    appTitle: 'My tasks',
    appSubtitle: 'The browser forgot the list. The database did not.',
    appButton: 'Refresh',
    inputDefault: '',
    startingTasks: tasks,
    codeLines: [
      "app.get('/tasks', (req, res) => {",
      '  const rows = db.all();',
      '  res.status(200).json(rows);',
      '});',
    ],
    cases: refreshCases,
    defaultCase: 'api',
    tryStepOne: 'Press Refresh to clear the browser’s copy.',
    tryStepTwo: 'Then follow GET /tasks back to the stored rows.',
    tryNote:
      'The browser can forget. The server can ask the database again.',
    trySubtext: 'Replays the reload one step at a time.',
  },
]

export function lessonById(id: ExplorerLessonId): ExplorerLesson {
  return EXPLORER_LESSONS.find((lesson) => lesson.id === id) ?? EXPLORER_LESSONS[0]
}

export function lessonCase(lesson: ExplorerLesson, id: string): ExplorerCase {
  return lesson.cases.find((item) => item.id === id) ?? lesson.cases[0]
}

function status(run: Run): string {
  if (run.failure === 'timeout') return 'No response'
  return run.response ? `${run.response.status}` : 'No response'
}

function failureStory(
  lesson: ExplorerLesson,
  run: Run,
  title: string,
): StoryStep[] | null {
  const method = run.request?.method ?? 'POST'
  const path = run.request?.path ?? '/tasks'
  const statusText = status(run)

  if (run.failure === 'blocked') {
    return [
      {
        id: 'blocked-browser',
        short: 'Browser tries the database',
        actor: 'Browser',
        tone: 'browser',
        box: 'browser',
        stage: 'blocked',
        text: 'The browser tries to open the tasks database directly. It has no database driver or credentials.',
      },
      {
        id: 'blocked-api',
        short: 'No HTTP request',
        actor: 'Server',
        tone: 'server',
        box: 'api',
        stage: 'blocked',
        text: 'No HTTP request is made, so the API router is skipped entirely.',
      },
      {
        id: 'blocked-server',
        short: 'Server never runs',
        actor: 'Server',
        tone: 'server',
        box: 'server',
        stage: 'blocked',
        text: 'The server process is not involved in this attempt.',
      },
      {
        id: 'blocked-db',
        short: 'Database refuses',
        actor: 'Database',
        tone: 'database',
        box: 'database',
        stage: 'blocked',
        text: 'The database only accepts the server. The browser is refused.',
      },
      {
        id: 'blocked-done',
        short: 'Browser shows the failure',
        actor: 'Browser',
        tone: 'browser',
        box: 'browser',
        stage: 'blocked',
        text: 'The browser shows the error. This is why every request has to go through the API and server.',
      },
    ]
  }

  if (run.failure === 'timeout') {
    return [
      {
        id: 'timeout-send',
        short: 'Browser sends request',
        actor: 'Browser',
        tone: 'browser',
        box: 'browser',
        stage: 'send',
        text: `The browser sends ${method} ${path} and waits for a reply.`,
      },
      {
        id: 'timeout-server',
        short: 'No server answers',
        actor: 'Server',
        tone: 'server',
        box: 'api',
        stage: 'respond',
        text: 'No server is listening, so no response comes back.',
      },
      {
        id: 'timeout-wait',
        short: 'Browser keeps waiting',
        actor: 'Browser',
        tone: 'browser',
        box: 'browser',
        stage: 'done',
        text: 'The browser waits for a response that will not arrive.',
      },
      {
        id: 'timeout-db',
        short: 'Database untouched',
        actor: 'Database',
        tone: 'database',
        box: 'database',
        stage: 'blocked',
        text: 'No request reached the server, so the database is untouched.',
      },
      {
        id: 'timeout-done',
        short: 'Browser times out',
        actor: 'Browser',
        tone: 'browser',
        box: 'browser',
        stage: 'done',
        text: 'The browser gives up with a connection error. It cannot know whether anything was written.',
      },
    ]
  }

  if (run.failure === 'not_found' || run.failure === 'method_not_allowed') {
    const routeProblem =
      run.failure === 'not_found'
        ? `No route matches ${method} ${path}.`
        : `The path ${path} does not accept ${method}.`
    return [
      {
        id: 'route-send',
        short: 'Browser sends request',
        actor: 'Browser',
        tone: 'browser',
        box: 'browser',
        stage: 'send',
        text: `The browser sends ${method} ${path}. It does not know which routes exist.`,
      },
      {
        id: 'route-match',
        short: 'Router rejects the route',
        actor: 'Server',
        tone: 'server',
        box: 'api',
        stage: 'route',
        text: `${routeProblem} The request stops at the router.`,
      },
      {
        id: 'route-code',
        short: 'Server code never runs',
        actor: 'Server',
        tone: 'server',
        box: 'server',
        stage: 'route',
        text: 'No handler runs, so no server code or database call is reached.',
      },
      {
        id: 'route-db',
        short: 'Database untouched',
        actor: 'Database',
        tone: 'database',
        box: 'database',
        stage: 'blocked',
        text: 'The database is never opened.',
      },
      {
        id: 'route-response',
        short: 'Browser shows the error',
        actor: 'Browser',
        tone: 'browser',
        box: 'browser',
        stage: 'done',
        text: `The server returns ${statusText}. The browser shows the error.`,
      },
    ]
  }

  if (run.failure === 'database_error') {
    return [
      {
        id: 'dbdown-send',
        short: 'Browser sends request',
        actor: 'Browser',
        tone: 'browser',
        box: 'browser',
        stage: 'send',
        text: `The browser sends ${method} ${path} and waits for a response.`,
      },
      {
        id: 'dbdown-route',
        short: 'Router matches',
        actor: 'Server',
        tone: 'server',
        box: 'api',
        stage: 'route',
        text: `${method} ${path} matches a handler, so the request enters the server.`,
      },
      {
        id: 'dbdown-server',
        short: 'Server code runs',
        actor: 'Server',
        tone: 'server',
        box: 'server',
        stage: 'code',
        text: 'The handler parses the request and asks the database to read or write.',
      },
      {
        id: 'dbdown-db',
        short: 'Database unavailable',
        actor: 'Database',
        tone: 'database',
        box: 'database',
        stage: 'blocked',
        text: 'The database cannot be reached. No row is read or written.',
      },
      {
        id: 'dbdown-response',
        short: 'Browser shows the error',
        actor: 'Browser',
        tone: 'browser',
        box: 'browser',
        stage: 'done',
        text: `The server returns ${statusText}. The page stays up and shows a service error.`,
      },
    ]
  }

  if (run.failure === 'invalid_json' || run.failure === 'validation') {
    return [
      {
        id: 'fail-send',
        short: 'Browser sends request',
        actor: 'Browser',
        tone: 'browser',
        box: 'browser',
        stage: 'send',
        text: `The browser sends ${method} ${path} with the request body. It does not decide whether the body is valid.`,
      },
      {
        id: 'fail-route',
        short: 'Router matches',
        actor: 'Server',
        tone: 'server',
        box: 'api',
        stage: 'route',
        text: `${method} ${path} matches a handler, so the request enters the server code.`,
      },
      {
        id: 'fail-guard',
        short: 'Server rejects the input',
        actor: 'Server',
        tone: 'server',
        box: 'server',
        stage: 'code',
        line: lesson.codeLines.length > 1 ? 2 : 1,
        text:
          run.failure === 'invalid_json'
            ? 'The server cannot parse the JSON body. The handler is not allowed to continue.'
            : 'The server checks the input and rejects it before the database call.',
      },
      {
        id: 'fail-db',
        short: 'Database untouched',
        actor: 'Database',
        tone: 'database',
        box: 'database',
        stage: 'blocked',
        text: 'The insert never runs. No row is written.',
      },
      {
        id: 'fail-response',
        short: 'Browser shows the error',
        actor: 'Browser',
        tone: 'browser',
        box: 'browser',
        stage: 'done',
        text: `The server returns ${statusText}. The list stays unchanged.`,
      },
    ]
  }

  return null
}

export function storyFor(
  lesson: ExplorerLesson,
  run: Run,
  title: string,
): StoryStep[] {
  const failed = failureStory(lesson, run, title)
  if (failed) return failed

  if (lesson.id === 'refresh') {
    return [
      {
        id: 'refresh-memory',
        short: 'Browser memory clears',
        actor: 'Browser',
        tone: 'browser',
        box: 'browser',
        stage: 'click',
        text: 'The page reloads. The browser’s in-memory list disappears.',
      },
      {
        id: 'refresh-ask',
        short: 'Browser asks for the list',
        actor: 'Browser',
        tone: 'browser',
        box: 'browser',
        stage: 'send',
        text: 'The page asks GET /tasks for the stored rows.',
      },
      {
        id: 'refresh-read',
        short: 'Server reads the table',
        actor: 'Server',
        tone: 'server',
        box: 'server',
        stage: 'code',
        line: 2,
        text: 'The server handler asks the database for the tasks.',
      },
      {
        id: 'refresh-rows',
        short: 'Database returns rows',
        actor: 'Database',
        tone: 'database',
        box: 'database',
        stage: 'db',
        line: 2,
        text: 'The database returns the stored rows. They survived the refresh.',
      },
      {
        id: 'refresh-render',
        short: 'Browser rebuilds the list',
        actor: 'Browser',
        tone: 'browser',
        box: 'browser',
        stage: 'done',
        text: 'The browser rebuilds the list from the response.',
      },
    ]
  }

  if (run.request?.method === 'GET') {
    return [
      {
        id: 'load-start',
        short: 'Browser needs the list',
        actor: 'Browser',
        tone: 'browser',
        box: 'browser',
        stage: 'click',
        text: 'The page needs the current tasks before it can show a list. The browser sends GET /tasks.',
      },
      {
        id: 'load-route',
        short: 'Router finds the handler',
        actor: 'Server',
        tone: 'server',
        box: 'api',
        stage: 'route',
        line: 1,
        text: 'The server matches GET /tasks to the code that lists tasks.',
      },
      {
        id: 'load-code',
        short: 'Server reads the table',
        actor: 'Server',
        tone: 'server',
        box: 'server',
        stage: 'code',
        line: 2,
        text: 'The handler asks the database for every task.',
      },
      {
        id: 'load-db',
        short: 'Database returns rows',
        actor: 'Database',
        tone: 'database',
        box: 'database',
        stage: 'db',
        line: 2,
        text: 'The database returns the stored rows.',
      },
      {
        id: 'load-response',
        short: 'Browser renders the list',
        actor: 'Server',
        tone: 'server',
        box: 'server',
        stage: 'respond',
        line: 3,
        text: 'The server sends 200 OK with the rows, and the browser renders the list.',
      },
    ]
  }

  const base = storySteps(title)
  if (lesson.id !== 'add' && lesson.id !== 'boundary') {
    return base
  }
  return base
}

export function tutorQuestionFor(
  lesson: ExplorerLesson,
  stepIndex: number,
  title: string,
  failure: string | null = null,
): string {
  const safeTitle = title.trim() || DEFAULT_TITLE

  if (failure) {
    return [
      'Why does the browser send the request even though it can fail?',
      'Which layer should reject this request, and why?',
      'Why does the failure stop before the database?',
      'What can the browser learn from this failed request?',
      'What should the browser do with the error it received?',
    ][stepIndex]
  }

  if (lesson.id === 'add' && stepIndex === 2) {
    return 'Why does the server check the title before saving?'
  }

  if (lesson.id === 'add' && stepIndex === 3) {
    return `At this step the server runs INSERT INTO tasks (title) VALUES ('${safeTitle}'); and the database creates row 3. How does the database choose the id?`
  }

  if (lesson.id === 'refresh') {
    return [
      'Why does the list disappear from the browser when the page reloads?',
      'Why does the browser ask the server instead of remembering the list itself?',
      'How does the server find the stored rows?',
      'Why does the database still have the list after the browser forgets it?',
      'How does the browser rebuild the list from the response?',
    ][stepIndex]
  }

  if (lesson.id === 'load') {
    return [
      'Why does the browser need to send a request just to show the list?',
      'How does the server know which code should handle GET /tasks?',
      'Why does the server read the database instead of the browser?',
      'What exactly does the database return to the server?',
      'How does the browser turn the response into list items?',
    ][stepIndex]
  }

  const generic = [
    'Why does the browser send a request instead of changing the database directly?',
    'How does the server decide which code should handle this request?',
    'What is the server checking at this step?',
    'What does the database actually change at this step?',
    'How does the browser know what happened?',
  ]

  return generic[stepIndex] ?? TUTOR_QUESTIONS[stepIndex]
}
