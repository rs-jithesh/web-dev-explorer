<script lang="ts">
  import { BOUNDARY_COPY } from '../engine/zones'
  import InfoTip from './InfoTip.svelte'

  let { kind }: { kind: 'http' | 'db' } = $props()

  const copy = $derived(BOUNDARY_COPY[kind])
</script>

<div class="zone-boundary" class:boundary-db={kind === 'db'}>
  <span class="boundary-line" aria-hidden="true"></span>
  <div class="boundary-pill">
    <div class="boundary-title-row">
      <span class="boundary-title">{copy.title}</span>
      <InfoTip text={copy.info} label={`About ${copy.title}`} />
    </div>
    <span class="boundary-detail">{copy.detail}</span>
  </div>
  <span class="boundary-line" aria-hidden="true"></span>
</div>
