import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildPrompt,
  buildSnapshot,
  termsForSnapshot,
} from '../src/engine/tutor.ts'

const addLesson = { id: 'add-a-task', title: 'Add a task' }

const addServer = [
  "app.post('/tasks', (req, res) => {",
  '  const { title } = req.body;',
  '  if (!title) return res.status(400);',
  '  const task = db.insert(title);',
  '  res.status(201).json(task);',
  '});',
]

function completedAdd() {
  return buildSnapshot({
    lesson: addLesson,
    step: {
      index: 6,
      total: 7,
      active: 'browser',
      stage: 'done',
      explanation:
        'The browser receives the response and swaps the pending task for the saved one.',
    },
    request: {
      method: 'POST',
      path: '/tasks',
      body: '{\n  "title": "Buy milk"\n}',
    },
    response: { status: 201, body: { id: 3, title: 'Buy milk' } },
    failure: null,
    server: { lines: addServer, activeLine: null },
    databaseRows: [
      { id: 1, title: 'Write project notes' },
      { id: 2, title: 'Review pull request' },
      { id: 3, title: 'Buy milk' },
    ],
    prediction: {
      question: 'What status will come back?',
      selected: '201 Created',
      correct: '201 Created',
      verdict: 'correct',
    },
  })
}

function validationFailure() {
  return buildSnapshot({
    lesson: { id: 'when-things-fail', title: 'When things fail' },
    step: {
      index: 5,
      total: 7,
      active: 'api',
      stage: 'respond',
      explanation: 'The server sends 400 Bad Request and an error message.',
    },
    request: {
      method: 'POST',
      path: '/tasks',
      body: '{\n  "title": ""\n}',
    },
    response: { status: 400, body: { error: 'title is required' } },
    failure: 'validation',
    server: { lines: addServer, activeLine: 3 },
    databaseRows: [
      { id: 1, title: 'Write project notes' },
      { id: 2, title: 'Review pull request' },
    ],
    prediction: {
      question: 'What status will come back?',
      selected: '201 Created',
      correct: '400 Bad Request',
      verdict: 'wrong',
    },
  })
}

function notFound() {
  return buildSnapshot({
    lesson: { id: 'load-the-list', title: 'Load the list' },
    step: {
      index: 4,
      total: 5,
      active: 'browser',
      stage: 'done',
      explanation:
        'The browser shows a not-found error. The request never reached the code that writes data.',
    },
    request: { method: 'GET', path: '/task' },
    response: { status: 404, body: { error: 'Not found' } },
    failure: 'not_found',
    server: { lines: addServer, activeLine: null },
    databaseRows: [
      { id: 1, title: 'Write project notes' },
      { id: 2, title: 'Review pull request' },
    ],
  })
}

test('buildSnapshot normalizes fields and omits the stop on success', () => {
  const snapshot = completedAdd()

  assert.equal(snapshot.lesson.title, 'Add a task')
  assert.deepEqual(snapshot.step, {
    number: 7,
    total: 7,
    active: 'browser',
    stage: 'done',
    explanation:
      'The browser receives the response and swaps the pending task for the saved one.',
  })
  assert.equal(snapshot.request.method, 'POST')
  assert.equal(snapshot.request.body, '{\n  "title": "Buy milk"\n}')
  assert.equal(snapshot.response.status, 201)
  assert.equal(snapshot.response.body.title, 'Buy milk')
  assert.equal(snapshot.stop, undefined)
  assert.equal(snapshot.server.activeLine, null)
  assert.equal(snapshot.prediction.wasCorrect, 'correct')
})

