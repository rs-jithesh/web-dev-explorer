import type { Run } from '../engine/server.ts'
import type { Task } from '../engine/types'
import {
  CHECKLIST,
  DEFAULT_TITLE,
  DETAIL_COPY,
  V2_CODE_LINES,
} from './content.ts'
import type { ExplorerLesson } from './lessons.ts'

export interface MonoBlock {
  kind: 'mono'
  title: string
  lines: string[]
  caption?: string
  highlightLine?: number
  wide?: boolean
  tone?: 'plain' | 'code'
}

export interface TableBlock {
  kind: 'table'
  title: string
  tasks: Task[]
  highlightId?: number | null
  caption?: string
  wide?: boolean
}

export interface NoteBlock {
  kind: 'note'
  text: string
  tone?: 'info' | 'plain'
  wide?: boolean
}

export interface ChecklistBlock {
  kind: 'checklist'
  title: string
  items: string[]
  wide?: boolean
}

export type EvidenceBlock =
  | MonoBlock
  | TableBlock
  | NoteBlock
  | ChecklistBlock

function jsonBody(value: unknown): string {
  return JSON.stringify(value)
}

function requestLines(title: string): string[] {
  const safeTitle = title.trim() || DEFAULT_TITLE
  return [
    'POST /tasks HTTP/1.1',
    'Host: my-tasks.app',
    'Content-Type: application/json',
    '',
    `{"title":"${safeTitle}"}`,
  ]
}

function responseLines(run: Run): string[] {
  const body = run.response?.body ?? { id: 3, title: DEFAULT_TITLE }
  return [
    `HTTP/1.1 ${run.response?.status ?? 201} Created`,
    'Content-Type: application/json',
    '',
    jsonBody(body),
  ]
}

function taskRows(tasks: Task[]): Task[] {
  return tasks.map((task) => ({ ...task }))
}

export function evidenceForStep(
  stepIndex: number,
  title: string,
  run: Run,
  tasksBefore: Task[],
): EvidenceBlock[] {
  const safeTitle = title.trim() || DEFAULT_TITLE
  const after = run.tasksAfter
  const before = tasksBefore.length > 0 ? tasksBefore : run.tasksAfter
  const insertedId = run.inserted?.id ?? after[after.length - 1]?.id ?? 3

  switch (stepIndex) {
    case 0:
      return [
        {
          kind: 'mono',
          title: DETAIL_COPY.requestSent,
          lines: requestLines(safeTitle),
          wide: true,
        },
        {
          kind: 'mono',
          title: DETAIL_COPY.formValue,
          lines: ['input type="text"', `title = "${safeTitle}"`],
          wide: true,
          tone: 'code',
        },
        {
          kind: 'note',
          text: 'The browser has the title. It sends a message to the server instead of writing the row itself.',
          tone: 'info',
          wide: true,
        },
        {
          kind: 'checklist',
          title: DETAIL_COPY.checkTitle,
          items: CHECKLIST.send,
          wide: true,
        },
      ]

    case 1:
      return [
        {
          kind: 'mono',
          title: DETAIL_COPY.route,
          lines: ['POST /tasks', '→ createTask', 'handlers/tasks.ts'],
          wide: true,
          tone: 'code',
        },
        {
          kind: 'mono',
          title: DETAIL_COPY.routeCheck,
          lines: ['method = POST', 'path = /tasks', 'router matched ✓'],
          wide: true,
        },
        {
          kind: 'note',
          text: 'The router checks the method and path before any handler code runs.',
          tone: 'info',
          wide: true,
        },
        {
          kind: 'checklist',
          title: DETAIL_COPY.checkTitle,
          items: CHECKLIST.route,
          wide: true,
        },
      ]

    case 2:
      return [
        {
          kind: 'mono',
          title: DETAIL_COPY.request,
          lines: requestLines(safeTitle),
        },
        {
          kind: 'mono',
          title: DETAIL_COPY.response,
          lines: responseLines(run),
        },
        {
          kind: 'mono',
          title: DETAIL_COPY.code,
          lines: V2_CODE_LINES,
          highlightLine: 2,
          caption: DETAIL_COPY.titleCaption.replace('{title}', safeTitle),
          tone: 'code',
        },
        {
          kind: 'table',
          title: DETAIL_COPY.table,
          tasks: taskRows(after),
          highlightId: insertedId,
        },
        {
          kind: 'checklist',
          title: DETAIL_COPY.checkTitle,
          items: CHECKLIST.code,
          wide: true,
        },
      ]

    case 3:
      return [
        {
          kind: 'mono',
          title: DETAIL_COPY.sql,
          lines: [`INSERT INTO tasks (title) VALUES ('${safeTitle}');`],
          wide: true,
          tone: 'code',
        },
        {
          kind: 'note',
          text: DETAIL_COPY.sqlExplanation,
          tone: 'info',
          wide: true,
        },
        {
          kind: 'table',
          title: DETAIL_COPY.tableBefore,
          tasks: taskRows(before),
        },
        {
          kind: 'table',
          title: DETAIL_COPY.tableAfter,
          tasks: taskRows(after),
          highlightId: insertedId,
        },
        {
          kind: 'note',
          text: DETAIL_COPY.idNote,
          tone: 'info',
          wide: true,
        },
        {
          kind: 'checklist',
          title: DETAIL_COPY.checkTitle,
          items: CHECKLIST.store,
          wide: true,
        },
      ]

    default:
      return [
        {
          kind: 'mono',
          title: DETAIL_COPY.responseSent,
          lines: responseLines(run),
          wide: true,
        },
        {
          kind: 'table',
          title: DETAIL_COPY.browserList,
          tasks: taskRows(after),
          highlightId: insertedId,
        },
        {
          kind: 'note',
          text: 'The browser renders the response. The database row was written by the server, not by the browser.',
          tone: 'info',
          wide: true,
        },
        {
          kind: 'checklist',
          title: DETAIL_COPY.checkTitle,
          items: CHECKLIST.respond,
          wide: true,
        },
      ]
  }
}

