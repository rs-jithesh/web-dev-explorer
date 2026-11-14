import type { Run } from '../engine/server.ts'
import type { Task } from '../engine/types'
import {
  CHECKLIST,
  DEFAULT_TITLE,
  DETAIL_COPY,
  V2_CODE_LINES,
} from './content.ts'

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
