<script lang="ts">
  import type { Snippet } from 'svelte'
  import { ZONE_COPY, type ZoneKind } from '../engine/zones'
  import InfoTip from './InfoTip.svelte'

  let {
    kind,
    children,
  }: {
    kind: ZoneKind
    children: Snippet
  } = $props()

  const copy = $derived(ZONE_COPY[kind])
</script>

<section class={`zone zone-${kind}`} aria-labelledby={`zone-${kind}-title`}>
  <header class="zone-head">
    <div class="zone-title-row">
      <span class="zone-dot" aria-hidden="true"></span>
      <h2 class="zone-title" id={`zone-${kind}-title`}>{copy.title}</h2>
      <InfoTip text={copy.info} label={`About ${copy.title}`} />
    </div>
    <p class="zone-desc">{copy.description}</p>
  </header>
  {@render children()}
</section>
