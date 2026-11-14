<script lang="ts">
  import type { RefreshModeId, RefreshPhase, Task } from '../engine/types'
  import type { RequestLogEntry } from '../engine/refresh.svelte'
  import { statusLabel } from '../engine/composer'
  import Card from './Card.svelte'

  let {
    modeId,
    tasks,
    requests,
    lastAddedId,
    phase,
  }: {
    modeId: RefreshModeId
    tasks: Task[]
    requests: RequestLogEntry[]
    lastAddedId: number | null
    phase: RefreshPhase
  } = $props()

  const meta = $derived(
    modeId === 'api' ? 'Fake server + database' : 'Not used',
  )
</script>

<Card title="Backend" {meta}>
  <div class="card-body">
    {#if modeId === 'browser'}
      <div class="notice">
        No backend in this mode. The tasks live only in this tab's memory.
      </div>
      <p class="hint">
        Switch to “Through the API and database” to see the stored rows.
      </p>
    {:else}
      <div class="refresh-db">
        <span class="lbl">Table: tasks</span>
        <table class="db-table">
          <thead>
            <tr>
              <th class="col-id">id</th>
              <th>title</th>
            </tr>
          </thead>
          <tbody>
            {#each tasks as task (task.id)}
              <tr class:row-new={lastAddedId === task.id}>
                <td class="mono">{task.id}</td>
                <td>{task.title}</td>
              </tr>
            {/each}
            {#if tasks.length === 0}
              <tr>
                <td class="db-empty" colspan="2">No rows yet.</td>
              </tr>
            {/if}
          </tbody>
        </table>
      </div>

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
