<script lang="ts">
  import type { RefreshModeData, RefreshPhase } from '../engine/types'
  import Card from './Card.svelte'

  let {
    mode,
    prediction,
    phase,
    validation,
    showPrediction,
    onSelect,
    onRefresh,
    onReset,
  }: {
    mode: RefreshModeData
    prediction: number | null
    phase: RefreshPhase
    validation: string | null
    showPrediction: boolean
    onSelect: (index: number) => void
    onRefresh: () => void
    onReset: () => void
  } = $props()

  const editing = $derived(phase === 'editing')
  const finished = $derived(phase === 'done')
  const meta = $derived(
    editing
      ? showPrediction
        ? 'Prediction'
        : 'Ready'
      : phase === 'refreshing'
        ? 'Reloading…'
        : 'Revealed',
  )
</script>

<Card
  title={showPrediction ? 'Before you refresh' : 'Refresh the page'}
  {meta}
  info="Refresh clears the browser's JavaScript state. In API mode the list is then reloaded from the database."
>
  <div class="card-body">
    {#if showPrediction}
      <p class="prediction-q" id="refresh-prediction-question">
        {mode.prediction.question}
      </p>

      <fieldset
        class="options"
        aria-labelledby="refresh-prediction-question"
        disabled={!editing}
      >
        {#each mode.prediction.options as option, index}
          <label
            class="option"
            class:selected={prediction === index}
            class:correct={finished && index === mode.prediction.correctIndex}
            class:wrong={finished &&
              prediction === index &&
              index !== mode.prediction.correctIndex}
          >
            <input
              type="radio"
              name="refresh-prediction"
              checked={prediction === index}
              disabled={!editing}
              onchange={() => onSelect(index)}
            />
            <span>{option}</span>
          </label>
        {/each}
      </fieldset>

      {#if validation}
        <p class="validation" role="alert">{validation}</p>
      {/if}
    {/if}

    <div class="controls">
      <button
        class="btn btn-primary"
        type="button"
        onclick={onRefresh}
        disabled={!editing}
      >
        Refresh
      </button>
      <button class="btn" type="button" onclick={onReset}>
        {finished ? 'Start over' : 'Reset'}
      </button>
    </div>

    <p class="hint">
      {editing
        ? showPrediction
          ? 'Add tasks above, choose what you expect, then refresh.'
          : 'Add tasks above, then refresh to clear the browser state.'
        : phase === 'refreshing'
          ? 'The browser is clearing its state.'
          : 'Reset or switch modes to run the test again.'}
    </p>
  </div>
</Card>
