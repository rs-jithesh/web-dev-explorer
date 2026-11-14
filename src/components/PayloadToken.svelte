<script lang="ts">
  import { fly } from 'svelte/transition'
  import type { Payload } from '../engine/types'

  let { payload }: { payload: Payload } = $props()

  const duration =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 0
      : 160
</script>

{#key `${payload.shape}|${payload.label}|${payload.value}`}
  <div
    class="payload"
    in:fly={{ y: 4, duration }}
    out:fly={{ y: -4, duration }}
  >
    <span class="payload-label">{payload.label}</span>
    <code class="payload-value">{payload.value}</code>
    <p class="payload-note">{payload.note}</p>
  </div>
{/key}
