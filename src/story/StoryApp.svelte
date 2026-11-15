<script lang="ts">
  import { onMount, tick } from 'svelte'
  import { handleRequest, type Run } from '../engine/server'
  import type { Task } from '../engine/types'
  import {
    CHAPTER_CHOICES,
    PAYLOAD_CASES,
    STORAGE_MODES,
    STORY_CHAPTERS,
    allChaptersComplete,
    canOpenChapter,
    chapterById,
    continueTarget,
    depthsFor,
    nextChapterId,
    readProgress,
    saveProgress,
    toolsFor,
    type ChapterId,
    type PayloadCaseId,
    type StoryChoiceData,
    type StoryProgress,
    type StoryStorage,
  } from './chapters'
  import StoryChoice from './StoryChoice.svelte'
  import StoryTools from './StoryTools.svelte'
  import './story.css'

  let { onSandbox }: { onSandbox: () => void } = $props()

  type StoryView = 'path' | 'chapter'
  type Phase = 'start' | 'choice' | 'done'
  type StoryDepth = 'app' | 'behind' | 'under'

  const STORY_HASH = '#story'
  const initial = readProgress()

  let current = $state<ChapterId>(initial.current)
  let completed = $state<ChapterId[]>([...initial.completed])
  let storyTitle = $state('Buy oat milk')
  let view = $state<StoryView>('path')
  let phase = $state<Phase>('start')
  let depth = $state<StoryDepth>('app')
  let depthOpen = $state(false)
  let hashReady = $state(false)
  let notice = $state('')
  let input = $state('Buy oat milk')
  let tasks = $state<Task[]>([])
  let tasksBefore = $state<Task[]>([])
  let run = $state<Run | null>(null)
  let refreshed = $state(false)
  let refreshResult = $state('')
  let selectedChoice = $state<string | null>(null)
  let choiceChecked = $state(false)
  let storage = $state<StoryStorage>('memory')
  let payloadCaseId = $state<PayloadCaseId>('empty')
  let serverOn = $state(true)
  let databaseOn = $state(true)

  const progress = $derived<StoryProgress>({ current, completed })
  const chapter = $derived(chapterById(current))
  const tools = $derived(toolsFor(progress))
  const depths = $derived(depthsFor(progress))
  const sandboxUnlocked = $derived(allChaptersComplete(progress))
  const continueId = $derived(continueTarget(progress))
  const payloadCase = $derived(
    PAYLOAD_CASES.find((item) => item.id === payloadCaseId) ?? PAYLOAD_CASES[0],
  )
  const storageMode = $derived(
    STORAGE_MODES.find((item) => item.id === storage) ?? STORAGE_MODES[0],
  )
  const choice = $derived(buildChoice())
  const choiceCorrect = $derived(
    choice !== null && selectedChoice !== null
      ? selectedChoice === choice.correctId
      : false,
  )
  const showInput = $derived(
    current === 'add' || current === 'server' || current === 'database',
  )
  const primaryLabel = $derived.by(() => {
    if (current === 'server') {
      return serverOn ? 'Turn the server off' : 'Send while the server is off'
    }
    if (current === 'database') {
      return databaseOn
        ? 'Turn the database off'
        : 'Send while the database is off'
    }
    return chapter.actionLabel
  })
  const appError = $derived.by(() => {
    if (current === 'server' && run?.failure === 'timeout') {
      return 'No response. The page is still here — only the request failed.'
    }
    if (current === 'database' && run?.failure === 'database_error') {
      return 'The database is unavailable. The server returned 503.'
    }
    return ''
  })
  const appNote = $derived.by(() => {
    if (current === 'add') return 'Your text will stay visible at every stop.'
    if (current === 'fetch') {
      return tasks.length > 0
        ? 'The list was rebuilt from the response.'
        : 'The page has not asked the server for the list yet.'
    }
    if (current === 'refresh') {
      return refreshed
        ? 'The page has reloaded. The result is below.'
        : 'Choose a storage, then refresh the page.'
    }
    if (current === 'payload') {
      return 'Use the case selector to try another broken request.'
    }
    if (current === 'server') {
      return serverOn
        ? 'The server is on. Turn it off, then send.'
        : 'The server is off. The page is still alive.'
    }
    return databaseOn
      ? 'The database is on. Turn it off, then send.'
      : 'The database is off. The server is still alive.'
  })
  const completion = $derived(completionFor(chapter.id))
  const nextId = $derived(nextChapterId(current))
  const nextChapter = $derived(nextId ? chapterById(nextId) : null)
  const stepStates = $derived.by(() => {
    if (phase === 'done') return ['done', 'done', 'done'] as const
    if (phase === 'choice') return ['done', 'done', 'current'] as const
    return ['current', 'future', 'future'] as const
  })

  function clone(tasks: Task[]): Task[] {
    return tasks.map((task) => ({ ...task }))
  }

  function storyBase(): Task[] {
    return [{ id: 1, title: storyTitle || 'Buy oat milk' }]
  }

  function chapterTasks(id: ChapterId): Task[] {
    if (id === 'add' || id === 'fetch') return []
    if (id === 'refresh') return storyBase()
    return storyBase()
  }

  function initialBaseTasks(id: ChapterId): Task[] {
    if (id === 'add') return []
    if (id === 'fetch') return storyBase()
    if (id === 'refresh') return storyBase()
    return storyBase()
  }

  function initChapter(id: ChapterId, showCompletion = false) {
    current = id
    view = 'chapter'
    phase = showCompletion && completed.includes(id) ? 'done' : 'start'
    input = storyTitle
    tasks = chapterTasks(id)
    tasksBefore = initialBaseTasks(id)
    run = null
    refreshed = false
    refreshResult = ''
    selectedChoice = null
    choiceChecked = false
    storage = 'memory'
    payloadCaseId = 'empty'
    serverOn = true
    databaseOn = true
    depth = 'app'
    depthOpen = false
    notice = ''
  }

  function openPath() {
    view = 'path'
    depth = 'app'
    depthOpen = false
    notice = ''
  }

  function selectChapter(id: ChapterId) {
    if (!canOpenChapter(id, progress)) {
      notice = 'Finish the current chapter before opening this one.'
      return
    }
    initChapter(id, completed.includes(id))
  }

  function continueStory() {
    if (sandboxUnlocked) {
      onSandbox()
      return
    }
    selectChapter(continueId)
  }

  function completeCurrent() {
    if (!completed.includes(current)) {
      completed = [...completed, current]
    }
    phase = 'done'
    depth = 'app'
    depthOpen = false
    refreshResult = ''
  }

  function goNextChapter() {
    if (!nextId) {
      openSandbox()
      return
    }
    initChapter(nextId, false)
  }

  function openSandbox() {
    if (!sandboxUnlocked) {
      notice = 'Finish all six chapters to open the sandbox.'
      return
    }
    onSandbox()
  }

  function openDepth(next: Exclude<StoryDepth, 'app'>) {
    if (next === 'behind' && !depths.behind) {
      notice = 'Behind the scenes unlocks after chapter 1.'
      return
    }
    if (next === 'under' && !depths.under) {
      notice = 'Under the hood unlocks after chapter 2.'
      return
    }
    depth = next
    depthOpen = true
    notice = ''
    tick().then(() => {
      document.querySelector<HTMLButtonElement>('.story-depth-close')?.focus()
    })
  }

  function closeDepth() {
    depth = 'app'
    depthOpen = false
    notice = ''
  }

  function resetAction() {
    run = null
    phase = 'start'
    selectedChoice = null
    choiceChecked = false
    refreshed = false
    refreshResult = ''
    notice = ''
  }

  function resetChapter() {
    initChapter(current, false)
  }

  function setChoice(id: string) {
    if (choiceChecked) return
    selectedChoice = id
  }

  function checkChoice() {
    if (!selectedChoice) return
    choiceChecked = true
  }

  function retryChoice() {
    selectedChoice = null
    choiceChecked = false
  }

  function continueChoice() {
    if (choiceChecked && choiceCorrect) completeCurrent()
  }

  function addTask() {
    const title = input.trim()
    if (!title) {
      notice = 'Type a task first.'
      return
    }
    const before = clone(tasks)
    const next = handleRequest(
      {
        method: 'POST',
        path: '/tasks',
        body: JSON.stringify({ title }),
      },
      before,
      { serverOn: true, databaseOn: true },
    )
    tasksBefore = before
    tasks = next.tasksAfter
    run = next
    storyTitle = title
    phase = 'choice'
    selectedChoice = null
    choiceChecked = false
  }

  function fetchList() {
    const before = clone(tasksBefore.length > 0 ? tasksBefore : storyBase())
    const next = handleRequest(
      { method: 'GET', path: '/tasks', body: null },
      before,
      { serverOn: true, databaseOn: true },
    )
    tasksBefore = before
    tasks = next.tasksAfter
    run = next
    phase = 'choice'
    selectedChoice = null
    choiceChecked = false
  }

  function refreshPage() {
    const base = storyBase()
    tasksBefore = base
    refreshed = true
    if (storage === 'database') {
      const next = handleRequest(
        { method: 'GET', path: '/tasks', body: null },
        base,
        { serverOn: true, databaseOn: true },
      )
      run = next
      tasks = next.tasksAfter
      if (next.response?.status === 200) {
        completeCurrent()
      }
      return
    }
    run = null
    tasks = storageMode.survivesRefresh ? clone(base) : []
    refreshResult = storageMode.result
  }

  function setStorage(next: StoryStorage) {
    storage = next
    tasks = storyBase()
    run = null
    refreshed = false
    refreshResult = ''
    notice = ''
  }

  function selectPayloadCase(next: PayloadCaseId) {
    payloadCaseId = next
    resetAction()
  }

  function sendPayload() {
    const item = payloadCase
    const before = clone(tasks)
    const next = handleRequest(
      { method: item.method, path: item.path, body: item.body },
      before,
      { serverOn: true, databaseOn: true },
    )
    tasksBefore = before
    tasks = next.tasksAfter
    run = next
    phase = 'choice'
    selectedChoice = null
    choiceChecked = false
  }

  function serverPrimary() {
    if (serverOn) {
      serverOn = false
      resetAction()
      notice = 'Server is off. Now send the request.'
      return
    }
    const before = clone(tasks)
    const next = handleRequest(
      {
        method: 'POST',
        path: '/tasks',
        body: JSON.stringify({ title: input.trim() || storyTitle }),
      },
      before,
      { serverOn: false, databaseOn: true },
    )
    tasksBefore = before
    tasks = next.tasksAfter
    run = next
    phase = 'choice'
    selectedChoice = null
    choiceChecked = false
  }

  function databasePrimary() {
    if (databaseOn) {
      databaseOn = false
      resetAction()
      notice = 'Database is off. Now send the request.'
      return
    }
    const before = clone(tasks)
    const next = handleRequest(
      {
        method: 'POST',
        path: '/tasks',
        body: JSON.stringify({ title: input.trim() || storyTitle }),
      },
      before,
      { serverOn: true, databaseOn: false },
    )
    tasksBefore = before
    tasks = next.tasksAfter
    run = next
    phase = 'choice'
    selectedChoice = null
    choiceChecked = false
  }

  function toggleServer() {
    if (current === 'database') {
      notice = 'The server is alive in this chapter. Use the database switch.'
      return
    }
    serverOn = !serverOn
    resetAction()
    notice = serverOn ? 'Server is on.' : 'Server is off.'
  }

  function toggleDatabase() {
    databaseOn = !databaseOn
    resetAction()
    notice = databaseOn ? 'Database is on.' : 'Database is off.'
  }

  function refreshTool() {
    if (current === 'fetch') {
      fetchList()
      return
    }
    if (current === 'refresh') {
      refreshPage()
      return
    }
    resetAction()
    notice = 'Ready to try the chapter again.'
  }

  function primaryAction() {
    if (phase !== 'start') return
    notice = ''
    if (current === 'add') addTask()
    else if (current === 'fetch') fetchList()
    else if (current === 'refresh') refreshPage()
    else if (current === 'payload') sendPayload()
    else if (current === 'server') serverPrimary()
    else if (current === 'database') databasePrimary()
  }

  function buildChoice(): StoryChoiceData | null {
    if (current === 'refresh') return null
    if (current === 'payload') {
      const base = CHAPTER_CHOICES.payload
      if (!base) return null
      const correct = payloadCase.expectedLayer
      return {
        ...base,
        correctId: correct,
        correctNote:
          correct === 'router'
            ? `The router stopped this request with ${payloadCase.expectedStatus}. No handler ran and the database was not touched.`
            : `The route matched, so the server handler rejected the payload with ${payloadCase.expectedStatus}. The database was not touched.`,
      }
    }
    return CHAPTER_CHOICES[current] ?? null
  }

  function completionFor(id: ChapterId): {
    title: string
    body: string
    receipt: string[]
  } {
    if (id === 'add') {
      const rowId = run?.inserted?.id ?? tasks[0]?.id ?? 1
      return {
        title: 'Task added.',
        body: `“${storyTitle}” became a row in the database. You followed your own text from the form to storage.`,
        receipt: ['POST /tasks', '201 Created', `row ${rowId} · ${storyTitle}`],
      }
    }
    if (id === 'fetch') {
      return {
        title: 'List rebuilt.',
        body: 'The browser asked GET /tasks, the server read the rows, and the page rendered the response.',
        receipt: ['GET /tasks', '200 OK', `${Math.max(1, tasks.length)} ${tasks.length === 1 ? 'row' : 'rows'} returned`],
      }
    }
    if (id === 'refresh') {
      return {
        title: 'The database kept it.',
        body: 'The page reloaded, but the database still had the task. The browser rebuilt the list from GET /tasks.',
        receipt: ['Refresh', 'database storage', 'row still there'],
      }
    }
    if (id === 'payload') {
      return {
        title: 'The server pushed back.',
        body: `${payloadCase.label} stopped with ${payloadCase.expectedStatus}. The layer that owns the check rejected it, and the database stayed untouched.`,
        receipt: [
          `${payloadCase.method} ${payloadCase.path}`,
          `${payloadCase.expectedStatus}`,
          `stopped at ${payloadCase.expectedLayer}`,
        ],
      }
    }
    if (id === 'server') {
      return {
        title: 'The page stayed up.',
        body: 'The server was off, so no response came back. The page kept working and the database was never reached.',
        receipt: ['POST /tasks', 'No response', 'database untouched'],
      }
    }
    return {
      title: 'The server reported the failure.',
      body: 'The request reached the server, but the database was unavailable. The server returned 503 and wrote nothing.',
      receipt: ['POST /tasks', '503 Service Unavailable', '0 rows written'],
    }
  }

  function statusLabel(value: Run | null): string {
    if (!value) return ''
    if (value.failure === 'timeout') return 'No response'
    if (!value.response) return 'No response'
    const labels: Record<number, string> = {
      200: 'OK',
      201: 'Created',
      400: 'Bad Request',
      404: 'Not Found',
      405: 'Method Not Allowed',
      503: 'Service Unavailable',
    }
    return `${value.response.status} ${labels[value.response.status] ?? ''}`.trim()
  }

  function requestBody(value: Run | null): string {
    return value?.request?.body ?? ''
  }

  function responseBody(value: Run | null): string {
    if (!value) return ''
    if (!value.response) return 'No response.'
    return JSON.stringify(value.response.body)
  }

  function stageState(index: number): 'done' | 'current' | 'future' {
    if (!run) return index === 0 ? 'current' : 'future'
    if (run.failure === 'timeout') {
      return index < 2 ? 'done' : index === 2 ? 'current' : 'future'
    }
    if (run.failure === 'not_found' || run.failure === 'method_not_allowed') {
      return index < 2 ? 'done' : index === 2 ? 'current' : 'future'
    }
    if (run.failure === 'validation' || run.failure === 'invalid_json') {
      return index < 2 ? 'done' : index === 2 ? 'current' : 'future'
    }
    if (run.failure === 'database_error') {
      return index < 3 ? 'done' : index === 3 ? 'current' : 'future'
    }
    if (run.response?.status === 201 || run.response?.status === 200) {
      return 'done'
    }
    return index === 0 ? 'current' : 'future'
  }

  function currentStageIndex(): number {
    if (!run) return 0
    if (run.failure === 'timeout') return 1
    if (
      run.failure === 'not_found' ||
      run.failure === 'method_not_allowed' ||
      run.failure === 'validation' ||
      run.failure === 'invalid_json'
    ) {
      return 2
    }
    if (run.failure === 'database_error') return 3
    return 3
  }

  function stageLabel(index: number): string {
    if (index === 0) return 'Browser'
    if (index === 1) return 'HTTP hop'
    if (index === 2) return 'Server'
    return 'Database'
  }

  function stageNote(index: number): string {
    if (index === 0) return 'Your action leaves the page.'
    if (index === 1) return 'Method, path and your data.'
    if (index === 2) return 'The handler and its checks.'
    return 'The row and the durable copy.'
  }

  function pathStatus(id: ChapterId): string {
    if (completed.includes(id)) return 'Done'
    if (id === continueId) return 'Continue'
    return 'Later'
  }

  function pathButtonLabel(): string {
    if (sandboxUnlocked) return 'Open sandbox'
    const target = chapterById(continueId)
    return completed.length === 0
      ? `Start chapter ${target.number}`
      : `Continue chapter ${target.number}`
  }

  function pathButtonAction() {
    if (sandboxUnlocked) openSandbox()
    else selectChapter(continueId)
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && depthOpen) {
      event.preventDefault()
      closeDepth()
    }
  }

  function syncHash() {
    const parts = window.location.hash.replace(/^#/, '').split('/')
    if (parts[0] !== 'story') return
    const id = parts[1] as ChapterId | undefined
    if (id && STORY_CHAPTERS.some((item) => item.id === id)) {
      if (canOpenChapter(id, progress)) {
        initChapter(id, completed.includes(id))
      } else {
        view = 'path'
      }
      return
    }
    view = 'path'
  }

  $effect(() => {
    saveProgress(progress)
  })

  $effect(() => {
    if (!depthOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  })

  $effect(() => {
    const nextHash = view === 'path' ? STORY_HASH : `${STORY_HASH}/${current}`
    if (!hashReady) return
    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, '', nextHash)
    }
  })

  onMount(() => {
    syncHash()
    hashReady = true
    window.addEventListener('hashchange', syncHash)
    window.addEventListener('keydown', onKeydown)
    return () => {
      window.removeEventListener('hashchange', syncHash)
      window.removeEventListener('keydown', onKeydown)
    }
  })
