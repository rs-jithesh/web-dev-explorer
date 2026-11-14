<script lang="ts">
  import type { BrowserView } from '../engine/view'
  import Card from './Card.svelte'

  let {
    view,
    active,
    title,
    editable,
    canTrigger,
    onTitle,
    onTrigger,
  }: {
    view: BrowserView
    active: boolean
    title: string
    editable: boolean
    canTrigger: boolean
    onTitle: (value: string) => void
    onTrigger: () => void
  } = $props()
</script>

<Card index="1" title="Browser" meta="Frontend" {active}>
  <div class="card-body">
    <div class="url-pill">localhost:5173/todo</div>

    {#if view.mode === 'add'}
      <div class="field">
        <label class="lbl" for="task-title">New task</label>
        <div class="row">
          <input
            id="task-title"
            class="text-input"
            type="text"
            value={title}
            placeholder="Task title"
            disabled={!editable}
            oninput={(event) => onTitle(event.currentTarget.value)}
          />
          <button
            class="btn btn-primary"
            type="button"
            onclick={onTrigger}
            disabled={!canTrigger}
          >
            Add
          </button>
        </div>
      </div>
    {:else if view.mode === 'load'}
      <div class="row spread">
        <span class="lbl">Tasks</span>
        <button
          class="btn btn-primary"
          type="button"
          onclick={onTrigger}
          disabled={!canTrigger}
        >
          Reload
        </button>
      </div>
      <p class="hint">The list is fetched when the page loads.</p>
    {:else}
      <div class="row spread">
        <span class="lbl">Database access</span>
        <button
          class="btn btn-primary"
          type="button"
          onclick={onTrigger}
          disabled={!canTrigger}
        >
          Open tasks.db
        </button>
      </div>
      <p class="hint">The browser has no database driver.</p>
    {/if}

    {#if view.mode === 'direct'}
      {#if view.error}
        <div class="error-box" role="alert">{view.error}</div>
      {:else}
        <div class="notice">
          This is the browser talking to tasks.db directly. It will not work.
        </div>
      {/if}
    {:else}
      <ul class="task-list">
        {#each view.items as task (task.id)}
          <li class="task-item" class:is-new={view.highlightId === task.id}>
            <span>{task.title}</span>
            {#if view.highlightId === task.id}
              <span class="mini-tag">NEW</span>
            {/if}
          </li>
        {/each}

        {#if view.pendingTitle}
          <li class="task-item pending">
            <span>{view.pendingTitle}</span>
            <span class="status">{view.statusLabel}</span>
          </li>
        {:else if view.mode === 'load' && view.state === 'loading'}
          <li class="task-item pending">
            <span>Loading tasks…</span>
            <span class="status">GET /tasks</span>
          </li>
        {/if}

        {#if view.items.length === 0 && !view.pendingTitle && view.mode === 'load' && view.state === 'idle'}
          <li class="empty-row">No tasks loaded yet. Press Reload.</li>
        {/if}
      </ul>

      {#if view.error}
        <div class="error-box" role="alert">{view.error}</div>
      {/if}
    {/if}
  </div>
</Card>
