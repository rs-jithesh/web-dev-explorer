<script lang="ts">
  import type { RefreshModeId, RefreshPhase } from '../engine/types'
  import type { RequestLogEntry } from '../engine/refresh.svelte'
  import { statusLabel } from '../engine/composer'
  import Card from './Card.svelte'

  let {
    modeId,
    requests,
    phase,
  }: {
    modeId: RefreshModeId
    requests: RequestLogEntry[]
    phase: RefreshPhase
  } = $props()
</script>

<Card
  title="Server"
  meta="Backend"
  info="The backend in this test. It receives POST /tasks when you add a task and GET /tasks when the page reloads."
>
  <div class="card-body">
    {#if modeId === 'browser'}
      <div class="notice">
        No backend in this mode. Tasks live only in the browser tab, so there
        is no API and no request log.
      </div>
      <p class="hint">
        Switch to “Through the API and database” to send requests.
      </p>
    {:else}
      <div class="backend-log">
        <span class="lbl">Requests</span>
        {#if requests.length === 0}
          <p class="hint">No requests yet. Add a task to send POST /tasks.</p>
        {:else}
          <ul class="request-log">
            {#each requests as entry (entry.id)}
              <li class="request-log-item">
                <span class="request-log-method mono">
                  {entry.method} {entry.path}
                </span>
                <span
                  class="status-badge"
                  class:ok={entry.status !== null && entry.status < 300}
                  class:err={entry.status === null || entry.status >= 400}
                >
                  {statusLabel(entry.status)}
                </span>
              </li>
            {/each}
          </ul>
        {/if}
        <p class="hint">
          {phase === 'refreshing'
            ? 'The page is asking GET /tasks for the saved rows.'
            : 'POST saves a task. GET reloads the list after a refresh.'}
        </p>
      </div>
    {/if}
  </div>
</Card>
