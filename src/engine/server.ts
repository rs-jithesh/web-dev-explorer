import type { Method, RequestSpec, Task, Transport } from './types'

export interface RunRequest {
  method: Method
  path: string
  body: string | null
}

export interface RunResponse {
  status: number
  body: unknown
}

export type Failure =
  | 'timeout'
  | 'blocked'
  | 'not_found'
  | 'method_not_allowed'
  | 'invalid_json'
  | 'validation'
  | 'server_error'
  | null

export interface Reached {
  api: boolean
  server: boolean
  database: boolean
}

export interface Run {
  request: RunRequest | null
  matched: boolean
  methodAllowed: boolean
  parsed: boolean
  response: RunResponse | null
  tasksAfter: Task[]
  inserted: Task | null
  sql: string | null
  failure: Failure
  reached: Reached
}

export interface RunOptions {
  serverOn?: boolean
  transport?: Transport
}

const ROUTES: Record<string, Method[]> = {
  '/tasks': ['GET', 'POST'],
}

const NOT_REACHED: Reached = {
  api: false,
  server: false,
  database: false,
}

function nextId(tasks: Task[]) {
  return tasks.reduce((highest, task) => Math.max(highest, task.id), 0) + 1
}

function sqlString(value: string) {
  return `'${value.replace(/'/g, "''")}'`
}

function makeRun(
  request: RunRequest | null,
  tasks: Task[],
  overrides: Partial<Run> = {},
): Run {
  return {
    request,
    matched: false,
    methodAllowed: false,
    parsed: false,
    response: null,
    tasksAfter: tasks,
    inserted: null,
    sql: null,
    failure: null,
    reached: NOT_REACHED,
    ...overrides,
  }
}

function readTitle(parsed: unknown): string {
  if (
    parsed !== null &&
    typeof parsed === 'object' &&
    'title' in parsed &&
    typeof (parsed as { title?: unknown }).title === 'string'
  ) {
    return (parsed as { title: string }).title
  }
  return ''
}

/**
 * The fake server. It interprets the same request shape a browser would send
 * and returns a real response object, plus a trace of how far the request got.
 *
 * Route checks happen before the handler runs, so a 404 or 405 never reaches
 * the server code or the database. Body parsing happens before validation, so
 * invalid JSON and a missing title both stop at 400 without a write.
 */
export function handleRequest(
  request: RunRequest,
  tasks: Task[],
  options: RunOptions = {},
): Run {
  if (options.transport === 'db') {
    return makeRun(null, tasks, { failure: 'blocked' })
  }

  if (options.serverOn === false) {
    return makeRun(request, tasks, { failure: 'timeout' })
  }

  const allowed = ROUTES[request.path]

  if (!allowed) {
    return makeRun(request, tasks, {
      response: { status: 404, body: { error: 'Not found' } },
      failure: 'not_found',
      reached: { api: true, server: false, database: false },
    })
  }

  if (!allowed.includes(request.method)) {
    return makeRun(request, tasks, {
      matched: true,
      response: {
        status: 405,
        body: { error: 'Method Not Allowed', allow: allowed },
      },
      failure: 'method_not_allowed',
      reached: { api: true, server: false, database: false },
    })
  }

  const handlerReached: Reached = {
    api: true,
    server: true,
    database: false,
  }

  if (request.method === 'GET') {
    return makeRun(request, tasks, {
      matched: true,
      methodAllowed: true,
      parsed: true,
      response: { status: 200, body: tasks },
      sql: 'SELECT * FROM tasks',
      reached: { api: true, server: true, database: true },
    })
  }

  if (request.method === 'POST') {
    let parsed: unknown

    try {
      parsed = JSON.parse(request.body ?? '')
    } catch {
      return makeRun(request, tasks, {
        matched: true,
        methodAllowed: true,
        response: {
          status: 400,
          body: { error: 'Request body must be valid JSON' },
        },
        failure: 'invalid_json',
        reached: handlerReached,
      })
    }

    const title = readTitle(parsed)

    if (!title.trim()) {
      return makeRun(request, tasks, {
        matched: true,
        methodAllowed: true,
        parsed: true,
        response: { status: 400, body: { error: 'title is required' } },
        failure: 'validation',
        reached: handlerReached,
      })
    }

    const task: Task = { id: nextId(tasks), title }

    return makeRun(request, tasks, {
      matched: true,
      methodAllowed: true,
      parsed: true,
      response: { status: 201, body: task },
      tasksAfter: [...tasks, task],
      inserted: task,
      sql: `INSERT INTO tasks (title) VALUES (${sqlString(title)})`,
      reached: { api: true, server: true, database: true },
    })
  }

  return makeRun(request, tasks, {
    matched: true,
    methodAllowed: true,
    response: { status: 500, body: { error: 'No handler for this method' } },
    failure: 'server_error',
    reached: handlerReached,
  })
}

/**
 * Adapter for the scripted lesson data, which still describes requests with a
 * title instead of a raw body. New composer code should call handleRequest
 * directly with the learner's real JSON text.
 */
export function toWireRequest(request: RequestSpec): RunRequest {
  if (request.body !== undefined) {
    return {
      method: request.method,
      path: request.path,
      body: request.body,
    }
  }

  if (request.method === 'POST') {
    return {
      method: request.method,
      path: request.path,
      body: JSON.stringify({ title: request.title ?? '' }, null, 2),
    }
  }

  return {
    method: request.method,
    path: request.path,
    body: null,
  }
}

export function simulate(
  request: RequestSpec,
  tasks: Task[],
  options: RunOptions = {},
): Run {
  return handleRequest(toWireRequest(request), tasks, options)
}

/**
 * The idle state before a composer request is sent. It lets the flow cards
 * render the current database and browser list without showing a response.
 */
export function previewRun(tasks: Task[]): Run {
  return makeRun(null, tasks)
}
