import type { Failure } from './server'
import type {
  Box,
  Method,
  RefreshModeId,
  RefreshPhase,
  Stage,
  Task,
} from './types'
import wording from './tutorPrompt.json' with { type: 'json' }

export type StopArea =
  | 'browser'
  | 'network'
  | 'api'
  | 'server'
  | 'database'

export interface SnapshotStep {
  number: number
  total: number
  active: Box
  stage: Stage
  explanation: string
}

export interface SnapshotRequest {
  method: Method
  path: string
  body?: string
}

export interface SnapshotResponse {
  status: number
  body?: unknown
}

export interface SnapshotStop {
  area: StopArea
  failure: Exclude<Failure, null>
}

export interface SnapshotServer {
  lines: string[]
  activeLine: number | null
}

export interface SnapshotPrediction {
  question?: string
  selected: string
  correct?: string
  wasCorrect?: 'correct' | 'wrong'
}

export interface SnapshotRequestLogEntry {
  method: Method
  path: string
  status: number | null
}

export interface SnapshotRefresh {
  modeId: RefreshModeId
  modeLabel: string
  phase: RefreshPhase
  browserTasks?: Task[]
  requests?: SnapshotRequestLogEntry[]
}

export interface LessonSnapshot {
  lesson: { id: string; title: string }
  step?: SnapshotStep
  request?: SnapshotRequest
  response?: SnapshotResponse
  stop?: SnapshotStop
  server?: SnapshotServer
  databaseRows?: Task[]
  prediction?: SnapshotPrediction
  refresh?: SnapshotRefresh
}

/**
 * The live app state is passed in explicitly so buildSnapshot stays pure and
 * can be exercised from tests without a Svelte runtime.
 */
export interface TutorSnapshotInput {
  lesson: { id: string; title: string }
  step?: {
    index: number
    total: number
    active: Box
    stage: Stage
    explanation: string
  } | null
  request?: {
    method: Method
    path: string
    body?: string | null
  } | null
  response?: {
    status: number
    body?: unknown
  } | null
  failure?: Failure
  server?: {
    lines: string[]
    activeLine?: number | null
  } | null
  databaseRows?: Task[] | null
  prediction?: {
    question?: string
    selected?: string | null
    correct?: string | null
    verdict?: 'correct' | 'wrong' | null
  } | null
  refresh?: {
    modeId: RefreshModeId
    modeLabel: string
    phase: RefreshPhase
    browserTasks?: Task[]
    databaseRows?: Task[]
    requests?: SnapshotRequestLogEntry[]
  } | null
}

export const TUTOR_BUTTONS = wording.buttons
export const TUTOR_UI = wording.ui

const STOP_AREAS: Record<Exclude<Failure, null>, StopArea> = {
  timeout: 'network',
  blocked: 'browser',
  not_found: 'api',
  method_not_allowed: 'api',
  invalid_json: 'server',
  validation: 'server',
  server_error: 'server',
}

const STATUS_LABELS = wording.status as Record<string, string>

const ACTIVE_TERMS: Record<Box, string> = {
  browser: 'browser',
  api: 'route',
  server: 'server handler',
  database: 'database',
}

const REQUEST_BODY_TERMS = ['request body', 'body', 'json', 'payload']
const SERVER_TERMS = [
  'route',
  'router',
  'server',
  'handler',
  'backend',
  'api',
  'endpoint',
  'middleware',
  'server code',
]
const DATABASE_TERMS = [
  'database',
  'table',
  'row',
  'sql',
  'insert',
  'select',
  'persist',
  'storage',
  'db',
]
const RESPONSE_BODY_TERMS = ['response', 'response body', 'json', 'error']
const BROWSER_TERMS = [
  'browser',
  'client',
  'refresh',
  'task',
  'memory',
  'state',
  'cache',
]
const REQUEST_LOG_TERMS = [
  'request',
  'http',
  'api',
  'server',
  'route',
  'network',
  'log',
  'refresh',
]

