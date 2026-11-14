import type { Run } from '../engine/server.ts'
import type { Task } from '../engine/types'
import { buildPrompt, buildSnapshot } from '../engine/tutor.ts'
import { DEFAULT_TITLE } from './content.ts'
import {
  storyFor,
  tutorQuestionFor,
  type ExplorerLesson,
} from './lessons.ts'

/**
 * The v2 prompt is still built by the shared tutor engine. This adapter only
 * supplies the current lesson, story step, request and evidence.
 */
export function v2Prompt(
  lesson: ExplorerLesson,
  stepIndex: number,
  title: string,
  run: Run,
  tasksBefore: Task[],
  term?: string | null,
): string {
  const safeTitle = title.trim() || DEFAULT_TITLE
  const steps = storyFor(lesson, run, safeTitle)
  const step = steps[Math.max(0, Math.min(stepIndex, steps.length - 1))]
  const request = run.request
  const requestBody =
    request?.method === 'POST'
      ? (request.body ?? JSON.stringify({ title: safeTitle }))
      : undefined
  const databaseRows =
    run.reached.database && stepIndex >= 3 ? run.tasksAfter : tasksBefore

  const snapshot = buildSnapshot({
    lesson: {
      id: lesson.id,
      title: lesson.title,
    },
    step: {
      index: stepIndex,
      total: steps.length,
      active: step.box,
      stage: step.stage,
      explanation: step.text,
    },
    request: request
      ? {
          method: request.method,
          path: request.path,
          body: requestBody,
        }
      : undefined,
    response: stepIndex >= 4 ? run.response : null,
    failure: run.failure,
    server: {
      lines: lesson.codeLines,
      activeLine: step.line ?? null,
    },
    databaseRows,
  })

  const question = tutorQuestionFor(lesson, stepIndex, safeTitle, run.failure)
  const choice = term
    ? ({ kind: 'term', term } as const)
    : ({ kind: 'why' } as const)

  return buildPrompt(snapshot, choice, question)
}
