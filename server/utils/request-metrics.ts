import { getRequestURL, type H3Event } from 'h3'
import { randomUUID } from 'node:crypto'

export interface RequestMetrics {
  requestId: string
  route: string
  startedAt: number
  totalMs: number
  dbMs: number
  storageMs: number
  modelMs: number
  signUrlMs: number
  responseBytes: number
  messageCount: number
  attachmentCount: number
}

type DurationMetricKey = 'dbMs' | 'storageMs' | 'modelMs' | 'signUrlMs'
type CountMetricKey = 'messageCount' | 'attachmentCount'

function now() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now()
}

function getMetrics(event: H3Event) {
  return event.context.requestMetrics ?? null
}

export function initializeRequestMetrics(event: H3Event) {
  if (event.context.requestMetrics) {
    return event.context.requestMetrics
  }

  const metrics: RequestMetrics = {
    requestId: randomUUID(),
    route: getRequestURL(event).pathname,
    startedAt: now(),
    totalMs: 0,
    dbMs: 0,
    storageMs: 0,
    modelMs: 0,
    signUrlMs: 0,
    responseBytes: 0,
    messageCount: 0,
    attachmentCount: 0
  }

  event.context.requestMetrics = metrics
  return metrics
}

export function incrementRequestMetric(event: H3Event | undefined, key: DurationMetricKey, deltaMs: number) {
  if (!event) {
    return
  }

  const metrics = getMetrics(event)

  if (!metrics) {
    return
  }

  metrics[key] += deltaMs
}

export function incrementCountMetric(event: H3Event | undefined, key: CountMetricKey, delta: number) {
  if (!event) {
    return
  }

  const metrics = getMetrics(event)

  if (!metrics) {
    return
  }

  metrics[key] += delta
}

export async function measureRequestMetric<T>(
  event: H3Event | undefined,
  key: DurationMetricKey,
  task: () => Promise<T> | T
) {
  if (!event) {
    return task()
  }

  const startedAt = now()

  try {
    return await task()
  }
  finally {
    incrementRequestMetric(event, key, now() - startedAt)
  }
}

export function setResponseBytes(event: H3Event | undefined, payload: unknown) {
  if (!event) {
    return
  }

  const metrics = getMetrics(event)

  if (!metrics) {
    return
  }

  metrics.responseBytes = Buffer.byteLength(JSON.stringify(payload))
}

export function finalizeRequestMetrics(event: H3Event) {
  const metrics = getMetrics(event)

  if (!metrics) {
    return null
  }

  metrics.totalMs = now() - metrics.startedAt
  return metrics
}
