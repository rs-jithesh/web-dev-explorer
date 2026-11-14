export type Box = 'browser' | 'api' | 'server' | 'database'

export type Method = 'GET' | 'POST' | 'DELETE'

export type Transport = 'http' | 'db'

export type BrowserMode = 'add' | 'load' | 'direct' | 'delete'

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
  body?: string
}

export type PayloadShape =
  | 'text'
  | 'json-request'
  | 'object'
  | 'row'
  | 'json-response'
  | 'list-item'

export interface Payload {
  box: Box
  shape: PayloadShape
  label: string
  value: string
  note: string
}

export interface Step {
  active: Box
  stage: Stage
  line?: number
  explanation: string
  payload?: Payload
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

export interface ComposerPreset {
  label: string
  method: Method
  path: string
  body: string
}

export interface ComposerConfig {
  method: Method
  path: string
  body: string
  presets: ComposerPreset[]
}

export type RefreshModeId = 'browser' | 'api'

export type RefreshPhase = 'editing' | 'refreshing' | 'done'

export interface RefreshModeData {
  id: RefreshModeId
  label: string
  description: string
  prediction: Prediction
  explanation: string
}

export interface RefreshConfig {
  modes: RefreshModeData[]
  startingTasks?: Task[]
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
  composer?: ComposerConfig
  refresh?: RefreshConfig
}
