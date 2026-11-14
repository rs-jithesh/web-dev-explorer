<script lang="ts">
  import { VERSION_COPY, type ViewName } from './content'

  let {
    view,
    onChange,
  }: {
    view: ViewName
    onChange: (view: ViewName) => void
  } = $props()

  let open = $state(false)
  let root: HTMLDivElement | undefined = $state()
  const choices = ['classic', 'explorer'] as const

  $effect(() => {
    if (!open) return

    const onPointer = (event: PointerEvent) => {
      if (root && !root.contains(event.target as Node)) open = false
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') open = false
    }

    window.addEventListener('pointerdown', onPointer)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onPointer)
      window.removeEventListener('keydown', onKey)
    }
  })

  function choose(next: ViewName) {
    onChange(next)
    open = false
  }
</script>

<div class="version-switch" class:is-open={open} bind:this={root}>
  <button
    class="version-trigger"
    type="button"
    aria-haspopup="menu"
    aria-expanded={open}
    aria-label="Choose Classic or Explorer"
    onclick={() => (open = !open)}
  >
    <span class="version-option" class:is-active={view === 'classic'}>
      {VERSION_COPY.classic.label}
    </span>
    <span class="version-option" class:is-active={view === 'explorer'}>
      {VERSION_COPY.explorer.label}
    </span>
    <svg
      class="version-chevron"
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentColor"
      stroke-width="1.4"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="m2 3.5 3 3 3-3"></path>
    </svg>
  </button>

  {#if open}
    <button
      class="version-scrim"
      type="button"
      tabindex="-1"
      aria-label="Close version menu"
      onclick={() => (open = false)}
    ></button>
    <div class="version-menu" role="menu" aria-label="Experience version">
      {#each choices as option}
        <button
          class="version-option-row"
          class:is-selected={view === option}
          type="button"
          role="menuitemradio"
          aria-checked={view === option}
          onclick={() => choose(option)}
        >
          <span class="version-option-copy">
            <span class="version-option-title">
              {VERSION_COPY[option].label}
              {#if view === option}
                <svg
                  class="version-check"
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="m2.5 7 3 3 6-6"></path>
                </svg>
              {/if}
            </span>
            <span class="version-option-desc">
              {VERSION_COPY[option].description}
            </span>
          </span>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .version-switch {
    position: relative;
    flex: none;
  }

  .version-switch.is-open {
    z-index: 41;
  }

  .version-scrim {
    position: fixed;
    z-index: 0;
    inset: 0;
    border: 0;
    background: rgb(27 31 36 / 7%);
    cursor: default;
  }

  .version-trigger {
    position: relative;
    z-index: 2;
    display: inline-flex;
    align-items: center;
    gap: 2px;
    min-height: 30px;
    padding: 2px 6px 2px 3px;
    border: 1px solid var(--border, #dad8d0);
    border-radius: 8px;
    background: #fff;
    color: var(--muted, #5b6470);
    font-family: var(--sans, 'Inter', system-ui, sans-serif);
    font-size: 11px;
    line-height: 1;
  }

  .version-trigger:hover {
    border-color: #bdbab0;
  }

  .version-option {
    padding: 5px 7px;
    border-radius: 5px;
    color: var(--muted, #5b6470);
    white-space: nowrap;
  }

  .version-option.is-active {
    border: 1px solid var(--border, #dad8d0);
    background: #f8f7f4;
    color: var(--ink, #1b1f24);
  }

  .version-chevron {
    margin-left: 1px;
    color: var(--muted, #5b6470);
  }

  .version-menu {
    position: absolute;
    z-index: 40;
    top: calc(100% + 7px);
    right: 0;
    width: min(370px, calc(100vw - 32px));
    overflow: hidden;
    padding: 5px;
    border: 1px solid var(--border, #dad8d0);
    border-radius: 12px;
    background: #fff;
    box-shadow:
      0 16px 36px rgb(27 31 36 / 12%),
      0 2px 6px rgb(27 31 36 / 5%);
  }

  .version-option-row {
    display: block;
    width: 100%;
    padding: 11px 12px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: var(--ink, #1b1f24);
    text-align: left;
  }

  .version-option-row:hover {
    background: #f8f7f4;
  }

  .version-option-row.is-selected {
    background: #f5f8ff;
  }

  .version-option-copy {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .version-option-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
  }

  .version-check {
    color: var(--accent, #1d4ed8);
  }

  .version-option-desc {
    color: var(--body, #4a5360);
    font-size: 12px;
    line-height: 1.45;
  }
</style>
