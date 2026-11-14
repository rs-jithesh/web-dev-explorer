<script lang="ts">
  import { onDestroy, tick } from 'svelte'
  import type { RefreshConfig } from '../engine/types'
  import { RefreshTestStore } from '../engine/refresh.svelte'
  import { SHOW_PREDICTIONS } from '../engine/features'
  import InfoTip from './InfoTip.svelte'
  import Zone from './Zone.svelte'
  import ZoneBoundary from './ZoneBoundary.svelte'
  import RefreshBrowser from './RefreshBrowser.svelte'
  import RefreshServer from './RefreshServer.svelte'
  import RefreshDatabase from './RefreshDatabase.svelte'
  import RefreshPrediction from './RefreshPrediction.svelte'
  import RefreshResult from './RefreshResult.svelte'

  let { config }: { config: RefreshConfig } = $props()

  // The lesson remounts this component when the lesson changes, so the
  // initial config is intentionally captured here.
  // svelte-ignore state_referenced_locally
  const test = new RefreshTestStore(config)
  let predictionEl: HTMLDivElement | undefined = $state()

  onDestroy(() => test.dispose())

  async function handleRefresh() {
    const result = test.refresh()
    if (result === 'prompt') {
      await tick()
      predictionEl
        ?.querySelector<HTMLInputElement>('input[type="radio"]')
        ?.focus({ preventScroll: true })
    }
  }

  const liveText = $derived(
    test.phase === 'refreshing'
      ? test.modeId === 'api'
        ? 'The browser state is cleared. Asking GET /tasks.'
        : 'The browser state is cleared. Reloading.'
      : test.phase === 'done'
        ? `Result: ${test.modeId === 'browser' ? 'the tasks are gone.' : 'the tasks are still there.'} ${test.mode.explanation}${
            SHOW_PREDICTIONS && test.verdict
              ? test.verdict === 'correct'
                ? ' Your prediction was correct.'
                : ' Your prediction was wrong.'
              : ''
          }`
        : `Editing. ${test.browserTasks.length} ${test.browserTasks.length === 1 ? 'task' : 'tasks'} in the browser.`,
  )
</script>

<div class="refresh-test">
  <div class="refresh-mode-head">
    <div class="refresh-modes" role="group" aria-label="Refresh test mode">
      {#each config.modes as mode (mode.id)}
        <button
          class="mode-btn"
          class:active={test.modeId === mode.id}
          type="button"
          aria-pressed={test.modeId === mode.id}
          onclick={() => test.selectMode(mode.id)}
        >
          {mode.label}
        </button>
      {/each}
    </div>
    <InfoTip
      text="Browser-only keeps tasks in the tab's memory. API mode sends them to the server and stores them in the database."
      label="About the refresh modes"
    />
  </div>
  <p class="refresh-mode-desc">{test.mode.description}</p>

  <div class="zones">
    <Zone kind="client">
      <RefreshBrowser
        tasks={test.browserTasks}
        input={test.input}
        phase={test.phase}
        inputError={test.inputError}
        lastAddedId={test.lastAddedId}
        onInput={(value) => (test.input = value)}
        onAdd={() => test.addTask()}
      />
    </Zone>

    <ZoneBoundary kind="http" />

    <Zone kind="server">
      <RefreshServer
        modeId={test.modeId}
        requests={test.requests}
        phase={test.phase}
      />
    </Zone>

    <ZoneBoundary kind="db" />

    <Zone kind="database">
      <RefreshDatabase
        modeId={test.modeId}
        tasks={test.dbTasks}
        lastAddedId={test.lastAddedId}
        phase={test.phase}
      />
    </Zone>
  </div>

  <div class="refresh-lower" bind:this={predictionEl}>
    <RefreshPrediction
      mode={test.mode}
      prediction={test.prediction}
      phase={test.phase}
      validation={test.validation}
      showPrediction={SHOW_PREDICTIONS}
      onSelect={(index) => (test.prediction = index)}
      onRefresh={handleRefresh}
      onReset={() => test.reset()}
    />
    <RefreshResult
      phase={test.phase}
      modeId={test.modeId}
      explanation={test.mode.explanation}
      verdict={test.verdict}
      taskCount={test.browserTasks.length}
    />
  </div>

  <p class="sr-only" aria-live="polite">{liveText}</p>
</div>
