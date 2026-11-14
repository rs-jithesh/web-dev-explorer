<script lang="ts">
  import type { DatabaseView } from '../engine/view'
  import Card from './Card.svelte'

  let { view, active }: { view: DatabaseView; active: boolean } = $props()
</script>

<Card index="4" title="Database" meta="Table: tasks" {active}>
  {#if view.locked}
    <div class="db-lock">Locked · the browser cannot open this table.</div>
  {/if}

  {#if view.sql}
    <div class="sql">
      <span class="lbl">Query</span>
      <code>{view.sql}</code>
    </div>
  {/if}

  <table class="db-table" class:is-locked={view.locked}>
    <thead>
      <tr>
        <th class="col-id">id</th>
        <th>title</th>
      </tr>
    </thead>
    <tbody>
      {#each view.rows as task (task.id)}
        <tr class:row-new={view.highlightId === task.id}>
          <td class="mono">{task.id}</td>
          <td>
            {task.title}
            {#if view.highlightId === task.id}
              <span class="mini-tag">NEW</span>
            {/if}
          </td>
        </tr>
      {/each}
      {#if view.rows.length === 0}
        <tr>
          <td class="db-empty" colspan="2">No rows yet.</td>
        </tr>
      {/if}
    </tbody>
  </table>

  {#if view.note}
    <p class="db-note">{view.note}</p>
  {/if}
</Card>
