<script lang="ts">
  import type { Snippet } from 'svelte'

  let {
    index = '',
    title,
    meta = '',
    active = false,
    children,
  }: {
    index?: string
    title: string
    meta?: string
    active?: boolean
    children: Snippet
  } = $props()
</script>

<section class="card" class:card-active={active} aria-label={`${index} ${title}`.trim()}>
  <header class="card-head">
    <span>{index ? `${index} · ${title}` : title}</span>
    {#if active}
      <span class="pill">Active</span>
    {:else if meta}
      <span class="card-meta">{meta}</span>
    {/if}
  </header>
  {@render children()}
</section>
