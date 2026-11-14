import type {
  ComposerPreset,
  Lesson,
  Method,
  RequestSpec,
  Scenario,
  Step,
  Task,
} from './types'
import type { Run } from './server'
import { handleRequest } from './server'
import { stepsForRun, type StatusCode } from './composer'
import { SHOW_PREDICTIONS } from './features'

/**
 * One store for the player and the request composer. Scripted lessons continue
 * to use the scenario steps; the composer lesson uses steps generated from the
 * fake server's real result.
 */
export class Player {
  readonly lessons: Lesson[]

  lessonIndex = $state(0)
  scenarioId = $state<string | null>(null)
  stepIndex = $state(-1)
  selected = $state<number | null>(null)
  locked = $state<number | null>(null)
  prompted = $state(false)
  pendingStart = $state(false)
  validation = $state<string | null>(null)
  title = $state('')
  mainTitle = $state('')
  mainStep = $state(-1)

  composerMethod = $state<Method>('POST')
  composerPath = $state('/tasks')
  composerBody = $state('')
  composerStatus = $state<StatusCode | null>(null)
  composerSent = $state(false)
  composerRun = $state<Run | null>(null)
  composerSteps = $state<Step[]>([])
  composerTasks = $state<Task[]>([])
  composerValidation = $state<string | null>(null)
  autoPlay = $state(false)

  constructor(lessons: Lesson[]) {
    this.lessons = lessons
    this.reset()
  }

  get lesson(): Lesson {
    return this.lessons[this.lessonIndex]
  }

  get scenario(): Scenario {
    if (this.scenarioId === null) return this.lesson.main
    return (
      this.lesson.breakIts.find((item) => item.id === this.scenarioId) ??
      this.lesson.main
    )
  }

  get isMain(): boolean {
    return this.scenarioId === null
  }

  get isComposer(): boolean {
    return this.lesson.composer !== undefined && this.scenarioId === null
  }

  get steps(): Step[] {
    return this.isComposer ? this.composerSteps : this.scenario.steps
  }

  get step(): Step | null {
    return this.steps[this.stepIndex] ?? null
  }

  get totalSteps(): number {
    return this.steps.length
  }

  get atEnd(): boolean {
    if (this.isComposer) {
      return (
        this.composerSent &&
        this.stepIndex === this.composerSteps.length - 1
      )
    }
    return this.stepIndex === this.scenario.steps.length - 1
  }

  get canStep(): boolean {
    if (this.isComposer) {
      return (
        this.composerSent &&
        this.stepIndex < this.composerSteps.length - 1
      )
    }
    if (!SHOW_PREDICTIONS) {
      return this.stepIndex < this.scenario.steps.length - 1
    }
    return this.locked !== null && this.stepIndex < this.scenario.steps.length - 1
  }

  get canBack(): boolean {
    if (this.isComposer) return this.composerSent && this.stepIndex > 0
    return this.stepIndex >= 0
  }

  get canTrigger(): boolean {
    return this.stepIndex < 0
  }

  get request(): RequestSpec {
    const request = this.scenario.request
    if (request.method !== 'POST') return request
    return { ...request, title: this.title }
  }

  get verdict(): 'correct' | 'wrong' | null {
    if (this.isComposer) return null
    if (!this.isMain || !this.atEnd || this.locked === null) return null
    return this.locked === this.lesson.prediction.correctIndex
      ? 'correct'
      : 'wrong'
  }

  get composerActualStatus(): number | 'timeout' | null {
    if (!this.composerRun) return null
    if (this.composerRun.failure === 'timeout') return 'timeout'
    return this.composerRun.response?.status ?? null
  }

  get statusVerdict(): 'correct' | 'wrong' | null {
    if (
      !SHOW_PREDICTIONS ||
      !this.isComposer ||
      !this.composerSent ||
      this.composerStatus === null
    ) {
      return null
    }
    if (this.stepIndex !== this.composerSteps.length - 1) return null
    const actual = this.composerActualStatus
    if (actual === null) return 'wrong'
    return this.composerStatus === actual ? 'correct' : 'wrong'
  }

  get statusFinished(): boolean {
    return (
      this.isComposer &&
      this.composerSent &&
      this.stepIndex === this.composerSteps.length - 1
    )
  }

  selectLesson(index: number) {
    this.lessonIndex = index
    this.reset()
  }

