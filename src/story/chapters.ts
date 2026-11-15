export type ChapterId =
  | 'add'
  | 'fetch'
  | 'refresh'
  | 'payload'
  | 'server'
  | 'database'

export type StoryTool = 'refresh' | 'storage' | 'server' | 'database'

export type StoryStorage = 'memory' | 'session' | 'local' | 'database'

export type PayloadCaseId =
  | 'empty'
  | 'invalid'
  | 'wrong-url'
  | 'wrong-method'
  | 'missing-task'

export interface StoryChapter {
  id: ChapterId
  number: number
  title: string
  problem: string
  narrative: string
  quote: string
  actionLabel: string
  steps: [string, string, string]
  unlockTitle: string
  unlockDetail: string
}

export interface StoryProgress {
  current: ChapterId
  completed: ChapterId[]
}

export interface StoryChoiceOption {
  id: string
  label: string
  detail: string
}

export interface StoryChoiceData {
  prompt: string
  lead: string
  options: StoryChoiceOption[]
  correctId: string
  correctNote: string
  wrongNote: string
}

export interface StorageMode {
  id: StoryStorage
  label: string
  short: string
  survivesRefresh: boolean
  serverCanRead: boolean
  result: string
}

export interface PayloadCase {
  id: PayloadCaseId
  label: string
  method: 'POST' | 'GET' | 'DELETE'
  path: string
  body: string | null
  expectedLayer: 'router' | 'server'
  expectedStatus: number
  note: string
}

export const STORY_CHAPTERS: StoryChapter[] = [
  {
    id: 'add',
    number: 1,
    title: 'Adding a task',
    problem: 'Your list is empty.',
    narrative:
      'You are building your own to-do app. Add one thing you actually need to do, then follow your text across the stack.',
    quote:
      'The same value should appear in the form, the request, and the database row.',
    actionLabel: 'Send the request',
    steps: [
      'Type the task you need to do.',
      'Send it and follow the request.',
      'Choose which layer receives it next.',
    ],
    unlockTitle: 'Behind the scenes',
    unlockDetail: 'See the server code and the request that just ran.',
  },
  {
    id: 'fetch',
    number: 2,
    title: 'Fetching all tasks',
    problem: 'The page does not already hold the list.',
    narrative:
      'Reload the list. The browser has to ask the server for the rows before it can render them.',
    quote:
      'A GET is a question. The response is the answer, and the browser waits for it.',
    actionLabel: 'Reload the list',
    steps: [
      'Clear the page’s copy of the list.',
      'Ask GET /tasks for the rows.',
      'Choose what the browser just received.',
    ],
    unlockTitle: 'Under the hood',
    unlockDetail: 'Open the raw request and response for this fetch.',
  },
  {
    id: 'refresh',
    number: 3,
    title: 'The refresh test',
    problem: 'A refresh clears the page.',
    narrative:
      'Choose where the task should live, then refresh the page. The result tells you what that storage actually keeps.',
    quote:
      'Memory is fast but temporary. A database is slower but still there tomorrow.',
    actionLabel: 'Refresh the page',
    steps: [
      'Choose where the task lives.',
      'Refresh the page.',
      'See what the browser can rebuild.',
    ],
    unlockTitle: 'Storage choice',
    unlockDetail: 'Choose memory, session, local, or the database in the action area.',
  },
  {
    id: 'payload',
    number: 4,
    title: 'Wrong payload',
    problem: 'Bad input can arrive at the door.',
    narrative:
      'Send a broken request and watch the server push back. The important part is where it stops.',
    quote:
      'A bad value is not a bad URL. The router and the handler are different checkpoints.',
    actionLabel: 'Send the bad request',
    steps: [
      'Pick a broken request.',
      'Send it and read the status.',
      'Choose the layer that stopped it.',
    ],
    unlockTitle: 'Break-it is part of the path',
    unlockDetail: 'Try a missing route and a wrong method from the same screen.',
  },
  {
    id: 'server',
    number: 5,
    title: 'The server goes down',
    problem: 'The request has nowhere to land.',
    narrative:
      'Flip the server switch and send another request. The page should stay up even when the request fails.',
    quote:
      'A failed request is not the same thing as a broken page.',
    actionLabel: 'Send while the server is off',
    steps: [
      'Open Tools and find the server switch.',
      'Turn the server off.',
      'Send a request and watch it fail.',
    ],
    unlockTitle: 'Server switch',
    unlockDetail: 'The server switch is now part of your controls.',
  },
  {
    id: 'database',
    number: 6,
    title: 'The database disconnects',
    problem: 'The server is alive, but its storage is not.',
    narrative:
      'Flip the database switch and send a valid task. The server runs, then reports that it cannot reach the database.',
    quote:
      'Three separate things can fail: the browser, the server, and the database.',
    actionLabel: 'Send while the database is off',
    steps: [
      'Open Tools and find the database switch.',
      'Turn the database off.',
      'Send a valid task and read the error.',
    ],
    unlockTitle: 'Database switch',
    unlockDetail: 'The database switch is open, and the sandbox is unlocked.',
  },
]

