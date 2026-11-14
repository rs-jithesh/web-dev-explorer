import type {
  Method,
  RefreshConfig,
  RefreshModeData,
  RefreshModeId,
  RefreshPhase,
  Task,
} from './types'
import { handleRequest } from './server'
import { SHOW_PREDICTIONS } from './features'

export interface RequestLogEntry {
  id: number
  method: Method
  path: string
  status: number | null
}

/**
 * The refresh test has a smaller, separate state machine because it is about
 * persistence across requests, not one request walkthrough.
 */
export class RefreshTestStore {
  readonly config: RefreshConfig

  modeId = $state<RefreshModeId>('browser')
  input = $state('')
  browserTasks = $state<Task[]>([])
  dbTasks = $state<Task[]>([])
  prediction = $state<number | null>(null)
  validation = $state<string | null>(null)
  inputError = $state<string | null>(null)
  phase = $state<RefreshPhase>('editing')
  lastAddedId = $state<number | null>(null)
  requests = $state<RequestLogEntry[]>([])

  requestId = 0
  refreshToken = 0
  timer: ReturnType<typeof setTimeout> | null = null

  constructor(config: RefreshConfig) {
    this.config = config
    this.reset()
  }

  get mode(): RefreshModeData {
    return (
      this.config.modes.find((mode) => mode.id === this.modeId) ??
      this.config.modes[0]
    )
  }

  get verdict(): 'correct' | 'wrong' | null {
    if (
      !SHOW_PREDICTIONS ||
      this.phase !== 'done' ||
      this.prediction === null
    ) {
      return null
    }
    return this.prediction === this.mode.prediction.correctIndex
      ? 'correct'
      : 'wrong'
  }

  get editing(): boolean {
    return this.phase === 'editing'
  }

  selectMode(id: RefreshModeId) {
    if (id === this.modeId) return
    if (!this.config.modes.some((mode) => mode.id === id)) return
    this.modeId = id
    this.reset()
  }

  addTask(): 'added' | 'invalid' | 'ignored' {
    if (this.phase !== 'editing') return 'ignored'

    const title = this.input.trim()
    if (!title) {
      this.inputError = 'Type a task first.'
      return 'invalid'
    }

    this.inputError = null
    this.validation = null
    this.prediction = null
    this.input = ''

    if (this.modeId === 'browser') {
      const task: Task = {
        id:
          this.browserTasks.reduce(
            (highest, item) => Math.max(highest, item.id),
            0,
          ) + 1,
        title,
      }
      this.browserTasks = [...this.browserTasks, task]
      this.lastAddedId = task.id
      return 'added'
    }

    const run = handleRequest(
      { method: 'POST', path: '/tasks', body: JSON.stringify({ title }) },
      this.dbTasks,
      { serverOn: true },
    )
    const status = run.response?.status ?? null
    this.requests = [
      ...this.requests,
      { id: ++this.requestId, method: 'POST', path: '/tasks', status },
    ]

    if (run.response?.status === 201 && run.inserted) {
      this.dbTasks = run.tasksAfter
      this.browserTasks = run.tasksAfter
      this.lastAddedId = run.inserted.id
      return 'added'
    }

    this.inputError = 'The server rejected the task.'
    return 'invalid'
  }

  refresh(): 'started' | 'prompt' | 'ignored' {
    if (this.phase !== 'editing') return 'ignored'
    if (SHOW_PREDICTIONS && this.prediction === null) {
      this.validation = 'Choose what you expect first.'
      return 'prompt'
    }

    this.validation = null
    this.input = ''
    this.inputError = null
    this.phase = 'refreshing'
    this.browserTasks = []
    this.lastAddedId = null

    const token = ++this.refreshToken
    this.clearTimer()
    this.timer = setTimeout(() => {
      if (token !== this.refreshToken) return

      if (this.modeId === 'api') {
        const run = handleRequest(
          { method: 'GET', path: '/tasks', body: null },
          this.dbTasks,
          { serverOn: true },
        )
        const status = run.response?.status ?? null
        this.requests = [
          ...this.requests,
          { id: ++this.requestId, method: 'GET', path: '/tasks', status },
        ]
        this.browserTasks =
          status === 200 ? ((run.response?.body as Task[]) ?? []) : []
      }

      this.phase = 'done'
    }, 700)

    return 'started'
  }

  reset() {
    this.refreshToken += 1
    this.clearTimer()
    this.input = ''
    this.browserTasks = []
    this.dbTasks = (this.config.startingTasks ?? []).map((task) => ({ ...task }))
    this.prediction = null
    this.validation = null
    this.inputError = null
    this.phase = 'editing'
    this.lastAddedId = null
    this.requests = []
    this.requestId = 0
  }

  dispose() {
    this.refreshToken += 1
    this.clearTimer()
  }

  clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }
}