  selectGuess(index: number) {
    if (this.locked !== null) return
    this.selected = index
    this.validation = null
  }

  lockGuess(): 'started' | 'locked' | 'invalid' {
    if (this.locked !== null) return 'locked'
    if (this.selected === null) {
      this.validation = 'Choose an answer first.'
      return 'invalid'
    }

    this.locked = this.selected
    this.validation = null
    this.prompted = false

    const shouldStart = this.pendingStart
    this.pendingStart = false

    if (shouldStart && this.stepIndex < 0) {
      this.stepIndex = 0
      return 'started'
    }

    return 'locked'
  }

  editTitle(value: string) {
    if (!this.isMain || this.stepIndex >= 0) return
    this.title = value
  }

  trigger(): 'started' | 'prompt' | 'ignored' {
    if (!this.canTrigger) return 'ignored'
    if (this.locked !== null || !SHOW_PREDICTIONS) {
      this.stepIndex = 0
      return 'started'
    }

    this.prompted = true
    this.pendingStart = true
    return 'prompt'
  }

  send(): 'started' | 'prompt' | 'ignored' {
    if (!this.isComposer || this.composerSent) return 'ignored'

    if (SHOW_PREDICTIONS && this.composerStatus === null) {
      this.composerValidation = 'Choose the status you expect first.'
      return 'prompt'
    }

    const method = this.composerMethod
    const path = this.composerPath.trim() || '/'
    const body = method === 'POST' ? this.composerBody : null
    const run = handleRequest({ method, path, body }, this.composerTasks, {
      serverOn: true,
    })

    this.composerRun = run
    this.composerSteps = stepsForRun(run)
    this.composerSent = true
    this.composerValidation = null
    this.stepIndex = 0
    this.autoPlay = true
    return 'started'
  }

  setComposerMethod(method: Method) {
    if (this.composerSent) return
    this.composerMethod = method
    this.composerStatus = null
    this.composerValidation = null
  }

  setComposerPath(path: string) {
    if (this.composerSent) return
    this.composerPath = path
    this.composerStatus = null
    this.composerValidation = null
  }

  setComposerBody(body: string) {
    if (this.composerSent) return
    this.composerBody = body
    this.composerStatus = null
    this.composerValidation = null
  }

  setComposerStatus(status: StatusCode) {
    if (this.composerSent) return
    this.composerStatus = status
    this.composerValidation = null
  }

  applyComposerPreset(preset: ComposerPreset) {
    if (this.composerSent) return
    this.composerMethod = preset.method
    this.composerPath = preset.path
    this.composerBody = preset.body
    this.composerStatus = null
    this.composerValidation = null
  }

  stepForward() {
    if (!this.canStep) return
    this.autoPlay = false
    this.stepIndex += 1
  }

  stepBack() {
    if (!this.canBack) return
    this.autoPlay = false
    this.stepIndex -= 1
    this.validation = null
  }

  pause() {
    this.autoPlay = false
  }

  advanceAuto() {
    if (!this.autoPlay) return
    if (this.stepIndex < this.composerSteps.length - 1) {
      this.stepIndex += 1
      return
    }
    this.autoPlay = false
  }

  selectScenario(id: string | null) {
    if (this.isMain && id !== null) {
      this.mainStep = this.stepIndex
      this.mainTitle = this.title
    }

    this.scenarioId = id
    this.prompted = false
    this.pendingStart = false
    this.validation = null

    if (id === null) {
      this.stepIndex = this.mainStep
      this.title = this.mainTitle
      return
    }

    this.stepIndex = -1
    this.title = this.scenario.request.title ?? this.lesson.inputDefault
  }

  reset() {
    this.scenarioId = null
    this.stepIndex = -1
    this.selected = null
    this.locked = null
    this.prompted = false
    this.pendingStart = false
    this.validation = null
    this.title = this.lesson.main.request.title ?? this.lesson.inputDefault
    this.mainTitle = this.title
    this.mainStep = -1

    const composer = this.lesson.composer
    this.composerMethod = composer?.method ?? 'POST'
    this.composerPath = composer?.path ?? '/tasks'
    this.composerBody = composer?.body ?? ''
    this.composerStatus = null
    this.composerSent = false
    this.composerRun = null
    this.composerSteps = []
    this.composerTasks = this.lesson.startingTasks.map((task) => ({ ...task }))
    this.composerValidation = null
    this.autoPlay = false
  }
}
