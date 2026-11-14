export interface GlossaryEntry {
  term: string
  definition: string
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  request: {
    term: 'request',
    definition:
      'A request is the message the browser sends to the server. In CS terms, it is a remote call across a process boundary: data is serialized, sent over the network, and handled by another program.',
  },
  response: {
    term: 'response',
    definition:
      'A response is the server’s reply to a request. It carries a status code and optional data back across the same process boundary.',
  },
  http: {
    term: 'HTTP',
    definition:
      'HTTP is the request/response protocol between the browser and the server. Think of it as a typed message protocol: method and path select the operation, headers describe the payload, and a status code reports the outcome.',
  },
  router: {
    term: 'router',
    definition:
      'A router maps a method and path to the handler that should run. It behaves like a dispatch table or a switch over the request tuple, before the handler function is entered.',
  },
  handler: {
    term: 'handler',
    definition:
      'A handler is the server function selected for a route. It receives the parsed request, performs the work, and returns a response.',
  },
  server: {
    term: 'server',
    definition:
      'The server is the trusted process that receives HTTP requests and owns the database connection. It runs outside the browser tab, in a separate process.',
  },
  database: {
    term: 'database',
    definition:
      'The database is durable storage outside the browser. The server reads and writes rows through its own connection; the browser has no direct access.',
  },
  sql: {
    term: 'SQL',
    definition:
      'SQL is the database’s query language. A statement such as INSERT describes a change to rows, while values are passed as data rather than pasted into the query text.',
  },
  row: {
    term: 'row',
    definition:
      'A row is one record in a database table. In this lesson, each task becomes one row with an id chosen by the database.',
  },
  json: {
    term: 'JSON',
    definition:
      'JSON is a text format for structured data. The browser serializes an object into bytes for the wire, and the server parses those bytes back into an object.',
  },
  'status code': {
    term: 'status code',
    definition:
      'A status code is the response’s outcome category. 2xx means success, 4xx means the request was rejected, and 5xx means the server failed while handling it.',
  },
  memory: {
    term: 'browser memory',
    definition:
      'Browser memory is the state held by the current page instance. A refresh clears it, while a database row survives in separate durable storage.',
  },
}

export function glossaryFor(term: string): GlossaryEntry {
  const key = term.trim().toLowerCase()
  return (
    GLOSSARY[key] ?? {
      term: term.trim(),
      definition:
        'A web term used in this step. Ask the tutor to connect it to the request lifecycle and your CS background.',
    }
  )
}

export function termsForStep(stepIndex: number): string[] {
  switch (stepIndex) {
    case 0:
      return ['request', 'HTTP', 'JSON']
    case 1:
      return ['router', 'handler', 'status code']
    case 2:
      return ['handler', 'status code', 'server']
    case 3:
      return ['database', 'row', 'SQL']
    default:
      return ['response', 'status code', 'JSON']
  }
}