function genericStatusText(run: Run): string {
  if (run.failure === 'timeout') return 'No response'
  const status = run.response?.status
  const labels: Record<number, string> = {
    200: 'OK',
    201: 'Created',
    400: 'Bad Request',
    404: 'Not Found',
    405: 'Method Not Allowed',
    500: 'Server Error',
  }
  return status ? `${status} ${labels[status] ?? ''}`.trim() : 'No response'
}

function genericRequestLines(
  run: Run,
  title: string,
): string[] {
  if (!run.request) return ['No HTTP request was made.']
  const lines = [
    `${run.request.method} ${run.request.path} HTTP/1.1`,
    'Host: my-tasks.app',
  ]
  if (run.request.body !== null) {
    lines.push('Content-Type: application/json', '', run.request.body)
  } else {
    lines.push('Accept: application/json', '', 'No body.')
  }
  return lines
}

function genericResponseLines(run: Run): string[] {
  if (!run.response) {
    return [
      run.failure === 'timeout'
        ? 'No response. The browser timed out.'
        : 'No response was returned.',
    ]
  }
  return [
    `HTTP/1.1 ${genericStatusText(run)}`,
    'Content-Type: application/json',
    '',
    JSON.stringify(run.response.body ?? null),
  ]
}

function notReachedNote(text: string): NoteBlock {
  return {
    kind: 'note',
    text,
    tone: 'info',
    wide: true,
  }
}

/**
 * Explorer evidence for every lesson and case. Add's success flow keeps the
 * hand-built receipts from the design; the remaining stories use the same
 * blocks driven by the fake server's actual run.
 */
