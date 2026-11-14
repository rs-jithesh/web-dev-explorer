import type { Lesson, Scenario } from '../engine/types'
import { getSteps, notFoundSteps, offlineSteps } from '../engine/scenarios'

const main: Scenario = {
  id: 'load',
  label: 'Load the list',
  request: { method: 'GET', path: '/tasks' },
  steps: getSteps,
}

const wrongUrl: Scenario = {
  id: 'wrong-url',
  label: 'Use a wrong URL',
  request: { method: 'GET', path: '/task' },
  steps: notFoundSteps,
}

const missingTask: Scenario = {
  id: 'missing-task',
  label: 'Ask for a missing task',
  request: { method: 'GET', path: '/tasks/99' },
  steps: notFoundSteps,
}

const serverOff: Scenario = {
  id: 'server-off',
  label: 'Turn the server off',
  request: { method: 'GET', path: '/tasks' },
  serverOn: false,
  steps: offlineSteps,
}

export const lesson2: Lesson = {
  id: 'load-the-list',
  navLabel: '2 Load the list',
  title: 'Load the list',
  intro:
    'Reload the page and see how the list asks the server for data before it can show anything.',
  mode: 'load',
  inputDefault: '',
  startingTasks: [
    { id: 1, title: 'Write project notes' },
    { id: 2, title: 'Review pull request' },
  ],
  code: [
    "app.get('/tasks', (req, res) => {",
    '  const tasks = db.all();',
    '  res.status(200).json(tasks);',
    '});',
  ],
  prediction: {
    question: 'When the page first loads, how does the list get its tasks?',
    options: [
      'The tasks are written into the HTML',
      'The browser sends GET /tasks',
      'The browser opens the database file',
    ],
    correctIndex: 1,
    reason:
      'The frontend sent GET /tasks and the server read the rows. A GET asks for data and has no body, while POST sends data to create something.',
  },
  main,
  breakIts: [wrongUrl, missingTask, serverOff],
  dbNote: 'The list reads the same table that the Add flow writes to.',
}
