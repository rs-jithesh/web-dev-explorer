import type {
  Box,
  BrowserMode,
  Lesson,
  Scenario,
  Stage,
  Step,
  Task,
} from './types'
import type { Run, RunRequest, RunResponse } from './server'

export interface BrowserView {
  mode: BrowserMode
  state: 'idle' | 'pending' | 'loading' | 'done' | 'error'
  items: Task[]
  pendingTitle: string | null
  highlightId: number | null
  error: string | null
  statusLabel: string | null
}

export type MatchState =
  | 'unknown'
  | 'matched'
  | 'missed'
  | 'method_not_allowed'
  | 'timeout'
  | 'blocked'

export interface ApiView {
  request: RunRequest | null
  sent: boolean
  match: MatchState
  response: RunResponse | null
  error: string | null
  note: string | null
}

export interface ServerView {
  on: boolean
  status: 'on' | 'offline' | 'blocked'
  lines: string[]
  activeLine: number | null
  note: string
}

export interface DatabaseView {
  rows: Task[]
  highlightId: number | null
  sql: string | null
  locked: boolean
  note: string | null
}

export interface FlowView {
  active: Box | null
  browser: BrowserView
  api: ApiView
  server: ServerView
  database: DatabaseView
}

const ORDER: Stage[] = ['click', 'send', 'route', 'code', 'db', 'respond', 'done']

function reached(stage: Stage, target: Stage) {
  const current = ORDER.indexOf(stage)
  const wanted = ORDER.indexOf(target)
  return current >= 0 && wanted >= 0 && current >= wanted
}

function errorText(run: Run): string {
  if (run.failure === 'timeout') {
    return 'Timed out. No response came back.'
  }
  if (run.failure === 'blocked') {
    return 'Blocked. A browser cannot open the database directly.'
  }
  if (run.response?.status === 400) {
    const body = run.response.body as { error?: string }
    return `400 Bad Request: ${body?.error ?? 'the request was rejected.'}`
  }
  if (run.response?.status === 404) {
    return '404 Not Found: no route matched this request.'
  }
  if (run.response?.status === 405) {
    return '405 Method Not Allowed: this path does not accept that method.'
  }
  if (run.response && run.response.status >= 500) {
    return `${run.response.status} Server error.`
  }
  return 'The request failed.'
}

function browserView(
  lesson: Lesson,
  scenario: Scenario,
  step: Step | null,
  run: Run,
  title: string,
  tasks: Task[],
): BrowserView {
  const mode = scenario.mode ?? lesson.mode

  if (mode === 'direct') {
    return {
      mode,
      state: step ? 'error' : 'idle',
      items: [],
      pendingTitle: null,
      highlightId: null,
      error: step ? 'Blocked. A browser cannot open tasks.db directly.' : null,
      statusLabel: step ? 'Blocked' : 'No access',
    }
  }

  if (!step) {
    return {
      mode,
      state: 'idle',
      items: mode === 'load' ? [] : tasks,
      pendingTitle: null,
      highlightId: null,
      error: null,
      statusLabel: mode === 'load' ? 'Not loaded' : null,
    }
  }

  const done = step.stage === 'done'
  const succeeded = run.response !== null && run.response.status < 300

  if (done) {
    if (!succeeded) {
      return {
        mode,
        state: 'error',
        items: mode === 'load' ? [] : tasks,
        pendingTitle: null,
        highlightId: null,
        error: errorText(run),
        statusLabel: 'Failed',
      }
    }

    return {
      mode,
      state: 'done',
      items: run.tasksAfter,
      pendingTitle: null,
      highlightId: run.inserted?.id ?? null,
      error: null,
      statusLabel:
        mode === 'load' ? 'Loaded' : mode === 'delete' ? 'Deleted' : 'Saved',
    }
  }

  if (mode === 'delete') {
    return {
      mode,
      state: 'pending',
      items: tasks,
      pendingTitle: null,
      highlightId: null,
      error: null,
      statusLabel: 'Deleting…',
    }
  }

  if (mode === 'load') {
    return {
      mode,
      state: 'loading',
      items: [],
      pendingTitle: null,
      highlightId: null,
      error: null,
      statusLabel: 'Loading…',
    }
  }

  const label =
    step.stage === 'db'
      ? 'Saving…'
      : step.stage === 'respond'
        ? 'Waiting for reply…'
        : 'Sending…'

  return {
    mode,
    state: 'pending',
    items: tasks,
    pendingTitle: title.trim() ? title : '(empty title)',
    highlightId: null,
    error: null,
    statusLabel: label,
  }
}

