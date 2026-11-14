<script lang="ts">
  import Browser from './components/Browser.svelte'
  import ApiRoute from './components/ApiRoute.svelte'
  import ServerCode from './components/ServerCode.svelte'
  import Database from './components/Database.svelte'
  import FlowArrow from './components/FlowArrow.svelte'
  import PredictionPanel from './components/PredictionPanel.svelte'
  import StepControls from './components/StepControls.svelte'
  import BreakItPanel from './components/BreakItPanel.svelte'
  import { tick } from 'svelte'
  import { lessons } from './lessons'
  import { Player } from './engine/player.svelte'
  import { simulate } from './engine/server'
  import { buildView } from './engine/view'
  import type { Box } from './engine/types'

  const player = new Player(lessons)

  let flowEl: HTMLDivElement
  let lowerEl: HTMLDivElement

  function scrollBehavior(): ScrollBehavior {
    return typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'auto'
      : 'smooth'
  }

  async function handleTrigger() {
    const result = player.trigger()
    if (result === 'ignored') return

    await tick()

    if (result === 'started') {
      flowEl?.focus({ preventScroll: true })
      return
    }

    lowerEl?.scrollIntoView({ behavior: scrollBehavior(), block: 'center' })
    lowerEl
      ?.querySelector<HTMLInputElement>('input[type="radio"]')
      ?.focus({ preventScroll: true })
  }

  async function handleLock() {
    const result = player.lockGuess()
    if (result === 'invalid') return

    await tick()

    if (result === 'started') {
      flowEl?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' })
      flowEl?.focus({ preventScroll: true })
      return
    }

    document.getElementById('step-button')?.focus({ preventScroll: true })
  }

  const lesson = $derived(player.lesson)
  const scenario = $derived(player.scenario)
  const run = $derived(
    simulate(player.request, lesson.startingTasks, {
      serverOn: scenario.serverOn,
      transport: scenario.transport,
    }),
  )
  const view = $derived(
    buildView(lesson, scenario, player.step, run, player.title),
  )

  const browserAction = $derived(lesson.mode === 'load' ? 'Reload' : 'Add')

  const readyText = $derived(
    player.isMain
      ? `Press ${browserAction} to start. When the prediction opens, lock in a guess and the request will run.`
      : `Press Step to follow this break-it case: ${scenario.label.toLowerCase()}.`,
  )

  const boxLabels: Record<Box, string> = {
    browser: 'Browser',
    api: 'API route',
    server: 'Server code',
    database: 'Database',
  }

  const liveText = $derived(
    player.step
      ? `Step ${player.stepIndex + 1} of ${player.totalSteps}. ${boxLabels[player.step.active]} is active. ${player.step.explanation}`
      : 'No step is active.',
  )

  const stepMeta = $derived(
    `Step ${player.stepIndex + 1} of ${player.totalSteps}`,
  )
</script>

<svelte:head>
  <title>{lesson.title} · Web Flow Explorer</title>
</svelte:head>

<div class="shell">
  <header class="masthead">
    <div class="brand">
      <div class="brand-mark" aria-hidden="true">
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          stroke="#fff"
          stroke-width="1.6"
          stroke-linecap="round"
        >
          <circle cx="3.5" cy="9" r="2"></circle>
          <circle cx="14.5" cy="4" r="2"></circle>
          <circle cx="14.5" cy="14" r="2"></circle>
          <path d="M5.3 8.2 12.7 4.8M5.3 9.8l7.4 3.4"></path>
        </svg>
      </div>
      <span class="brand-name">Web Flow Explorer</span>
    </div>

    <nav class="lessons" aria-label="Lessons">
      {#each lessons as item, index}
        <button
          class="lesson-btn"
          class:active={index === player.lessonIndex}
          type="button"
          aria-current={index === player.lessonIndex ? 'page' : undefined}
          onclick={() => player.selectLesson(index)}
        >
          {item.navLabel}
        </button>
      {/each}
    </nav>
  </header>

  <main class="lesson">
    <section class="lesson-head" aria-labelledby="lesson-title">
      <span class="eyebrow">Lesson {player.lessonIndex + 1} of {lessons.length}</span>
      <h1 id="lesson-title">{lesson.title}</h1>
      <p class="intro">{lesson.intro}</p>
    </section>

    <div class="flow" bind:this={flowEl} tabindex="-1">
      <Browser
        view={view.browser}
        active={view.active === 'browser'}
        title={player.title}
        editable={player.isMain && player.stepIndex < 0}
        canTrigger={player.canTrigger}
        onTitle={(value) => player.editTitle(value)}
        onTrigger={handleTrigger}
      />
      <FlowArrow />
      <ApiRoute view={view.api} active={view.active === 'api'} />
      <FlowArrow />
      <ServerCode view={view.server} active={view.active === 'server'} />
      <FlowArrow />
      <Database view={view.database} active={view.active === 'database'} />
    </div>

    <div class="lower" bind:this={lowerEl}>
      <PredictionPanel
        lessonId={lesson.id}
        question={lesson.prediction.question}
        options={lesson.prediction.options}
        correctIndex={lesson.prediction.correctIndex}
        reason={lesson.prediction.reason}
        selected={player.selected}
        locked={player.locked}
        verdict={player.verdict}
        inBreakIt={!player.isMain}
        prompted={player.prompted}
        validation={player.validation}
        onSelect={(index) => player.selectGuess(index)}
        onLock={handleLock}
      />

      <StepControls
        title={player.isMain ? 'Walkthrough' : `Break it · ${scenario.label}`}
        meta={stepMeta}
        stepIndex={player.stepIndex}
        total={player.totalSteps}
        explanation={player.step?.explanation ?? ''}
        canStep={player.canStep}
        canBack={player.canBack}
        atEnd={player.atEnd}
        locked={player.locked}
        readyText={readyText}
        onStep={() => player.stepForward()}
        onBack={() => player.stepBack()}
        onReset={() => player.reset()}
      />
    </div>

    <BreakItPanel
      scenarios={lesson.breakIts}
      activeId={player.scenarioId}
      locked={player.locked !== null}
      onSelect={(id) => player.selectScenario(id)}
      onMain={() => player.selectScenario(null)}
    />

    <p class="sr-only" aria-live="polite">{liveText}</p>
  </main>
</div>
