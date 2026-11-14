<script lang="ts">
  import type { RefreshModeId, RefreshPhase } from '../engine/types'
  import Card from './Card.svelte'

  let {
    phase,
    modeId,
    explanation,
    verdict,
    taskCount,
  }: {
    phase: RefreshPhase
    modeId: RefreshModeId
    explanation: string
    verdict: 'correct' | 'wrong' | null
    taskCount: number
  } = $props()

  const meta = $derived(
    phase === 'editing'
      ? 'Waiting'
      : phase === 'refreshing'
        ? 'Reloading…'
        : 'Revealed',
  )

  const countText = $derived(
    `${taskCount} ${taskCount === 1 ? 'task' : 'tasks'}`,
  )
</script>

<Card title="Result" {meta}>
  <div class="card-body">
    {#if phase === 'editing'}
      <div class="notice">
        Add a task, make a prediction, then press Refresh.
      </div>
      <p class="hint">The browser will clear its JavaScript state.</p>
    {:else if phase === 'refreshing'}
      <div class="notice">
        {modeId === 'api'
          ? 'The browser is clearing its state, then asking GET /tasks.'
          : 'The browser is clearing its state and reloading.'}
      </div>
    {:else}
      <p class="refresh-result-line">
        {modeId === 'api'
          ? `${countText} survived the refresh.`
          : 'The list is empty after the refresh.'}
      </p>
      <p class="result-sentence">{explanation}</p>

      {#if verdict}
        <div class="verdict" class:verdict-wrong={verdict === 'wrong'}>
          <strong>{verdict === 'correct' ? 'Correct.' : 'Not quite.'}</strong>
          {verdict === 'correct'
            ? 'Your prediction matched what happened.'
            : 'The correct answer is marked on the prediction card.'}
        </div>
      {/if}
    {/if}
  </div>
</Card>