</script>

<div class="story-shell">
  <header class="story-top">
    <div class="story-brand">
      <span class="story-logo" aria-hidden="true">W</span>
      <span class="story-brand-name">Web Flow Explorer</span>
    </div>

    <div class="story-mode" aria-label="Story Mode or Sandbox">
      <button
        class="story-mode-btn is-active"
        type="button"
        aria-pressed="true"
        onclick={openPath}
      >
        Story Mode
      </button>
      <button
        class="story-mode-btn"
        class:is-locked={!sandboxUnlocked}
        type="button"
        aria-pressed="false"
        aria-disabled={!sandboxUnlocked}
        onclick={openSandbox}
      >
        Sandbox
        {#if !sandboxUnlocked}
          <svg class="story-lock" width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true">
            <rect x="2.5" y="4.5" width="5" height="4" rx="1"></rect>
            <path d="M3.5 4.5V3.2a1.5 1.5 0 0 1 3 0v1.3"></path>
          </svg>
        {/if}
      </button>
    </div>

    <div class="story-top-right">
      {#if view === 'chapter'}
        <nav class="story-depth" aria-label="Depth">
          <button
            class="story-depth-btn"
            class:is-active={depth === 'app'}
            type="button"
            aria-label="Use the app"
            onclick={closeDepth}
          >
            <span class="story-depth-full" aria-hidden="true">Use the app</span><span class="story-depth-short" aria-hidden="true">App</span>
          </button>
          <button
            class="story-depth-btn"
            class:is-locked={!depths.behind}
            type="button"
            aria-label="Behind the scenes"
            aria-disabled={!depths.behind}
            aria-pressed={depth === 'behind'}
            onclick={() => openDepth('behind')}
          >
            <span class="story-depth-full" aria-hidden="true">Behind the scenes</span><span class="story-depth-short" aria-hidden="true">Behind</span>
            {#if !depths.behind}
              <svg class="story-lock" width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true">
                <rect x="2.5" y="4.5" width="5" height="4" rx="1"></rect>
                <path d="M3.5 4.5V3.2a1.5 1.5 0 0 1 3 0v1.3"></path>
              </svg>
            {/if}
          </button>
          <button
            class="story-depth-btn"
            class:is-locked={!depths.under}
            type="button"
            aria-label="Under the hood"
            aria-disabled={!depths.under}
            aria-pressed={depth === 'under'}
            onclick={() => openDepth('under')}
          >
            <span class="story-depth-full" aria-hidden="true">Under the hood</span><span class="story-depth-short" aria-hidden="true">Under</span>
            {#if !depths.under}
              <svg class="story-lock" width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true">
                <rect x="2.5" y="4.5" width="5" height="4" rx="1"></rect>
                <path d="M3.5 4.5V3.2a1.5 1.5 0 0 1 3 0v1.3"></path>
              </svg>
            {/if}
          </button>
        </nav>
      {/if}
      <div class="story-chapter-mini">
        <span>{completed.length} of 6 complete</span>
        <div class="story-bars" aria-hidden="true">
          {#each STORY_CHAPTERS as item, index (item.id)}
            <span
              class:is-done={completed.includes(item.id)}
              class:is-current={item.id === current && !completed.includes(item.id)}
            ></span>
          {/each}
        </div>
      </div>
    </div>
  </header>

  {#if notice}
    <p class="story-notice" role="status" aria-live="polite">{notice}</p>
  {/if}

  {#if view === 'path'}
    <main class="story-page story-path-page">
      <div class="story-entry-head">
        <p class="story-eyebrow">STORY MODE · YOUR OWN TO-DO APP</p>
        <h1>One problem at a time.</h1>
        <p>Each chapter starts with something your app cannot do yet. You make the move by hand, then see which layer made it happen.</p>
      </div>

      <div class="story-entry-grid">
        <section class="story-path-card">
          <div class="story-path-head">
            <div><p class="story-eyebrow">SIX CHAPTERS</p><h2>Your path through the stack</h2></div>
            <span class="story-chip">{completed.length} of 6 complete</span>
          </div>
          <div class="story-path-list">
            {#each STORY_CHAPTERS as item (item.id)}
              <button
                class="story-path-row"
                class:is-current={!sandboxUnlocked && item.id === continueId}
                class:is-done={completed.includes(item.id)}
                type="button"
                onclick={() => selectChapter(item.id)}
              >
                <span class="story-path-num">
                  {#if completed.includes(item.id)}
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m2 6 2.5 2.5L10 3"></path></svg>
                  {:else}
                    {item.number}
                  {/if}
                </span>
                <span class="story-path-main"><strong>{item.title}</strong><span>{item.problem}</span></span>
                <span class="story-path-state">{pathStatus(item.id)}</span>
              </button>
            {/each}
          </div>
          <div class="story-path-foot">
            <span class="story-muted">Progress saves automatically.</span>
            <button class="story-btn story-btn-primary" type="button" onclick={pathButtonAction}>
              {pathButtonLabel()}
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 7h9M8 4l3 3-3 3"></path></svg>
            </button>
          </div>
        </section>

        <aside class="story-sandbox-card">
          <p class="story-eyebrow">SANDBOX</p>
          <h2>{sandboxUnlocked ? 'Everything is open.' : 'The controls you are earning.'}</h2>
          <p>{sandboxUnlocked ? 'Every scenario, switch and case is available.' : 'Story Mode opens the sandbox one switch at a time, right after the chapter that explains it.'}</p>
          {#if sandboxUnlocked}
            <div class="story-sandbox-list">
              <div class="story-sandbox-item"><span class="story-check">✓</span>All cases</div>
              <div class="story-sandbox-item"><span class="story-check">✓</span>All switches</div>
              <div class="story-sandbox-item"><span class="story-check">✓</span>Three depths</div>
            </div>
            <button class="story-btn story-btn-primary story-wide" type="button" onclick={openSandbox}>Open sandbox</button>
          {:else}
            <div class="story-sandbox-list">
              <div class="story-sandbox-item"><span class="story-lock-small">●</span>Scenario picker</div>
              <div class="story-sandbox-item"><span class="story-lock-small">●</span>Refresh and storage</div>
              <div class="story-sandbox-item"><span class="story-lock-small">●</span>Server and database</div>
            </div>
            <button class="story-btn story-wide" type="button" disabled>Sandbox locked</button>
            <p class="story-sandbox-note">Finish all six chapters to open every scenario and switch.</p>
          {/if}
        </aside>
      </div>
    </main>
  {:else}
    <main class="story-page">
      <div class="story-chapter-head">
        <div>
          <p class="story-eyebrow">CHAPTER {chapter.number} OF 6</p>
          <h1>{chapter.title}</h1>
          <p>{chapter.problem}</p>
        </div>
        <div class="story-head-right">
          <div class="story-progress">
            <span class="story-chapter-mini">
              <span>{completed.length} of 6 complete</span>
              <div class="story-bars" aria-hidden="true">
                {#each STORY_CHAPTERS as item (item.id)}
                  <span class:is-done={completed.includes(item.id)} class:is-current={item.id === current && !completed.includes(item.id)}></span>
                {/each}
              </div>
            </span>
          </div>
          <button class="story-link" type="button" onclick={openPath}>All chapters</button>
        </div>
      </div>

      <div class="story-grid">
        <aside class="story-card story-story-card">
          <p class="story-eyebrow">CHAPTER {chapter.number} · THE PROBLEM</p>
          <h2>{chapter.problem}</h2>
          <p class="story-lead">{chapter.narrative}</p>
          <div class="story-quote">{chapter.quote}</div>
          <div class="story-steps">
            {#each chapter.steps as label, index (label)}
              <div class="story-step is-{stepStates[index]}">
                <span class="story-step-num">{#if stepStates[index] === 'done'}✓{:else}{index + 1}{/if}</span>
                <span>{label}</span>
              </div>
            {/each}
          </div>
          <p class="story-foot">Your text is the data. It should appear unchanged at every hop.</p>
        </aside>

        <section class="story-work">
          {#if phase === 'done'}
            <section class="story-complete">
              <span class="story-complete-mark" aria-hidden="true">✓</span>
              <p class="story-eyebrow">CHAPTER {chapter.number} COMPLETE</p>
              <h2>{completion.title}</h2>
              <p>{completion.body}</p>
              <div class="story-receipt is-complete">
                <p class="story-eyebrow">THE RECEIPT</p>
                {#each completion.receipt as line, index (line)}
                  <div class="story-receipt-line"><strong>{line}</strong>{#if index === 0}<span class="story-muted">·</span>{/if}</div>
                {/each}
              </div>
              <div class="story-complete-actions">
                <button class="story-btn story-btn-primary" type="button" onclick={goNextChapter}>
                  {nextChapter ? `Next chapter: ${nextChapter.title}` : 'Open sandbox'}
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 7h9M8 4l3 3-3 3"></path></svg>
                </button>
                <button class="story-btn story-btn-quiet" type="button" onclick={openPath}>Back to chapters</button>
              </div>
            </section>
          {:else}
            <p class="story-eyebrow">YOUR ACTION</p>
            <div class="story-browser" class:is-compact={phase !== 'start'}>
              <div class="story-browser-bar" aria-hidden="true">
                <span class="story-dots"><i></i><i></i><i></i></span>
                <span class="story-url">my-tasks.app</span>
              </div>
              <div class="story-app">
                <header class="story-app-head"><h2>My tasks</h2><p>One thing at a time.</p></header>

                {#if phase === 'start'}
                  {#if current === 'refresh'}
                    <div class="story-storage-picker" role="radiogroup" aria-label="Where should the task live?">
                      {#each STORAGE_MODES as mode (mode.id)}
                        <label class="story-storage-option" class:is-selected={storage === mode.id}>
                          <input type="radio" name="story-storage" value={mode.id} checked={storage === mode.id} onchange={() => setStorage(mode.id)} />
                          <span class="story-radio" aria-hidden="true"></span>
                          <span class="story-storage-copy"><strong>{mode.label}</strong><span>{mode.serverCanRead ? 'Server can read it.' : 'Stays in the browser.'}</span></span>
                        </label>
                      {/each}
                    </div>
                  {/if}

                  {#if current === 'payload'}
                    <div class="story-case-picker" aria-label="Broken request">
                      {#each PAYLOAD_CASES as item (item.id)}
                        <button
                          class="story-case-btn"
                          class:is-active={payloadCaseId === item.id}
                          type="button"
                          onclick={() => selectPayloadCase(item.id)}
                        >
                          {item.label}
                        </button>
                      {/each}
                    </div>
                  {/if}

                  {#if showInput}
                    <div class="story-add-row">
                      <label class="story-sr" for="story-task-input">Task title</label>
                      <input id="story-task-input" class="story-input" value={input} oninput={(event) => (input = event.currentTarget.value)} onkeydown={(event) => { if (event.key === 'Enter' && phase === 'start') primaryAction() }} />
                      <button class="story-btn story-btn-primary" type="button" onclick={primaryAction}>{primaryLabel}</button>
                    </div>
                  {:else}
                    <button class="story-btn story-btn-primary story-wide" type="button" onclick={primaryAction}>
                      {primaryLabel}
                    </button>
                  {/if}
                {/if}

                {#if appError}
                  <p class="story-error" role="alert">{appError}</p>
                {/if}

                <ul class="story-task-list" aria-label="Tasks">
                  {#each tasks as task (task.id)}
                    <li class="story-task" class:is-new={run?.inserted?.id === task.id}>
                      <span class="story-check-box" aria-hidden="true"></span>
                      <span>{task.title}</span>
                      {#if run?.inserted?.id === task.id}<span class="story-new-tag">Saved</span>{/if}
                    </li>
                  {/each}
                  {#if current === 'fetch' && tasks.length === 0 && !run}
                    <li class="story-empty">Waiting for the list.</li>
                  {/if}
                </ul>
                <p class="story-app-note">{appNote}</p>
              </div>
            </div>

            {#if run || refreshed}
              <div class="story-receipt">
                <p class="story-eyebrow">ON THE WIRE</p>
                {#if run?.request}
                  <div class="story-receipt-line"><strong>{run.request.method} {run.request.path}</strong><span class:is-bad={run.failure === 'database_error' || run.failure === 'validation' || run.failure === 'invalid_json' || run.failure === 'not_found' || run.failure === 'method_not_allowed'}>{statusLabel(run)}</span></div>
                  {#if run.request.body}<div class="story-receipt-line is-body">{run.request.body}</div>{/if}
                  {#if run.response}<div class="story-receipt-line is-response">{responseBody(run)}</div>{/if}
                  {#if run.failure === 'timeout'}<div class="story-receipt-line is-body">No response. The browser is still waiting.</div>{/if}
                {:else}
                  <div class="story-receipt-line"><strong>{storageMode.label}</strong><span>{refreshed ? 'refreshed' : ''}</span></div>
                  <div class="story-receipt-line is-body">{refreshResult}</div>
                {/if}
              </div>
            {/if}

            {#if current === 'refresh' && refreshed && phase === 'start'}
              <div class="story-refresh-result" role="status" aria-live="polite">
                <strong>{storageMode.survivesRefresh ? 'The task survived.' : 'The task disappeared.'}</strong>
                <p>{storageMode.result}</p>
                {#if storage !== 'database'}<button class="story-text-link" type="button" onclick={() => setStorage('database')}>Try the database</button>{/if}
              </div>
            {/if}

            {#if current === 'payload' && phase === 'choice'}
              <div class="story-case-picker is-after" aria-label="Try another broken request">
                <span class="story-muted">Try another:</span>
                {#each PAYLOAD_CASES as item (item.id)}
                  <button
                    class="story-case-btn"
                    class:is-active={payloadCaseId === item.id}
                    type="button"
                    onclick={() => selectPayloadCase(item.id)}
                  >
                    {item.label}
                  </button>
                {/each}
              </div>
            {/if}

            {#if phase === 'choice' && choice}
              <StoryChoice
                prompt={choice.prompt}
                lead={choice.lead}
                options={choice.options}
                selectedId={selectedChoice}
                checked={choiceChecked}
                isCorrect={choiceCorrect}
                correctNote={choice.correctNote}
                wrongNote={choice.wrongNote}
                onSelect={setChoice}
                onCheck={checkChoice}
                onContinue={continueChoice}
                onRetry={retryChoice}
                continueLabel={`Finish chapter ${chapter.number}`}
              />
            {/if}
          {/if}
        </section>

        <aside class="story-side">
          {#if phase === 'done'}
            <section class="story-unlock-card">
              <p class="story-eyebrow">{sandboxUnlocked ? 'ALL CHAPTERS COMPLETE' : 'UNLOCKED'}</p>
              <h2>{sandboxUnlocked ? 'The sandbox is open.' : `One layer deeper.`}</h2>
              <div class="story-unlock-list">
                {#if sandboxUnlocked}
                  <div class="story-unlock-item"><span class="story-check">✓</span><span><strong>Every scenario</strong><span>All existing cases and new failure cases.</span></span></div>
                  <div class="story-unlock-item"><span class="story-check">✓</span><span><strong>Every switch</strong><span>Server, database, storage and refresh.</span></span></div>
                  <div class="story-unlock-item"><span class="story-check">✓</span><span><strong>Three depths</strong><span>Use the app, behind the scenes, under the hood.</span></span></div>
                {:else}
                  <div class="story-unlock-item"><span class="story-check">✓</span><span><strong>{chapter.unlockTitle}</strong><span>{chapter.unlockDetail}</span></span></div>
                  <div class="story-unlock-item"><span class="story-check">✓</span><span><strong>Progress saved</strong><span>Continue from the chapters screen anytime.</span></span></div>
                {/if}
              </div>
              <p class="story-unlock-next">
                {#if nextChapter}
                  Next: <strong>{nextChapter.title}</strong>.
                {:else}
                  The sandbox is ready when you are.
                {/if}
              </p>
            </section>
          {:else}
            <section class="story-path-card is-side">
              <div class="story-path-head"><div><p class="story-eyebrow">YOUR PATH</p><h2>One request, four stops</h2></div><span class="story-chip">Step {currentStageIndex() + 1}</span></div>
              <div class="story-stages">
                {#each [0, 1, 2, 3] as index (index)}
                  <div class="story-stage is-{stageState(index)}">
                    <span class="story-stage-dot">{#if stageState(index) === 'done'}✓{:else}{index + 1}{/if}</span>
                    <span class="story-stage-copy"><span>{stageLabel(index)}</span><small>{stageNote(index)}</small></span>
                    {#if stageState(index) === 'current'}<span class="story-stage-meta">Here</span>{/if}
                  </div>
                {/each}
              </div>
              <p class="story-path-note">{run ? 'The request is moving through the stack.' : 'The browser has your text. The next hop is up to you.'}</p>
            </section>

            <section class="story-tip-card">
              <p class="story-eyebrow">YOUR DATA</p>
              <h2>{current === 'fetch' ? 'The list you asked for' : current === 'payload' ? 'The broken request' : 'The same text, everywhere'}</h2>
              <p>{current === 'fetch' ? 'The server reads these rows and sends them back.' : current === 'payload' ? 'The request shape tells the router and handler what to do.' : 'You typed this. It is the value that travels in the request and becomes the row.'}</p>
              <div class="story-data">
                {#if current === 'fetch'}
                  GET /tasks
                {:else if current === 'payload'}
                  {payloadCase.method} {payloadCase.path}
                {:else if current === 'server' || current === 'database'}
                  "{input || storyTitle}"
                {:else}
                  "{input || storyTitle}"
                {/if}
              </div>
            </section>
          {/if}
        </aside>
      </div>
    </main>

    <StoryTools
      available={tools}
      {serverOn}
      {databaseOn}
      {storage}
      onRefresh={refreshTool}
      onStorage={setStorage}
      onServer={toggleServer}
      onDatabase={toggleDatabase}
      onReset={resetChapter}
    />
  {/if}

  {#if depthOpen}
    <div class="story-depth-layer">
      <button class="story-depth-scrim" type="button" tabindex="-1" aria-label="Close depth details" onclick={closeDepth}></button>
      <div class="story-depth-panel" role="dialog" aria-modal="true" aria-label="Depth details" tabindex="-1">
        <header class="story-depth-head">
          <div><p class="story-eyebrow">{depth === 'behind' ? 'BEHIND THE SCENES' : 'UNDER THE HOOD'}</p><h2>{depth === 'behind' ? 'The request in motion' : 'The raw receipt'}</h2></div>
          <button class="story-depth-close" type="button" aria-label="Close depth details" onclick={closeDepth}>×</button>
        </header>
        <div class="story-depth-body">
          {#if depth === 'behind'}
            <p class="story-depth-intro">Use the story you just played, then look at the layer that did the work.</p>
            <div class="story-depth-stages">
              {#each [0, 1, 2, 3] as index (index)}
                <div class="story-depth-stage is-{stageState(index)}">
                  <span>{index + 1}</span>
                  <div><strong>{stageLabel(index)}</strong><p>{stageNote(index)}</p></div>
                </div>
              {/each}
            </div>
            {#if run}
              <div class="story-depth-mono"><strong>{run.request?.method ?? 'Request'} {run.request?.path ?? ''}</strong><br>{statusLabel(run)}</div>
            {/if}
          {:else}
            <p class="story-depth-intro">The exact request and response for this chapter.</p>
            {#if run?.request}
              <div class="story-depth-label">THE REQUEST</div>
              <pre class="story-depth-pre">{run.request.method} {run.request.path} HTTP/1.1
Host: my-tasks.app{#if run.request.body}
Content-Type: application/json

{run.request.body}{/if}</pre>
              <div class="story-depth-label">THE RESPONSE</div>
              <pre class="story-depth-pre">{run.response ? `HTTP/1.1 ${statusLabel(run)}\n${responseBody(run)}` : 'No response came back.'}</pre>
            {:else}
              <p class="story-depth-empty">Make the move first, then this view will have a request to show.</p>
            {/if}
            <div class="story-depth-label">THE TASKS TABLE</div>
            <div class="story-depth-table">
              {#each tasks as task (task.id)}<div><span>{task.id}</span><span>{task.title}</span></div>{/each}
              {#if tasks.length === 0}<div class="story-depth-empty-row">No rows.</div>{/if}
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>