export function buildSnapshot(input: TutorSnapshotInput): LessonSnapshot {
  const snapshot: LessonSnapshot = {
    lesson: { id: input.lesson.id, title: input.lesson.title },
  }

  if (input.step && input.step.index >= 0) {
    snapshot.step = {
      number: input.step.index + 1,
      total: input.step.total,
      active: input.step.active,
      stage: input.step.stage,
      explanation: input.step.explanation,
    }
  }

  const lastRequest = input.refresh?.requests?.length
    ? input.refresh.requests[input.refresh.requests.length - 1]
    : undefined

  const request =
    input.request ??
    (lastRequest
      ? { method: lastRequest.method, path: lastRequest.path }
      : null)

  if (request) {
    const item: SnapshotRequest = {
      method: request.method,
      path: request.path,
    }
    if (request.body !== undefined && request.body !== null) {
      item.body = request.body
    }
    snapshot.request = item
  }

  const response =
    input.response ??
    (lastRequest && lastRequest.status !== null
      ? { status: lastRequest.status }
      : null)

  if (response) {
    const item: SnapshotResponse = { status: response.status }
    if (response.body !== undefined) item.body = response.body
    snapshot.response = item
  }

  if (input.failure) {
    snapshot.stop = {
      area: STOP_AREAS[input.failure],
      failure: input.failure,
    }
  }

  if (input.server && input.server.lines.length > 0) {
    snapshot.server = {
      lines: [...input.server.lines],
      activeLine: input.server.activeLine ?? null,
    }
  }

  const rows = input.databaseRows ?? input.refresh?.databaseRows
  if (rows !== undefined && rows !== null) {
    snapshot.databaseRows = rows.map((task) => ({ ...task }))
  }

  const rawPrediction = input.prediction
  const selected = rawPrediction?.selected
  if (
    rawPrediction &&
    selected !== undefined &&
    selected !== null
  ) {
    const wasCorrect =
      rawPrediction.verdict ??
      (rawPrediction.correct
        ? selected === rawPrediction.correct
          ? 'correct'
          : 'wrong'
        : undefined)

    const prediction: SnapshotPrediction = { selected }
    if (rawPrediction.question) prediction.question = rawPrediction.question
    if (rawPrediction.correct) prediction.correct = rawPrediction.correct
    if (wasCorrect) prediction.wasCorrect = wasCorrect
    snapshot.prediction = prediction
  }

  if (input.refresh) {
    const refresh: SnapshotRefresh = {
      modeId: input.refresh.modeId,
      modeLabel: input.refresh.modeLabel,
      phase: input.refresh.phase,
    }
    if (input.refresh.browserTasks !== undefined) {
      refresh.browserTasks = input.refresh.browserTasks.map((task) => ({
        ...task,
      }))
    }
    if (input.refresh.requests !== undefined) {
      refresh.requests = input.refresh.requests.map((entry) => ({ ...entry }))
    }
    snapshot.refresh = refresh
  }

  return snapshot
}

/**
 * The terms a learner can actually see around the current step. This is a
 * focused list, not a glossary: it is meant to make the term buttons useful
 * without turning the panel into another lesson.
 */
export function termsForSnapshot(snapshot: LessonSnapshot): string[] {
  const terms: string[] = []
  const add = (term: string) => {
    if (!terms.includes(term)) terms.push(term)
  }

  if (snapshot.step) add(ACTIVE_TERMS[snapshot.step.active])

  add('status code')
  add('request')
  add('response')
  add('HTTP')
  add('browser')

  if (snapshot.request?.body !== undefined) {
    add('request body')
    add('JSON')
  }

  if (snapshot.response?.body !== undefined) {
    add('response body')
    add('JSON')
  }

  if (snapshot.server) {
    add('route')
    add('API router')
    add('server handler')
  }

  if (snapshot.databaseRows !== undefined) {
    add('database')
    add('table')
    add('row')
  }

  if (snapshot.prediction) add('prediction')

  if (snapshot.stop?.area === 'network') {
    add('timeout')
    add('network')
  }

  if (snapshot.stop?.area === 'browser') {
    add('database credentials')
    add('direct database access')
  }

  if (snapshot.refresh) {
    add('refresh')
    add('browser state')
    if (snapshot.refresh.modeId === 'api') add('persistent storage')
    add('request log')
  }

  if (snapshot.response) {
    add(
      STATUS_LABELS[String(snapshot.response.status)] ??
        String(snapshot.response.status),
    )
  }

  return terms
}

export type TutorChoice =
  | { kind: 'why' }
  | { kind: 'another' }
  | { kind: 'term'; term?: string }

export function buildPrompt(
  snapshot: LessonSnapshot,
  choice: TutorChoice,
  userText = '',
): string {
  const context = [
    wording.contextTitle,
    ...contextLines(snapshot, choice),
  ].join('\n')

  const question = questionLines(choice, userText)

  const instructions = [
    wording.instructionsTitle,
    ...wording.instructions.map((item) => `- ${item}`),
  ].join('\n')

  return [wording.role, context, question, instructions].join('\n\n')
}

function questionLines(choice: TutorChoice, userText: string): string {
  const question =
    choice.kind === 'term'
      ? choice.term?.trim()
        ? wording.questions.term.replace('{term}', choice.term.trim())
        : wording.questions.termFallback
      : wording.questions[choice.kind]

  const lines = [`${wording.questionTitle}: ${question}`]
  const ownText = userText.trim().replace(/\s+/g, ' ')
  if (ownText) lines.push(`${wording.userTextLabel}: ${ownText}`)
  return lines.join('\n')
}

