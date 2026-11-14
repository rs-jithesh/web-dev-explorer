import type { BrowserMode, Method, Payload, Step } from './types'
import type { Run } from './server'

export type StatusCode = 200 | 201 | 400 | 404 | 405

export interface StatusOption {
  value: StatusCode
  label: string
}

export const STATUS_OPTIONS: StatusOption[] = [
  { value: 200, label: '200 OK' },
  { value: 201, label: '201 Created' },
  { value: 400, label: '400 Bad Request' },
  { value: 404, label: '404 Not Found' },
  { value: 405, label: '405 Method Not Allowed' },
]

const GET_CODE = [
  'app.use(express.json());',
  "app.get('/tasks', (req, res) => {",
  '  res.status(200).json(db.all());',
  '});',
]

const POST_CODE = [
  'app.use(express.json());',
  "app.post('/tasks', (req, res) => {",
  '  const { title } = req.body;',
  '  if (!title) return res.status(400);',
  '  const task = db.insert(title);',
  '  res.status(201).json(task);',
  '});',
]

const ROUTE_CODE = [
  'app.use(express.json());',
  "app.get('/tasks', listTasks);",
  "app.post('/tasks', createTask);",
  '// No handler for this method.',
]

export function composerCode(method: Method): string[] {
  if (method === 'GET') return GET_CODE
  if (method === 'POST') return POST_CODE
  return ROUTE_CODE
}

export function composerBrowserMode(method: Method): BrowserMode {
  if (method === 'GET') return 'load'
  if (method === 'DELETE') return 'delete'
  return 'add'
}

export function pendingTitleFor(run: Run | null): string {
  if (!run?.request || run.request.method !== 'POST') return ''

  try {
    const parsed = JSON.parse(run.request.body ?? '')
    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      typeof parsed.title === 'string'
    ) {
      return parsed.title
    }
    return ''
  } catch {
    return 'New task'
  }
}

export function actualStatus(run: Run): number | 'timeout' | null {
  if (run.failure === 'timeout') return 'timeout'
  return run.response?.status ?? null
}

export function statusLabel(status: number | 'timeout' | null): string {
  if (status === 'timeout') return 'No response'
  switch (status) {
    case 200:
      return '200 OK'
    case 201:
      return '201 Created'
    case 400:
      return '400 Bad Request'
    case 404:
      return '404 Not Found'
    case 405:
      return '405 Method Not Allowed'
    case 500:
      return '500 Server Error'
    default:
      return status === null ? 'No response' : `${status}`
  }
}

export function statusSentence(run: Run): string {
  if (run.failure === 'timeout') {
    return 'No response came back. The request timed out.'
  }

  switch (run.response?.status) {
    case 200:
      return 'The server returned the current task list.'
    case 201:
      return 'The server created a new task and sent it back.'
    case 400:
      return run.failure === 'invalid_json'
        ? 'The server could not parse the JSON body, so it rejected the request.'
        : 'The server rejected the request because the title was missing or empty.'
    case 404:
      return 'No API route matched that method and path.'
    case 405:
      return 'The path exists, but it does not accept that method.'
    case 500:
      return 'The server hit an error it did not handle.'
    default:
      return 'The request completed.'
  }
}

export function failureLocation(run: Run): string {
  switch (run.failure) {
    case 'not_found':
    case 'method_not_allowed':
      return 'Stopped at the API route.'
    case 'invalid_json':
      return 'Stopped in the server code while parsing the JSON body.'
    case 'validation':
      return 'Stopped in the server code before the database write.'
    case 'timeout':
      return 'Stopped before the server answered.'
    case 'blocked':
      return 'Stopped in the browser; no HTTP request was made.'
    case 'server_error':
      return 'Stopped in the server code.'
    case null:
      return run.request?.method === 'GET'
        ? 'Reached the database and returned the list through the API.'
        : 'Reached the database and returned through the API.'
    default:
      return 'Stopped in the pipeline.'
  }
}

function parseBody(run: Run): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(run.request?.body ?? '') }
  } catch {
    return { ok: false }
  }
}

type TitleResult =
  | { kind: 'text'; value: string }
  | { kind: 'missing' }
  | { kind: 'invalid' }

function titleValue(value: unknown): TitleResult {
  if (value === null || typeof value !== 'object' || !('title' in value)) {
    return { kind: 'missing' }
  }
  const title = (value as { title?: unknown }).title
  if (typeof title !== 'string') return { kind: 'invalid' }
  return { kind: 'text', value: title }
}

function jsonText(value: unknown) {
  return JSON.stringify(value, null, 2)
}

function objectText(value: unknown) {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    const entries = Object.entries(value)
    if (entries.length === 0) return '{}'
    return `{ ${entries
      .map(([key, item]) => `${key}: ${JSON.stringify(item)}`)
      .join(', ')} }`
  }
  return JSON.stringify(value)
}

function isJson(text: string) {
  try {
    JSON.parse(text)
    return true
  } catch {
    return false
  }
}

