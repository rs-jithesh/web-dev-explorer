<script lang="ts">
  import type { RefreshPhase, Task } from '../engine/types'
  import Card from './Card.svelte'

  let {
    tasks,
    input,
    phase,
    inputError,
    lastAddedId,
    onInput,
    onAdd,
  }: {
    tasks: Task[]
    input: string
    phase: RefreshPhase
    inputError: string | null
    lastAddedId: number | null
    onInput: (value: string) => void
    onAdd: () => void
  } = $props()

  const editing = $derived(phase === 'editing')
</script>

<Card title="Browser" meta="Frontend">
  <div class="card-body">
    <div class="url-pill">localhost:5173/todo</div>

    <div class="field">
      <label class="lbl" for="refresh-task">New task</label>
      <div class="row">
        <input
          id="refresh-task"
          class="text-input"
          type="text"
          value={input}
          placeholder="Task title"
          disabled={!editing}
          oninput={(event) => onInput(event.currentTarget.value)}
        />
        <button
          class="btn btn-primary"
          type="button"
          onclick={onAdd}
          disabled={!editing}
        >
          Add
        </button>
      </div>
      {#if inputError}
        <p class="validation" role="alert">{inputError}</p>
      {/if}
    </div>

    {#if phase === 'refreshing'}
      <div class="notice">Reloading the page… The browser's state is cleared.</div>
    {:else}
      <ul class="task-list">
        {#each tasks as task (task.id)}
          <li class="task-item" class:is-new={lastAddedId === task.id}>
            <span>{task.title}</span>
            {#if lastAddedId === task.id}
              <span class="mini-tag">NEW</span>
            {/if}
          </li>
        {/each}
        {#if tasks.length === 0}
          <li class="empty-row">
            {phase === 'done'
              ? 'No tasks after the reload.'
              : 'No tasks yet. Add one to start.'}
          </li>
        {/if}
      </ul>
    {/if}

    <p class="hint">
      {phase === 'editing'
        ? 'Add the tasks you want to test, then refresh.'
        : phase === 'done'
          ? 'The refresh is complete. Reset or switch modes to try again.'
          : 'The page is reloading without its previous JavaScript state.'}
    </p>
  </div>
</Card>
