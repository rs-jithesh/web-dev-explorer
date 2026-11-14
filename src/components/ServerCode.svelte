<script lang="ts">
  import type { ServerView } from '../engine/view'
  import type { Payload } from '../engine/types'
  import Card from './Card.svelte'
  import PayloadToken from './PayloadToken.svelte'

  let {
    view,
    active,
    payload,
  }: {
    view: ServerView
    active: boolean
    payload: Payload | null
  } = $props()
</script>

<Card
  title="Server handler"
  meta="Server · handler"
  info="The backend function that runs your code. It reads the request, validates it, and talks to the database."
  {active}
>
  <div class="card-body code-body">
    {#if payload}
      <div class="code-payload">
        <PayloadToken {payload} />
      </div>
    {/if}

    <div class="code" class:is-off={!view.on}>
      {#each view.lines as line, index}
        <div class="code-line" class:active={view.activeLine === index + 1}>
          <span class="code-num">{index + 1}</span>
          <span class="code-text">{line}</span>
        </div>
      {/each}
    </div>
    <p class="code-note">{view.note}</p>
  </div>
</Card>
