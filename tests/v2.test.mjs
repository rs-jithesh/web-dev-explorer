import test from 'node:test'
import assert from 'node:assert/strict'
import { handleRequest } from '../src/engine/server.ts'
import {
  DEFAULT_TITLE,
  INITIAL_TASKS,
  storySteps,
} from '../src/v2/content.ts'
import { evidenceForStep } from '../src/v2/evidence.ts'
import { v2Prompt } from '../src/v2/tutor.ts'

function createRun(title = DEFAULT_TITLE) {
  const tasks = INITIAL_TASKS.map((task) => ({ ...task }))
  return handleRequest(
    {
      method: 'POST',
      path: '/tasks',
      body: JSON.stringify({ title }),
    },
    tasks,
    { serverOn: true },
  )
}

test('v2 story has five steps and uses the current title', () => {
  const steps = storySteps('Buy milk')

  assert.equal(steps.length, 5)
  assert.equal(steps[0].actor, 'Browser')
  assert.equal(steps[2].actor, 'Server')
  assert.equal(steps[3].actor, 'Database')
  assert.match(steps[0].text, /Buy milk/)
  assert.deepEqual(
    steps.map((step) => step.short),
    [
      'Browser sends request',
      'Server finds the code',
      'Server code saves it',
      'Database stores it',
      'Response comes back',
    ],
  )
})

test('v2 step 3 evidence shows the request, response, code and new row', () => {
  const run = createRun()
  const blocks = evidenceForStep(2, DEFAULT_TITLE, run, INITIAL_TASKS)
  const code = blocks.find((block) => block.kind === 'mono' && block.title === 'THE CODE RUNNING NOW')
  const table = blocks.find((block) => block.kind === 'table')
  const checklist = blocks.find((block) => block.kind === 'checklist')

  assert.ok(code)
  assert.equal(code.kind, 'mono')
  assert.equal(code.highlightLine, 2)
  assert.match(code.lines[2], /db\.insert/)

  assert.ok(table)
  assert.equal(table.kind, 'table')
  assert.equal(table.highlightId, 3)
  assert.equal(table.tasks.length, 3)

  assert.ok(checklist)
  assert.equal(checklist.kind, 'checklist')
  assert.equal(checklist.items.length, 3)
})

test('v2 step 4 evidence shows SQL, before/after tables and id note', () => {
  const run = createRun()
  const blocks = evidenceForStep(3, DEFAULT_TITLE, run, INITIAL_TASKS)
  const sql = blocks.find((block) => block.kind === 'mono' && block.title === 'WHAT THE SERVER ASKED THE DATABASE')
  const tables = blocks.filter((block) => block.kind === 'table')
  const note = blocks.find((block) => block.kind === 'note' && block.text.includes('never said 3'))

  assert.ok(sql)
  assert.equal(sql.kind, 'mono')
  assert.match(sql.lines[0], /INSERT INTO tasks/)
  assert.equal(tables.length, 2)
  assert.equal(tables[0].kind, 'table')
  assert.equal(tables[0].tasks.length, 2)
  assert.equal(tables[1].kind, 'table')
  assert.equal(tables[1].tasks.length, 3)
  assert.equal(tables[1].highlightId, 3)
  assert.ok(note)
})

test('v2 tutor prompt uses the shared builder and carries step-specific context', () => {
  const run = createRun()
  const step3 = v2Prompt(2, DEFAULT_TITLE, run, INITIAL_TASKS)
  const step4 = v2Prompt(3, DEFAULT_TITLE, run, INITIAL_TASKS)

  assert.match(step3, /Context/)
  assert.match(step3, /At step 3 of 5, Server handler is active\./)
  assert.match(step3, /Why does the server check the title before saving\?/)
  assert.match(step3, /THE CODE RUNNING NOW|Server code/)

  assert.match(step4, /At step 4 of 5, Database is active\./)
  assert.match(step4, /INSERT INTO tasks/)
  assert.match(step4, /row 3/)
  assert.match(step4, /Database rows:/)
})

test('v2 add operation reaches the database only for a title', () => {
  const success = createRun()
  const rejected = handleRequest(
    {
      method: 'POST',
      path: '/tasks',
      body: JSON.stringify({ title: '' }),
    },
    INITIAL_TASKS,
    { serverOn: true },
  )

  assert.equal(success.response?.status, 201)
  assert.equal(success.inserted?.title, 'Buy milk')
  assert.equal(success.reached.database, true)
  assert.equal(rejected.response?.status, 400)
  assert.equal(rejected.reached.database, false)
})
