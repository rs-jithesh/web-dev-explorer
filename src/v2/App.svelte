<script lang="ts">
  import { onMount, tick } from 'svelte'
  import { handleRequest, type Run } from '../engine/server'
  import type { Task } from '../engine/types'
  import {
    APP_COPY,
    DEFAULT_TITLE,
    DEPTH_OPTIONS,
    TRY_COPY,
    type V2Depth,
    type ViewName,
  } from './content'
  import {
    EXPLORER_LESSONS,
    lessonById,
    lessonCase,
    storyFor,
    type ExplorerCase,
    type ExplorerLesson,
    type ExplorerLessonId,
  } from './lessons'
  import { termsForStep } from './glossary'
  import { evidenceFor } from './evidence'
  import { MENTAL_QUESTIONS, type MentalQuestion } from './questions'
  import { v2Prompt } from './tutor'
  import ModeSwitch from '../ModeSwitch.svelte'
  import EvidenceCard from './EvidenceCard.svelte'
  import QuestionDrawer from './QuestionDrawer.svelte'
  import StepRail from './StepRail.svelte'
  import StoryCard from './StoryCard.svelte'
  import TaskApp from './TaskApp.svelte'
  import TutorCard from './TutorCard.svelte'
  import VersionToggle from './VersionToggle.svelte'
  import './v2.css'

  let {
    view,
    onChangeView,
    onStory,
  }: {
    view: ViewName
    onChangeView: (view: ViewName) => void
    onStory: () => void
  } = $props()

  const STORAGE_KEY = 'wfe:explorer'

  interface BootState {
    lessonId: ExplorerLessonId
    caseId: string
    depth: V2Depth
    stepIndex: number
  }

  function cloneTasks(tasks: Task[]): Task[] {
    return tasks.map((task) => ({ ...task }))
  }

  function titleFromRequest(body: string | null, fallback: string): string {
    if (!body) return fallback
    try {
      const parsed = JSON.parse(body) as { title?: unknown }
      if (typeof parsed.title === 'string') {
        return parsed.title.trim() || '(empty title)'
      }
    } catch {
      // Invalid JSON is a valid failure case; keep the fallback title.
    }
    return fallback
  }

  function inputTitleFromRequest(body: string | null, fallback: string): string {
    if (!body) return fallback
    try {
      const parsed = JSON.parse(body) as { title?: unknown }
      if (typeof parsed.title === 'string') return parsed.title
    } catch {
      // Leave the field at its lesson default for malformed JSON.
    }
    return fallback
  }

  function readHashRoute(): Partial<BootState> {
    if (typeof window === 'undefined') return {}
    const parts = window.location.hash.replace(/^#/, '').split('/')
    if (parts[0] !== 'explorer') return {}
    const lesson = EXPLORER_LESSONS.some((item) => item.id === parts[1])
      ? (parts[1] as ExplorerLessonId)
      : undefined
    const depthNumber = Number(parts[2])
    const stepNumber = Number(parts[3])
    return {
      lessonId: lesson,
      depth:
        depthNumber === 1 || depthNumber === 2 || depthNumber === 3
          ? (depthNumber as V2Depth)
          : undefined,
      stepIndex:
        Number.isInteger(stepNumber) && stepNumber >= 1 && stepNumber <= 5
          ? stepNumber - 1
          : undefined,
    }
  }

  function readBootState(): BootState {
    const hash = readHashRoute()
    let saved: Partial<BootState> = {}

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) saved = JSON.parse(raw) as Partial<BootState>
    } catch {
      // Storage is optional; the hash still wins on this load.
    }

    const lessonId = lessonById(
      (hash.lessonId ?? saved.lessonId ?? 'add') as ExplorerLessonId,
    ).id
    const lesson = lessonById(lessonId)
    const caseId = lessonCase(
      lesson,
      hash.caseId ?? saved.caseId ?? lesson.defaultCase,
    ).id
    const depth =
      hash.depth ?? saved.depth ?? (hash.lessonId ? 1 : 1)
    const stepIndex =
      hash.stepIndex ?? saved.stepIndex ?? 0

    return {
      lessonId,
      caseId,
      depth,
      stepIndex: Math.max(0, Math.min(stepIndex, 4)),
    }
  }

  const boot = readBootState()
  const bootLesson = lessonById(boot.lessonId)
  const bootCase = lessonCase(bootLesson, boot.caseId)

  function makeRun(
    lesson: ExplorerLesson,
    item: ExplorerCase,
    before: Task[],
  ): Run {
    return handleRequest(
      {
        method: item.request.method,
        path: item.request.path,
        body: item.request.body,
      },
      before,
      {
        serverOn: item.serverOn ?? true,
        databaseOn: item.databaseOn,
        transport: item.transport,
      },
    )
  }

  let lessonId = $state<ExplorerLessonId>(boot.lessonId)
  let caseId = $state(boot.caseId)
  let depth = $state<V2Depth>(boot.depth)
  let stepIndex = $state(boot.stepIndex)
  let tasksBefore = $state<Task[]>(cloneTasks(bootLesson.startingTasks))
  let tasks = $state<Task[]>(
    bootLesson.appMode === 'load'
      ? []
      : cloneTasks(bootLesson.startingTasks),
  )
  let appInput = $state(bootLesson.inputDefault)
  let requestTitle = $state(
    titleFromRequest(bootCase.request.body, bootLesson.inputDefault),
  )
  let appError = $state('')
  let selectedTerm = $state<string | null>(null)
  let mentalOpen = $state(false)
  let answeredCount = $state(0)
  let mentalButton: HTMLButtonElement | undefined = $state()
  let run = $state<Run | null>(
    boot.depth > 1
      ? makeRun(bootLesson, bootCase, cloneTasks(bootLesson.startingTasks))
      : null,
  )

  let tutorEl: HTMLElement | undefined = $state()

  const lesson = $derived(lessonById(lessonId))
  const activeCase = $derived(lessonCase(lesson, caseId))
  const steps = $derived(run ? storyFor(lesson, run, requestTitle) : [])
  const step = $derived(steps[stepIndex] ?? steps[0])
  const pending = $derived(
    depth > 1 &&
      stepIndex < 4 &&
      lesson.appMode === 'add' &&
      run?.request !== null,
  )
  const anchorTasks = $derived(
    depth > 1 && stepIndex >= 4
      ? (run?.tasksAfter ?? tasks)
      : lesson.appMode === 'add'
        ? tasksBefore
        : [],
  )
  const anchorCaption = $derived(
    stepIndex >= 4
      ? run?.failure
        ? 'The list is unchanged.'
        : APP_COPY.anchorDone
      : APP_COPY.anchorCaption,
  )
  const blocks = $derived(
    run ? evidenceFor(lesson, stepIndex, requestTitle, run, tasksBefore) : [],
  )
  const prompt = $derived(
    run
      ? v2Prompt(
          lesson,
          stepIndex,
          requestTitle,
          run,
          tasksBefore,
          selectedTerm,
        )
      : '',
  )
  const detailActor = $derived(
    stepIndex === 2 && step?.actor === 'Server' ? 'Server code' : (step?.actor ?? 'Server'),
  )
  const liveText = $derived(
    depth === 1
      ? `Use the app. ${lesson.title}.`
      : depth === 2
        ? `Behind the scenes. Step ${stepIndex + 1} of 5, ${step?.actor ?? 'Server'}. ${step?.text ?? ''}`
        : `Under the hood. Step ${stepIndex + 1} of 5, ${detailActor}.`,
  )

  function resetForLesson(nextId: ExplorerLessonId) {
    const nextLesson = lessonById(nextId)
    lessonId = nextLesson.id
    caseId = nextLesson.defaultCase
    depth = 1
    stepIndex = 0
    tasksBefore = cloneTasks(nextLesson.startingTasks)
    tasks =
      nextLesson.appMode === 'load'
        ? []
        : cloneTasks(nextLesson.startingTasks)
    appInput = nextLesson.inputDefault
    appError = ''
    requestTitle = nextLesson.inputDefault
    selectedTerm = null
    run = null
  }

  function requestWithTitle(item: ExplorerCase, title: string) {
    if (item.request.method !== 'POST') return item.request
    return {
      ...item.request,
      body: JSON.stringify({ title }),
    }
  }

  function handleAction() {
    if (lesson.appMode === 'add') {
      const title = appInput.trim()
      const before = cloneTasks(tasks)
      const successCase =
        lesson.cases.find((item) => item.id === 'add') ??
        lessonCase(lesson, lesson.defaultCase)
      const next = makeRun(
        lesson,
        {
          ...successCase,
          request: requestWithTitle(successCase, title),
        },
        before,
      )

      tasksBefore = before
      requestTitle = title || '(empty title)'
      run = next
      appInput = ''
      stepIndex = 0
      selectedTerm = null

      if (next.response?.status === 201) {
        appError = ''
        caseId = successCase.id
        tasks = next.tasksAfter
        return
      }

      appError =
        next.response?.status === 400
          ? 'The server rejected the request: title is required.'
          : 'The server rejected the request.'
      caseId =
        lesson.cases.find((item) => item.id === 'empty')?.id ??
        lesson.defaultCase
      return
    }

    const before = cloneTasks(tasksBefore)
    const next = makeRun(lesson, activeCase, before)
    appError = ''
    run = next
    tasks = next.response?.status === 200 ? next.tasksAfter : []
    requestTitle = ''
    appInput = ''
    stepIndex = 0
    selectedTerm = null
  }

  function ensureRun() {
    if (run) return

    const item = activeCase
    const before = cloneTasks(lesson.startingTasks)
    const next =
      lesson.appMode === 'add' && item.id === lesson.defaultCase
        ? makeRun(
            lesson,
            {
              ...item,
              request: requestWithTitle(
                item,
                appInput.trim() || lesson.inputDefault || DEFAULT_TITLE,
              ),
            },
            before,
          )
        : makeRun(lesson, item, before)

    tasksBefore = before
    requestTitle = titleFromRequest(
      next.request?.body ?? item.request.body,
      lesson.inputDefault,
    )
    if (next.response?.status === 201) {
      tasks = next.tasksAfter
    } else if (lesson.appMode === 'load') {
      tasks = []
    }
    run = next
    if (!next.request && next.failure === 'blocked') {
      caseId = item.id
    }
  }

  function showDepth(next: V2Depth) {
    if (next === 1) {
      depth = 1
      selectedTerm = null
      return
    }

    ensureRun()
    if (!run) return

    if (depth === 1) {
      stepIndex = 0
    }
    selectedTerm = null
    depth = next
  }

  function showDetails(index = stepIndex) {
    ensureRun()
    if (!run) return
    stepIndex = index
    selectedTerm = null
    depth = 3
  }

  function setStep(index: number) {
    if (!steps.length) return
    stepIndex = Math.max(0, Math.min(index, steps.length - 1))
    selectedTerm = null
  }

  function replay() {
    stepIndex = 0
    selectedTerm = null
    depth = 2
  }

  function selectCase(id: string) {
    const item = lessonCase(lesson, id)
    const before = cloneTasks(lesson.startingTasks)
    const next = makeRun(lesson, item, before)

    caseId = item.id
    tasksBefore = before
    tasks =
      next.response?.status === 201
        ? next.tasksAfter
        : cloneTasks(lesson.startingTasks)
    appInput = inputTitleFromRequest(item.request.body, lesson.inputDefault)
    requestTitle = titleFromRequest(item.request.body, lesson.inputDefault)
    appError = ''
    run = next
    stepIndex = 0
    selectedTerm = null
  }

  function closeMentalModel() {
    mentalOpen = false
    tick().then(() => mentalButton?.focus())
  }

  function openQuestionContext(question: MentalQuestion) {
    const nextLesson = lessonById(question.lessonId)
    const item = lessonCase(nextLesson, question.caseId)
    const before = cloneTasks(nextLesson.startingTasks)
    const next = makeRun(nextLesson, item, before)

    lessonId = nextLesson.id
    caseId = item.id
    tasksBefore = before
    tasks =
      nextLesson.appMode === 'load'
        ? []
        : next.response?.status === 201
          ? next.tasksAfter
          : cloneTasks(nextLesson.startingTasks)
    appInput = inputTitleFromRequest(item.request.body, nextLesson.inputDefault)
    requestTitle = titleFromRequest(item.request.body, nextLesson.inputDefault)
    appError = ''
    selectedTerm = null
    run = next
    stepIndex = Math.max(0, Math.min(question.stepIndex, 4))
    depth = 3
  }

  function showQuestionInStep(question: MentalQuestion) {
    openQuestionContext(question)
    closeMentalModel()
  }

  async function askTerm(term: string) {
    selectedTerm = term
    if (depth !== 3) depth = 3
    await tick()
    tutorEl?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  function applyHashRoute() {
    const route = readHashRoute()
    if (!route.lessonId && route.depth === undefined && route.stepIndex === undefined) {
      return
    }

    if (route.lessonId && route.lessonId !== lessonId) {
      const nextLesson = lessonById(route.lessonId)
      lessonId = nextLesson.id
      caseId = nextLesson.defaultCase
      tasksBefore = cloneTasks(nextLesson.startingTasks)
      tasks =
        nextLesson.appMode === 'load'
          ? []
          : cloneTasks(nextLesson.startingTasks)
      appInput = nextLesson.inputDefault
      requestTitle = nextLesson.inputDefault
      appError = ''
      selectedTerm = null
      run = null
    }

    const nextDepth = route.depth ?? depth
    if (nextDepth > 1) ensureRun()
    depth = nextDepth
    stepIndex = route.stepIndex ?? 0
  }

  function onKeydown(event: KeyboardEvent) {
    if (mentalOpen) {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeMentalModel()
      }
      return
    }

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

    if (depth > 1 && event.key === 'ArrowRight') {
      event.preventDefault()
      setStep(stepIndex + 1)
      return
    }

    if (depth > 1 && event.key === 'ArrowLeft') {
      event.preventDefault()
      setStep(stepIndex - 1)
      return
    }

    if (event.key === 'Escape' && depth > 1) {
      event.preventDefault()
      depth = depth === 3 ? 2 : 1
    }
  }

  $effect(() => {
    const state = {
      lessonId,
      caseId,
      depth,
      stepIndex,
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // The hash remains the fallback for this session.
    }

    const nextHash = `#explorer/${lessonId}/${depth}/${stepIndex + 1}`
    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, '', nextHash)
    }
  })

  onMount(() => {
    window.addEventListener('keydown', onKeydown)
    window.addEventListener('hashchange', applyHashRoute)
    return () => {
      window.removeEventListener('keydown', onKeydown)
      window.removeEventListener('hashchange', applyHashRoute)
    }
  })
