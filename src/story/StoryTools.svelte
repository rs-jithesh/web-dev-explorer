<script lang="ts">
  import {
    STORAGE_MODES,
    type StoryStorage,
    type StoryTool,
  } from './chapters'

  const lock = `<svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><rect x="2.5" y="4.5" width="5" height="4" rx="1"></rect><path d="M3.5 4.5V3.2a1.5 1.5 0 0 1 3 0v1.3"></path></svg>`
  const reset = `<svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11.2 5.2A4.5 4.5 0 1 0 11 8.8"></path><path d="M11.4 2.2v3.1H8.3"></path></svg>`

  let {
    available,
    serverOn,
    databaseOn,
    storage,
    onRefresh,
    onStorage,
    onServer,
    onDatabase,
    onReset,
  }: {
    available: Record<StoryTool, boolean>
    serverOn: boolean
    databaseOn: boolean
    storage: StoryStorage
    onRefresh: () => void
    onStorage: (value: StoryStorage) => void
    onServer: () => void
    onDatabase: () => void
    onReset: () => void
  } = $props()
</script>

<footer class="story-tools" aria-label="Story controls">
  <p class="story-eyebrow story-tools-label">TOOLS</p>
  <div class="story-tools-list">
    {#if available.refresh}
      <button class="story-tool" type="button" onclick={onRefresh}>Refresh</button>
    {:else}
      <span class="story-tool is-locked">Refresh {@html lock}</span>
    {/if}

    {#if available.storage}
      <label class="story-tool is-select">
        <span>Storage</span>
        <select
          value={storage}
          aria-label="Storage"
          onchange={(event) => onStorage(event.currentTarget.value as StoryStorage)}
        >
          {#each STORAGE_MODES as mode (mode.id)}
            <option value={mode.id}>{mode.short}</option>
          {/each}
        </select>
      </label>
    {:else}
      <span class="story-tool is-locked">Storage {@html lock}</span>
    {/if}

    {#if available.server}
      <button
        class="story-tool"
        class:is-on={serverOn}
        type="button"
        aria-pressed={serverOn}
        onclick={onServer}
      >
        Server <i class="story-toggle" aria-hidden="true"></i>
      </button>
    {:else}
      <span class="story-tool is-locked">Server {@html lock}</span>
    {/if}

    {#if available.database}
      <button
        class="story-tool"
        class:is-on={databaseOn}
        type="button"
        aria-pressed={databaseOn}
        onclick={onDatabase}
      >
        Database <i class="story-toggle" aria-hidden="true"></i>
      </button>
    {:else}
      <span class="story-tool is-locked">Database {@html lock}</span>
    {/if}
  </div>
  <button class="story-reset" type="button" onclick={onReset}>
    {@html reset}
    Reset chapter
  </button>
</footer>