export const STORAGE_MODES: StorageMode[] = [
  {
    id: 'memory',
    label: 'Browser memory',
    short: 'Memory',
    survivesRefresh: false,
    serverCanRead: false,
    result: 'The refresh cleared it. Memory belongs to this page instance only.',
  },
  {
    id: 'session',
    label: 'Session storage',
    short: 'Session',
    survivesRefresh: true,
    serverCanRead: false,
    result: 'It survived this tab’s refresh, but another tab and the server cannot see it.',
  },
  {
    id: 'local',
    label: 'Local storage',
    short: 'Local',
    survivesRefresh: true,
    serverCanRead: false,
    result: 'It survived this browser’s refresh, but the server did not write it.',
  },
  {
    id: 'database',
    label: 'The database',
    short: 'Database',
    survivesRefresh: true,
    serverCanRead: true,
    result: 'It survived. The server can read it again through GET /tasks.',
  },
]

export const PAYLOAD_CASES: PayloadCase[] = [
  {
    id: 'empty',
    label: 'Empty title',
    method: 'POST',
    path: '/tasks',
    body: JSON.stringify({ title: '' }),
    expectedLayer: 'server',
    expectedStatus: 400,
    note: 'The route matched, so the handler had to reject the value.',
  },
  {
    id: 'invalid',
    label: 'Invalid JSON',
    method: 'POST',
    path: '/tasks',
    body: '{"title":',
    expectedLayer: 'server',
    expectedStatus: 400,
    note: 'The server could not parse the body, so the handler stopped before saving.',
  },
  {
    id: 'wrong-url',
    label: 'Unknown path',
    method: 'POST',
    path: '/task',
    body: JSON.stringify({ title: 'Buy oat milk' }),
    expectedLayer: 'router',
    expectedStatus: 404,
    note: 'No route matches this path, so the request stops at the router.',
  },
  {
    id: 'wrong-method',
    label: 'Wrong method',
    method: 'DELETE',
    path: '/tasks',
    body: null,
    expectedLayer: 'router',
    expectedStatus: 405,
    note: 'The path exists, but it does not accept DELETE, so the router rejects it.',
  },
  {
    id: 'missing-task',
    label: 'Missing task',
    method: 'GET',
    path: '/tasks/99',
    body: null,
    expectedLayer: 'router',
    expectedStatus: 404,
    note: 'There is no route for a single task, so the request never reaches the database.',
  },
]

