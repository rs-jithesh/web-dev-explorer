<script lang="ts">
  let {
    mode,
    sandboxLocked = false,
    onStory,
    onSandbox,
  }: {
    mode: 'story' | 'sandbox'
    sandboxLocked?: boolean
    onStory: () => void
    onSandbox: () => void
  } = $props()
</script>

<div class="wfe-mode" role="group" aria-label="Story Mode or Sandbox">
  <button
    class="wfe-mode-btn"
    class:is-active={mode === 'story'}
    type="button"
    aria-pressed={mode === 'story'}
    onclick={onStory}
  >
    Story Mode
  </button>
  <button
    class="wfe-mode-btn"
    class:is-active={mode === 'sandbox'}
    class:is-locked={sandboxLocked}
    type="button"
    aria-pressed={mode === 'sandbox'}
    aria-disabled={sandboxLocked}
    onclick={onSandbox}
  >
    Sandbox
    {#if sandboxLocked}
      <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true">
        <rect x="2.5" y="4.5" width="5" height="4" rx="1"></rect>
        <path d="M3.5 4.5V3.2a1.5 1.5 0 0 1 3 0v1.3"></path>
      </svg>
    {/if}
  </button>
</div>

<style>
  .wfe-mode {
    display: inline-flex;
    gap: 2px;
    padding: 3px;
    border: 1px solid #dad8d0;
    border-radius: 8px;
    background: #efeee9;
  }

  .wfe-mode-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    min-height: 26px;
    padding: 0 10px;
    border: 1px solid transparent;
    border-radius: 5px;
    background: transparent;
    color: #4a5360;
    font-family: var(--sans, 'Inter', system-ui, sans-serif);
    font-size: 10px;
    font-weight: 500;
    line-height: 1.5;
    white-space: nowrap;
  }

  .wfe-mode-btn:hover {
    color: #1b1f24;
  }

  .wfe-mode-btn.is-active {
    background: #1b1f24;
    color: #fff;
  }

  .wfe-mode-btn.is-active:hover {
    color: #fff;
  }

  .wfe-mode-btn.is-locked {
    color: #69717c;
  }

  .wfe-mode-btn:focus-visible {
    outline: 2px solid #1d4ed8;
    outline-offset: 2px;
  }
</style>