function contextLines(
  snapshot: LessonSnapshot,
  choice: TutorChoice,
): string[] {
  const termChoice = choice.kind === 'term'
  const term = termChoice ? termValue(choice) : ''
  const lines: string[] = [
    `${wording.labels.lesson}: ${snapshot.lesson.title}`,
  ]

  if (snapshot.refresh) {
    lines.push(`${wording.labels.refreshMode}: ${snapshot.refresh.modeLabel}`)
  }

  if (snapshot.request) {
    lines.push(`${wording.labels.sent}: ${requestText(snapshot.request)}`)
    if (
      snapshot.request.body !== undefined &&
      (!termChoice || termHas(term, REQUEST_BODY_TERMS))
    ) {
      lines.push(`${wording.labels.requestBody}:`)
      lines.push(truncate(textValue(snapshot.request.body)))
    }
  }

  if (snapshot.prediction && !termChoice) {
    lines.push(predictionText(snapshot.prediction))
    if (snapshot.prediction.question) {
      lines.push(
        `${wording.labels.predictionQuestion}: ${snapshot.prediction.question}`,
      )
    }
  }

  lines.push(`${wording.labels.actual}: ${actualText(snapshot, choice)}`)

  if (
    snapshot.response?.body !== undefined &&
    shouldShowResponseBody(snapshot, choice)
  ) {
    lines.push(`${wording.labels.responseBody}:`)
    lines.push(truncate(valueText(snapshot.response.body)))
  }

  if (snapshot.stop) {
    lines.push(`${wording.labels.stopped}: ${wording.stop[snapshot.stop.area]}`)
  }

  const server = snapshot.server
  if (server && shouldShowServer(snapshot, choice)) {
    lines.push(`${wording.labels.serverCode}:`)
    lines.push(serverCodeText(server))
  }

  const rows = snapshot.databaseRows
  if (rows && shouldShowDatabase(snapshot, choice)) {
    lines.push(`${wording.labels.databaseRows}:`)
    lines.push(...databaseText(rows))
  }

  if (snapshot.refresh && shouldShowBrowserTasks(snapshot, choice)) {
    lines.push(`${wording.labels.browserTasks}:`)
    lines.push(...taskText(snapshot.refresh.browserTasks ?? []))
  }

  if (snapshot.refresh && shouldShowRequestLog(snapshot, choice)) {
    lines.push(`${wording.labels.requestLog}:`)
    lines.push(...requestLogText(snapshot.refresh.requests ?? []))
  }

  return lines
}

function actualText(
  snapshot: LessonSnapshot,
  choice: TutorChoice,
): string {
  if (snapshot.refresh) return refreshActualText(snapshot)

  const parts: string[] = []

  if (choice.kind !== 'term' && snapshot.step) {
    parts.push(
      wording.actual.step
        .replace('{number}', String(snapshot.step.number))
        .replace('{total}', String(snapshot.step.total))
        .replace('{box}', wording.boxes[snapshot.step.active])
        .replace('{explanation}', snapshot.step.explanation),
    )
  }

  if (snapshot.response) {
    parts.push(
      wording.actual.status.replace(
        '{status}',
        statusText(snapshot.response.status),
      ),
    )
  } else if (!snapshot.stop) {
    parts.push(
      snapshot.request
        ? wording.actual.noResponse
        : wording.actual.noRequest,
    )
  }

  if (snapshot.stop?.area === 'browser') {
    parts.push(wording.actual.blocked)
  }

  return parts.join(' ') || wording.actual.noResponse
}

function refreshActualText(snapshot: LessonSnapshot): string {
  const refresh = snapshot.refresh
  if (!refresh) return wording.actual.noResponse

  const key =
    refresh.phase === 'done'
      ? 'refreshDone'
      : refresh.phase === 'refreshing'
        ? 'refreshRefreshing'
        : 'refreshEditing'

  return wording.actual[key]
    .replace('{browserCount}', String(refresh.browserTasks?.length ?? 0))
    .replace('{databaseCount}', String(snapshot.databaseRows?.length ?? 0))
}

function predictionText(prediction: SnapshotPrediction): string {
  let text = `${wording.labels.predicted}: ${prediction.selected}.`

  if (prediction.wasCorrect === 'correct') {
    text += ` ${wording.prediction.correct}`
  } else if (prediction.wasCorrect === 'wrong') {
    text += ` ${wording.prediction.wrong}`
    if (prediction.correct) {
      text += ` ${wording.prediction.correctAnswer.replace(
        '{correct}',
        prediction.correct,
      )}`
    }
  }

  return text
}

function requestText(request: SnapshotRequest): string {
  return wording.request
    .replace('{method}', request.method)
    .replace('{path}', request.path)
}

function serverCodeText(server: SnapshotServer): string {
  return server.lines
    .map((line, index) => {
      const number = index + 1
      const marker =
        server.activeLine === number ? wording.activeLineMarker : ' '
      return `${marker} ${number} ${line}`
    })
    .join('\n')
}