export const CHAPTER_CHOICES: Partial<Record<ChapterId, StoryChoiceData>> = {
  add: {
    prompt: 'Where does your request go next?',
    lead: 'Use the method and path on the wire. Pick the layer that handles this operation.',
    options: [
      {
        id: 'server',
        label: 'The server',
        detail: 'The router sends POST /tasks to a handler.',
      },
      {
        id: 'database',
        label: 'The database',
        detail: 'It can find the row by its title.',
      },
      {
        id: 'memory',
        label: 'The browser memory',
        detail: 'It can keep the task on the page.',
      },
    ],
    correctId: 'server',
    correctNote:
      'The server owns POST /tasks. Its handler checks the title before the database is touched.',
    wrongNote:
      'The database is behind the server, and this request has not crossed that boundary yet.',
  },
  fetch: {
    prompt: 'What did the browser just ask for?',
    lead: 'GET has no body. Look at the request and the rows that came back.',
    options: [
      {
        id: 'rows',
        label: 'The current rows',
        detail: 'The server returns the list the database stored.',
      },
      {
        id: 'new-row',
        label: 'A new task',
        detail: 'The browser is trying to write another row.',
      },
      {
        id: 'connection',
        label: 'A database connection',
        detail: 'The browser opens the database directly.',
      },
    ],
    correctId: 'rows',
    correctNote:
      'GET /tasks asks for the stored rows. The server reads them and sends them back.',
    wrongNote:
      'GET reads data. The browser never opens the database or writes a row.',
  },
  payload: {
    prompt: 'Which layer stopped this request?',
    lead: 'Look at the status and the layer that owns this check.',
    options: [
      {
        id: 'router',
        label: 'The router',
        detail: 'The method and path did not match a handler.',
      },
      {
        id: 'server',
        label: 'The server handler',
        detail: 'The handler received the request and rejected the payload.',
      },
      {
        id: 'database',
        label: 'The database',
        detail: 'The table rejected the row before it was stored.',
      },
    ],
    correctId: 'server',
    correctNote:
      'The route matched, so the server handler rejected the bad payload before the database call.',
    wrongNote:
      'Look at the status and the request. A bad value is not the same thing as a bad URL.',
  },
  server: {
    prompt: 'What happened to this request?',
    lead: 'The page is still here. Look at the request and the missing response.',
    options: [
      {
        id: 'no-response',
        label: 'No response came back',
        detail: 'The request never reached a running server.',
      },
      {
        id: 'database',
        label: 'The database rejected it',
        detail: 'The database was down, so the row was refused.',
      },
      {
        id: 'page',
        label: 'The page crashed',
        detail: 'The failed request took the browser page with it.',
      },
    ],
    correctId: 'no-response',
    correctNote:
      'The server was off, so no response came back. The page stayed up and the database was never reached.',
    wrongNote:
      'The failure is at the connection step, before any database call.',
  },
  database: {
    prompt: 'Which layer failed?',
    lead: 'The server answered. Look at the status and the protected page.',
    options: [
      {
        id: 'database',
        label: 'The database',
        detail: 'The server ran, but could not read or write its storage.',
      },
      {
        id: 'browser',
        label: 'The browser',
        detail: 'The page sent a malformed request.',
      },
      {
        id: 'router',
        label: 'The router',
        detail: 'No handler matched this method and path.',
      },
    ],
    correctId: 'database',
    correctNote:
      'The router matched and the server ran. The database was unavailable, so it returned 503 and wrote nothing.',
    wrongNote:
      'The request shape was valid and the handler ran. The failure is behind the server.',
  },
}

const STORAGE_KEY = 'wfe:story'
const VALID_IDS = new Set<ChapterId>(STORY_CHAPTERS.map((chapter) => chapter.id))

export function chapterById(id: ChapterId): StoryChapter {
  return STORY_CHAPTERS.find((chapter) => chapter.id === id) ?? STORY_CHAPTERS[0]
}

export function nextChapterId(id: ChapterId): ChapterId | null {
  const index = STORY_CHAPTERS.findIndex((chapter) => chapter.id === id)
  return STORY_CHAPTERS[index + 1]?.id ?? null
}

export function allChaptersComplete(progress: StoryProgress): boolean {
  return STORY_CHAPTERS.every((chapter) =>
    progress.completed.includes(chapter.id),
  )
}

export function continueTarget(progress: StoryProgress): ChapterId {
  return (
    STORY_CHAPTERS.find(
      (chapter) => !progress.completed.includes(chapter.id),
    )?.id ?? progress.current
  )
}

export function canOpenChapter(
  id: ChapterId,
  progress: StoryProgress,
): boolean {
  return (
    id === progress.current ||
    progress.completed.includes(id) ||
    id === continueTarget(progress)
  )
}

export function toolsFor(progress: StoryProgress): Record<StoryTool, boolean> {
  return {
    refresh: progress.completed.includes('fetch'),
    storage:
      progress.current === 'refresh' ||
      progress.completed.includes('refresh'),
    server:
      progress.current === 'server' || progress.completed.includes('server'),
    database:
      progress.current === 'database' ||
      progress.completed.includes('database'),
  }
}

export function depthsFor(progress: StoryProgress): {
  behind: boolean
  under: boolean
} {
  return {
    behind: progress.completed.includes('add'),
    under: progress.completed.includes('fetch'),
  }
}

export function defaultProgress(): StoryProgress {
  return { current: 'add', completed: [] }
}

export function readProgress(): StoryProgress {
  if (typeof window === 'undefined') return defaultProgress()

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultProgress()
    const parsed = JSON.parse(raw) as Partial<StoryProgress>
    const current =
      typeof parsed.current === 'string' &&
      VALID_IDS.has(parsed.current as ChapterId)
        ? (parsed.current as ChapterId)
        : 'add'
    const completed = Array.isArray(parsed.completed)
      ? parsed.completed.filter(
          (id): id is ChapterId =>
            typeof id === 'string' && VALID_IDS.has(id as ChapterId),
        )
      : []
    return { current, completed: [...new Set(completed)] }
  } catch {
    return defaultProgress()
  }
}

export function saveProgress(progress: StoryProgress): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // Story progress is optional in restricted storage contexts.
  }
}

export function resetStoryProgress(): StoryProgress {
  if (typeof window === 'undefined') return defaultProgress()
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // The in-memory state still resets.
  }
  return defaultProgress()
}
