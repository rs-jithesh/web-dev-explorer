<script lang="ts">
  import type { RefreshModeId, RefreshPhase, Task } from '../engine/types'
  import Card from './Card.svelte'

  let {
    modeId,
    tasks,
    lastAddedId,
    phase,
  }: {
    modeId: RefreshModeId
    tasks: Task[]
    lastAddedId: number | null
    phase: RefreshPhase
  } = $props()
</script>

<Card
  title="Tasks table"
  meta="Database · server only"
  info="The persisted tasks table. The browser cannot read it directly; it asks the server with GET /tasks."
>
  <div class="card-body">
    {#if modeId === 'browser'}
      <div class="notice">
        No database in this mode. Nothing is persisted, so there is nowhere for
        a reloaded page to read the tasks from.
      </div>
      <p class="hint">
        Switch to “Through the API and database” to see stored rows.
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
      <p class="hint">
        {phase === 'refreshing'
          ? 'The rows stay here while the browser reloads and asks for them.'
          : 'Only the server reads and writes these rows.'}
      </p>
    {/if}
  </div>
</Card>