function databaseText(rows: Task[]): string[] {
  if (rows.length === 0) return [wording.labels.databaseEmpty]

  const shown = rows.slice(0, wording.limits.rows)
  const lines = shown.map((task) => `- ${task.id}: ${task.title}`)
  if (rows.length > shown.length) {
    lines.push(
      wording.labels.moreRows.replace(
        '{count}',
        String(rows.length - shown.length),
      ),
    )
  }
  return lines
}

function taskText(tasks: Task[]): string[] {
  if (tasks.length === 0) return [wording.labels.browserTasksEmpty]

  const shown = tasks.slice(0, wording.limits.rows)
  const lines = shown.map((task) => `- ${task.title}`)
  if (tasks.length > shown.length) {
    lines.push(
      wording.labels.moreTasks.replace(
        '{count}',
        String(tasks.length - shown.length),
      ),
    )
  }
  return lines
}

function requestLogText(entries: SnapshotRequestLogEntry[]): string[] {
  if (entries.length === 0) return [wording.labels.requestLogEmpty]

  const shown = entries.slice(-wording.limits.requests)
  const lines: string[] = []
  const omitted = entries.length - shown.length
  if (omitted > 0) {
    lines.push(
      wording.labels.moreRequests.replace('{count}', String(omitted)),
    )
  }

  for (const entry of shown) {
    lines.push(
      wording.requestLog
        .replace('{method}', entry.method)
        .replace('{path}', entry.path)
        .replace('{status}', statusText(entry.status)),
    )
  }
  return lines
}

function statusText(status: number | null): string {
  if (status === null) return wording.labels.noResponseStatus
  return STATUS_LABELS[String(status)] ?? String(status)
}

function textValue(value: string): string {
  return value === '' ? wording.emptyValue : value
}

function valueText(value: unknown): string {
  if (value === null) return 'null'
  if (typeof value === 'string') return textValue(value)
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}

function truncate(text: string): string {
  const limit = wording.limits.bodyCharacters
  if (text.length <= limit) return text
  return `${text.slice(0, limit).trimEnd()}\n${wording.labels.truncated}`
}

function termValue(choice: Extract<TutorChoice, { kind: 'term' }>): string {
  return (choice.term ?? '').trim().toLowerCase()
}

function termHas(term: string, patterns: string[]): boolean {
  return patterns.some(
    (pattern) => term === pattern || term.includes(pattern),
  )
}

function handlerRan(snapshot: LessonSnapshot): boolean {
  if (snapshot.stop) {
    return snapshot.stop.area === 'server' || snapshot.stop.area === 'database'
  }
  if (snapshot.response) return true
  return (
    !!snapshot.step &&
    ['code', 'db', 'respond', 'done'].includes(snapshot.step.stage)
  )
}

function shouldShowResponseBody(
  snapshot: LessonSnapshot,
  choice: TutorChoice,
): boolean {
  if (!snapshot.response || snapshot.response.body === undefined) return false

  if (choice.kind === 'term') {
    return termHas(termValue(choice), RESPONSE_BODY_TERMS)
  }

  if (snapshot.response.status >= 400) return true
  return !shouldShowDatabase(snapshot, choice)
}

function shouldShowServer(
  snapshot: LessonSnapshot,
  choice: TutorChoice,
): boolean {
  if (!snapshot.server || snapshot.server.lines.length === 0) return false

  if (choice.kind === 'term') {
    return termHas(termValue(choice), SERVER_TERMS)
  }

  if (snapshot.refresh) return false
  return handlerRan(snapshot)
}

function shouldShowDatabase(
  snapshot: LessonSnapshot,
  choice: TutorChoice,
): boolean {
  if (snapshot.databaseRows === undefined) return false

  if (choice.kind === 'term') {
    return termHas(termValue(choice), DATABASE_TERMS)
  }

  if (snapshot.refresh) return snapshot.refresh.modeId === 'api'
  if (snapshot.stop) return snapshot.stop.area === 'database'
  if (snapshot.response && snapshot.response.status >= 400) return false
  if (snapshot.response) return true
  if (snapshot.step) {
    return ['db', 'respond', 'done'].includes(snapshot.step.stage)
  }
  return false
}

function shouldShowBrowserTasks(
  snapshot: LessonSnapshot,
  choice: TutorChoice,
): boolean {
  if (!snapshot.refresh) return false
  if (choice.kind !== 'term') return true
  return termHas(termValue(choice), BROWSER_TERMS)
}

function shouldShowRequestLog(
  snapshot: LessonSnapshot,
  choice: TutorChoice,
): boolean {
  if (!snapshot.refresh) return false
  if (choice.kind !== 'term') return true
  return termHas(termValue(choice), REQUEST_LOG_TERMS)
}
