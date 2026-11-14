<script lang="ts">
  import { TUTOR_COPY } from './content'

  let {
    stepIndex,
    prompt,
    actorLabel,
  }: {
    stepIndex: number
    prompt: string
    actorLabel: string
  } = $props()

  let previewEl: HTMLTextAreaElement | undefined = $state()
  let editing = $state(false)
  let draft = $state('')
  let copyStatus = $state('')
  let timer: ReturnType<typeof setTimeout> | undefined

  const displayPrompt = $derived(editing ? draft : prompt)

  function startEdit() {
    if (!editing) {
      draft = prompt
      editing = true
    } else {
      editing = false
    }
  }

  async function copyPrompt() {
    if (timer) clearTimeout(timer)
    copyStatus = ''

    try {
      const clipboard = navigator.clipboard
      if (!clipboard?.writeText) throw new Error('Clipboard unavailable')
      await clipboard.writeText(displayPrompt)
      copyStatus = TUTOR_COPY.copied
    } catch {
      previewEl?.focus()
      previewEl?.select()
      copyStatus = TUTOR_COPY.copyFallback
    }

    timer = setTimeout(() => {
      copyStatus = ''
    }, 6000)
  }

  $effect(() => {
    return () => {
      if (timer) clearTimeout(timer)
    }
  })
</script>

<aside class="v2-card v2-tutor-card" aria-labelledby="v2-tutor-title">
  <header class="v2-tutor-head">
    <h2 id="v2-tutor-title">{TUTOR_COPY.title}</h2>
  </header>

  <div class="v2-tutor-chips">
    <span class="v2-step-chip">Step {stepIndex + 1} of 5</span>
    <span
      class="v2-actor"
      class:actor-browser={actorLabel === 'Browser'}
      class:actor-server={actorLabel === 'Server'}
      class:actor-database={actorLabel === 'Database'}
    >
      {actorLabel}
    </span>
  </div>

  <p class="v2-eyebrow v2-prompt-label">{TUTOR_COPY.promptLabel}</p>

  <textarea
    class="v2-prompt"
    class:is-editing={editing}
    readonly={!editing}
    spellcheck="false"
    aria-label="Tutor prompt preview"
    value={displayPrompt}
    bind:this={previewEl}
    oninput={(event) => {
      if (editing) draft = event.currentTarget.value
    }}
  ></textarea>

  <div class="v2-tutor-actions">
    <button class="v2-primary v2-copy-button" type="button" onclick={copyPrompt}>
      {TUTOR_COPY.copy}
    </button>
    <button
      class="v2-secondary"
      type="button"
      aria-pressed={editing}
      onclick={startEdit}
    >
      {editing ? TUTOR_COPY.done : TUTOR_COPY.edit}
    </button>
  </div>

  <p class="v2-copy-status" role="status" aria-live="polite">{copyStatus}</p>
  <p class="v2-tutor-paste">{TUTOR_COPY.paste}</p>
</aside>
