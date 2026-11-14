<script lang="ts">
  import { onMount } from 'svelte'
  import { handleRequest, type Run } from '../engine/server'
  import type { Task } from '../engine/types'
  import {
    APP_COPY,
    DEFAULT_TITLE,
    DEPTH_OPTIONS,
    INITIAL_TASKS,
    TRY_COPY,
    storySteps,
    type V2Depth,
    type ViewName,
  } from './content'
  import { evidenceForStep } from './evidence'
  import { v2Prompt } from './tutor'
  import EvidenceCard from './EvidenceCard.svelte'
  import StepRail from './StepRail.svelte'
  import StoryCard from './StoryCard.svelte'
  import TaskApp from './TaskApp.svelte'
  import TutorCard from './TutorCard.svelte'
  import VersionToggle from './VersionToggle.svelte'
  import './v2.css'

  let {
    view,
    onChangeView,
  }: {
    view: ViewName
    onChangeView: (view: ViewName) => void
  } = $props()

  let depth = $state<V2Depth>(1)
  let stepIndex = $state(0)
  let tasks = $state<Task[]>(INITIAL_TASKS.map((task) => ({ ...task })))
  let tasksBefore = $state<Task[]>(INITIAL_TASKS.map((task) => ({ ...task })))
  let appInput = $state(DEFAULT_TITLE)
  let requestTitle = $state(DEFAULT_TITLE)
  let appError = $state('')
  let run = $state<Run | null>(null)

  const steps = $derived(storySteps(requestTitle))
  const step = $derived(steps[stepIndex] ?? steps[0])
  const anchorPending = $derived(
    depth > 1 && stepIndex < 4 ? requestTitle : null,
  )
  const anchorTasks = $derived(
    depth > 1 && stepIndex >= 4
      ? (run?.tasksAfter ?? tasks)
      : tasksBefore,
  )
  const anchorCaption = $derived(
    stepIndex >= 4 ? APP_COPY.anchorDone : APP_COPY.anchorCaption,
  )
  const blocks = $derived(
    run ? evidenceForStep(stepIndex, requestTitle, run, tasksBefore) : [],
  )
  const prompt = $derived(
    run ? v2Prompt(stepIndex, requestTitle, run, tasksBefore) : '',
  )
  const detailActor = $derived(
    stepIndex === 2 ? 'Server code' : step.actor,
  )
  const liveText = $derived(
    depth === 1
      ? 'Use the app. Add a task or look behind the scenes.'
      : depth === 2
        ? `Behind the scenes. Step ${stepIndex + 1} of 5, ${step.actor}. ${step.text}`
        : `Under the hood. Step ${stepIndex + 1} of 5, ${step.actor}.`,
  )

  function makeRun(title: string, before: Task[]): Run {
    return handleRequest(
      {
        method: 'POST',
        path: '/tasks',
        body: JSON.stringify({ title }),
      },
      before,
      { serverOn: true },
    )
  }

  function handleAdd() {
    const title = appInput.trim()
    if (!title) {
      appError = APP_COPY.emptyError
      return
    }

    const before = tasks.map((task) => ({ ...task }))
    const next = makeRun(title, before)

    if (next.response?.status !== 201) {
      appError = 'The server rejected the task.'
      return
    }

    appError = ''
    tasksBefore = before
    requestTitle = title
    run = next
    tasks = next.tasksAfter
    appInput = ''
  }

  function ensureStoryRun() {
    if (run) return

    const title = appInput.trim() || requestTitle || DEFAULT_TITLE
    const before = tasks.map((task) => ({ ...task }))
    const next = makeRun(title, before)

    if (next.response?.status !== 201) {
      appError = 'The server rejected the task.'
      return
    }

    appError = ''
    tasksBefore = before
    requestTitle = title
    run = next
    tasks = next.tasksAfter
  }

  function showDepth(next: V2Depth) {
    if (next === 1) {
      depth = 1
      return
    }

    ensureStoryRun()
    if (!run) return

    if (depth === 1) {
      stepIndex = next === 3 ? 2 : 0
    }
    depth = next
  }

  function showDetails(index = stepIndex) {
    ensureStoryRun()
    if (!run) return
    stepIndex = index
    depth = 3
  }

  function setStep(index: number) {
    stepIndex = Math.max(0, Math.min(index, steps.length - 1))
  }

  function replay() {
    stepIndex = 0
    depth = 2
  }

  function tryEmpty() {
    appInput = ''
    appError = ''
    depth = 1
  }

  function onKeydown(event: KeyboardEvent) {
    const target = event.target as HTMLElement | null
    if (
      target?.closest(
        'input, textarea, select, [contenteditable="true"]',
      )
    ) {
      return
    }

    if (event.key === '1' || event.key === '2' || event.key === '3') {
      event.preventDefault()
      showDepth(Number(event.key) as V2Depth)
      return
    }

    if (event.key === 'Escape' && depth > 1) {
      event.preventDefault()
      depth = depth === 3 ? 2 : 1
    }
  }

  onMount(() => {
    window.addEventListener('keydown', onKeydown)
    return () => window.removeEventListener('keydown', onKeydown)
  })
