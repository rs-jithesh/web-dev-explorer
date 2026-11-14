<script lang="ts">
  import Card from './Card.svelte'

  let {
    title,
    meta,
    stepIndex,
    total,
    explanation,
    canStep,
    canBack,
    atEnd,
    ready,
    hint,
    readyText,
    onStep,
    onBack,
    onReset,
  }: {
    title: string
    meta: string
    stepIndex: number
    total: number
    explanation: string
    canStep: boolean
    canBack: boolean
    atEnd: boolean
    ready: boolean
    hint: string
    readyText: string
    onStep: () => void
    onBack: () => void
    onReset: () => void
  } = $props()
</script>

<Card {title} {meta}>
  <div class="card-body">
    <div class="progress" aria-hidden="true">
      {#each Array.from({ length: total }) as _, index}
        <span class:filled={index <= stepIndex}></span>
      {/each}
    </div>

    <p class="walkthrough-text">
      {stepIndex >= 0 ? explanation : readyText}
    </p>

    <div class="controls">
      <button
        id="step-button"
        class="btn btn-primary"
        type="button"
        onclick={onStep}
        disabled={!canStep}
      >
        {atEnd ? 'Done' : 'Step'}
      </button>
      <button class="btn" type="button" onclick={onBack} disabled={!canBack}>
        Back
      </button>
      <button class="btn" type="button" onclick={onReset}>Reset</button>
    </div>

    {#if !ready}
      <p class="hint">{hint}</p>
    {/if}
  </div>
</Card>
