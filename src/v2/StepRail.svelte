<script lang="ts">
  import type { StoryStep } from './content'
  import { APP_COPY, DETAIL_COPY } from './content'
  import TaskApp from './TaskApp.svelte'

  let {
    steps,
    stepIndex,
    input,
    tasks,
    pendingTitle,
    lastAddedId,
    caption,
    onStep,
  }: {
    steps: StoryStep[]
    stepIndex: number
    input: string
    tasks: Array<{ id: number; title: string }>
    pendingTitle: string | null
    lastAddedId: number | null
    caption: string
    onStep: (index: number) => void
  } = $props()
</script>

<aside class="v2-rail" aria-label="Step navigation">
  <p class="v2-eyebrow">{APP_COPY.label}</p>
  <TaskApp
    tasks={tasks}
    {input}
    pendingTitle={pendingTitle}
    lastAddedId={lastAddedId}
    compact
    interactive={false}
    onInput={() => {}}
    onAdd={() => {}}
  />
  <p class="v2-caption">{caption}</p>

  <p class="v2-eyebrow v2-rail-heading">{DETAIL_COPY.jump}</p>
  <nav class="v2-rail-list" aria-label="All five steps">
    {#each steps as step, index (step.id)}
      <button
        class="v2-rail-step"
        class:is-done={index < stepIndex}
        class:is-active={index === stepIndex}
        type="button"
        aria-current={index === stepIndex ? 'step' : undefined}
        onclick={() => onStep(index)}
      >
        <span class="v2-rail-number" aria-hidden="true">
          {#if index < stepIndex}
            <svg
              width="10"
              height="10"
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
        <span>{step.short}</span>
      </button>
    {/each}
  </nav>
</aside>