function apiView(step: Step | null, run: Run): ApiView {
  if (!step) {
    return {
      request: null,
      sent: false,
      match: 'unknown',
      response: null,
      error: null,
      note: null,
    }
  }

  if (run.failure === 'blocked') {
    return {
      request: null,
      sent: false,
      match: 'blocked',
      response: null,
      error: 'Not an HTTP request.',
      note: 'The browser tried to open the database directly.',
    }
  }

  const sent = step.stage !== 'click'
  const showResponse = reached(step.stage, 'respond')

  let match: MatchState = 'unknown'
  if (run.failure === 'timeout') {
    match = showResponse ? 'timeout' : 'unknown'
  } else if (reached(step.stage, 'route')) {
    if (!run.matched) {
      match = 'missed'
    } else if (!run.methodAllowed) {
      match = 'method_not_allowed'
    } else {
      match = 'matched'
    }
  }

  return {
    request: run.request,
    sent,
    match,
    response: showResponse ? run.response : null,
    error:
      showResponse && run.failure === 'timeout'
        ? 'No response. The request timed out.'
        : null,
    note: null,
  }
}

function serverView(
  step: Step | null,
  run: Run,
  code: string[],
): ServerView {
  const on = run.failure !== 'timeout' && run.failure !== 'blocked'
  const status =
    run.failure === 'timeout'
      ? 'offline'
      : run.failure === 'blocked'
        ? 'blocked'
        : 'on'

  let note = 'Waiting for a request.'
  if (run.failure === 'blocked') {
    note = 'Not reached. No HTTP request was made.'
  } else if (run.failure === 'timeout') {
    note = 'The server is off. No code ran.'
  } else if (!step) {
    note = 'The handler is idle.'
  } else if (step.stage === 'click' || step.stage === 'send') {
    note = 'No code has run yet.'
  } else if (step.stage === 'route') {
    if (!run.matched) {
      note = 'No handler matched, so no code ran.'
    } else if (!run.methodAllowed) {
      note = 'The path exists, but no handler accepts this method.'
    } else {
      note = `The router chose the handler on line ${step.line ?? 1}.`
    }
  } else if (step.stage === 'code') {
    note = step.line ? `Line ${step.line} is running.` : 'The handler is running.'
  } else if (step.stage === 'db') {
    note = step.line
      ? `Line ${step.line} asks the database.`
      : 'The handler is asking the database.'
  } else if (step.stage === 'respond') {
    note = step.line
      ? `Line ${step.line} sends the response.`
      : 'The handler sends the response.'
  } else if (step.stage === 'done') {
    note = 'The handler finished.'
  }

  return {
    on,
    status,
    lines: code,
    activeLine: on && step?.line ? step.line : null,
    note,
  }
}

function databaseView(
  lesson: Lesson,
  step: Step | null,
  run: Run,
  tasks: Task[],
): DatabaseView {
  const locked = run.failure === 'blocked'
  const showedDatabase = step ? reached(step.stage, 'db') : false

  return {
    rows: showedDatabase ? run.tasksAfter : tasks,
    highlightId: showedDatabase && run.inserted ? run.inserted.id : null,
    sql: showedDatabase ? run.sql : null,
    locked,
    note: lesson.dbNote ?? null,
  }
}

export function buildView(
  lesson: Lesson,
  scenario: Scenario,
  step: Step | null,
  run: Run,
  title: string,
  tasks: Task[] = lesson.startingTasks,
  code: string[] = lesson.code,
): FlowView {
  return {
    active: step?.active ?? null,
    browser: browserView(lesson, scenario, step, run, title, tasks),
    api: apiView(step, run),
    server: serverView(step, run, code),
    database: databaseView(lesson, step, run, tasks),
  }
}
