<script lang="ts">
  import type { StoryStep } from './content'
  import type { ExplorerCase } from './lessons'
  import { STORY_COPY } from './content'

  let {
    steps,
    stepIndex,
    onBack,
    onStep,
    onReplay,
    onDetails,
    cases,
    caseId,
    onCase,
  }: {
    steps: StoryStep[]
    stepIndex: number
    onBack: () => void
    onStep: () => void
    onReplay: () => void
    onDetails: () => void
    cases: ExplorerCase[]
    caseId: string
    onCase: (id: string) => void
  } = $props()

  const atEnd = $derived(stepIndex >= steps.length - 1)
</script>

<article class="v2-card v2-story-card" aria-labelledby="v2-story-title">
  <header class="v2-card-head">
    <h2 id="v2-story-title">{STORY_COPY.title}</h2>
    <span class="v2-step-count">Step {stepIndex + 1} of 5</span>
  </header>

  <div class="v2-story-note">
    {STORY_COPY.note}
  </div>

  <ol class="v2-story-list">
    {#each steps as step, index (step.id)}
      <li
        class="v2-story-step"
        class:is-done={index < stepIndex}
        class:is-active={index === stepIndex}
        class:is-future={index > stepIndex}
        aria-current={index === stepIndex ? 'step' : undefined}
      >
        <span class="v2-step-number" aria-hidden="true">
          {#if index < stepIndex}
            <svg
              width="11"
              height="11"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="m2 6 2.5 2.5L10 3"></path>
            </svg>
          {:else}
            {index + 1}
          {/if}
        </span>
        <span
          class="v2-actor"
          class:actor-browser={step.tone === 'browser'}
          class:actor-server={step.tone === 'server'}
          class:actor-database={step.tone === 'database'}
        >
          {step.actor}
        </span>
        <p>{step.text}</p>
        {#if index === stepIndex}
          <button class="v2-text-link v2-story-details" type="button" onclick={onDetails}>
            {STORY_COPY.details}
          </button>
        {/if}
      </li>
    {/each}
  </ol>

  <div class="v2-story-controls">
    <div class="v2-control-cluster">
      <button class="v2-secondary" type="button" onclick={onBack} disabled={stepIndex === 0}>
        {STORY_COPY.back}
      </button>
      <button class="v2-primary" type="button" onclick={onStep} disabled={atEnd}>
        {STORY_COPY.step}
      </button>
      <button class="v2-secondary" type="button" onclick={onReplay}>
        {STORY_COPY.replay}
      </button>
    </div>
    <label class="v2-case-select-wrap">
      <span class="v2-sr-only">Try a case</span>
      <select
        class="v2-case-select"
        value={caseId}
        onchange={(event) => onCase(event.currentTarget.value)}
      >
        {#each cases as item (item.id)}
          <option value={item.id}>{item.label}</option>
        {/each}
      </select>
    </label>
  </div>
</article>