</script>

<div class="v2-shell">
  <h1 class="v2-sr-only">Web Flow Explorer: {lesson.title}</h1>

  <header class="v2-topbar">
    <div class="v2-topbar-main">
      <div class="v2-brand">
        <span class="v2-logo" aria-hidden="true">W</span>
        <span class="v2-brand-name">{APP_COPY.brand}</span>
      </div>

      <ModeSwitch mode="sandbox" onStory={onStory} onSandbox={() => {}} />

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

    <button
      class="v2-mental-btn"
      class:is-open={mentalOpen}
      type="button"
      aria-haspopup="dialog"
      aria-expanded={mentalOpen}
      aria-controls="v2-mental-model"
      bind:this={mentalButton}
      onclick={() => (mentalOpen = true)}
    >
      <span class="v2-mental-label">Test my mental model</span>
      <span class="v2-mental-count" aria-hidden="true">
        {answeredCount}/{MENTAL_QUESTIONS.length}
      </span>
    </button>

    <VersionToggle {view} onChange={onChangeView} />
    </div>

    <div class="v2-lesson-row">
      <label class="v2-lesson-label">
        <span class="v2-sr-only">Lesson</span>
        <select
          class="v2-lesson-select"
          value={lessonId}
          onchange={(event) =>
            resetForLesson(event.currentTarget.value as ExplorerLessonId)}
        >
          {#each EXPLORER_LESSONS as item (item.id)}
            <option value={item.id}>{item.navLabel}</option>
          {/each}
        </select>
      </label>
    </div>
  </header>

  <main class="v2-main">
    {#if depth === 1}
      <section class="v2-depth-one" aria-labelledby="v2-depth-one-title">
        <div class="v2-app-column">
          <p class="v2-eyebrow">{APP_COPY.label}</p>
          <TaskApp
            tasks={tasks}
            input={appInput}
            mode={lesson.appMode}
            buttonLabel={lesson.appButton}
            appTitle={lesson.appTitle}
            appSubtitle={lesson.appSubtitle}
            onInput={(value) => {
              appInput = value
              appError = ''
            }}
            onAction={handleAction}
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
              <span>{lesson.tryStepOne}</span>
            </li>
            <li>
              <span class="v2-try-number" aria-hidden="true">2</span>
              <span>{lesson.tryStepTwo}</span>
            </li>
          </ol>
          <p class="v2-try-note">{lesson.tryNote}</p>
          <button class="v2-primary v2-wide-button" type="button" onclick={() => showDepth(2)}>
            {TRY_COPY.button}
          </button>
          <p class="v2-try-subtext">{lesson.trySubtext}</p>
        </aside>
      </section>
    {:else if depth === 2 && run && step}
      <section class="v2-depth-two" aria-labelledby="v2-story-title">
        <aside class="v2-anchor" aria-label="The app being explained">
          <p class="v2-eyebrow">{APP_COPY.label}</p>
          <TaskApp
            tasks={anchorTasks}
            input={requestTitle}
            mode={lesson.appMode}
            buttonLabel={lesson.appButton}
            appTitle={lesson.appTitle}
            appSubtitle={lesson.appSubtitle}
            pendingTitle={pending ? requestTitle : null}
            lastAddedId={stepIndex >= 4 ? (run.inserted?.id ?? null) : null}
            compact
            interactive={false}
            onInput={() => {}}
            onAction={() => {}}
          />
          <p class="v2-caption">{anchorCaption}</p>
        </aside>

        <StoryCard
          {steps}
          {stepIndex}
          cases={lesson.cases}
          {caseId}
          onCase={selectCase}
          onBack={() => setStep(stepIndex - 1)}
          onStep={() => setStep(stepIndex + 1)}
          onReplay={replay}
          onDetails={() => showDetails(stepIndex)}
        />
      </section>
    {:else if run && step}
      <section class="v2-depth-three" aria-labelledby="v2-detail-title">
        <StepRail
          {steps}
          {stepIndex}
          input={requestTitle}
          tasks={anchorTasks}
          pendingTitle={pending ? requestTitle : null}
          lastAddedId={stepIndex >= 4 ? (run.inserted?.id ?? null) : null}
          appTitle={lesson.appTitle}
          appSubtitle={lesson.appSubtitle}
          appMode={lesson.appMode}
          appButton={lesson.appButton}
          caption={anchorCaption}
          onStep={(index) => {
            setStep(index)
            depth = 3
          }}
        />

        <EvidenceCard
          {stepIndex}
          stepLabel={step.short}
          actorLabel={detailActor}
          actorTone={step.tone}
          {blocks}
          terms={termsForStep(stepIndex)}
          onBack={() => (depth = 2)}
          onStep={setStep}
          onTerm={askTerm}
        />

        <div bind:this={tutorEl} id="v2-tutor">
          {#key `${stepIndex}|${selectedTerm ?? ''}`}
            <TutorCard
              {stepIndex}
              prompt={prompt}
              actorLabel={detailActor}
              term={selectedTerm}
            />
          {/key}
        </div>
      </section>
    {/if}
  </main>

  <footer class="v2-footer">
    <span class="v2-footer-hint">Press <kbd>1</kbd>, <kbd>2</kbd> or <kbd>3</kbd> to change depth</span>
  </footer>

  <QuestionDrawer
    open={mentalOpen}
    onClose={closeMentalModel}
    onOpenQuestion={openQuestionContext}
    onShowInStep={showQuestionInStep}
    bind:answeredCount
  />

  <p class="v2-sr-only" aria-live="polite">{liveText}</p>
</div>
