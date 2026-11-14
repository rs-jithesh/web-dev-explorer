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
    return this.locked !== null && this.stepIndex < 0
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
  }

  lockGuess() {
    if (this.selected === null || this.locked !== null) return
    this.locked = this.selected
  }

  editTitle(value: string) {
    if (!this.isMain || this.stepIndex >= 0) return
    this.title = value
  }

  trigger() {
    if (!this.canTrigger) return false
    this.stepIndex = 0
    return true
  }

  stepForward() {
    if (!this.canStep) return
    this.stepIndex += 1
  }

  stepBack() {
    if (!this.canBack) return
    this.stepIndex -= 1
  }

  selectScenario(id: string | null) {
    if (this.isMain && id !== null) {
      this.mainStep = this.stepIndex
      this.mainTitle = this.title
    }

    this.scenarioId = id

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
    this.title = this.lesson.main.request.title ?? this.lesson.inputDefault
    this.mainTitle = this.title
    this.mainStep = -1
  }
}
