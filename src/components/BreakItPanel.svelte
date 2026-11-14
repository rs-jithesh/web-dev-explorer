<script lang="ts">
  import type { Scenario } from '../engine/types'
  import InfoTip from './InfoTip.svelte'

  let {
    scenarios,
    activeId,
    locked,
    onSelect,
    onMain,
  }: {
    scenarios: Scenario[]
    activeId: string | null
    locked: boolean
    onSelect: (id: string) => void
    onMain: () => void
  } = $props()
</script>

<details class="card breakit" open>
  <summary class="breakit-summary">
    <span class="breakit-title">Break it</span>
    <span class="lbl">Send bad input and see what comes back.</span>
  </summary>

  <div class="breakit-body">
    <div class="breakit-info">
      <InfoTip
        text="Break it sends a deliberately bad request so you can see where it stops. Everything is simulated and safe."
        label="About Break it"
      />
      <span class="hint">Deliberately bad requests are safe here.</span>
    </div>

    {#each scenarios as scenario (scenario.id)}
      <button
        class="btn btn-sm"
        class:is-active={activeId === scenario.id}
        type="button"
        aria-pressed={activeId === scenario.id}
        disabled={!locked}
        onclick={() => onSelect(scenario.id)}
      >
        {scenario.label}
      </button>
    {/each}

    {#if activeId !== null}
      <button class="btn btn-sm" type="button" onclick={onMain}>
        Back to main flow
      </button>
    {/if}

    {#if !locked}
      <p class="hint breakit-hint">Lock in a guess to unlock these.</p>
    {/if}
  </div>
</details>
