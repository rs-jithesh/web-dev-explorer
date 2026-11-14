import type { Run } from '../engine/server.ts'
import type { Task } from '../engine/types'
import { buildPrompt, buildSnapshot } from '../engine/tutor.ts'
import {
  DEFAULT_TITLE,
  TUTOR_QUESTIONS,
  V2_CODE_LINES,
  V2_LESSON,
  storySteps,
} from './content.ts'

/**
 * The v2 prompt is still built by the shared tutor engine. This adapter only
 * supplies the current story step, request and evidence to the existing pure
 * snapshot/prompt builder.
 */
export function v2Prompt(
  stepIndex: number,
  title: string,
  run: Run,
  tasksBefore: Task[],
): string {
  const safeTitle = title.trim() || DEFAULT_TITLE
  const steps = storySteps(safeTitle)
  const step = steps[Math.max(0, Math.min(stepIndex, steps.length - 1))]
  const tasks = stepIndex >= 3 ? run.tasksAfter : tasksBefore

  const snapshot = buildSnapshot({
    lesson: {
      id: V2_LESSON.id,
      title: V2_LESSON.title,
    },
    step: {
      index: stepIndex,
      total: steps.length,
      active: step.box,
      stage: step.stage,
      explanation: step.text,
    },
    request: {
      method: 'POST',
      path: '/tasks',
      body: JSON.stringify({ title: safeTitle }, null, 2),
    },
    response: stepIndex >= 4 ? run.response : null,
    failure: run.failure,
    server: {
      lines: V2_CODE_LINES,
      activeLine: step.line ?? null,
    },
    databaseRows: tasks,
  })

  const question = TUTOR_QUESTIONS[stepIndex].replace('{title}', safeTitle)
  return buildPrompt(snapshot, { kind: 'why' }, question)
}
