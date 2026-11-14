<script lang="ts">
  import { onDestroy } from 'svelte'
  import {
    buildPrompt,
    termsForSnapshot,
    TUTOR_BUTTONS,
    TUTOR_UI,
    type LessonSnapshot,
    type TutorChoice,
  } from '../engine/tutor'
  import InfoTip from './InfoTip.svelte'

  let {
    snapshot,
    extraTerms = [],
  }: {
    snapshot: LessonSnapshot
    extraTerms?: string[]
  } = $props()

  type ChoiceId = 'why' | 'another' | 'term'

  const choices = [
    { id: 'why' as const, label: TUTOR_BUTTONS.why },
    { id: 'another' as const, label: TUTOR_BUTTONS.another },
    { id: 'term' as const, label: TUTOR_BUTTONS.term },
  ]

  let selected = $state<ChoiceId>('why')
  let ownText = $state('')
  let selectedTerm = $state('')
  let previewEl: HTMLTextAreaElement | undefined = $state()
  let copyStatus = $state('')
  let copyTimer: ReturnType<typeof setTimeout> | undefined

  const terms = $derived([
    ...new Set([...termsForSnapshot(snapshot), ...extraTerms]),
  ])
  const effectiveTerm = $derived(
    selectedTerm && terms.includes(selectedTerm)
      ? selectedTerm
      : (terms[0] ?? ''),
  )

  const choice = $derived<TutorChoice>(
    selected === 'term'
      ? { kind: 'term', term: effectiveTerm }
      : selected === 'why'
        ? { kind: 'why' }
        : { kind: 'another' },
  )

  const prompt = $derived(buildPrompt(snapshot, choice, ownText))

  $effect(() => {
    prompt
    copyStatus = ''
  })

  onDestroy(() => {
    if (copyTimer) clearTimeout(copyTimer)
  })

  async function copyPrompt() {
    if (copyTimer) clearTimeout(copyTimer)
    copyStatus = ''

    try {
      const clipboard = navigator.clipboard
      if (!clipboard?.writeText) throw new Error('Clipboard unavailable')
      await clipboard.writeText(prompt)
      copyStatus = TUTOR_UI.copied
    } catch {
      previewEl?.focus()
      previewEl?.select()
      copyStatus = TUTOR_UI.copyFallback
    }

    copyTimer = setTimeout(() => {
      copyStatus = ''
    }, 6000)
  }
</script>

<details class="card tutor">
  <summary class="tutor-summary">
    <span class="tutor-title">{TUTOR_UI.title}</span>
    <span class="lbl">{TUTOR_UI.subtitle}</span>
  </summary>

  <div class="tutor-body">
    <div class="tutor-intro">
      <InfoTip text={TUTOR_UI.info} label={TUTOR_UI.infoLabel} />
      <p class="hint">{TUTOR_UI.intro}</p>
    </div>

    <div
      class="tutor-choices"
      role="group"
      aria-label="What do you want to ask?"
    >
      {#each choices as item (item.id)}
        <button
          class="btn btn-sm"
          class:is-active={selected === item.id}
          type="button"
          aria-pressed={selected === item.id}
          onclick={() => (selected = item.id)}
        >
          {item.label}
        </button>
      {/each}
    </div>

    <div class="field">
      <label class="lbl" for="tutor-own-text">
        {TUTOR_UI.ownQuestion}
      </label>
      <input
        id="tutor-own-text"
        class="text-input"
        type="text"
        maxlength="200"
        placeholder={TUTOR_UI.ownQuestionPlaceholder}
        bind:value={ownText}
      />
    </div>

    {#if selected === 'term'}
      <div class="tutor-terms" role="group" aria-label={TUTOR_UI.terms}>
        <span class="lbl">{TUTOR_UI.terms}</span>
        <div class="tutor-term-list">
          {#each terms as term (term)}
            <button
              class="tutor-term"
              class:is-active={effectiveTerm === term}
              type="button"
              aria-pressed={effectiveTerm === term}
              onclick={() => (selectedTerm = term)}
            >
              {term}
            </button>
          {/each}
          {#if terms.length === 0}
            <span class="hint">{TUTOR_UI.noTerms}</span>
          {/if}
        </div>
      </div>
    {/if}

    <div class="tutor-preview">
      <label class="lbl" for="tutor-prompt-preview">
        {TUTOR_UI.preview}
      </label>
      <textarea
        id="tutor-prompt-preview"
        class="tutor-prompt"
        rows="14"
        readonly
        spellcheck="false"
        value={prompt}
        bind:this={previewEl}
        aria-describedby="tutor-prompt-hint"
      ></textarea>
      <div class="tutor-copy">
        <button class="btn btn-primary" type="button" onclick={copyPrompt}>
          {TUTOR_UI.copy}
        </button>
        <p
          class="copy-status"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {copyStatus}
        </p>
      </div>
      <p class="hint" id="tutor-prompt-hint">{TUTOR_UI.previewHint}</p>
    </div>
  </div>
</details>
