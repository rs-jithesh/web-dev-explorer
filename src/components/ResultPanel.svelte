<script lang="ts">
  import type { StatusCode } from '../engine/composer'
  import {
    actualStatus,
    failureLocation,
    statusLabel,
    statusSentence,
  } from '../engine/composer'
  import type { Run } from '../engine/server'
  import Card from './Card.svelte'

  let {
    sent,
    finished,
    run,
    guess,
    verdict,
  }: {
    sent: boolean
    finished: boolean
    run: Run | null
    guess: StatusCode | null
    verdict: 'correct' | 'wrong' | null
  } = $props()

  const meta = $derived(
    sent ? (finished ? 'Revealed' : 'Following…') : 'Waiting',
  )
  const actual = $derived(run ? actualStatus(run) : null)
</script>

<Card
  title="Result"
  {meta}
  info="The response status and a plain-language explanation of what happened."
>
  <div class="card-body">
    {#if !sent}
      <div class="notice">
        No request sent yet. Compose a request above and press Send.
      </div>
    {:else if !finished}
      <div class="notice">
        The request is moving through the pipeline. The result is revealed
        after the last step.
      </div>
      {#if guess !== null}
        <p class="hint">You predicted {statusLabel(guess)}.</p>
      {/if}
    {:else if run}
      <div class="row">
        <span
          class="status-badge"
          class:ok={typeof actual === 'number' && actual < 300}
          class:err={typeof actual !== 'number' || actual >= 400}
        >
          {statusLabel(actual)}
        </span>
      </div>

      <p class="result-sentence">{statusSentence(run)}</p>
      <p class="hint">{failureLocation(run)}</p>

      {#if guess !== null}
        <div class="verdict" class:verdict-wrong={verdict === 'wrong'}>
          <strong>{verdict === 'correct' ? 'Correct.' : 'Not quite.'}</strong>
          {#if verdict === 'correct'}
            You predicted {statusLabel(guess)}.
          {:else}
            You predicted {statusLabel(guess)}; the server returned {statusLabel(actual)}.
          {/if}
        </div>
      {/if}
    {/if}
  </div>
</Card>
