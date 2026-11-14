<script lang="ts">
  let { active = false }: { active?: boolean } = $props()
</script>

<div class="arrow" class:arrow-active={active} aria-hidden="true">
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M3 10h13M11 5l5 5-5 5"></path>
  </svg>
</div>
