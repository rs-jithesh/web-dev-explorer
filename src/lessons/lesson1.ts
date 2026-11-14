import type { Lesson, Scenario } from '../engine/types'
import { addSteps } from '../engine/scenarios'

const main: Scenario = {
  id: 'add',
  label: 'Add a task',
  request: { method: 'POST', path: '/tasks', title: 'Buy milk' },
  steps: addSteps,
}

const validBody = '{\n  "title": "Buy milk"\n}'
const emptyBody = '{\n  "title": ""\n}'
const invalidJson = '{\n  "title": "Buy milk"\n'

export const lesson1: Lesson = {
  id: 'add-a-task',
  navLabel: '1 Add a task',
  title: 'Add a task',
  intro:
    'Compose a request, predict the status, and send it. Follow it from the browser to the database and back.',
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
  breakIts: [],
  composer: {
    method: 'POST',
    path: '/tasks',
    body: validBody,
    presets: [
      { label: 'Add a task', method: 'POST', path: '/tasks', body: validBody },
      { label: 'Load the list', method: 'GET', path: '/tasks', body: '' },
      { label: 'Empty title', method: 'POST', path: '/tasks', body: emptyBody },
      { label: 'Invalid JSON', method: 'POST', path: '/tasks', body: invalidJson },
      { label: 'Unknown path', method: 'POST', path: '/task', body: validBody },
      { label: 'Wrong method', method: 'DELETE', path: '/tasks', body: '' },
    ],
  },
}
