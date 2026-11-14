<script lang="ts">
  let {
    text,
    label = 'More information',
  }: {
    text: string
    label?: string
  } = $props()

  const id = `info-${crypto.randomUUID()}`
</script>

<button
  class="info-button"
  type="button"
  popovertarget={id}
  aria-label={label}
  title={label}
>
  i
</button>

<div id={id} popover="auto" class="info-popover">
  <p class="info-popover-title">{label}</p>
  <p>{text}</p>
  <button
    class="info-close"
    type="button"
    popovertarget={id}
    popovertargetaction="hide"
  >
    Close
  </button>
</div>
