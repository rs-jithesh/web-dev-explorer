<script lang="ts">
  import type { EvidenceBlock } from './evidence'
  import { DETAIL_COPY } from './content'

  let {
    stepIndex,
    stepLabel,
    actorLabel,
    actorTone,
    blocks,
    onBack,
    onStep,
  }: {
    stepIndex: number
    stepLabel: string
    actorLabel: string
    actorTone: 'browser' | 'server' | 'database'
    blocks: EvidenceBlock[]
    onBack: () => void
    onStep: (index: number) => void
  } = $props()

  const previous = $derived(stepIndex > 0 ? stepIndex - 1 : null)
  const next = $derived(stepIndex < 4 ? stepIndex + 1 : null)
</script>

<article class="v2-card v2-detail-card" aria-labelledby="v2-detail-title">
  <button class="v2-back-link" type="button" onclick={onBack}>
    {DETAIL_COPY.back}
  </button>

  <header class="v2-detail-head">
    <div>
      <p class="v2-step-count">Step {stepIndex + 1} of 5</p>
      <div class="v2-title-row">
        <h2 id="v2-detail-title">{DETAIL_COPY.title}</h2>
        <span
          class="v2-actor"
          class:actor-browser={actorTone === 'browser'}
          class:actor-server={actorTone === 'server'}
          class:actor-database={actorTone === 'database'}
        >
          {actorLabel}
        </span>
      </div>
    </div>
    <span class="v2-detail-step-label">{stepLabel}</span>
  </header>

  <p class="v2-detail-subtitle">{DETAIL_COPY.subtitle}</p>

  <div class="v2-evidence-grid">
    {#each blocks as block, index (index)}
      {#if block.kind === 'mono'}
        <section
          class="v2-evidence-block"
          class:is-wide={block.wide}
          class:is-code={block.tone === 'code'}
        >
          <h3>{block.title}</h3>
          <div class="v2-mono-box">
            {#each block.lines as line, lineIndex (lineIndex)}
              <div class="v2-mono-line" class:is-highlighted={block.highlightLine === lineIndex}>
                {line || ' '}
              </div>
            {/each}
          </div>
          {#if block.caption}
            <p class="v2-block-caption">{block.caption}</p>
          {/if}
        </section>
      {:else if block.kind === 'table'}
        <section class="v2-evidence-block" class:is-wide={block.wide}>
          <h3>{block.title}</h3>
          <div class="v2-table-wrap">
            <table class="v2-table">
              <thead>
                <tr>
                  <th scope="col">id</th>
                  <th scope="col">title</th>
                </tr>
              </thead>
              <tbody>
                {#each block.tasks as task (task.id)}
                  <tr class:is-highlighted={block.highlightId === task.id}>
                    <td class="v2-mono-cell">{task.id}</td>
                    <td>
                      {task.title}
                      {#if block.highlightId === task.id}
                        <span class="v2-new-tag">← new row</span>
                      {/if}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </section>
      {:else if block.kind === 'note'}
        <div class="v2-info-note" class:is-wide={block.wide} class:is-plain={block.tone === 'plain'}>
          {block.text}
        </div>
      {:else}
        <section class="v2-evidence-block v2-checklist" class:is-wide={block.wide}>
          <h3>{block.title}</h3>
          <ul>
            {#each block.items as item (item)}
              <li>
                <span class="v2-filled-check" aria-hidden="true">
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="m2 6 2.5 2.5L10 3"></path>
                  </svg>
                </span>
                <span>{item}</span>
              </li>
            {/each}
          </ul>
        </section>
      {/if}
    {/each}
  </div>

  <footer class="v2-detail-controls">
    {#if previous !== null}
      <button class="v2-secondary" type="button" onclick={() => onStep(previous)}>
        {DETAIL_COPY.stepBack.replace('{step}', String(previous + 1))}
      </button>
    {:else}
      <span></span>
    {/if}
    {#if next !== null}
      <button class="v2-primary" type="button" onclick={() => onStep(next)}>
        {DETAIL_COPY.stepNext.replace('{step}', String(next + 1))}
      </button>
    {/if}
  </footer>
</article>
