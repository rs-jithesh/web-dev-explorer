import type { Lesson, Scenario } from '../engine/types'
import {
  addSteps,
  emptySteps,
  notFoundSteps,
  offlineSteps,
} from '../engine/scenarios'

const main: Scenario = {
  id: 'add',
  label: 'Add a task',
  request: { method: 'POST', path: '/tasks', title: 'Buy milk' },
  steps: addSteps,
}

const empty: Scenario = {
  id: 'empty-task',
  label: 'Send an empty task',
  request: { method: 'POST', path: '/tasks', title: '' },
  steps: emptySteps,
}

const wrongUrl: Scenario = {
  id: 'wrong-url',
  label: 'Use a wrong URL',
  request: { method: 'POST', path: '/task', title: 'Buy milk' },
  steps: notFoundSteps,
}

const serverOff: Scenario = {
  id: 'server-off',
  label: 'Turn the server off',
  request: { method: 'POST', path: '/tasks', title: 'Buy milk' },
  serverOn: false,
  steps: offlineSteps,
}

export const lesson1: Lesson = {
  id: 'add-a-task',
  navLabel: '1 Add a task',
  title: 'Add a task',
  intro:
    'Press Add and follow one request from the browser, through the server, into the database and back.',
  mode: 'add',
  inputDefault: 'Buy milk',
  startingTasks: [
    { id: 1, title: 'Write project notes' },
    { id: 2, title: 'Review pull request' },
  ],
  code: [
    "app.post('/tasks', (req, res) => {",
    '  const { title } = req.body;',
    '  if (!title) return res.status(400);',
    '  const task = db.insert(title);',
    '  res.status(201).json(task);',
    '});',
  ],
  prediction: {
    question: 'When you clicked Add, what did the browser do first?',
    options: [
      'Reloaded the whole page',
      'Sent a request to the server',
      'Wrote to the database directly',
    ],
    correctIndex: 1,
    reason:
      'The browser sent POST /tasks with the new title. The server wrote the row and returned 201 Created; the browser never touched the database.',
  },
  main,
  breakIts: [empty, wrongUrl, serverOff],
}
