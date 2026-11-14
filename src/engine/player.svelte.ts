import type { Lesson, RequestSpec, Scenario, Step } from './types'

/**
 * One store for the whole player: current lesson, active scenario, step
 * index, the locked guess and the editable title. Components stay dumb.
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

  constructor(lessons: Lesson[]) {
    this.lessons = lessons
    this.title = lessons[0]?.inputDefault ?? ''
    this.mainTitle = this.title
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

  get step(): Step | null {
    return this.scenario.steps[this.stepIndex] ?? null
  }

  get totalSteps(): number {
    return this.scenario.steps.length
  }

  get atEnd(): boolean {
    return this.stepIndex === this.scenario.steps.length - 1
  }

  get canStep(): boolean {
    return this.locked !== null && this.stepIndex < this.scenario.steps.length - 1
  }

  get canBack(): boolean {
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
    if (!this.isMain || !this.atEnd || this.locked === null) return null
    return this.locked === this.lesson.prediction.correctIndex
      ? 'correct'
      : 'wrong'
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
    if (this.locked !== null) {
      this.stepIndex = 0
      return 'started'
    }

    this.prompted = true
    this.pendingStart = true
    return 'prompt'
  }

  stepForward() {
    if (!this.canStep) return
    this.stepIndex += 1
  }

  stepBack() {
    if (!this.canBack) return
    this.stepIndex -= 1
    this.validation = null
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
  }
}
