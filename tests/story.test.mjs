import test from 'node:test'
import assert from 'node:assert/strict'
import { handleRequest } from '../src/engine/server.ts'
import { INITIAL_TASKS } from '../src/v2/content.ts'
import { evidenceFor } from '../src/v2/evidence.ts'
import { lessonById, storyFor } from '../src/v2/lessons.ts'
import {
  PAYLOAD_CASES,
  STORAGE_MODES,
  STORY_CHAPTERS,
  allChaptersComplete,
  canOpenChapter,
  continueTarget,
  depthsFor,
  nextChapterId,
  toolsFor,
} from '../src/story/chapters.ts'

function before() {
  return INITIAL_TASKS.map((task) => ({ ...task }))
}

test('database off reaches the server but never writes a row', () => {
  const post = handleRequest(
    {
      method: 'POST',
      path: '/tasks',
      body: JSON.stringify({ title: 'Buy oat milk' }),
    },
    before(),
    { serverOn: true, databaseOn: false },
  )
  const get = handleRequest(
    { method: 'GET', path: '/tasks', body: null },
    before(),
    { serverOn: true, databaseOn: false },
  )

  assert.equal(post.response?.status, 503)
  assert.equal(post.failure, 'database_error')
  assert.equal(post.reached.server, true)
  assert.equal(post.reached.database, false)
  assert.equal(post.inserted, null)
  assert.equal(post.tasksAfter.length, 2)

  assert.equal(get.response?.status, 503)
  assert.equal(get.failure, 'database_error')
  assert.equal(get.reached.server, true)
  assert.equal(get.reached.database, false)
})

test('bad payloads stop before the database is opened', () => {
  const empty = handleRequest(
    {
      method: 'POST',
      path: '/tasks',
      body: JSON.stringify({ title: '' }),
    },
    before(),
    { serverOn: true, databaseOn: false },
  )
  const invalid = handleRequest(
    { method: 'POST', path: '/tasks', body: '{"title":' },
    before(),
    { serverOn: true, databaseOn: false },
  )

  assert.equal(empty.response?.status, 400)
  assert.equal(empty.failure, 'validation')
  assert.equal(empty.reached.database, false)
  assert.equal(invalid.response?.status, 400)
  assert.equal(invalid.failure, 'invalid_json')
  assert.equal(invalid.reached.database, false)
})

test('database failure gets a readable story and evidence', () => {
  const lesson = lessonById('add')
  const run = handleRequest(
    {
      method: 'POST',
      path: '/tasks',
      body: JSON.stringify({ title: 'Buy oat milk' }),
    },
    before(),
    { serverOn: true, databaseOn: false },
  )
  const steps = storyFor(lesson, run, 'Buy oat milk')
  const blocks = evidenceFor(lesson, 3, 'Buy oat milk', run, before())

  assert.equal(steps.length, 5)
  assert.match(steps[3].text, /cannot be reached/)
  assert.equal(run.reached.database, false)
  assert.ok(blocks.some((block) => block.kind === 'table'))
})

test('story has six ordered chapters and an unlock path through the tools', () => {
  assert.deepEqual(
    STORY_CHAPTERS.map((chapter) => chapter.id),
    ['add', 'fetch', 'refresh', 'payload', 'server', 'database'],
  )
  assert.equal(nextChapterId('add'), 'fetch')
  assert.equal(nextChapterId('database'), null)

  const start = { current: 'add', completed: [] }
  assert.equal(continueTarget(start), 'add')
  assert.equal(canOpenChapter('add', start), true)
  assert.equal(canOpenChapter('fetch', start), false)

  const afterAdd = { current: 'add', completed: ['add'] }
  assert.equal(continueTarget(afterAdd), 'fetch')
  assert.equal(depthsFor(afterAdd).behind, true)
  assert.equal(depthsFor(afterAdd).under, false)

  const afterFetch = { current: 'fetch', completed: ['add', 'fetch'] }
  assert.equal(toolsFor(afterFetch).refresh, true)
  assert.equal(depthsFor(afterFetch).under, true)

  const afterRefresh = { current: 'refresh', completed: ['add', 'fetch', 'refresh'] }
  assert.equal(toolsFor(afterRefresh).storage, true)

  const atServer = { current: 'server', completed: ['add', 'fetch', 'refresh', 'payload'] }
  assert.equal(toolsFor(atServer).server, true)
  assert.equal(toolsFor(atServer).database, false)

  const atDatabase = { current: 'database', completed: ['add', 'fetch', 'refresh', 'payload', 'server'] }
  assert.equal(toolsFor(atDatabase).server, true)
  assert.equal(toolsFor(atDatabase).database, true)

  const complete = { current: 'database', completed: STORY_CHAPTERS.map((chapter) => chapter.id) }
  assert.equal(allChaptersComplete(complete), true)
})

test('story includes all four storage modes and every broken-request case', () => {
  assert.deepEqual(
    STORAGE_MODES.map((mode) => mode.id),
    ['memory', 'session', 'local', 'database'],
  )
  assert.equal(STORAGE_MODES.find((mode) => mode.id === 'database')?.serverCanRead, true)
  assert.equal(STORAGE_MODES.find((mode) => mode.id === 'memory')?.survivesRefresh, false)

  assert.deepEqual(
    PAYLOAD_CASES.map((item) => item.id),
    ['empty', 'invalid', 'wrong-url', 'wrong-method', 'missing-task'],
  )
  assert.equal(PAYLOAD_CASES.find((item) => item.id === 'empty')?.expectedLayer, 'server')
  assert.equal(PAYLOAD_CASES.find((item) => item.id === 'wrong-url')?.expectedLayer, 'router')
  assert.equal(PAYLOAD_CASES.find((item) => item.id === 'wrong-method')?.expectedStatus, 405)
})