function payloadText(run: Run): Payload | undefined {
  if (!run.request || run.request.method !== 'POST') return undefined

  const parsed = parseBody(run)
  if (!parsed.ok) {
    return {
      box: 'browser',
      shape: 'text',
      label: 'Text in the composer',
      value: run.request.body || '(empty body)',
      note: 'This is the text you sent; it is not valid JSON yet.',
    }
  }

  const title = titleValue(parsed.value)
  if (title.kind === 'text') {
    return {
      box: 'browser',
      shape: 'text',
      label: 'Form field text',
      value: title.value || '(empty)',
      note: 'The title is plain text before the browser serializes it.',
    }
  }

  return {
    box: 'browser',
    shape: 'text',
    label: 'Form field text',
    value: title.kind === 'invalid' ? '(not text)' : '(no title)',
    note:
      title.kind === 'invalid'
        ? 'The title field is not text, so the server cannot use it.'
        : 'The JSON has no title field.',
  }
}

function payloadRequest(run: Run): Payload | undefined {
  if (!run.request || run.request.body === null) return undefined
  const body = run.request.body
  return {
    box: 'api',
    shape: 'json-request',
    label: 'JSON string in the request',
    value: body || '(empty body)',
    note: isJson(body)
      ? 'The browser serializes the request as JSON for the wire.'
      : 'This text is not valid JSON; the server will reject it.',
  }
}

function payloadInvalidJson(run: Run): Payload | undefined {
  if (!run.request || run.request.method !== 'POST') return undefined
  const parsed = parseBody(run)
  if (parsed.ok) return undefined
  return {
    box: 'server',
    shape: 'json-request',
    label: 'Invalid JSON in the request',
    value: run.request.body || '(empty body)',
    note: 'The server cannot parse this text into a JavaScript object.',
  }
}

function payloadObject(run: Run): Payload | undefined {
  if (!run.request || run.request.method !== 'POST') return undefined
  const parsed = parseBody(run)
  if (!parsed.ok) return undefined

  const title = titleValue(parsed.value)
  const isObject =
    parsed.value !== null &&
    typeof parsed.value === 'object' &&
    !Array.isArray(parsed.value)

  return {
    box: 'server',
    shape: 'object',
    label: isObject
      ? 'JavaScript object on the server'
      : 'JavaScript value on the server',
    value: objectText(parsed.value),
    note:
      title.kind === 'text' && title.value.trim()
        ? 'The server parses the JSON into a JavaScript object.'
        : 'The server parses the JSON, but the object has no usable title.',
  }
}

function payloadRow(run: Run): Payload | undefined {
  if (run.request?.method === 'GET') {
    const rows = run.tasksAfter
      .map((task) => `${task.id} · ${task.title}`)
      .join('\n')
    return {
      box: 'database',
      shape: 'row',
      label: 'Rows in the table',
      value: rows || '(no rows)',
      note: 'The database returns the stored rows to the server.',
    }
  }

  if (!run.inserted) return undefined
  return {
    box: 'database',
    shape: 'row',
    label: 'Row in the table',
    value: `id ${run.inserted.id} · ${run.inserted.title}`,
    note: 'The database stores the object as a row.',
  }
}

function payloadResponse(run: Run): Payload | undefined {
  if (!run.response || run.response.status >= 400) return undefined
  return {
    box: 'api',
    shape: 'json-response',
    label: 'JSON string in the response',
    value: jsonText(run.response.body),
    note:
      run.request?.method === 'GET'
        ? 'The server serializes the task rows into a JSON array.'
        : 'The server serializes the saved row into JSON for the response.',
  }
}

function payloadList(run: Run): Payload | undefined {
  if (!run.response || run.response.status >= 400) return undefined
  if (run.request?.method === 'GET') {
    const items = run.tasksAfter.map((task) => task.title).join('\n')
    return {
      box: 'browser',
      shape: 'list-item',
      label: 'List items in the browser',
      value: items || '(empty list)',
      note: 'The browser turns each JSON array entry into a list item.',
    }
  }

  if (!run.inserted) return undefined
  return {
    box: 'browser',
    shape: 'list-item',
    label: 'List item in the browser',
    value: run.inserted.title,
    note: 'The browser parses the JSON and renders a list item.',
  }
}

/**
 * Builds the walkthrough from what the fake server actually did. A 404 or 405
 * never gets a server-code or database step; a parse or validation failure
 * stops before the database; a timeout never reaches the API route.
 */