test('buildSnapshot records a structured stop and derives refresh requests', () => {
  const failure = validationFailure()
  assert.deepEqual(failure.stop, {
    area: 'server',
    failure: 'validation',
  })
  assert.equal(failure.databaseRows.length, 2)

  const refresh = buildSnapshot({
    lesson: { id: 'refresh-test', title: 'What survives a refresh?' },
    refresh: {
      modeId: 'api',
      modeLabel: 'Through the API and database',
      phase: 'done',
      browserTasks: [{ id: 1, title: 'Buy milk' }],
      databaseRows: [{ id: 1, title: 'Buy milk' }],
      requests: [
        { method: 'POST', path: '/tasks', status: 201 },
        { method: 'GET', path: '/tasks', status: 200 },
      ],
    },
  })

  assert.equal(refresh.request.method, 'GET')
  assert.equal(refresh.response.status, 200)
  assert.equal(refresh.refresh.modeId, 'api')
  assert.equal(refresh.databaseRows.length, 1)
  assert.equal(refresh.prediction, undefined)
})

test('buildPrompt puts the four required parts in order and includes relevant success context', () => {
  const prompt = buildPrompt(completedAdd(), { kind: 'why' }, '')

  const roleAt = prompt.indexOf('Act as a patient tutor.')
  const contextAt = prompt.indexOf('Context\nLesson: Add a task')
  const questionAt = prompt.indexOf('My question: Why did this happen?')
  const instructionsAt = prompt.indexOf('Instructions')
  assert.ok(roleAt >= 0)
  assert.ok(contextAt > roleAt)
  assert.ok(questionAt > contextAt)
  assert.ok(instructionsAt > questionAt)

  assert.match(prompt, /What I sent: POST \/tasks/)
  assert.match(prompt, /Request body:\n\{/)
  assert.match(prompt, /What I predicted: 201 Created\. I was right\./)
  assert.match(
    prompt,
    /What actually happened: At step 7 of 7, Browser is active\./,
  )
  assert.match(prompt, /The server returned 201 Created\./)
  assert.match(prompt, /Server code \(→ marks the active line\):/)
  assert.match(prompt, /Database rows:\n- 1: Write project notes/)
  assert.match(prompt, /- 3: Buy milk/)
  assert.match(prompt, /Use this exact example\./)
  assert.match(prompt, /Define every term you use\./)
  assert.match(prompt, /Do not just write code for me\./)

  assert.doesNotMatch(prompt, /Response body:/)
  assert.doesNotMatch(prompt, /Where it stopped:/)
})

test('buildPrompt keeps failure context focused and shows the error and active line', () => {
  const prompt = buildPrompt(validationFailure(), { kind: 'why' }, '')

  assert.match(prompt, /What I predicted: 201 Created\. I was wrong\./)
  assert.match(prompt, /The correct answer was: 400 Bad Request\./)
  assert.match(prompt, /The server returned 400 Bad Request\./)
  assert.match(prompt, /Where it stopped: In the server code\./)
  assert.match(prompt, /→ 3   if \(!title\) return res\.status\(400\);/)
  assert.match(prompt, /Response body:\n\{[\s\S]*title is required/)
  assert.doesNotMatch(prompt, /Database rows:/)
})

test('a term question carries only context that helps define the term', () => {
  const statusPrompt = buildPrompt(
    completedAdd(),
    { kind: 'term', term: 'status code' },
    '',
  )

  assert.ok(
    statusPrompt.includes(
      'What does “status code” mean in this lesson?',
    ),
  )
  assert.match(statusPrompt, /The server returned 201 Created\./)
  assert.doesNotMatch(statusPrompt, /Request body:/)
  assert.doesNotMatch(statusPrompt, /Response body:/)
  assert.doesNotMatch(statusPrompt, /Server code/)
  assert.doesNotMatch(statusPrompt, /Database rows:/)
  assert.doesNotMatch(statusPrompt, /What I predicted:/)

  const jsonPrompt = buildPrompt(
    validationFailure(),
    { kind: 'term', term: 'JSON' },
    '',
  )
  assert.match(jsonPrompt, /Request body:/)
  assert.match(jsonPrompt, /Response body:/)
  assert.doesNotMatch(jsonPrompt, /Database rows:/)
  assert.doesNotMatch(jsonPrompt, /Server code/)
})

test('route and database terms pull in the matching context', () => {
  const routePrompt = buildPrompt(notFound(), { kind: 'term', term: 'route' }, '')
  assert.match(routePrompt, /What I sent: GET \/task/)
  assert.match(routePrompt, /Where it stopped: At the API route\./)
  assert.match(routePrompt, /Server code/)
  assert.doesNotMatch(routePrompt, /Database rows:/)

  const databasePrompt = buildPrompt(
    validationFailure(),
    { kind: 'term', term: 'database' },
    '',
  )
  assert.match(databasePrompt, /Database rows:\n- 1: Write project notes/)
  assert.doesNotMatch(databasePrompt, /Server code/)
})

test('refresh prompts include mode, persisted data, prediction and request log', () => {
  const snapshot = buildSnapshot({
    lesson: { id: 'refresh-test', title: 'What survives a refresh?' },
    refresh: {
      modeId: 'api',
      modeLabel: 'Through the API and database',
      phase: 'done',
      browserTasks: [{ id: 1, title: 'Buy milk' }],
      databaseRows: [{ id: 1, title: 'Buy milk' }],
      requests: [
        { method: 'POST', path: '/tasks', status: 201 },
        { method: 'GET', path: '/tasks', status: 200 },
      ],
    },
    prediction: {
      question: 'After the refresh, what will the task list show?',
      selected: 'The tasks will still be there',
      correct: 'The tasks will still be there',
      verdict: 'correct',
    },
  })

  const prompt = buildPrompt(snapshot, { kind: 'why' }, '')

  assert.match(prompt, /Refresh mode: Through the API and database/)
  assert.match(prompt, /What I sent: GET \/tasks/)
  assert.match(prompt, /I was right\./)
  assert.match(
    prompt,
    /The refresh finished\. Browser tasks: 1\. Database rows: 1\./,
  )
  assert.match(prompt, /Browser task list:\n- Buy milk/)
  assert.match(prompt, /Database rows:\n- 1: Buy milk/)
  assert.match(prompt, /Request log:/)
  assert.match(prompt, /POST \/tasks → 201 Created/)
  assert.match(prompt, /GET \/tasks → 200 OK/)
  assert.doesNotMatch(prompt, /Server code/)
})

test('user text is appended and missing prediction context is omitted', () => {
  const snapshot = buildSnapshot({
    lesson: addLesson,
    step: {
      index: 1,
      total: 7,
      active: 'browser',
      stage: 'send',
      explanation: 'The browser sends POST /tasks with the title as JSON.',
    },
    request: { method: 'POST', path: '/tasks', body: '{"title":"Buy milk"}' },
    server: { lines: addServer, activeLine: null },
  })

  const prompt = buildPrompt(
    snapshot,
    { kind: 'another' },
    'Why does the browser not write to the database directly?',
  )

  assert.match(
    prompt,
    /Explain it another way, using this exact example\./,
  )
  assert.match(
    prompt,
    /In my own words: Why does the browser not write to the database directly\?/,
  )
  assert.doesNotMatch(prompt, /What I predicted:/)
  assert.match(prompt, /No response has come back yet\./)
  assert.match(prompt, /At step 2 of 7, Browser is active\./)
})

test('an empty lesson snapshot builds only the role, actual state, question and instructions', () => {
  const snapshot = buildSnapshot({ lesson: addLesson })

  assert.deepEqual(Object.keys(snapshot), ['lesson'])

  const prompt = buildPrompt(snapshot, { kind: 'why' }, '')
  assert.match(prompt, /Lesson: Add a task/)
  assert.match(prompt, /What actually happened: No request has been sent yet\./)
  assert.doesNotMatch(prompt, /What I sent:/)
  assert.doesNotMatch(prompt, /What I predicted:/)
  assert.doesNotMatch(prompt, /Where it stopped:/)
  assert.doesNotMatch(prompt, /Server code/)
  assert.doesNotMatch(prompt, /Database rows:/)
})

test('termsForSnapshot offers the terms visible in the current state', () => {
  const terms = termsForSnapshot(validationFailure())

  for (const term of [
    'status code',
    'JSON',
    'route',
    'request body',
    'database',
    'server handler',
    '400 Bad Request',
  ]) {
    assert.ok(terms.includes(term), `missing term: ${term}`)
  }
})