</script>

<svelte:head>
  <title>Add a task · Web Flow Explorer</title>
</svelte:head>

<div class="v2-shell">
  <header class="v2-topbar">
    <div class="v2-brand">
      <span class="v2-logo" aria-hidden="true">W</span>
      <span class="v2-brand-name">{APP_COPY.brand}</span>
      <span class="v2-context">{APP_COPY.context}</span>
    </div>

    <nav class="v2-depth" aria-label="Depth">
      {#each DEPTH_OPTIONS as option (option.level)}
        <button
          class="v2-depth-btn"
          class:is-active={depth === option.level}
          type="button"
          aria-pressed={depth === option.level}
          aria-keyshortcuts={String(option.level)}
          onclick={() => showDepth(option.level)}
        >
          {option.label}
        </button>
      {/each}
    </nav>

    <VersionToggle {view} onChange={onChangeView} />
  </header>

  <h1 class="v2-sr-only">Web Flow Explorer: Add a task</h1>

  <main class="v2-main">
    {#if depth === 1}
      <section class="v2-depth-one" aria-labelledby="v2-depth-one-title">
        <div class="v2-app-column">
          <p class="v2-eyebrow">{APP_COPY.label}</p>
          <TaskApp
            tasks={tasks}
            input={appInput}
            onInput={(value) => {
              appInput = value
              appError = ''
            }}
            onAdd={handleAdd}
            error={appError}
            lastAddedId={run?.inserted?.id ?? null}
          />
          <p class="v2-caption">{APP_COPY.caption}</p>
        </div>

        <aside class="v2-card v2-try-card" aria-labelledby="v2-try-title">
          <h2 id="v2-try-title">{TRY_COPY.title}</h2>
          <ol class="v2-try-steps">
            <li>
              <span class="v2-try-number" aria-hidden="true">1</span>
              <span>{TRY_COPY.stepOne}</span>
            </li>
            <li>
              <span class="v2-try-number" aria-hidden="true">2</span>
              <span>{TRY_COPY.stepTwo}</span>
            </li>
          </ol>
          <p class="v2-try-note">{TRY_COPY.note}</p>
          <button class="v2-primary v2-wide-button" type="button" onclick={() => showDepth(2)}>
            {TRY_COPY.button}
          </button>
          <p class="v2-try-subtext">{TRY_COPY.subtext}</p>
        </aside>
      </section>
    {:else if depth === 2}
      <section class="v2-depth-two" aria-labelledby="v2-story-title">
        <aside class="v2-anchor" aria-label="The app being explained">
          <p class="v2-eyebrow">{APP_COPY.label}</p>
          <TaskApp
            tasks={anchorTasks}
            input={requestTitle}
            pendingTitle={anchorPending}
            lastAddedId={stepIndex >= 4 ? (run?.inserted?.id ?? null) : null}
            compact
            interactive={false}
            onInput={() => {}}
            onAdd={() => {}}
          />
          <p class="v2-caption">{anchorCaption}</p>
        </aside>

        <StoryCard
          {steps}
          {stepIndex}
          onBack={() => setStep(stepIndex - 1)}
          onStep={() => setStep(stepIndex + 1)}
          onReplay={replay}
          onDetails={() => showDetails(stepIndex)}
          onTryEmpty={tryEmpty}
        />
      </section>
    {:else}
      <section class="v2-depth-three" aria-labelledby="v2-detail-title">
        <StepRail
          {steps}
          {stepIndex}
          input={requestTitle}
          tasks={anchorTasks}
          pendingTitle={anchorPending}
          lastAddedId={stepIndex >= 4 ? (run?.inserted?.id ?? null) : null}
          caption={anchorCaption}
          onStep={(index) => {
            setStep(index)
            depth = 3
          }}
        />

        {#if run}
          <EvidenceCard
            {stepIndex}
            stepLabel={step.short}
            actorLabel={detailActor}
            actorTone={step.tone}
            {blocks}
            onBack={() => (depth = 2)}
            onStep={setStep}
          />

          {#key stepIndex}
            <TutorCard
              {stepIndex}
              prompt={prompt}
              actorLabel={detailActor}
            />
          {/key}
        {/if}
      </section>
    {/if}
  </main>

  <footer class="v2-footer">
    <span class="v2-footer-hint">Press <kbd>1</kbd>, <kbd>2</kbd> or <kbd>3</kbd> to change depth</span>
  </footer>

  <p class="v2-sr-only" aria-live="polite">{liveText}</p>
</div>
