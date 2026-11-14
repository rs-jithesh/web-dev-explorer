export type Box = 'browser' | 'api' | 'server' | 'database'

export type Method = 'GET' | 'POST'

export type Transport = 'http' | 'db'

export type BrowserMode = 'add' | 'load' | 'direct'

export type Stage =
  | 'click'
  | 'send'
  | 'route'
  | 'code'
  | 'db'
  | 'respond'
  | 'done'
  | 'blocked'

export interface Task {
  id: number
  title: string
}

export interface Prediction {
  question: string
  options: string[]
  correctIndex: number
  reason: string
}

export interface RequestSpec {
  method: Method
  path: string
  title?: string
}

export interface Step {
  active: Box
  stage: Stage
  line?: number
  explanation: string
}

export interface Scenario {
  id: string
  label: string
  request: RequestSpec
  serverOn?: boolean
  transport?: Transport
  mode?: BrowserMode
  steps: Step[]
}

export interface Lesson {
  id: string
  navLabel: string
  title: string
  intro: string
  mode: BrowserMode
  inputDefault: string
  code: string[]
  startingTasks: Task[]
  prediction: Prediction
  main: Scenario
  breakIts: Scenario[]
  dbNote?: string
}
