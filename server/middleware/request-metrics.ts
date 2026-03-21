import { setResponseHeader } from 'h3'
import { finalizeRequestMetrics, initializeRequestMetrics } from '../utils/request-metrics'

export default defineEventHandler((event) => {
  const metrics = initializeRequestMetrics(event)

  setResponseHeader(event, 'x-request-id', metrics.requestId)

  event.node.res.on('finish', () => {
    const finalized = finalizeRequestMetrics(event)

    if (!finalized) {
      return
    }

    console.info('[polarGPT] request.metrics', finalized)
  })
})
