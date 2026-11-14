<script lang="ts">
  import type { ApiView } from '../engine/view'
  import type { Payload } from '../engine/types'
  import Card from './Card.svelte'
  import PayloadToken from './PayloadToken.svelte'

  let {
    view,
    active,
    payload,
  }: {
    view: ApiView
    active: boolean
    payload: Payload | null
  } = $props()

  const labels: Record<number, string> = {
    200: 'OK',
    201: 'Created',
    400: 'Bad Request',
    404: 'Not Found',
    405: 'Method Not Allowed',
    500: 'Server Error',
  }
</script>

<Card index="2" title="API route" meta="HTTP" {active}>
  <div class="card-body">
    {#if payload}
      <PayloadToken {payload} />
    {/if}

    <div class="api-block">
      <span class="lbl">Request</span>
      {#if view.request}
        <div class="request mono">
          <b>{view.request.method} {view.request.path}</b><br />
          {#if view.request.body !== null}
            Content-Type: application/json
            <span class="request-body" class:muted={view.request.body.trim() === ''}>
              {view.request.body.trim() === '' ? '(empty body)' : view.request.body}
            </span>
          {:else}
            Accept: application/json<br /><br /><span class="muted">No body.</span>
          {/if}
        </div>
        {#if !view.sent}
          <p class="note">Built by the browser. Not sent yet.</p>
        {/if}
      {:else}
        <div class="notice">{view.error ?? 'Not sent yet.'}</div>
      {/if}

      {#if view.match === 'matched'}
        <p class="note match-ok">Route matched.</p>
      {:else if view.match === 'missed'}
        <p class="note match-bad">No route matched.</p>
      {:else if view.match === 'method_not_allowed'}
        <p class="note match-bad">
          Path exists, but this method is not allowed.
        </p>
      {:else if view.match === 'timeout'}
        <p class="note match-bad">Timed out before a response.</p>
      {:else if view.match === 'blocked'}
        <p class="note match-bad">No HTTP request was made.</p>
      {/if}
    </div>

    <div class="api-block">
      <span class="lbl">Response</span>
      {#if view.response}
        <div class="response">
          <div class="row spread">
            <span
              class="status-badge"
              class:ok={view.response.status < 300}
              class:err={view.response.status >= 400}
            >
              {view.response.status} {labels[view.response.status] ?? ''}
            </span>
          </div>
          <pre class="json mono">{JSON.stringify(view.response.body, null, 2)}</pre>
        </div>
      {:else if view.match === 'blocked'}
        <div class="notice">{view.note ?? 'The API was skipped.'}</div>
      {:else if view.error}
        <div class="notice error-note">{view.error}</div>
      {:else if view.request && view.sent}
        <div class="notice">Waiting for the server…</div>
      {:else}
        <div class="notice">
          Not sent yet. It appears after the server finishes.
        </div>
      {/if}
    </div>
  </div>
</Card>
