<script lang="ts">
  import { onMount } from 'svelte'
  import ClassicApp from './App.svelte'
  import V2App from './v2/App.svelte'
  import VersionToggle from './v2/VersionToggle.svelte'
  import {
    DEFAULT_VIEW,
    type ViewName,
  } from './v2/content'

  const STORAGE_KEY = 'wfe:view'

  function parseView(value: string | null | undefined): ViewName | null {
    if (!value) return null
    if (value === 'classic' || value.startsWith('classic/')) return 'classic'
    if (value === 'explorer' || value.startsWith('explorer/')) return 'explorer'
    return null
  }

  function readInitialView(): ViewName {
    if (typeof window === 'undefined') return DEFAULT_VIEW

    const fromHash = parseView(window.location.hash.slice(1))
    if (fromHash) return fromHash

    try {
      const stored = parseView(window.localStorage.getItem(STORAGE_KEY))
      if (stored) return stored
    } catch {
      // Storage can be unavailable in private or restricted contexts.
    }

    return DEFAULT_VIEW
  }

  let view = $state<ViewName>(readInitialView())

  function chooseView(next: ViewName) {
    view = next

    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // The hash still keeps the choice for this session.
    }

    const url = new URL(window.location.href)
    url.hash = next
    window.history.replaceState(null, '', url)
  }

  onMount(() => {
    const syncFromHash = () => {
      const next = parseView(window.location.hash.slice(1))
      if (next && next !== view) view = next
    }

    window.addEventListener('hashchange', syncFromHash)
    syncFromHash()
    return () => window.removeEventListener('hashchange', syncFromHash)
  })
</script>

{#if view === 'classic'}
  <ClassicApp>
    {#snippet versionToggle()}
      <VersionToggle {view} onChange={chooseView} />
    {/snippet}
  </ClassicApp>
{:else}
  <V2App {view} onChangeView={chooseView} />
{/if}
