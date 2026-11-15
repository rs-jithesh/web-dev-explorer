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
      return serverOn ? 'Turn off server' : 'Send request'
    }
    if (current === 'database') {
      return databaseOn ? 'Turn off database' : 'Send request'
    }
    return chapter.actionLabel
  })
  const appError = $derived.by(() => {
    if (current === 'server' && run?.failure === 'timeout') {
      return 'No response.'
    }
    if (current === 'database' && run?.failure === 'database_error') {
      return 'Database unavailable (503).'
    }
    return ''
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
      notice = 'Finish this chapter first.'
      return
    }
    initChapter(id, false)
  }

  function redoChapter() {
    initChapter(current, false)
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
      notice = 'Finish all chapters first.'
      return
    }
    onSandbox()
  }

  function openDepth(next: Exclude<StoryDepth, 'app'>) {
    if (next === 'behind' && !depths.behind) {
      notice = 'Locked until chapter 1.'
      return
    }
    if (next === 'under' && !depths.under) {
      notice = 'Locked until chapter 2.'
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
      notice = 'Type a task.'
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
      notice = 'Server off. Send when ready.'
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
      notice = 'Database off. Send when ready.'
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
    notice = serverOn ? 'Server on.' : 'Server off.'
  }

  function toggleDatabase() {
    databaseOn = !databaseOn
    resetAction()
    notice = databaseOn ? 'Database on.' : 'Database off.'
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
    notice = 'Chapter reset.'
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
            ? `Router: ${payloadCase.expectedStatus}.`
            : `Server: ${payloadCase.expectedStatus}.`,
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
        body: `“${storyTitle}” became row ${rowId}.`,
        receipt: ['POST /tasks', '201 Created', `row ${rowId} · ${storyTitle}`],
      }
    }
    if (id === 'fetch') {
      return {
        title: 'List loaded.',
        body: 'The rows came back from the server.',
        receipt: ['GET /tasks', '200 OK', `${Math.max(1, tasks.length)} ${tasks.length === 1 ? 'row' : 'rows'}`],
      }
    }
    if (id === 'refresh') {
      return {
        title: 'Refresh survived.',
        body: 'The database still had the task.',
        receipt: ['Refresh', 'database storage', 'row still there'],
      }
    }
    if (id === 'payload') {
      return {
        title: 'Request rejected.',
        body: `${payloadCase.label} stopped at ${payloadCase.expectedLayer} with ${payloadCase.expectedStatus}.`,
        receipt: [
          `${payloadCase.method} ${payloadCase.path}`,
          `${payloadCase.expectedStatus}`,
          `stopped at ${payloadCase.expectedLayer}`,
        ],
      }
    }
    if (id === 'server') {
      return {
        title: 'No response.',
        body: 'The request failed. The page stayed up.',
        receipt: ['POST /tasks', 'No response', 'database untouched'],
      }
    }
    return {
      title: '503.',
      body: 'The server could not reach the database.',
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

  function pathStatus(id: ChapterId): string {
    if (completed.includes(id)) return 'Redo'
    if (id === continueId) return 'Continue'
    return 'Later'
  }

  function pathButtonLabel(): string {
    if (sandboxUnlocked) return 'Open sandbox'
    const target = chapterById(continueId)
    return completed.length === 0
      ? `Start ${target.number}`
      : `Continue ${target.number}`
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
    </div>
  </header>

  {#if notice}
    <p class="story-notice" role="status" aria-live="polite">{notice}</p>
  {/if}

  {#if view === 'path'}
    <main class="story-page story-path-page">
      <div class="story-entry-head">
        <h1>One problem at a time.</h1>
        <p>Six chapters. You make each move.</p>
      </div>

      <div class="story-entry-grid">
        <section class="story-path-card">
          <div class="story-path-head">
            <div><h2>Chapters</h2></div>
            <span class="story-chip">{completed.length}/6</span>
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
            <span class="story-muted">Saved</span>
            <button class="story-btn story-btn-primary" type="button" onclick={pathButtonAction}>
              {pathButtonLabel()}
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 7h9M8 4l3 3-3 3"></path></svg>
            </button>
          </div>
        </section>

        <aside class="story-sandbox-card">
          <h2>Sandbox</h2>
          <p>{sandboxUnlocked ? 'Everything is open.' : 'Unlocks after chapter 6.'}</p>
          {#if sandboxUnlocked}
            <div class="story-sandbox-list">
              <div class="story-sandbox-item"><span class="story-check">✓</span>All cases</div>
              <div class="story-sandbox-item"><span class="story-check">✓</span>All switches</div>
              <div class="story-sandbox-item"><span class="story-check">✓</span>Three depths</div>
            </div>
            <button class="story-btn story-btn-primary story-wide" type="button" onclick={openSandbox}>Open</button>
          {:else}
            <div class="story-sandbox-list">
              <div class="story-sandbox-item"><span class="story-lock-small">●</span>Scenarios</div>
              <div class="story-sandbox-item"><span class="story-lock-small">●</span>Switches</div>
              <div class="story-sandbox-item"><span class="story-lock-small">●</span>Depths</div>
            </div>
            <button class="story-btn story-wide" type="button" disabled>Locked</button>
          {/if}
        </aside>
      </div>
    </main>
  {:else}
    <main class="story-page">
      <div class="story-chapter-head">
        <div>
          <p class="story-eyebrow">Chapter {chapter.number} / 6</p>
          <h1>{chapter.title}</h1>
        </div>
        <div class="story-head-right">
          <button class="story-link" type="button" onclick={openPath}>Chapters</button>
        </div>
      </div>

      <div class="story-grid">
        <aside class="story-card story-story-card">
          <h2>{chapter.problem}</h2>
          <p class="story-lead">{chapter.narrative}</p>
          <div class="story-steps">
            {#each chapter.steps as label, index (label)}
              <div class="story-step is-{stepStates[index]}">
                <span class="story-step-num">{#if stepStates[index] === 'done'}✓{:else}{index + 1}{/if}</span>
                <span>{label}</span>
              </div>
            {/each}
          </div>
        </aside>

        <section class="story-work">
          {#if phase === 'done'}
            <section class="story-complete">
              <span class="story-complete-mark" aria-hidden="true">✓</span>
              <h2>{completion.title}</h2>
              <p>{completion.body}</p>
              <div class="story-receipt is-complete">
                {#each completion.receipt as line, index (line)}
                  <div class="story-receipt-line"><strong>{line}</strong>{#if index === 0}<span class="story-muted">·</span>{/if}</div>
                {/each}
              </div>
              <div class="story-complete-actions">
                <button class="story-btn story-btn-primary" type="button" onclick={goNextChapter}>
                  {nextChapter ? `Next: ${nextChapter.title}` : 'Open sandbox'}
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 7h9M8 4l3 3-3 3"></path></svg>
                </button>
                <button class="story-btn" type="button" onclick={redoChapter}>Redo</button>
                <button class="story-btn story-btn-quiet" type="button" onclick={openPath}>Chapters</button>
              </div>
            </section>
          {:else}
            <div class="story-browser" class:is-compact={phase !== 'start'}>
              <div class="story-browser-bar" aria-hidden="true">
                <span class="story-dots"><i></i><i></i><i></i></span>
                <span class="story-url">my-tasks.app</span>
              </div>
              <div class="story-app">
                <header class="story-app-head"><h2>My tasks</h2></header>

                {#if phase === 'start'}
                  {#if current === 'refresh'}
                    <div class="story-storage-picker" role="radiogroup" aria-label="Where should the task live?">
                      {#each STORAGE_MODES as mode (mode.id)}
                        <label class="story-storage-option" class:is-selected={storage === mode.id}>
                          <input type="radio" name="story-storage" value={mode.id} checked={storage === mode.id} onchange={() => setStorage(mode.id)} />
                          <span class="story-radio" aria-hidden="true"></span>
                          <span class="story-storage-copy"><strong>{mode.label}</strong><span>{mode.serverCanRead ? 'Server' : 'Browser'}</span></span>
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
                    <li class="story-empty">Empty.</li>
                  {/if}
                </ul>
              </div>
            </div>

            {#if run || refreshed}
              <div class="story-receipt">
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
                <strong>{storageMode.survivesRefresh ? 'Survived.' : 'Gone.'}</strong>
                <p>{storageMode.result}</p>
                {#if storage !== 'database'}<button class="story-text-link" type="button" onclick={() => setStorage('database')}>Use database</button>{/if}
              </div>
            {/if}

            {#if current === 'payload' && phase === 'choice'}
              <div class="story-case-picker is-after" aria-label="Try another broken request">
                <span class="story-muted">Try:</span>
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
                continueLabel={`Finish ${chapter.number}`}
              />
            {/if}
          {/if}
        </section>

        <aside class="story-side">
          {#if phase === 'done'}
            <section class="story-unlock-card">
              <h2>{sandboxUnlocked ? 'Sandbox open' : 'Unlocked'}</h2>
              <div class="story-unlock-list">
                {#if sandboxUnlocked}
                  <div class="story-unlock-item"><span class="story-check">✓</span><span><strong>All cases</strong></span></div>
                  <div class="story-unlock-item"><span class="story-check">✓</span><span><strong>All switches</strong></span></div>
                  <div class="story-unlock-item"><span class="story-check">✓</span><span><strong>All depths</strong></span></div>
                {:else}
                  <div class="story-unlock-item"><span class="story-check">✓</span><span><strong>{chapter.unlockTitle}</strong><span>{chapter.unlockDetail}</span></span></div>
                {/if}
              </div>
              <p class="story-unlock-next">
                {#if nextChapter}
                  Next: <strong>{nextChapter.title}</strong>.
                {:else}
                  Ready.
                {/if}
              </p>
            </section>
          {:else}
            <section class="story-path-card is-side">
              <div class="story-path-head"><div><h2>Path</h2></div><span class="story-chip">Step {currentStageIndex() + 1}</span></div>
              <div class="story-stages">
                {#each [0, 1, 2, 3] as index (index)}
                  <div class="story-stage is-{stageState(index)}">
                    <span class="story-stage-dot">{#if stageState(index) === 'done'}✓{:else}{index + 1}{/if}</span>
                    <span class="story-stage-copy"><span>{stageLabel(index)}</span></span>
                    {#if stageState(index) === 'current'}<span class="story-stage-meta">Here</span>{/if}
                  </div>
                {/each}
              </div>
            </section>

            <section class="story-tip-card">
              <p class="story-eyebrow">{current === 'fetch' ? 'Query' : current === 'payload' ? 'Request' : 'Task'}</p>
              <div class="story-data">
                {#if current === 'fetch'}
                  GET /tasks
                {:else if current === 'payload'}
                  {payloadCase.method} {payloadCase.path}
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
          <div><h2>{depth === 'behind' ? 'Request path' : 'Raw'}</h2></div>
          <button class="story-depth-close" type="button" aria-label="Close" onclick={closeDepth}>×</button>
        </header>
        <div class="story-depth-body">
          {#if depth === 'behind'}
            <div class="story-depth-stages">
              {#each [0, 1, 2, 3] as index (index)}
                <div class="story-depth-stage is-{stageState(index)}">
                  <span>{index + 1}</span>
                  <div><strong>{stageLabel(index)}</strong></div>
                </div>
              {/each}
            </div>
            {#if run}
              <div class="story-depth-mono"><strong>{run.request?.method ?? 'Request'} {run.request?.path ?? ''}</strong><br>{statusLabel(run)}</div>
            {/if}
          {:else}
            {#if run?.request}
              <div class="story-depth-label">Request</div>
              <pre class="story-depth-pre">{run.request.method} {run.request.path} HTTP/1.1
Host: my-tasks.app{#if run.request.body}
Content-Type: application/json

{run.request.body}{/if}</pre>
              <div class="story-depth-label">Response</div>
              <pre class="story-depth-pre">{run.response ? `HTTP/1.1 ${statusLabel(run)}\n${responseBody(run)}` : 'No response came back.'}</pre>
            {:else}
              <p class="story-depth-empty">Send a request first.</p>
            {/if}
            <div class="story-depth-label">Rows</div>
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
