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
    narrative: 'Add one task. Follow your text.',
    quote:
      'The same value should appear in the form, the request, and the database row.',
    actionLabel: 'Add',
    steps: ['Type a task', 'Send it', 'Pick the next layer'],
    unlockTitle: 'Behind the scenes',
    unlockDetail: 'View the request.',
  },
  {
    id: 'fetch',
    number: 2,
    title: 'Fetching all tasks',
    problem: 'The page has no list.',
    narrative: 'Reload. The browser asks for the rows.',
    quote:
      'A GET is a question. The response is the answer, and the browser waits for it.',
    actionLabel: 'Reload',
    steps: ['Clear the list', 'Ask GET /tasks', 'Pick what came back'],
    unlockTitle: 'Under the hood',
    unlockDetail: 'View request and response.',
  },
  {
    id: 'refresh',
    number: 3,
    title: 'The refresh test',
    problem: 'Refresh clears the page.',
    narrative: 'Pick storage. Refresh. See what stays.',
    quote:
      'Memory is fast but temporary. A database is slower but still there tomorrow.',
    actionLabel: 'Refresh',
    steps: ['Pick storage', 'Refresh', 'See what stays'],
    unlockTitle: 'Storage choice',
    unlockDetail: 'Pick storage.',
  },
  {
    id: 'payload',
    number: 4,
    title: 'Wrong payload',
    problem: 'Bad input reaches the server.',
    narrative: 'Send a bad request. See where it stops.',
    quote:
      'A bad value is not a bad URL. The router and the handler are different checkpoints.',
    actionLabel: 'Send',
    steps: ['Pick a request', 'Send', 'Pick the stop'],
    unlockTitle: 'Break-it is part of the path',
    unlockDetail: 'Try a bad route or method.',
  },
  {
    id: 'server',
    number: 5,
    title: 'The server goes down',
    problem: 'The request has nowhere to go.',
    narrative: 'Turn the server off. The page stays up.',
    quote:
      'A failed request is not the same thing as a broken page.',
    actionLabel: 'Send',
    steps: ['Find the switch', 'Turn it off', 'Send and watch'],
    unlockTitle: 'Server switch',
    unlockDetail: 'Server control.',
  },
  {
    id: 'database',
    number: 6,
    title: 'The database disconnects',
    problem: 'The server cannot reach storage.',
    narrative: 'Turn the database off. The server cannot save.',
    quote:
      'Three separate things can fail: the browser, the server, and the database.',
    actionLabel: 'Send',
    steps: ['Find the switch', 'Turn it off', 'Send and read'],
    unlockTitle: 'Database switch',
    unlockDetail: 'Sandbox unlocked.',
  },
]

export const STORAGE_MODES: StorageMode[] = [
  {
    id: 'memory',
    label: 'Browser memory',
    short: 'Memory',
    survivesRefresh: false,
    serverCanRead: false,
    result: 'Refresh cleared it.',
  },
  {
    id: 'session',
    label: 'Session storage',
    short: 'Session',
    survivesRefresh: true,
    serverCanRead: false,
    result: 'Survived this tab only.',
  },
  {
    id: 'local',
    label: 'Local storage',
    short: 'Local',
    survivesRefresh: true,
    serverCanRead: false,
    result: 'Survived this browser only.',
  },
  {
    id: 'database',
    label: 'The database',
    short: 'Database',
    survivesRefresh: true,
    serverCanRead: true,
    result: 'Survived. The server can read it.',
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
    prompt: 'Where does the request go?',
    lead: 'Use the method and path on the wire. Pick the layer that handles this operation.',
    options: [
      {
        id: 'server',
        label: 'Server',
        detail: 'Owns POST /tasks.',
      },
      {
        id: 'database',
        label: 'Database',
        detail: 'Behind the server.',
      },
      {
        id: 'memory',
        label: 'Memory',
        detail: 'Only this page.',
      },
    ],
    correctId: 'server',
    correctNote: 'The server owns POST /tasks.',
    wrongNote: 'The database is behind the server.',
  },
  fetch: {
    prompt: 'What came back?',
    lead: 'GET has no body. Look at the request and the rows that came back.',
    options: [
      {
        id: 'rows',
        label: 'Rows',
        detail: 'Rows from the database.',
      },
      {
        id: 'new-row',
        label: 'New task',
        detail: 'A write, not a read.',
      },
      {
        id: 'connection',
        label: 'DB connection',
        detail: 'No direct connection.',
      },
    ],
    correctId: 'rows',
    correctNote: 'GET returns the stored rows.',
    wrongNote: 'GET reads. It does not write.',
  },
  payload: {
    prompt: 'Where did it stop?',
    lead: 'Look at the status and the layer that owns this check.',
    options: [
      {
        id: 'router',
        label: 'Router',
        detail: 'No route matched.',
      },
      {
        id: 'server',
        label: 'Server',
        detail: 'The handler rejected it.',
      },
      {
        id: 'database',
        label: 'Database',
        detail: 'It never got there.',
      },
    ],
    correctId: 'server',
    correctNote: 'The server rejected the payload.',
    wrongNote: 'Check the status and the request.',
  },
  server: {
    prompt: 'What happened?',
    lead: 'The page is still here. Look at the request and the missing response.',
    options: [
      {
        id: 'no-response',
        label: 'No response',
        detail: 'Server was off.',
      },
      {
        id: 'database',
        label: 'Database',
        detail: 'Database untouched.',
      },
      {
        id: 'page',
        label: 'Page crashed',
        detail: 'Page stayed up.',
      },
    ],
    correctId: 'no-response',
    correctNote: 'No response. The page stayed up.',
    wrongNote: 'The connection failed first.',
  },
  database: {
    prompt: 'What failed?',
    lead: 'The server answered. Look at the status and the protected page.',
    options: [
      {
        id: 'database',
        label: 'Database',
        detail: 'Storage unavailable.',
      },
      {
        id: 'browser',
        label: 'Browser',
        detail: 'Request was valid.',
      },
      {
        id: 'router',
        label: 'Router',
        detail: 'Route matched.',
      },
    ],
    correctId: 'database',
    correctNote: 'The server ran; the database was down.',
    wrongNote: 'The request and handler were fine.',
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
