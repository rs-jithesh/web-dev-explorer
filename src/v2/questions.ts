import type { ExplorerLessonId } from './lessons'

export type QuestionEvidenceTone = 'danger' | 'plain' | 'blue'

export interface MentalQuestionOption {
  id: string
  title: string
  detail: string
  correct?: boolean
}

export interface MentalQuestionEvidence {
  badge: string
  tone: QuestionEvidenceTone
  items: string[]
}

export interface MentalQuestion {
  id: string
  group: string
  lessonId: ExplorerLessonId
  lessonLabel: string
  caseId: string
  stepIndex: number
  actor: string
  actorTone: 'browser' | 'server' | 'database'
  stepLabel: string
  prompt: string
  options: MentalQuestionOption[]
  correctNote: string
  wrongNote: string
  evidence: MentalQuestionEvidence
}

export const QUESTION_GROUPS = [
  'Add a task',
  'When things fail',
  'Load the list',
  'Database boundary',
  'Refresh',
  'Evidence & AI check',
] as const

export const MENTAL_QUESTIONS: MentalQuestion[] = [
  {
    id: 'add-guard',
    group: 'Add a task',
    lessonId: 'add',
    lessonLabel: 'Add a task',
    caseId: 'empty',
    stepIndex: 2,
    actor: 'Server code',
    actorTone: 'server',
    stepLabel: 'Step 3 · Server code',
    prompt:
      'Which layer rejects the empty title — and does the database ever open?',
    options: [
      {
        id: 'browser',
        title: 'The browser',
        detail: 'It checks the title before sending the request.',
      },
      {
        id: 'server',
        title: 'The server handler',
        detail:
          'It rejects the empty title; the database is never opened.',
        correct: true,
      },
      {
        id: 'database',
        title: 'The database',
        detail: 'It rejects the row before anything is stored.',
      },
    ],
    correctNote:
      'The server guard rejects the empty title with 400. The database connection never opens.',
    wrongNote:
      'The browser sends the request. The server guard is the first thing that rejects the empty title.',
    evidence: {
      badge: '400 Bad Request',
      tone: 'danger',
      items: ['0 rows written', 'database not opened'],
    },
  },
  {
    id: 'add-id',
    group: 'Add a task',
    lessonId: 'add',
    lessonLabel: 'Add a task',
    caseId: 'add',
    stepIndex: 3,
    actor: 'Database',
    actorTone: 'database',
    stepLabel: 'Step 4 · Database',
    prompt: 'Who chooses the new row’s id?',
    options: [
      {
        id: 'browser',
        title: 'The browser',
        detail: 'It counts the tasks on the page and sends the next number.',
      },
      {
        id: 'server',
        title: 'The server',
        detail: 'It picks a number before calling the database.',
      },
      {
        id: 'database',
        title: 'The database',
        detail: 'It assigns the id when the row is inserted.',
        correct: true,
      },
    ],
    correctNote:
      'The database assigns the id. The server sends only the title, then receives the saved row back.',
    wrongNote:
      'The server does not pick the id either. The database assigns it during the insert.',
    evidence: {
      badge: '201 Created',
      tone: 'blue',
      items: ['row id 3', 'database chose it'],
    },
  },
  {
    id: 'fail-rows',
    group: 'When things fail',
    lessonId: 'fail',
    lessonLabel: 'When things fail',
    caseId: 'empty',
    stepIndex: 3,
    actor: 'Database untouched',
    actorTone: 'database',
    stepLabel: 'Step 4 · Database untouched',
    prompt: 'How many rows changed when validation failed?',
    options: [
      {
        id: 'zero',
        title: 'None',
        detail: 'The request stopped before the insert ran.',
        correct: true,
      },
      {
        id: 'one',
        title: 'One',
        detail: 'The database wrote a row, then marked it invalid.',
      },
      {
        id: 'three',
        title: 'Three',
        detail: 'The whole tasks table was rewritten.',
      },
    ],
    correctNote:
      'Zero rows changed. The insert never ran, so the table is still exactly the same.',
    wrongNote:
      'The database only receives work that reaches it. This request stopped at the server guard.',
    evidence: {
      badge: '400 Bad Request',
      tone: 'danger',
      items: ['0 rows changed', 'table still has 2 rows'],
    },
  },
  {
    id: 'load-handler',
    group: 'Load the list',
    lessonId: 'load',
    lessonLabel: 'Load list',
    caseId: 'load',
    stepIndex: 1,
    actor: 'Router',
    actorTone: 'server',
    stepLabel: 'Step 2 · Router',
    prompt:
      'Why does GET /tasks use a different handler than POST /tasks?',
    options: [
      {
        id: 'method',
        title: 'The method changes the operation',
        detail:
          'GET reads rows; POST creates one. The router matches method and path.',
        correct: true,
      },
      {
        id: 'speed',
        title: 'GET is faster',
        detail: 'It skips the handler and reads the database directly.',
      },
      {
        id: 'browser',
        title: 'The browser chooses the handler',
        detail: 'It sends the handler name along with the URL.',
      },
    ],
    correctNote:
      'The router matches both method and path. GET /tasks and POST /tasks are different operations.',
    wrongNote:
      'The browser sends a method and path, not a handler. The server router selects the handler.',
    evidence: {
      badge: 'GET /tasks',
      tone: 'blue',
      items: ['router matched', 'db.all() returned rows'],
    },
  },
  {
    id: 'boundary-credentials',
    group: 'Database boundary',
    lessonId: 'boundary',
    lessonLabel: 'Database boundary',
    caseId: 'direct-db',
    stepIndex: 0,
    actor: 'Browser',
    actorTone: 'browser',
    stepLabel: 'Step 1 · Trust boundary',
    prompt: 'Does the browser know the database credentials?',
    options: [
      {
        id: 'no',
        title: 'No',
        detail:
          'The server owns the connection. The browser can only send HTTP.',
        correct: true,
      },
      {
        id: 'local-storage',
        title: 'Yes, in local storage',
        detail: 'The page saves the password so it can connect directly.',
      },
      {
        id: 'after-login',
        title: 'Yes, after login',
        detail: 'Logging in gives the browser a direct database connection.',
      },
    ],
    correctNote:
      'The browser has no database driver or credentials. Only the server holds the connection.',
    wrongNote:
      'Nothing in the page can open the database directly. The API is the browser’s only door.',
    evidence: {
      badge: 'No request',
      tone: 'plain',
      items: ['browser blocked', 'server owns the connection'],
    },
  },
  {
    id: 'refresh-memory',
    group: 'Refresh',
    lessonId: 'refresh',
    lessonLabel: 'Refresh test',
    caseId: 'api',
    stepIndex: 0,
    actor: 'Browser memory',
    actorTone: 'browser',
    stepLabel: 'Step 1 · Browser memory',
    prompt: 'What exactly is lost when the page refreshes?',
    options: [
      {
        id: 'browser-list',
        title: 'The browser’s in-memory list',
        detail: 'The database rows are still there for the next request.',
        correct: true,
      },
      {
        id: 'database-rows',
        title: 'The database rows',
        detail: 'A refresh clears the stored table as well as the page.',
      },
      {
        id: 'both',
        title: 'Both the list and the rows',
        detail: 'The page and its durable storage reset together.',
      },
    ],
    correctNote:
      'The browser forgets its in-memory copy. The database still has the rows, so the page can ask again.',
    wrongNote:
      'A refresh clears the page, not durable storage. The next GET can rebuild the list from the database.',
    evidence: {
      badge: 'Refresh',
      tone: 'plain',
      items: ['browser list cleared', 'database rows remain'],
    },
  },
  {
    id: 'evidence-db',
    group: 'Evidence & AI check',
    lessonId: 'add',
    lessonLabel: 'Add a task',
    caseId: 'empty',
    stepIndex: 3,
    actor: 'Database untouched',
    actorTone: 'database',
    stepLabel: 'Step 4 · Database untouched',
    prompt: 'Which evidence proves the database was untouched?',
    options: [
      {
        id: 'table',
        title: 'The table is unchanged and the insert never ran',
        detail:
          'The failed request stopped at the server guard, before db.insert.',
        correct: true,
      },
      {
        id: 'status',
        title: 'The 400 status alone',
        detail: 'Any error response proves that no row was written.',
      },
      {
        id: 'empty-list',
        title: 'The task list is empty',
        detail: 'An empty list proves the database refused the request.',
      },
    ],
    correctNote:
      'The table still has the same two rows, and the request never reached db.insert. That is the receipt.',
    wrongNote:
      'A status code reports the outcome; it does not prove the side effect. Look at the table and the stopped call.',
    evidence: {
      badge: '400 Bad Request',
      tone: 'danger',
      items: ['0 rows written', 'table unchanged'],
    },
  },
  {
    id: 'ai-validation',
    group: 'Evidence & AI check',
    lessonId: 'add',
    lessonLabel: 'Add a task',
    caseId: 'empty',
    stepIndex: 2,
    actor: 'Server code',
    actorTone: 'server',
    stepLabel: 'AI check · Server code',
    prompt:
      'Is validation enforced on the server or only in the browser?',
    options: [
      {
        id: 'server',
        title: 'On the server',
        detail: 'The guard runs before db.insert, on every request.',
        correct: true,
      },
      {
        id: 'browser-only',
        title: 'Only in the browser',
        detail: 'The form blocks an empty title, so the server can trust it.',
      },
      {
        id: 'database',
        title: 'In the database',
        detail: 'The table rejects the empty title before it stores it.',
      },
    ],
    correctNote:
      'The server checks the title before the database call. A browser check is useful, but it is not enforcement.',
    wrongNote:
      'The form can be bypassed. Validation has to run in trusted server code before db.insert.',
    evidence: {
      badge: '400 Bad Request',
      tone: 'danger',
      items: ['server guard ran', 'browser did not decide'],
    },
  },
]

export function questionById(id: string): MentalQuestion {
  return MENTAL_QUESTIONS.find((question) => question.id === id) ?? MENTAL_QUESTIONS[0]
}

export function questionNumber(id: string): number {
  return MENTAL_QUESTIONS.findIndex((question) => question.id === id) + 1
}

export function nextQuestion(id: string): MentalQuestion | null {
  const index = MENTAL_QUESTIONS.findIndex((question) => question.id === id)
  if (index < 0 || index === MENTAL_QUESTIONS.length - 1) return null
  return MENTAL_QUESTIONS[index + 1]
}
