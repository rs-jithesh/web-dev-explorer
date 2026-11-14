import type { RequestSpec, Task, Transport } from './types'

export interface RunRequest {
  method: 'GET' | 'POST'
  path: string
  title?: string
}

export interface RunResponse {
  status: number
  body: unknown
}

export type RunError = 'offline' | 'blocked' | null

export interface Run {
  request: RunRequest | null
  matched: boolean
  response: RunResponse | null
  tasksAfter: Task[]
  inserted: Task | null
  sql: string | null
  error: RunError
}

interface RunOptions {
  serverOn?: boolean
  transport?: Transport
}

function nextId(tasks: Task[]) {
  return tasks.reduce((highest, task) => Math.max(highest, task.id), 0) + 1
}

function sqlString(value: string) {
  return `'${value.replace(/'/g, "''")}'`
}

/**
 * A deliberately small fake server. It takes the same shape of request the
 * browser would send and returns a real response object, so break-it cases
 * produce actual status codes rather than canned text.
 */
export function simulate(
  request: RequestSpec,
  tasks: Task[],
  options: RunOptions = {},
): Run {
  if (options.transport === 'db') {
    return {
      request: null,
      matched: false,
      response: null,
      tasksAfter: tasks,
      inserted: null,
      sql: null,
      error: 'blocked',
    }
  }

  const shownRequest: RunRequest = {
    method: request.method,
    path: request.path,
    ...(request.method === 'POST' ? { title: request.title ?? '' } : {}),
  }

  if (options.serverOn === false) {
    return {
      request: shownRequest,
      matched: false,
      response: null,
      tasksAfter: tasks,
      inserted: null,
      sql: null,
      error: 'offline',
    }
  }

  if (request.method === 'GET' && request.path === '/tasks') {
    return {
      request: shownRequest,
      matched: true,
      response: { status: 200, body: tasks },
      tasksAfter: tasks,
      inserted: null,
      sql: 'SELECT * FROM tasks',
      error: null,
    }
  }

  if (request.method === 'POST' && request.path === '/tasks') {
    const title = request.title ?? ''

    if (!title) {
      return {
        request: shownRequest,
        matched: true,
        response: {
          status: 400,
          body: { error: 'title is required' },
        },
        tasksAfter: tasks,
        inserted: null,
        sql: null,
        error: null,
      }
    }

    const task: Task = { id: nextId(tasks), title }
    return {
      request: shownRequest,
      matched: true,
      response: { status: 201, body: task },
      tasksAfter: [...tasks, task],
      inserted: task,
      sql: `INSERT INTO tasks (title) VALUES (${sqlString(title)})`,
      error: null,
    }
  }

  return {
    request: shownRequest,
    matched: false,
    response: { status: 404, body: { error: 'Not found' } },
    tasksAfter: tasks,
    inserted: null,
    sql: null,
    error: null,
  }
}
