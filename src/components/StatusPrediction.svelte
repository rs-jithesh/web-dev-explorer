<script lang="ts">
  import { STATUS_OPTIONS, type StatusCode } from '../engine/composer'

  let {
    status,
    sent,
    validation,
    actualStatus,
    finished,
    onStatus,
  }: {
    status: StatusCode | null
    sent: boolean
    validation: string | null
    actualStatus: number | 'timeout' | null
    finished: boolean
    onStatus: (status: StatusCode) => void
  } = $props()
</script>

<fieldset class="status-field" class:has-error={!!validation} disabled={sent}>
  <legend class="lbl">Predict the status code</legend>
  <div class="status-options">
    {#each STATUS_OPTIONS as option}
      <label
        class="status-option"
        class:selected={status === option.value}
        class:correct={finished && actualStatus === option.value}
        class:wrong={finished &&
          status === option.value &&
          actualStatus !== option.value}
      >
        <input
          type="radio"
          name="composer-status"
          value={option.value}
          checked={status === option.value}
          disabled={sent}
          onchange={() => onStatus(option.value)}
        />
        <span>{option.label}</span>
      </label>
    {/each}
  </div>
</fieldset>

{#if validation}
  <p class="validation" role="alert">{validation}</p>
{/if}