export function stepsForRun(run: Run): Step[] {
  const method = run.request?.method ?? 'POST'
  const path = run.request?.path ?? '/tasks'
  const steps: Step[] = [
    {
      active: 'browser',
      stage: 'click',
      explanation: `You pressed Send. The browser builds ${method} ${path}, but nothing has left yet.`,
      payload: payloadText(run),
    },
    {
      active: 'browser',
      stage: 'send',
      explanation:
        method === 'POST'
          ? `The browser sends ${method} ${path} with the JSON body.`
          : `The browser sends ${method} ${path}.`,
      payload: payloadRequest(run),
    },
  ]

  if (run.failure === 'timeout') {
    steps.push({
      active: 'api',
      stage: 'respond',
      explanation:
        'No server answers. The browser waits, then gives up with a timeout.',
    })
    steps.push({
      active: 'browser',
      stage: 'done',
      explanation:
        'The browser shows a timeout. The request may or may not have arrived.',
    })
    return steps
  }

  if (!run.matched) {
    steps.push({
      active: 'api',
      stage: 'route',
      explanation: `The router has no route for ${method} ${path}, so it stops at the API layer.`,
      payload: payloadRequest(run),
    })
    steps.push({
      active: 'api',
      stage: 'respond',
      explanation:
        'The server returns 404 Not Found. No server code ran and the database was never touched.',
    })
    steps.push({
      active: 'browser',
      stage: 'done',
      explanation:
        'The browser shows the 404. Nothing was read from or written to the database.',
    })
    return steps
  }

  if (!run.methodAllowed) {
    steps.push({
      active: 'api',
      stage: 'route',
      explanation: `The path ${path} exists, but it does not accept ${method}. The router stops here.`,
      payload: payloadRequest(run),
    })
    steps.push({
      active: 'api',
      stage: 'respond',
      explanation:
        'The server returns 405 Method Not Allowed. No handler ran and the database was not touched.',
    })
    steps.push({
      active: 'browser',
      stage: 'done',
      explanation:
        'The browser shows the 405. The request never reached the server code.',
    })
    return steps
  }

  steps.push({
    active: 'api',
    stage: 'route',
    line: 2,
    explanation: `The router matches ${method} ${path} to a handler.`,
    payload: payloadRequest(run),
  })

  if (method === 'GET') {
    steps.push({
      active: 'server',
      stage: 'code',
      line: 3,
      explanation: 'The handler asks the database for every task.',
    })
    steps.push({
      active: 'database',
      stage: 'db',
      line: 3,
      explanation:
        'The database runs SELECT * FROM tasks and returns the rows.',
      payload: payloadRow(run),
    })
    steps.push({
      active: 'api',
      stage: 'respond',
      line: 3,
      explanation: 'The server sends 200 OK with the tasks as a JSON array.',
      payload: payloadResponse(run),
    })
    steps.push({
      active: 'browser',
      stage: 'done',
      explanation:
        'The browser renders the list. GET only reads; it does not change the database.',
      payload: payloadList(run),
    })
    return steps
  }

  if (method === 'POST') {
    if (run.failure === 'invalid_json') {
      steps.push({
        active: 'server',
        stage: 'code',
        line: 1,
        explanation:
          'The JSON body parser cannot parse the body, so the request stops before the handler line.',
        payload: payloadInvalidJson(run),
      })
      steps.push({
        active: 'api',
        stage: 'respond',
        line: 1,
        explanation:
          'The server sends 400 Bad Request with an error. The handler and database were never reached.',
      })
      steps.push({
        active: 'browser',
        stage: 'done',
        explanation: 'The browser shows the 400. No task was written.',
      })
      return steps
    }

    if (run.failure === 'validation') {
      steps.push({
        active: 'server',
        stage: 'code',
        line: 3,
        explanation:
          'The handler reads title from the parsed JSON body. It is missing or empty.',
        payload: payloadObject(run),
      })
      steps.push({
        active: 'server',
        stage: 'code',
        line: 4,
        explanation:
          'The guard on line 4 rejects the request with 400 before the insert.',
        payload: payloadObject(run),
      })
      steps.push({
        active: 'api',
        stage: 'respond',
        line: 4,
        explanation:
          'The server sends 400 Bad Request. The database insert never ran.',
      })
      steps.push({
        active: 'browser',
        stage: 'done',
        explanation:
          'The browser shows the error and leaves the list unchanged. No row was written.',
      })
      return steps
    }

    if (run.failure) {
      steps.push({
        active: 'server',
        stage: 'code',
        line: 2,
        explanation: 'The handler starts but cannot complete the request.',
        payload: payloadObject(run),
      })
      steps.push({
        active: 'api',
        stage: 'respond',
        line: 2,
        explanation:
          'The server returns an error. The database was not changed.',
      })
      steps.push({
        active: 'browser',
        stage: 'done',
        explanation: 'The browser shows the error.',
      })
      return steps
    }

    steps.push({
      active: 'server',
      stage: 'code',
      line: 3,
      explanation:
        'The handler reads title from the parsed JSON body and checks that it is not empty.',
      payload: payloadObject(run),
    })
    steps.push({
      active: 'database',
      stage: 'db',
      line: 5,
      explanation:
        'The handler inserts the row. The database, not the browser, writes the data.',
      payload: payloadRow(run),
    })
    steps.push({
      active: 'api',
      stage: 'respond',
      line: 6,
      explanation:
        'The server sends 201 Created and the saved task as JSON.',
      payload: payloadResponse(run),
    })
    steps.push({
      active: 'browser',
      stage: 'done',
      explanation:
        'The browser adds the saved task to the list. The round trip is complete.',
      payload: payloadList(run),
    })
    return steps
  }

  steps.push({
    active: 'api',
    stage: 'respond',
    explanation:
      'The route is matched, but no handler is implemented for this method.',
  })
  steps.push({
    active: 'browser',
    stage: 'done',
    explanation: 'The browser shows the result.',
  })
  return steps
}
