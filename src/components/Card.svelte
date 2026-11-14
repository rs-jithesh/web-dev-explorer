<script lang="ts">
  import type { Snippet } from 'svelte'
  import InfoTip from './InfoTip.svelte'

  let {
    index = '',
    title,
    meta = '',
    active = false,
    highlight = false,
    info = '',
    children,
  }: {
    index?: string
    title: string
    meta?: string
    active?: boolean
    highlight?: boolean
    info?: string
    children: Snippet
  } = $props()
</script>

<section
  class="card"
  class:card-active={active}
  class:card-highlight={highlight}
  aria-label={`${index} ${title}`.trim()}
>
  <header class="card-head">
    <span class="card-title">
      {index ? `${index} · ${title}` : title}
      {#if info}
        <InfoTip text={info} label={`About ${title}`} />
      {/if}
    </span>
    {#if active}
      <span class="pill">Active</span>
    {:else if meta}
      <span class="card-meta">{meta}</span>
    {/if}
  </header>
  {@render children()}
</section>
