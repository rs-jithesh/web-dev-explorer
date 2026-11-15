<script lang="ts">
  import { tick } from 'svelte'
  import {
    MENTAL_QUESTIONS,
    QUESTION_GROUPS,
    nextQuestion,
    questionNumber,
    type MentalQuestion,
  } from './questions'

  let {
    open,
    onClose,
    onOpenQuestion,
    onShowInStep,
    answeredCount = $bindable(0),
  }: {
    open: boolean
    onClose: () => void
    onOpenQuestion: (question: MentalQuestion) => void
    onShowInStep: (question: MentalQuestion) => void
    answeredCount?: number
  } = $props()

  type View = 'set' | 'question'

  let view = $state<View>('set')
  let activeId = $state<string | null>(null)
  let answers = $state<Record<string, string>>({})
  let checked = $state<Record<string, boolean>>({})
  let liveMessage = $state('')
  let panelEl: HTMLDivElement | undefined = $state()
  let closeButton: HTMLButtonElement | undefined = $state()
  let questionHeading: HTMLHeadingElement | undefined = $state()

  const groups = $derived(
    QUESTION_GROUPS.map((label) => ({
      label,
      items: MENTAL_QUESTIONS.filter((question) => question.group === label),
    })),
  )
  const activeQuestion = $derived(
    activeId
      ? (MENTAL_QUESTIONS.find((question) => question.id === activeId) ?? null)
      : null,
  )
  const activeIndex = $derived(
    activeQuestion ? MENTAL_QUESTIONS.indexOf(activeQuestion) : -1,
  )
  const answer = $derived(
    activeQuestion ? (answers[activeQuestion.id] ?? '') : '',
  )
  const isChecked = $derived(
    activeQuestion ? checked[activeQuestion.id] === true : false,
  )
  const selectedIsCorrect = $derived(
    activeQuestion
      ? activeQuestion.options.find((option) => option.id === answer)?.correct ===
        true
      : false,
  )
  const checkedTotal = $derived(
    Object.values(checked).filter(Boolean).length,
  )
  const upcoming = $derived(
    activeQuestion ? nextQuestion(activeQuestion.id) : null,
  )

  $effect(() => {
    answeredCount = checkedTotal
  })

  $effect(() => {
    if (!open) return

    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    tick().then(() => closeButton?.focus())

    return () => {
      document.body.style.overflow = previous
    }
  })

  function close() {
    onClose()
  }

  function selectQuestion(question: MentalQuestion) {
    activeId = question.id
    view = 'question'
    liveMessage = `Question ${questionNumber(question.id)} of ${MENTAL_QUESTIONS.length}. ${question.prompt}`
    onOpenQuestion(question)
    tick().then(() => questionHeading?.focus())
  }

  function backToSet() {
    view = 'set'
    activeId = null
    liveMessage = 'Question set.'
    tick().then(() => {
      panelEl?.querySelector<HTMLButtonElement>('.v2-mm-row')?.focus()
    })
  }

  function choose(optionId: string) {
    if (!activeQuestion || isChecked) return
    answers = { ...answers, [activeQuestion.id]: optionId }
  }

  function check() {
    if (!activeQuestion || !answer) return
    checked = { ...checked, [activeQuestion.id]: true }
    liveMessage = selectedIsCorrect
      ? `Correct. ${activeQuestion.correctNote}`
      : `Not quite. ${activeQuestion.wrongNote}`
    tick().then(() => {
      panelEl
        ?.querySelector<HTMLButtonElement>('.v2-mm-actions .v2-mm-primary')
        ?.focus()
    })
  }

  function retry() {
    if (!activeQuestion) return
    answers = { ...answers, [activeQuestion.id]: '' }
    checked = { ...checked, [activeQuestion.id]: false }
    liveMessage = 'Answer cleared. Try again.'
    tick().then(() => {
      panelEl
        ?.querySelector<HTMLInputElement>('input[type="radio"]')
        ?.focus()
    })
  }

  function goNext() {
    if (!activeQuestion) return
    const next = nextQuestion(activeQuestion.id)
    if (next) {
      selectQuestion(next)
      return
    }
    backToSet()
  }

  function onPanelKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      close()
      return
    }

    if (event.key !== 'Tab' || !panelEl) return

    const focusable = Array.from(
      panelEl.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => element.offsetParent !== null)

    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

