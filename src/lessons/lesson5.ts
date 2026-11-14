import type { Lesson, RefreshConfig, Scenario } from '../engine/types'

const main: Scenario = {
  id: 'refresh',
  label: 'Refresh test',
  request: { method: 'GET', path: '/tasks' },
  steps: [],
}

const refresh: RefreshConfig = {
  startingTasks: [],
  modes: [
    {
      id: 'browser',
      label: 'Browser only',
      description:
        'Tasks live only in this tab. No server or database is keeping a copy.',
      prediction: {
        question: 'After the refresh, what will the task list show?',
        options: [
          'The tasks will still be there',
          'The tasks will be gone',
          'Only the last task will remain',
        ],
        correctIndex: 1,
        reason:
          "The tasks lived only in this tab's memory, so clearing the page removed them. Nothing outside the browser was keeping a copy.",
      },
      explanation:
        "The tasks lived only in this tab's memory, so clearing the page removed them. Nothing outside the browser was keeping a copy.",
    },
    {
      id: 'api',
      label: 'Through the API and database',
      description:
        'Each task is sent to the server and stored in the database. The list can be reloaded after a refresh.',
      prediction: {
        question: 'After the refresh, what will the task list show?',
        options: [
          'The tasks will still be there',
          'The tasks will be gone',
          'Only the last task will remain',
        ],
        correctIndex: 0,
        reason:
          'The tasks were saved as rows by the server, so the page could ask GET /tasks after reloading. That is why a backend and database exist: they keep the data when the browser forgets it.',
      },
      explanation:
        'The tasks were saved as rows by the server, so the page could ask GET /tasks after reloading. That is why a backend and database exist: they keep the data when the browser forgets it.',
    },
  ],
}

export const lesson5: Lesson = {
  id: 'refresh-test',
  navLabel: '5 Refresh test',
  title: 'What survives a refresh?',
  intro:
    'Add tasks in both modes, then refresh. See what the browser remembers and what the backend keeps.',
  mode: 'load',
  inputDefault: 'Buy milk',
  startingTasks: [],
  code: [],
  prediction: refresh.modes[0].prediction,
  main,
  breakIts: [],
  refresh,
}
