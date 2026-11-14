import type { Lesson, Scenario } from '../engine/types'
import { emptySteps, notFoundSteps, offlineSteps } from '../engine/scenarios'

const main: Scenario = {
  id: 'empty',
  label: 'Add an empty task',
  request: { method: 'POST', path: '/tasks', title: '' },
  steps: emptySteps,
}

const emptyAgain: Scenario = {
  id: 'empty-again',
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

export const lesson3: Lesson = {
  id: 'when-things-fail',
  navLabel: '3 When things fail',
  title: 'When things fail',
  intro:
    'Send bad input and follow the error back. The status code tells you where the request stopped.',
  mode: 'add',
  inputDefault: '',
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
    question: 'You pressed Add with an empty box. What status code should come back?',
    options: ['201 Created', '400 Bad Request', '500 Server Error'],
    correctIndex: 1,
    reason:
      "The handler's guard rejected the empty title with 400 Bad Request. 201 is only sent after a row is created, and this request never reached the insert.",
  },
  main,
  breakIts: [emptyAgain, wrongUrl, serverOff],
}
