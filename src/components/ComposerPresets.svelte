<script lang="ts">
  import type { ComposerPreset } from '../engine/types'

  let {
    presets,
    sent,
    onPreset,
  }: {
    presets: ComposerPreset[]
    sent: boolean
    onPreset: (preset: ComposerPreset) => void
  } = $props()
</script>

{#if presets.length > 0}
  <div class="composer-presets">
    <span class="lbl">Try a request:</span>
    {#each presets as preset (preset.label)}
      <button
        class="btn btn-sm"
        type="button"
        disabled={sent}
        onclick={() => onPreset(preset)}
      >
        {preset.label}
      </button>
    {/each}
  </div>
{/if}
