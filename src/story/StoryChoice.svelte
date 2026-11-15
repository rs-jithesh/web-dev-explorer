<script lang="ts">
  import type { StoryChoiceOption } from './chapters'

  let {
    prompt,
    lead,
    options,
    selectedId,
    checked,
    isCorrect,
    correctNote,
    wrongNote,
    onSelect,
    onCheck,
    onContinue,
    onRetry,
    continueLabel = 'Continue',
  }: {
    prompt: string
    lead: string
    options: StoryChoiceOption[]
    selectedId: string | null
    checked: boolean
    isCorrect: boolean
    correctNote: string
    wrongNote: string
    onSelect: (id: string) => void
    onCheck: () => void
    onContinue: () => void
    onRetry: () => void
    continueLabel?: string
  } = $props()
</script>

<section class="story-choice" aria-labelledby="story-choice-title">
  <p class="story-eyebrow">MAKE THE NEXT MOVE</p>
  <h2 id="story-choice-title">{prompt}</h2>
  <p class="story-choice-lead">{lead}</p>

  <div class="story-choice-list" role="radiogroup" aria-label="Answer choices">
    {#each options as option (option.id)}
      <label
        class="story-choice-option"
        class:is-selected={selectedId === option.id && !checked}
        class:is-correct={checked && isCorrect && option.id === selectedId}
        class:is-wrong={checked && !isCorrect && option.id === selectedId}
      >
        <input
          type="radio"
          name="story-choice"
          value={option.id}
          checked={selectedId === option.id}
          disabled={checked}
          onchange={() => onSelect(option.id)}
        />
        <span class="story-radio" aria-hidden="true">
          {#if checked && isCorrect && option.id === selectedId}
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m2 6 2.5 2.5L10 3"></path>
            </svg>
          {/if}
        </span>
        <span class="story-choice-copy">
          <strong>{option.label}</strong>
          <span>{option.detail}</span>
        </span>
        {#if checked && isCorrect && option.id === selectedId}
          <span class="story-choice-tag">Chosen</span>
        {:else if checked && !isCorrect && option.id === selectedId}
          <span class="story-choice-tag is-wrong">Not this one</span>
        {/if}
      </label>
    {/each}
  </div>

  {#if checked}
    <div
      class="story-choice-feedback"
      class:is-wrong={!isCorrect}
      role="status"
      aria-live="polite"
    >
      <strong>{isCorrect ? 'Right.' : 'Not quite.'}</strong>
      <p>{isCorrect ? correctNote : wrongNote}</p>
    </div>
  {/if}

  <div class="story-choice-actions">
    {#if !checked}
      <button
        class="story-btn story-btn-primary"
        type="button"
        disabled={!selectedId}
        onclick={onCheck}
      >
        Check answer
      </button>
    {:else if isCorrect}
      <button class="story-btn story-btn-primary" type="button" onclick={onContinue}>
        {continueLabel}
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M2 7h9M8 4l3 3-3 3"></path>
        </svg>
      </button>
    {:else}
      <button class="story-btn story-btn-primary" type="button" onclick={onRetry}>
        Try again
      </button>
    {/if}
  </div>
</section>
