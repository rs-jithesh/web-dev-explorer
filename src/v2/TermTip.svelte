<script lang="ts">
  import { glossaryFor } from './glossary.ts'

  let {
    term,
    onAsk,
  }: {
    term: string
    onAsk: (term: string) => void
  } = $props()

  const entry = $derived(glossaryFor(term))
  const id = `v2-term-${crypto.randomUUID()}`

  function ask() {
    onAsk(entry.term)
    document.getElementById(id)?.hidePopover?.()
  }
</script>

<button class="v2-term" type="button" popovertarget={id}>
  {entry.term}
</button>

<div id={id} popover="auto" class="v2-term-popover">
  <p class="v2-eyebrow">{entry.term}</p>
  <p class="v2-term-definition">{entry.definition}</p>
  <div class="v2-term-actions">
    <button class="v2-primary v2-term-ask" type="button" onclick={ask}>
      Ask tutor in context
    </button>
    <button
      class="v2-secondary"
      type="button"
      popovertarget={id}
      popovertargetaction="hide"
    >
      Close
    </button>
  </div>
</div>
