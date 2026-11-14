<script lang="ts">
  import type { Task } from '../engine/types'
  import { APP_COPY } from './content'

  let {
    tasks,
    input,
    onInput,
    onAction,
    mode = 'add',
    buttonLabel = 'Add',
    appTitle = APP_COPY.appTitle,
    appSubtitle = APP_COPY.appSubtitle,
    pendingTitle = null,
    error = '',
    compact = false,
    interactive = true,
    lastAddedId = null,
  }: {
    tasks: Task[]
    input: string
    onInput: (value: string) => void
    onAction: () => void
    mode?: 'add' | 'load' | 'refresh'
    buttonLabel?: string
    appTitle?: string
    appSubtitle?: string
    pendingTitle?: string | null
    error?: string
    compact?: boolean
    interactive?: boolean
    lastAddedId?: number | null
  } = $props()
</script>

{#if compact}
  <div class="v2-mini-browser">
    <div class="v2-mini-bar" aria-hidden="true">
      <span class="v2-window-dots"><i></i><i></i><i></i></span>
      <span class="v2-url">{APP_COPY.browserUrl}</span>
    </div>
    <div class="v2-mini-app">
      <h3>{appTitle}</h3>
      <p>{appSubtitle}</p>
      {#if mode === 'add'}
        <div class="v2-mini-add">
          <span class="v2-mini-input">{input}</span>
          <span class="v2-mini-button">{buttonLabel}</span>
        </div>
      {:else}
        <div class="v2-mini-add">
          <span class="v2-mini-input">
            {mode === 'load'
              ? tasks.length > 0
                ? 'List loaded'
                : 'Waiting for the list'
              : tasks.length > 0
                ? 'List rebuilt'
                : 'Reloading the list'}
          </span>
          <span class="v2-mini-button">{buttonLabel}</span>
        </div>
      {/if}
      <ul class="v2-task-list" aria-label="Tasks">
        {#each tasks as task (task.id)}
          <li class="v2-task" class:is-new={lastAddedId === task.id}>
            <span class="v2-check" aria-hidden="true"></span>
            <span>{task.title}</span>
            {#if lastAddedId === task.id}
              <span class="v2-new-tag">{APP_COPY.saved}</span>
            {/if}
          </li>
        {/each}
        {#if pendingTitle}
          <li class="v2-task is-pending">
            <span class="v2-spinner" aria-hidden="true"></span>
            <span>{pendingTitle} · {APP_COPY.pending}</span>
          </li>
        {/if}
      </ul>
    </div>
  </div>
{:else}
  <div class="v2-browser">
    <div class="v2-browser-bar" aria-hidden="true">
      <span class="v2-window-dots"><i></i><i></i><i></i></span>
      <span class="v2-url">{APP_COPY.browserUrl}</span>
    </div>
    <div class="v2-app">
      <h2>{appTitle}</h2>
      <p class="v2-app-subtitle">{appSubtitle}</p>

      <div class="v2-add-row">
        {#if mode === 'add'}
          <label class="v2-sr-only" for="v2-task-input">{APP_COPY.inputLabel}</label>
          <input
            id="v2-task-input"
            class="v2-input"
            type="text"
            value={input}
            disabled={!interactive}
            oninput={(event) => onInput(event.currentTarget.value)}
            onkeydown={(event) => {
              if (event.key === 'Enter') onAction()
            }}
          />
        {/if}
        <button
          class="v2-primary"
          type="button"
          onclick={onAction}
          disabled={!interactive}
        >
          {buttonLabel}
        </button>
      </div>

      {#if error}
        <p class="v2-error" role="alert">{error}</p>
      {/if}

      <ul class="v2-task-list" aria-label="Tasks">
        {#each tasks as task (task.id)}
          <li class="v2-task" class:is-new={lastAddedId === task.id}>
            <span class="v2-check" aria-hidden="true"></span>
            <span>{task.title}</span>
            {#if lastAddedId === task.id}
              <span class="v2-new-tag">{APP_COPY.saved}</span>
            {/if}
          </li>
        {/each}
        {#if pendingTitle}
          <li class="v2-task is-pending">
            <span class="v2-spinner" aria-hidden="true"></span>
            <span>{pendingTitle} · {APP_COPY.pending}</span>
          </li>
        {/if}
      </ul>
    </div>
  </div>
{/if}