</script>

{#if open}
  <div class="v2-mm-layer">
    <button
      class="v2-mm-scrim"
      type="button"
      tabindex="-1"
      aria-label="Close mental model check"
      onclick={close}
    ></button>

    <div
      id="v2-mental-model"
      class="v2-mm-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="v2-mm-title"
      tabindex="-1"
      bind:this={panelEl}
      onkeydown={onPanelKeydown}
    >
      <header class="v2-mm-head">
        <div>
          <p class="v2-mm-eyebrow">SANITY CHECK</p>
          <h2 id="v2-mm-title">Test my mental model</h2>
        </div>
        <button
          class="v2-mm-icon"
          type="button"
          aria-label="Close mental model check"
          bind:this={closeButton}
          onclick={close}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 13 13"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d="m3 3 7 7M10 3l-7 7"></path>
          </svg>
        </button>
      </header>

      <div class="v2-mm-body">
        {#if view === 'set'}
          <h3 class="v2-mm-sr">
            Question set
          </h3>
          <p class="v2-mm-intro">
            One causal question per step. Optional — your lesson stays where
            it is.
          </p>
          <div class="v2-mm-progress-row">
            <div class="v2-mm-bars" aria-hidden="true">
              {#each MENTAL_QUESTIONS as question (question.id)}
                <span class:is-done={checked[question.id] === true}></span>
              {/each}
            </div>
            <span class="v2-mm-meta">
              {checkedTotal} of {MENTAL_QUESTIONS.length} checked
            </span>
          </div>

          <div class="v2-mm-list">
            {#each groups as group (group.label)}
              <section class="v2-mm-group">
                <div class="v2-mm-group-head">
                  <span>{group.label}</span>
                  <span>{group.items.length}</span>
                </div>
                {#each group.items as question (question.id)}
                  <button
                    class="v2-mm-row"
                    class:is-answered={checked[question.id] === true}
                    type="button"
                    onclick={() => selectQuestion(question)}
                  >
                    <span class="v2-mm-num">
                      {String(questionNumber(question.id)).padStart(2, '0')}
                    </span>
                    <span class="v2-mm-row-main">
                      <strong>{question.prompt}</strong>
                      <span>{question.stepLabel}</span>
                    </span>
                    <span class="v2-mm-arrow" aria-hidden="true">
                      {#if checked[question.id] === true}
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="1.8"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <path d="m2 6 2.5 2.5L10 3"></path>
                        </svg>
                      {:else}
                        →
                      {/if}
                    </span>
                  </button>
                {/each}
              </section>
            {/each}
          </div>

          <p class="v2-mm-foot">
            Choose a question, or skip the set entirely. Nothing is scored.
          </p>
        {:else if activeQuestion}
          <div class="v2-mm-qtop">
            <button class="v2-mm-back" type="button" onclick={backToSet}>
              ← All questions
            </button>
            <span class="v2-mm-meta">
              Question {activeIndex + 1} of {MENTAL_QUESTIONS.length}{#if isChecked}{selectedIsCorrect ? ' · correct' : ' · review'}{/if}
            </span>
          </div>

          <div class="v2-mm-progress-row">
            <div class="v2-mm-bars" aria-hidden="true">
              {#each MENTAL_QUESTIONS as question (question.id)}
                <span
                  class:is-done={checked[question.id] === true}
                  class:is-current={question.id === activeQuestion.id && !checked[question.id]}
                ></span>
              {/each}
            </div>
            <span class="v2-mm-meta">
              {checkedTotal} of {MENTAL_QUESTIONS.length} checked
            </span>
          </div>

          <div class="v2-mm-context">
            <span class="v2-mm-chip">{activeQuestion.lessonLabel}</span>
            <span class="v2-mm-chip">Step {activeQuestion.stepIndex + 1}</span>
            <span
              class="v2-mm-actor"
              class:actor-browser={activeQuestion.actorTone === 'browser'}
              class:actor-server={activeQuestion.actorTone === 'server'}
              class:actor-database={activeQuestion.actorTone === 'database'}
            >
              {activeQuestion.actor}
            </span>
          </div>

          <h3
            class="v2-mm-question"
            class:is-small={isChecked}
            bind:this={questionHeading}
            tabindex="-1"
          >
            {activeQuestion.prompt}
          </h3>

          <div class="v2-mm-answers" role="radiogroup" aria-label="Answer choices">
            {#each activeQuestion.options as option (option.id)}
              <label
                class="v2-mm-answer"
                class:is-selected={!isChecked && answer === option.id}
                class:is-correct={isChecked && option.correct === true}
                class:is-wrong={isChecked &&
                  answer === option.id &&
                  option.correct !== true}
              >
                <input
                  type="radio"
                  name={`mm-${activeQuestion.id}`}
                  value={option.id}
                  checked={answer === option.id}
                  disabled={isChecked}
                  onchange={() => choose(option.id)}
                />
                <span class="v2-mm-radio" aria-hidden="true">
                  {#if isChecked && option.correct}
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="m2 6 2.5 2.5L10 3"></path>
                    </svg>
                  {/if}
                </span>
                <span class="v2-mm-answer-copy">
                  <strong>{option.title}</strong>
                  <span>{option.detail}</span>
                </span>
                {#if isChecked && option.correct}
                  <span class="v2-mm-tag">Correct answer</span>
                {:else if isChecked && answer === option.id}
                  <span class="v2-mm-tag is-wrong">Your answer</span>
                {/if}
              </label>
            {/each}
          </div>

          {#if !isChecked}
            <div class="v2-mm-actions">
              <button
                class="v2-mm-primary"
                type="button"
                disabled={!answer}
                onclick={check}
              >
                Check answer
              </button>
              <button class="v2-mm-quiet" type="button" onclick={close}>
                Skip for now
              </button>
            </div>
            <p class="v2-mm-note">
              You can change your answer before checking. The evidence will be
              shown after.
            </p>
          {:else}
            <div
              class="v2-mm-feedback"
              class:is-wrong={!selectedIsCorrect}
            >
              <span class="v2-mm-feedback-mark" aria-hidden="true">
                {selectedIsCorrect ? '✓' : '!'}
              </span>
              <div>
                <strong>{selectedIsCorrect ? 'Correct.' : 'Not quite.'}</strong>
                <p>
                  {selectedIsCorrect
                    ? activeQuestion.correctNote
                    : activeQuestion.wrongNote}
                </p>
              </div>
            </div>

            <div class="v2-mm-evidence">
              <span
                class="v2-mm-badge"
                class:is-danger={activeQuestion.evidence.tone === 'danger'}
                class:is-blue={activeQuestion.evidence.tone === 'blue'}
              >
                {activeQuestion.evidence.badge}
              </span>
              {#each activeQuestion.evidence.items as item (item)}
                <span class="v2-mm-dot" aria-hidden="true">·</span>
                <span>{item}</span>
              {/each}
              <button
                class="v2-mm-show"
                type="button"
                onclick={() => onShowInStep(activeQuestion)}
              >
                Show in step →
              </button>
            </div>

            <div class="v2-mm-actions">
              {#if !selectedIsCorrect}
                <button class="v2-mm-primary" type="button" onclick={retry}>
                  Try again
                </button>
                <button class="v2-mm-quiet" type="button" onclick={goNext}>
                  {upcoming ? 'Next question →' : 'Back to question set'}
                </button>
              {:else}
                <button class="v2-mm-primary" type="button" onclick={goNext}>
                  {upcoming ? 'Next question →' : 'Back to question set'}
                </button>
                <button class="v2-mm-quiet" type="button" onclick={close}>
                  Back to step
                </button>
              {/if}
            </div>
          {/if}
        {/if}
      </div>

      <p class="v2-mm-sr" aria-live="polite">{liveMessage}</p>
    </div>
  </div>
{/if}

<style>
  .v2-mm-layer {
    position: fixed;
    z-index: 70;
    inset: 0;
    display: flex;
    justify-content: flex-end;
  }

  .v2-mm-scrim {
    position: absolute;
    inset: 0;
    border: 0;
    background: rgb(27 31 36 / 16%);
    cursor: default;
  }

  .v2-mm-panel {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    width: min(470px, 100vw);
    height: 100%;
    border-left: 1px solid var(--v2-border, #dad8d0);
    background: #fff;
    color: var(--v2-ink, #1b1f24);
    font-family: var(--sans, 'Inter', system-ui, sans-serif);
    box-shadow: -18px 0 44px rgb(27 31 36 / 10%);
  }

  .v2-mm-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding: 22px 24px 14px;
    border-bottom: 1px solid var(--v2-border-soft, #e8e5dc);
  }

  .v2-mm-head h2 {
    margin: 3px 0 0;
    font-size: 21px;
    font-weight: 600;
    letter-spacing: -0.02em;
    line-height: 1.2;
  }

  .v2-mm-eyebrow {
    margin: 0;
    color: var(--v2-muted, #69717c);
    font-family: var(--mono, 'JetBrains Mono', monospace);
    font-size: 9px;
    font-weight: 500;
    letter-spacing: 0.08em;
    line-height: 1.4;
    text-transform: uppercase;
  }

  .v2-mm-icon {
    display: inline-grid;
    place-items: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border: 1px solid transparent;
    border-radius: 6px;
    background: transparent;
    color: var(--v2-muted, #69717c);
  }

  .v2-mm-icon:hover {
    background: var(--v2-bg, #f6f5f1);
    color: var(--v2-ink, #1b1f24);
  }

  .v2-mm-body {
    min-height: 0;
    overflow: auto;
    padding: 16px 24px 20px;
    overscroll-behavior: contain;
  }

  .v2-mm-intro {
    margin: 0;
    color: var(--v2-body, #4a5360);
    font-size: 11px;
    line-height: 1.5;
  }

  .v2-mm-progress-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 13px;
  }

  .v2-mm-bars {
    display: flex;
    gap: 4px;
  }

  .v2-mm-bars span {
    width: 20px;
    height: 3px;
    border-radius: 999px;
    background: var(--v2-border, #dad8d0);
  }

  .v2-mm-bars span.is-done {
    background: var(--v2-blue, #1d4ed8);
  }

  .v2-mm-bars span.is-current {
    background: var(--v2-ink, #1b1f24);
  }

  .v2-mm-meta {
    color: var(--v2-muted, #69717c);
    font-family: var(--mono, 'JetBrains Mono', monospace);
    font-size: 9px;
    white-space: nowrap;
  }

  .v2-mm-list {
    padding-top: 7px;
  }

  .v2-mm-group {
    padding-top: 8px;
  }

  .v2-mm-group-head {
    display: flex;
    justify-content: space-between;
    padding: 5px 0 4px;
    color: var(--v2-muted, #69717c);
    font-family: var(--mono, 'JetBrains Mono', monospace);
    font-size: 8px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .v2-mm-row {
    display: grid;
    grid-template-columns: 23px minmax(0, 1fr) 15px;
    gap: 8px;
    align-items: center;
    width: 100%;
    padding: 8px 5px;
    border: 0;
    border-bottom: 1px solid var(--v2-border-soft, #e8e5dc);
    background: transparent;
    color: var(--v2-ink, #1b1f24);
    text-align: left;
  }

  .v2-mm-row:hover {
    background: #fbfaf7;
  }

  .v2-mm-num {
    color: var(--v2-muted, #69717c);
    font-family: var(--mono, 'JetBrains Mono', monospace);
    font-size: 9px;
  }

  .v2-mm-row-main {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .v2-mm-row-main strong {
    font-size: 11px;
    font-weight: 500;
    line-height: 1.35;
  }

  .v2-mm-row-main span {
    color: var(--v2-muted, #69717c);
    font-size: 9px;
  }

  .v2-mm-arrow {
    color: #a8a49a;
    font-size: 13px;
    text-align: right;
  }

  .v2-mm-row.is-answered .v2-mm-arrow {
    color: var(--v2-blue, #1d4ed8);
  }

  .v2-mm-foot {
    margin: 13px 0 0;
    color: var(--v2-muted, #69717c);
    font-size: 9px;
    line-height: 1.5;
  }

  .v2-mm-qtop {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .v2-mm-back {
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--v2-body, #4a5360);
    font-family: inherit;
    font-size: 10px;
  }

  .v2-mm-back:hover {
    color: var(--v2-ink, #1b1f24);
    text-decoration: underline;
  }

  .v2-mm-context {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-top: 16px;
  }

  .v2-mm-chip {
    display: inline-flex;
    align-items: center;
    min-height: 21px;
    padding: 0 7px;
    border: 1px solid var(--v2-border-soft, #e8e5dc);
    border-radius: 5px;
    background: #fbfaf7;
    color: var(--v2-body, #4a5360);
    font-family: var(--mono, 'JetBrains Mono', monospace);
    font-size: 9px;
    white-space: nowrap;
  }

  .v2-mm-actor {
    display: inline-flex;
    align-items: center;
    min-height: 21px;
    padding: 0 7px;
    border: 1px solid transparent;
    border-radius: 5px;
    font-family: var(--mono, 'JetBrains Mono', monospace);
    font-size: 9px;
    font-weight: 500;
    line-height: 1;
    white-space: nowrap;
  }

  .v2-mm-question {
    margin: 17px 0 0;
    color: var(--v2-ink, #1b1f24);
    font-size: 23px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: -0.025em;
    outline: none;
  }

  .v2-mm-question.is-small {
    font-size: 17px;
    line-height: 1.3;
  }

  .v2-mm-answers {
    display: flex;
    flex-direction: column;
    gap: 7px;
    margin-top: 17px;
  }

  .v2-mm-answer {
    position: relative;
    display: grid;
    grid-template-columns: 17px minmax(0, 1fr) auto;
    gap: 9px;
    align-items: flex-start;
    padding: 10px 11px;
    border: 1px solid var(--v2-border, #dad8d0);
    border-radius: 7px;
    background: #fff;
    cursor: pointer;
  }

  .v2-mm-answer:hover {
    border-color: #b8b4aa;
  }

  .v2-mm-answer input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  .v2-mm-answer:has(input:focus-visible) {
    outline: 2px solid var(--v2-blue, #1d4ed8);
    outline-offset: 2px;
  }

  .v2-mm-answer.is-selected {
    border-color: var(--v2-blue, #1d4ed8);
    background: var(--v2-blue-soft, #f5f8ff);
  }

  .v2-mm-answer.is-correct {
    border-color: var(--v2-blue, #1d4ed8);
    background: var(--v2-blue-soft, #f5f8ff);
  }

  .v2-mm-answer.is-wrong {
    border-color: #e6b3ad;
    background: #fff5f4;
  }

  .v2-mm-radio {
    display: grid;
    place-items: center;
    width: 15px;
    height: 15px;
    margin-top: 1px;
    border: 1px solid #c8c4ba;
    border-radius: 50%;
    background: #fff;
    color: #fff;
  }

  .v2-mm-answer.is-selected .v2-mm-radio,
  .v2-mm-answer.is-correct .v2-mm-radio {
    border-color: var(--v2-blue, #1d4ed8);
    background: var(--v2-blue, #1d4ed8);
  }

  .v2-mm-answer.is-wrong .v2-mm-radio {
    border-color: #b42318;
  }

  .v2-mm-answer-copy {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .v2-mm-answer-copy strong {
    color: var(--v2-ink, #1b1f24);
    font-size: 11px;
    font-weight: 600;
  }

  .v2-mm-answer-copy span {
    color: var(--v2-body, #4a5360);
    font-size: 10px;
    line-height: 1.4;
  }

  .v2-mm-tag {
    align-self: start;
    padding: 2px 5px;
    border-radius: 3px;
    background: var(--v2-blue-soft, #f5f8ff);
    color: var(--v2-blue, #1d4ed8);
    font-family: var(--mono, 'JetBrains Mono', monospace);
    font-size: 7px;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .v2-mm-tag.is-wrong {
    background: #fdecea;
    color: #b42318;
  }

  .v2-mm-actions {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-top: 17px;
  }

  .v2-mm-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 36px;
    padding: 0 14px;
    border: 1px solid var(--v2-blue, #1d4ed8);
    border-radius: 7px;
    background: var(--v2-blue, #1d4ed8);
    color: #fff;
    font-family: inherit;
    font-size: 12px;
    font-weight: 500;
  }

  .v2-mm-primary:hover {
    background: #1e40af;
  }

  .v2-mm-primary:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }

  .v2-mm-quiet {
    min-height: 36px;
    padding: 0 11px;
    border: 1px solid transparent;
    border-radius: 7px;
    background: transparent;
    color: var(--v2-body, #4a5360);
    font-family: inherit;
    font-size: 12px;
  }

  .v2-mm-quiet:hover {
    background: #fbfaf7;
    color: var(--v2-ink, #1b1f24);
  }

  .v2-mm-note {
    margin: 9px 0 0;
    color: var(--v2-muted, #69717c);
    font-size: 9px;
    line-height: 1.45;
  }

  .v2-mm-feedback {
    display: flex;
    gap: 9px;
    margin-top: 14px;
    padding: 10px 11px;
    border: 1px solid var(--v2-blue-line, #cfdcf8);
    border-radius: 7px;
    background: var(--v2-blue-soft, #f5f8ff);
    outline: none;
  }

  .v2-mm-feedback.is-wrong {
    border-color: #efc9c2;
    background: #fff5f4;
  }

  .v2-mm-feedback-mark {
    display: grid;
    place-items: center;
    width: 17px;
    height: 17px;
    flex: none;
    border-radius: 50%;
    background: var(--v2-blue, #1d4ed8);
    color: #fff;
    font-family: var(--mono, 'JetBrains Mono', monospace);
    font-size: 10px;
    font-weight: 700;
  }

  .v2-mm-feedback.is-wrong .v2-mm-feedback-mark {
    background: #b42318;
  }

  .v2-mm-feedback strong {
    display: block;
    color: var(--v2-ink, #1b1f24);
    font-size: 11px;
  }

  .v2-mm-feedback p {
    margin: 2px 0 0;
    color: var(--v2-body, #4a5360);
    font-size: 10px;
    line-height: 1.45;
  }

  .v2-mm-evidence {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 5px;
    margin-top: 10px;
    padding: 8px 9px;
    border: 1px solid var(--v2-border-soft, #e8e5dc);
    border-radius: 6px;
    background: #fbfaf7;
    color: var(--v2-body, #4a5360);
    font-size: 9px;
  }

  .v2-mm-badge {
    padding: 2px 5px;
    border: 1px solid var(--v2-border, #dad8d0);
    border-radius: 3px;
    background: #fff;
    color: var(--v2-body, #4a5360);
    font-family: var(--mono, 'JetBrains Mono', monospace);
    font-size: 8px;
  }

  .v2-mm-badge.is-danger {
    border-color: #efc9c2;
    background: #fff5f4;
    color: #b42318;
  }

  .v2-mm-badge.is-blue {
    border-color: var(--v2-blue-line, #cfdcf8);
    background: var(--v2-blue-soft, #f5f8ff);
    color: var(--v2-blue, #1d4ed8);
  }

  .v2-mm-dot {
    color: #b5b1a7;
  }

  .v2-mm-show {
    margin-left: auto;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--v2-blue, #1d4ed8);
    font-family: inherit;
    font-size: 9px;
    white-space: nowrap;
  }

  .v2-mm-show:hover {
    text-decoration: underline;
  }

  .v2-mm-sr {
    position: absolute;
    overflow: hidden;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    border: 0;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }

  .v2-mm-primary:focus-visible,
  .v2-mm-quiet:focus-visible,
  .v2-mm-icon:focus-visible,
  .v2-mm-back:focus-visible,
  .v2-mm-show:focus-visible,
  .v2-mm-row:focus-visible {
    outline: 2px solid var(--v2-blue, #1d4ed8);
    outline-offset: 2px;
  }

  @media (max-width: 760px) {
    .v2-mm-panel {
      width: 100%;
      border-left: 0;
      box-shadow: none;
    }

    .v2-mm-head {
      padding: 18px 20px 12px;
    }

    .v2-mm-body {
      padding: 14px 20px 18px;
    }

    .v2-mm-question {
      font-size: 22px;
    }

    .v2-mm-question.is-small {
      font-size: 16px;
    }

    .v2-mm-bars span {
      width: 16px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .v2-mm-panel {
      transition: none;
    }
  }
</style>
