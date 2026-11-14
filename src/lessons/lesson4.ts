import type { Lesson, Scenario } from '../engine/types'
import { boundarySteps, directDbSteps } from '../engine/scenarios'

const main: Scenario = {
  id: 'boundary',
  label: 'Add a task through the server',
  request: { method: 'POST', path: '/tasks', title: 'Buy milk' },
  steps: boundarySteps,
}

const directDb: Scenario = {
  id: 'direct-db',
  label: 'Try the database directly',
  request: { method: 'POST', path: '/tasks', title: 'Buy milk' },
  transport: 'db',
  mode: 'direct',
  steps: directDbSteps,
}

export const lesson4: Lesson = {
  id: 'who-talks-to-the-database',
  navLabel: '4 Who talks to the database',
  title: 'Who talks to the database',
  intro:
    'See why the browser never touches the database directly, and what the server protects.',
  mode: 'add',
  inputDefault: 'Buy milk',
  startingTasks: [
    { id: 1, title: 'Write project notes' },
    { id: 2, title: 'Review pull request' },
  ],
  code: [
    "app.post('/tasks', (req, res) => {",
    '  // This runs on the server only.',
    '  const { title } = req.body;',
    '  const task = db.insert(title);',
    '  res.status(201).json(task);',
    '});',
  ],
  prediction: {
    question: 'Could the browser write a task straight into the database?',
    options: [
      'Yes, if it knows the database address',
      'No, only the server can reach it',
      'Only after the user logs in',
    ],
    correctIndex: 1,
    reason:
      'The database accepts connections only from the server process. The browser can only send HTTP requests to the API, which is the point of the backend layer.',
  },
  main,
  breakIts: [directDb],
  dbNote:
    'Only the server process can open this table. The browser has no connection to it.',
}
