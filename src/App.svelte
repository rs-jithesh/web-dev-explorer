<script lang="ts">
  import Browser from './components/Browser.svelte'
  import ApiRoute from './components/ApiRoute.svelte'
  import ServerCode from './components/ServerCode.svelte'
  import Database from './components/Database.svelte'
  import FlowArrow from './components/FlowArrow.svelte'
  import PredictionPanel from './components/PredictionPanel.svelte'
  import StepControls from './components/StepControls.svelte'
  import BreakItPanel from './components/BreakItPanel.svelte'
  import RequestComposer from './components/RequestComposer.svelte'
  import ResultPanel from './components/ResultPanel.svelte'
  import RefreshTest from './components/RefreshTest.svelte'
  import { tick } from 'svelte'
  import { lessons } from './lessons'
  import { Player } from './engine/player.svelte'
  import { previewRun, simulate } from './engine/server'
  import { buildView } from './engine/view'
  import {
    composerBrowserMode,
    composerCode,
    failureLocation,
    pendingTitleFor,
    statusLabel,
    statusSentence,
  } from './engine/composer'
  import type { Box } from './engine/types'

  const player = new Player(lessons)

  let flowEl: HTMLDivElement | undefined = $state()
  let lowerEl: HTMLDivElement | undefined = $state()
  let composerEl: HTMLDivElement | undefined = $state()

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

  async function handleSend() {
    const result = player.send()

    if (result === 'prompt') {
      await tick()
      composerEl
        ?.querySelector<HTMLElement>('.status-options')
        ?.scrollIntoView({ behavior: scrollBehavior(), block: 'center' })
      composerEl
        ?.querySelector<HTMLInputElement>('input[type="radio"]')
        ?.focus({ preventScroll: true })
      return
    }

    if (result === 'started') {
      await tick()
      flowEl?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' })
      flowEl?.focus({ preventScroll: true })
    }
  }

  function handleStep() {
    player.pause()
    player.stepForward()
  }

  function handleBack() {
    player.pause()
    player.stepBack()
  }

  async function handleReset() {
    player.reset()
    if (player.isComposer) {
      await tick()
      composerEl?.scrollIntoView({
        behavior: scrollBehavior(),
        block: 'start',
      })
    }
  }

  $effect(() => {
    if (!player.autoPlay) return

    if (player.stepIndex >= player.composerSteps.length - 1) {
      player.autoPlay = false
      return
    }

    const timer = setTimeout(() => player.advanceAuto(), 4000)
    return () => clearTimeout(timer)
  })

  const lesson = $derived(player.lesson)
  const scenario = $derived(player.scenario)
  const isComposer = $derived(player.isComposer)

  const viewScenario = $derived(
    isComposer
      ? { ...scenario, mode: composerBrowserMode(player.composerMethod) }
      : scenario,
  )
  const viewCode = $derived(
    isComposer ? composerCode(player.composerMethod) : lesson.code,
  )
  const viewTasks = $derived(
    isComposer ? player.composerTasks : lesson.startingTasks,
  )
  const run = $derived(
    isComposer
      ? (player.composerRun ?? previewRun(player.composerTasks))
      : simulate(player.request, lesson.startingTasks, {
          serverOn: scenario.serverOn,
          transport: scenario.transport,
        }),
  )
  const view = $derived(
    buildView(
      lesson,
      viewScenario,
      player.step,
      run,
      isComposer ? pendingTitleFor(player.composerRun) : player.title,
      viewTasks,
      viewCode,
    ),
  )
  const payload = $derived(player.step?.payload ?? null)

  const browserAction = $derived(lesson.mode === 'load' ? 'Reload' : 'Add')

  const readyText = $derived(
    isComposer
      ? 'Compose a request above, choose the status you expect, then press Send.'
      : player.isMain
        ? `Press ${browserAction} to start. When the prediction opens, lock in a guess and the request will run.`
        : `Press Step to follow this break-it case: ${scenario.label.toLowerCase()}.`,
  )

  const boxLabels: Record<Box, string> = {
    browser: 'Browser',
    api: 'API route',
    server: 'Server code',
    database: 'Database',
  }

  const resultLive = $derived(
    isComposer && player.statusFinished && player.composerRun
      ? `Result: ${statusLabel(player.composerActualStatus)}. ${statusSentence(player.composerRun)} ${failureLocation(player.composerRun)} ${player.statusVerdict === 'correct' ? 'Your prediction was correct.' : 'Your prediction was wrong.'}`
      : '',
  )

  const liveText = $derived(
    player.step
      ? `Step ${player.stepIndex + 1} of ${player.totalSteps}. ${boxLabels[player.step.active]} is active. ${player.step.explanation} ${resultLive}`
      : isComposer
        ? player.composerSent
          ? 'The request has finished.'
          : 'No request sent yet.'
        : 'No step is active.',
  )

  const stepMeta = $derived(
    isComposer
      ? player.composerSent
        ? `Step ${player.stepIndex + 1} of ${player.totalSteps}${player.autoPlay ? ' · auto-playing' : ''}`
        : 'Waiting for Send'
      : `Step ${player.stepIndex + 1} of ${player.totalSteps}`,
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

    {#if lesson.refresh}
      <RefreshTest config={lesson.refresh} />
    {:else}
      {#if isComposer}
        <div bind:this={composerEl}>
          <RequestComposer
            method={player.composerMethod}
            path={player.composerPath}
            body={player.composerBody}
            status={player.composerStatus}
            sent={player.composerSent}
            validation={player.composerValidation}
            presets={lesson.composer?.presets ?? []}
            actualStatus={player.composerActualStatus}
            finished={player.statusFinished}
            onMethod={(method) => player.setComposerMethod(method)}
            onPath={(path) => player.setComposerPath(path)}
            onBody={(body) => player.setComposerBody(body)}
            onStatus={(status) => player.setComposerStatus(status)}
            onSend={handleSend}
            onPreset={(preset) => player.applyComposerPreset(preset)}
          />
        </div>
      {/if}

      <div class="flow" bind:this={flowEl} tabindex="-1">
        <Browser
          view={view.browser}
          active={view.active === 'browser'}
          title={isComposer ? '' : player.title}
          editable={!isComposer && player.isMain && player.stepIndex < 0}
          canTrigger={!isComposer && player.canTrigger}
          showControls={!isComposer}
          payload={payload?.box === 'browser' ? payload : null}
          onTitle={(value) => player.editTitle(value)}
          onTrigger={handleTrigger}
        />
        <FlowArrow />
        <ApiRoute
          view={view.api}
          active={view.active === 'api'}
          payload={payload?.box === 'api' ? payload : null}
        />
        <FlowArrow />
        <ServerCode
          view={view.server}
          active={view.active === 'server'}
          payload={payload?.box === 'server' ? payload : null}
        />
        <FlowArrow />
        <Database
          view={view.database}
          active={view.active === 'database'}
          payload={payload?.box === 'database' ? payload : null}
        />
      </div>

      <div class="lower" bind:this={lowerEl}>
        {#if isComposer}
          <ResultPanel
            sent={player.composerSent}
            finished={player.statusFinished}
            run={player.composerRun}
            guess={player.composerStatus}
            verdict={player.statusVerdict}
          />
        {:else}
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
        {/if}

        <StepControls
          title={isComposer
            ? 'Walkthrough'
            : player.isMain
              ? 'Walkthrough'
              : `Break it · ${scenario.label}`}
          meta={stepMeta}
          stepIndex={player.stepIndex}
          total={player.totalSteps}
          explanation={player.step?.explanation ?? ''}
          canStep={player.canStep}
          canBack={player.canBack}
          atEnd={player.atEnd}
          ready={isComposer ? player.composerSent : player.locked !== null}
          hint={isComposer
            ? 'Choose a status and press Send to start.'
            : 'Step unlocks after you lock in a guess.'}
          readyText={readyText}
          onStep={handleStep}
          onBack={handleBack}
          onReset={handleReset}
        />
      </div>

      {#if !isComposer}
        <BreakItPanel
          scenarios={lesson.breakIts}
          activeId={player.scenarioId}
          locked={player.locked !== null}
          onSelect={(id) => player.selectScenario(id)}
          onMain={() => player.selectScenario(null)}
        />
      {/if}

      <p class="sr-only" aria-live="polite">{liveText}</p>
    {/if}
  </main>
</div>
