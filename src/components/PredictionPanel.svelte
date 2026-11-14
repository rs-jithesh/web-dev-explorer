<script lang="ts">
  import Card from './Card.svelte'

  let {
    lessonId,
    question,
    options,
    correctIndex,
    reason,
    selected,
    locked,
    verdict,
    inBreakIt,
    onSelect,
    onLock,
  }: {
    lessonId: string
    question: string
    options: string[]
    correctIndex: number
    reason: string
    selected: number | null
    locked: number | null
    verdict: 'correct' | 'wrong' | null
    inBreakIt: boolean
    onSelect: (index: number) => void
    onLock: () => void
  } = $props()
</script>

<Card title="Your prediction" meta={locked === null ? 'Not locked' : 'Locked in'}>
  <div class="card-body">
    <p class="prediction-q" id="prediction-question">{question}</p>

    <fieldset class="options" aria-labelledby="prediction-question">
      {#each options as option, index}
        <label
          class="option"
          class:selected={selected === index}
          class:correct={verdict !== null && index === correctIndex}
          class:wrong={verdict !== null && selected === index && index !== correctIndex}
        >
          <input
            type="radio"
            name={`prediction-${lessonId}`}
            checked={selected === index}
            disabled={locked !== null}
            onchange={() => onSelect(index)}
          />
          <span>{option}</span>
          {#if verdict !== null && index === correctIndex}
            <span class="tag tag-correct">Correct answer</span>
          {/if}
          {#if verdict !== null && selected === index && index !== correctIndex}
            <span class="tag tag-wrong">Your guess</span>
          {/if}
        </label>
      {/each}
    </fieldset>

    {#if locked === null}
      <button
        class="btn btn-primary lock-btn"
        type="button"
        onclick={onLock}
        disabled={selected === null}
      >
        Lock in my guess
      </button>
      <p class="hint">
        Commit to a guess. The walkthrough unlocks after you lock it in.
      </p>
    {:else if inBreakIt}
      <p class="hint">
        Break-it case. Return to the main flow to see the lesson answer.
      </p>
    {:else if verdict === null}
      <p class="hint">The answer is revealed after the last step.</p>
    {/if}

    {#if verdict !== null}
      <div class="verdict" class:verdict-wrong={verdict === 'wrong'}>
        <strong>{verdict === 'correct' ? 'Correct.' : 'Not quite.'}</strong>
        {reason}
      </div>
    {/if}
  </div>
</Card>