export function evidenceFor(
  lesson: ExplorerLesson,
  stepIndex: number,
  title: string,
  run: Run,
  tasksBefore: Task[],
): EvidenceBlock[] {
  if (
    (lesson.id === 'add' || lesson.id === 'boundary') &&
    run.failure === null &&
    run.request?.method === 'POST'
  ) {
    return evidenceForStep(stepIndex, title, run, tasksBefore)
  }

  const after = run.tasksAfter
  const before = tasksBefore.length > 0 ? tasksBefore : after
  const insertedId = run.inserted?.id ?? after[after.length - 1]?.id ?? 3
  const requestBlock: MonoBlock = {
    kind: 'mono',
    title: DETAIL_COPY.requestSent,
    lines: genericRequestLines(run, title),
    wide: true,
  }
  const responseBlock: MonoBlock = {
    kind: 'mono',
    title: DETAIL_COPY.responseSent,
    lines: genericResponseLines(run),
    wide: true,
  }

  if (run.failure === 'blocked') {
    switch (stepIndex) {
      case 0:
        return [
          {
            kind: 'mono',
            title: 'THE BROWSER’S ATTEMPT',
            lines: ['tasks.db', '→ open connection', 'credentials: none'],
            wide: true,
            tone: 'code',
          },
          notReachedNote(
            'The browser has no database driver and no credentials. It cannot open the table directly.',
          ),
        ]
      case 1:
        return [
          notReachedNote('No HTTP request was made, so the API router is skipped.'),
          {
            kind: 'checklist',
            title: DETAIL_COPY.checkTitle,
            items: CHECKLIST.route,
            wide: true,
          },
        ]
      case 2:
        return [
          notReachedNote('The server process is not involved in this attempt.'),
        ]
      case 3:
        return [
          notReachedNote('The database accepts only the server process. The browser is refused.'),
        ]
      default:
        return [
          notReachedNote('The attempt fails. This is why the browser has to go through the API and server.'),
          {
            kind: 'checklist',
            title: DETAIL_COPY.checkTitle,
            items: CHECKLIST.code,
            wide: true,
          },
        ]
    }
  }

  if (run.failure === 'timeout') {
    switch (stepIndex) {
      case 0:
        return [requestBlock]
      case 1:
        return [notReachedNote('No server is listening, so no response comes back.')]
      case 2:
        return [notReachedNote('The browser keeps waiting for a reply.')]
      case 3:
        return [
          {
            kind: 'table',
            title: DETAIL_COPY.tableBefore,
            tasks: taskRows(before),
            caption: 'No database connection was opened.',
            wide: true,
          },
        ]
      default:
        return [
          notReachedNote('The browser times out. It cannot know whether anything was written.'),
          {
            kind: 'checklist',
            title: DETAIL_COPY.checkTitle,
            items: CHECKLIST.respond,
            wide: true,
          },
        ]
    }
  }

  if (run.failure === 'not_found' || run.failure === 'method_not_allowed') {
    switch (stepIndex) {
      case 0:
        return [requestBlock]
      case 1:
        return [
          {
            kind: 'mono',
            title: DETAIL_COPY.routeCheck,
            lines: [
              `method = ${run.request?.method ?? 'POST'}`,
              `path = ${run.request?.path ?? '/tasks'}`,
              run.matched ? 'path matched' : 'no route matched',
              run.matched
                ? run.methodAllowed
                  ? 'method allowed'
                  : 'method not allowed'
                : 'handler not selected',
            ],
            wide: true,
          },
        ]
      case 2:
        return [notReachedNote('No handler runs. The server code is never entered.')]
      case 3:
        return [
          {
            kind: 'table',
            title: DETAIL_COPY.table,
            tasks: taskRows(before),
            caption: '0 rows changed. The database was not opened.',
            wide: true,
          },
        ]
      default:
        return [
          responseBlock,
          {
            kind: 'checklist',
            title: DETAIL_COPY.checkTitle,
            items: CHECKLIST.route,
            wide: true,
          },
        ]
    }
  }

  if (run.failure === 'invalid_json' || run.failure === 'validation') {
    switch (stepIndex) {
      case 0:
        return [requestBlock]
      case 1:
        return [
          {
            kind: 'mono',
            title: DETAIL_COPY.route,
            lines: [
              `${run.request?.method ?? 'POST'} ${run.request?.path ?? '/tasks'}`,
              '→ handler matched',
            ],
            tone: 'code',
            wide: true,
          },
        ]
      case 2:
        return [
          {
            kind: 'mono',
            title: DETAIL_COPY.code,
            lines: lesson.codeLines,
            highlightLine: run.failure === 'invalid_json' ? 0 : 1,
            tone: 'code',
            wide: true,
          },
        ]
      case 3:
        return [
          {
            kind: 'table',
            title: DETAIL_COPY.table,
            tasks: taskRows(before),
            caption: '0 rows written. The database insert was never reached.',
            wide: true,
          },
        ]
      default:
        return [
          responseBlock,
          {
            kind: 'checklist',
            title: DETAIL_COPY.checkTitle,
            items: CHECKLIST.code,
            wide: true,
          },
        ]
    }
  }

  if (lesson.id === 'refresh') {
    switch (stepIndex) {
      case 0:
        return [
          notReachedNote(
            'The browser’s in-memory list is gone. The database still has the rows.',
          ),
        ]
      case 1:
        return [requestBlock]
      case 2:
        return [
          {
            kind: 'mono',
            title: DETAIL_COPY.code,
            lines: lesson.codeLines,
            highlightLine: 1,
            tone: 'code',
            wide: true,
          },
        ]
      case 3:
        return [
          {
            kind: 'table',
            title: DETAIL_COPY.table,
            tasks: taskRows(after),
            wide: true,
          },
        ]
      default:
        return [
          responseBlock,
          {
            kind: 'checklist',
            title: DETAIL_COPY.checkTitle,
            items: CHECKLIST.respond,
            wide: true,
          },
        ]
    }
  }

  if (run.request?.method === 'GET') {
    switch (stepIndex) {
      case 0:
        return [requestBlock]
      case 1:
        return [
          {
            kind: 'mono',
            title: DETAIL_COPY.route,
            lines: ['GET /tasks', '→ listTasks', 'handlers/tasks.ts'],
            tone: 'code',
            wide: true,
          },
        ]
      case 2:
        return [
          {
            kind: 'mono',
            title: DETAIL_COPY.code,
            lines: lesson.codeLines,
            highlightLine: 1,
            tone: 'code',
            wide: true,
          },
        ]
      case 3:
        return [
          {
            kind: 'table',
            title: DETAIL_COPY.table,
            tasks: taskRows(after),
            highlightId: insertedId,
            wide: true,
          },
        ]
      default:
        return [
          responseBlock,
          {
            kind: 'checklist',
            title: DETAIL_COPY.checkTitle,
            items: CHECKLIST.respond,
            wide: true,
          },
        ]
    }
  }

  return evidenceForStep(stepIndex, title, run, tasksBefore)
}
