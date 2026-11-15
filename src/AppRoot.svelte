<script lang="ts">
  import { onMount } from 'svelte'
  import ClassicApp from './App.svelte'
  import V2App from './v2/App.svelte'
  import StoryApp from './story/StoryApp.svelte'
  import VersionToggle from './v2/VersionToggle.svelte'
  import {
    DEFAULT_VIEW,
    type ViewName,
  } from './v2/content'

  const STORAGE_KEY = 'wfe:view'

  function parseStory(value: string | null | undefined): boolean {
    return value === 'story' || Boolean(value?.startsWith('story/'))
  }

  function parseView(value: string | null | undefined): ViewName | null {
    if (!value) return null
    if (value === 'classic' || value.startsWith('classic/')) return 'classic'
    if (value === 'explorer' || value.startsWith('explorer/')) return 'explorer'
    return null
  }

  function readInitialStory(): boolean {
    if (typeof window === 'undefined') return false
    return parseStory(window.location.hash.slice(1))
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
  let story = $state(readInitialStory())

  function chooseView(next: ViewName) {
    view = next
    story = false

    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // The hash still keeps the choice for this session.
    }

    const url = new URL(window.location.href)
    url.hash = next
    window.history.replaceState(null, '', url)
  }

  function chooseStory() {
    story = true
    const url = new URL(window.location.href)
    url.hash = 'story'
    window.history.replaceState(null, '', url)
  }

  function chooseSandbox() {
    chooseView('explorer')
  }

  onMount(() => {
    const syncFromHash = () => {
      const hash = window.location.hash.slice(1)
      if (parseStory(hash)) {
        story = true
        return
      }
      const next = parseView(hash)
      if (next) {
        story = false
        if (next !== view) view = next
      }
    }

    window.addEventListener('hashchange', syncFromHash)
    syncFromHash()
    return () => window.removeEventListener('hashchange', syncFromHash)
  })

  $effect(() => {
    if (typeof document === 'undefined') return
    document.title = 'Web Dev Explorer'
  })
</script>

{#if story}
  <StoryApp onSandbox={chooseSandbox} />
{:else if view === 'classic'}
  <ClassicApp>
    {#snippet versionToggle()}
      <VersionToggle {view} onChange={chooseView} />
    {/snippet}
  </ClassicApp>
{:else}
  <V2App {view} onChangeView={chooseView} onStory={chooseStory} />
{/if}
