import type { Step } from './types'

export const addSteps: Step[] = [
  {
    active: 'browser',
    stage: 'click',
    explanation:
      'You clicked Add. The browser shows the task as pending and builds an HTTP request, but nothing has left the browser yet.',
  },
  {
    active: 'browser',
    stage: 'send',
    explanation:
      'The browser sends POST /tasks with the title as JSON. The page does not reload, so the rest of the screen stays where it is.',
  },
  {
    active: 'api',
    stage: 'route',
    line: 1,
    explanation:
      'The server matches POST /tasks to the handler on line 1. The router picked this code; it has not run yet.',
  },
  {
    active: 'server',
    stage: 'code',
    line: 2,
    explanation:
      'Line 2 reads title from the request body, and line 3 checks that it is not empty. The value passed the check.',
  },
  {
    active: 'database',
    stage: 'db',
    line: 4,
    explanation:
      'Line 4 asks the database to insert a row. The database, not the browser, writes the data.',
  },
  {
    active: 'api',
    stage: 'respond',
    line: 5,
    explanation:
      'The handler replies with 201 Created and the saved task as JSON. A 201 means a new resource was created.',
  },
  {
    active: 'browser',
    stage: 'done',
    explanation:
      'The browser receives the response and swaps the pending task for the saved one. One full round trip is complete.',
  },
]

export const getSteps: Step[] = [
  {
    active: 'browser',
    stage: 'click',
    explanation:
      'The page has just loaded, so the frontend starts and needs the current tasks before it can show a list.',
  },
  {
    active: 'browser',
    stage: 'send',
    explanation:
      'The browser sends GET /tasks. A GET asks for data and has no request body.',
  },
  {
    active: 'api',
    stage: 'route',
    line: 1,
    explanation:
      'The router matches GET /tasks to this handler. A different method on the same path would be a different route.',
  },
  {
    active: 'server',
    stage: 'code',
    line: 2,
    explanation:
      'Line 2 asks the database for every task. The server is doing the reading, not the browser.',
  },
  {
    active: 'database',
    stage: 'db',
    line: 2,
    explanation:
      'The database runs SELECT * FROM tasks and returns both rows to the server.',
  },
  {
    active: 'api',
    stage: 'respond',
    line: 3,
    explanation:
      'The server sends 200 OK with the tasks as a JSON array. 200 means the request succeeded.',
  },
  {
    active: 'browser',
    stage: 'done',
    explanation:
      'The browser renders the array as a list. GET only reads data; it does not change the database.',
  },
]

export const emptySteps: Step[] = [
  {
    active: 'browser',
    stage: 'click',
    explanation:
      'You clicked Add with an empty box. The browser does not decide whether the title is valid; it builds the request anyway.',
  },
  {
    active: 'browser',
    stage: 'send',
    explanation:
      'The browser sends POST /tasks with an empty title in the JSON body. The server has to decide what to do with it.',
  },
  {
    active: 'api',
    stage: 'route',
    line: 1,
    explanation:
      'The route matches, so the handler runs. A bad value is not the same thing as a bad URL.',
  },
  {
    active: 'server',
    stage: 'code',
    line: 2,
    explanation:
      'Line 2 reads title from the body. For this request it is an empty string.',
  },
  {
    active: 'server',
    stage: 'code',
    line: 3,
    explanation:
      'The guard on line 3 is true, so the handler returns early with 400 Bad Request. The insert never happens.',
  },
  {
    active: 'api',
    stage: 'respond',
    line: 3,
    explanation:
      'The server sends 400 Bad Request and an error message. A 400 means the client sent something the server cannot accept.',
  },
  {
    active: 'browser',
    stage: 'done',
    explanation:
      'The browser shows the error and leaves the list unchanged. No row was written to the database.',
  },
]

export const boundarySteps: Step[] = [
  {
    active: 'browser',
    stage: 'click',
    explanation:
      'You clicked Add. The browser can draw the page, but it cannot see the tasks database at all.',
  },
  {
    active: 'browser',
    stage: 'send',
    explanation:
      'The only channel the browser has is HTTP, so it sends POST /tasks to the API.',
  },
  {
    active: 'api',
    stage: 'route',
    line: 1,
    explanation:
      'The API route is the public door. It decides which server code is allowed to run for this request.',
  },
  {
    active: 'server',
    stage: 'code',
    line: 3,
    explanation:
      'The handler runs inside the server process, where the database credentials live. The browser never receives those credentials.',
  },
  {
    active: 'database',
    stage: 'db',
    line: 4,
    explanation:
      'Only the server can open the database and run this INSERT. The browser never gets this access.',
  },
  {
    active: 'api',
    stage: 'respond',
    line: 5,
    explanation:
      'The server sends the result back as HTTP. The database connection stays on the server side.',
  },
  {
    active: 'browser',
    stage: 'done',
    explanation:
      'The browser updates the page. Every write crossed the backend boundary, which is why the database stays protected.',
  },
]

export const notFoundSteps: Step[] = [
  {
    active: 'browser',
    stage: 'click',
    explanation:
      'The browser builds the request from the method and URL it was given. It does not know which routes exist.',
  },
  {
    active: 'browser',
    stage: 'send',
    explanation:
      'The request leaves the browser for the server. So far it looks exactly like a valid request.',
  },
  {
    active: 'api',
    stage: 'route',
    explanation:
      'The router looks for a matching method and path. No handler is registered for this URL, so it stops here.',
  },
  {
    active: 'api',
    stage: 'respond',
    explanation:
      'The server sends 404 Not Found. No handler ran and the database was never touched.',
  },
  {
    active: 'browser',
    stage: 'done',
    explanation:
      'The browser shows a not-found error. The request never reached the code that writes data.',
  },
]

export const offlineSteps: Step[] = [
  {
    active: 'browser',
    stage: 'click',
    explanation:
      'The browser builds the request in exactly the same way as before. It has no reason to expect trouble.',
  },
  {
    active: 'browser',
    stage: 'send',
    explanation:
      'The browser sends the request and waits. This time no server is listening for it.',
  },
  {
    active: 'api',
    stage: 'respond',
    explanation:
      'No response comes back. This is a network failure, not an HTTP status code: the request never reached a server.',
  },
  {
    active: 'browser',
    stage: 'done',
    explanation:
      'The browser eventually gives up and shows a connection error. It cannot know whether anything was written.',
  },
]

export const directDbSteps: Step[] = [
  {
    active: 'browser',
    stage: 'blocked',
    explanation:
      'The browser tries to open the tasks database directly. Browsers have no database driver and no credentials to present.',
  },
  {
    active: 'api',
    stage: 'blocked',
    explanation:
      'No HTTP request was made, so the API route is never involved. The backend door was skipped entirely.',
  },
  {
    active: 'database',
    stage: 'blocked',
    explanation:
      'The database only accepts connections from the server process. The browser is refused.',
  },
  {
    active: 'browser',
    stage: 'blocked',
    explanation:
      'The attempt fails. This is exactly why the browser has to go through the API and the server.',
  },
]
