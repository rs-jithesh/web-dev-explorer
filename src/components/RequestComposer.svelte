<script lang="ts">
  import type { ComposerPreset, Method } from '../engine/types'
  import type { StatusCode } from '../engine/composer'
  import Card from './Card.svelte'
  import ComposerFields from './ComposerFields.svelte'
  import StatusPrediction from './StatusPrediction.svelte'
  import ComposerPresets from './ComposerPresets.svelte'

  let {
    method,
    path,
    body,
    status,
    sent,
    validation,
    presets,
    actualStatus,
    finished,
    onMethod,
    onPath,
    onBody,
    onStatus,
    onSend,
    onPreset,
  }: {
    method: Method
    path: string
    body: string
    status: StatusCode | null
    sent: boolean
    validation: string | null
    presets: ComposerPreset[]
    actualStatus: number | 'timeout' | null
    finished: boolean
    onMethod: (method: Method) => void
    onPath: (path: string) => void
    onBody: (body: string) => void
    onStatus: (status: StatusCode) => void
    onSend: () => void
    onPreset: (preset: ComposerPreset) => void
  } = $props()

  const meta = $derived(sent ? 'Sent' : 'Ready')
</script>

<Card title="Request composer" {meta}>
  <div class="card-body">
    <p class="composer-intro">
      You are the client. Build a request, predict its status, then send it.
    </p>

    <ComposerFields
      {method}
      {path}
      {body}
      {sent}
      {onMethod}
      {onPath}
      {onBody}
    />

    <StatusPrediction
      {status}
      {sent}
      {validation}
      {actualStatus}
      {finished}
      {onStatus}
    />

    <div class="composer-actions">
      <button
        class="btn btn-primary"
        type="button"
        onclick={onSend}
        disabled={sent}
      >
        Send
      </button>
      <span class="hint">
        {sent
          ? 'Request sent. Use Reset below to try another.'
          : 'Your prediction is checked after the response.'}
      </span>
    </div>

    <ComposerPresets {presets} {sent} {onPreset} />
  </div>
</Card>
