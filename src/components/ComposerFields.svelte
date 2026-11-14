<script lang="ts">
  import type { Method } from '../engine/types'
  import InfoTip from './InfoTip.svelte'

  let {
    method,
    path,
    body,
    sent,
    onMethod,
    onPath,
    onBody,
  }: {
    method: Method
    path: string
    body: string
    sent: boolean
    onMethod: (method: Method) => void
    onPath: (path: string) => void
    onBody: (body: string) => void
  } = $props()

  const bodyEnabled = $derived(method === 'POST' && !sent)
  const endpointPath = $derived(path.trim() || '/')
  const endpoint = $derived(`${method} localhost:5173${endpointPath}`)
</script>

<div class="composer-row">
  <div class="composer-field method-field">
    <div class="label-row">
      <label class="lbl" for="composer-method">Method</label>
      <InfoTip
        text="The HTTP method. GET asks for data, POST creates data, DELETE removes data."
        label="About the HTTP method"
      />
    </div>
    <select
      id="composer-method"
      class="select-input"
      value={method}
      disabled={sent}
      onchange={(event) => onMethod(event.currentTarget.value as Method)}
    >
      <option value="GET">GET</option>
      <option value="POST">POST</option>
      <option value="DELETE">DELETE</option>
    </select>
  </div>

  <div class="composer-field path-field">
    <div class="label-row">
      <label class="lbl" for="composer-path">Path</label>
      <InfoTip
        text="The URL path the API router matches, such as /tasks."
        label="About the path"
      />
    </div>
    <input
      id="composer-path"
      class="text-input path-input"
      type="text"
      value={path}
      spellcheck="false"
      disabled={sent}
      oninput={(event) => onPath(event.currentTarget.value)}
    />
  </div>
</div>

<div class="endpoint-preview">
  <div class="label-row">
    <span class="lbl">Endpoint</span>
    <InfoTip
      text="The method plus the full URL the browser calls, such as POST localhost:5173/tasks."
      label="About the endpoint"
    />
  </div>
  <code class="endpoint-value">{endpoint}</code>
</div>

<div class="composer-field">
  <div class="label-row">
    <label class="lbl" for="composer-body">JSON body</label>
    <InfoTip
      text="JSON is a text format for structured data. The server parses it into a JavaScript object."
      label="About the JSON body"
    />
  </div>
  <textarea
    id="composer-body"
    class="body-input"
    rows="4"
    spellcheck="false"
    value={body}
    disabled={!bodyEnabled}
    oninput={(event) => onBody(event.currentTarget.value)}
  ></textarea>
  <p class="hint">
    {method === 'POST'
      ? 'The server parses this as JSON. A missing or empty title gives a 400.'
      : `${method} requests do not send a body in this composer.`}
  </p>
</div>
