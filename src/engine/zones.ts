export type ZoneKind = 'client' | 'server' | 'database'

export interface ZoneCopy {
  title: string
  description: string
  info: string
}

export const ZONE_COPY: Record<ZoneKind, ZoneCopy> = {
  client: {
    title: 'Client / browser',
    description: 'Runs in your tab. Everything in this zone is client-side.',
    info: 'The client is everything running in your browser tab. It builds HTTP requests and renders responses. It does not run server code or connect to the database.',
  },
  server: {
    title: 'Server / backend',
    description:
      'The backend. It receives requests, runs server-side code, and is the only side that talks to the database.',
    info: 'The backend is the server-side code. In the main lesson, the API router matches the HTTP method and path to a handler, and the handler runs your code. Only the server talks to the database.',
  },
  database: {
    title: 'Database',
    description:
      'Separate storage. Only the server connects here; the browser never does.',
    info: 'The database is separate storage. It holds the tasks table. The server reads and writes rows; the browser has no direct connection or credentials.',
  },
}

export interface BoundaryCopy {
  title: string
  detail: string
  info: string
}

export const BOUNDARY_COPY: Record<'http' | 'db', BoundaryCopy> = {
  http: {
    title: 'HTTP request / response',
    detail: 'The browser ⇄ the server',
    info: 'HTTP is the network protocol the browser uses to send a request to the server and receive a response. The browser and server are separate processes.',
  },
  db: {
    title: 'Database connection',
    detail: 'Server only. The browser never connects directly.',
    info: 'This is the private connection between the server and the database. The browser has no database credentials and cannot open this connection.',
  },
}
