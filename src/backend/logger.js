import winston from 'winston';
import otelApi from '@opentelemetry/api';
const { trace, logs } = otelApi;

const SeverityNumber = {
  INFO: 9,
  WARN: 13,
  ERROR: 17
};

function safeEmitOtelLog(severityNumber, severityText, body, attributes) {
  try {
    if (logs && typeof logs.getLogger === 'function') {
      const otelLogger = logs.getLogger('proyecto-parcial2-logger');
      if (otelLogger && typeof otelLogger.emit === 'function') {
        otelLogger.emit({
          severityNumber,
          severityText,
          body,
          attributes
        });
      }
    }
  } catch (err) {
    // Fail-safe for OTEL log emission
  }
}

export function getActiveTraceContext() {
  try {
    if (trace && typeof trace.getActiveSpan === 'function') {
      const activeSpan = trace.getActiveSpan();
      if (activeSpan) {
        const spanContext = activeSpan.spanContext();
        return {
          traceId: spanContext.traceId,
          spanId: spanContext.spanId
        };
      }
    }
  } catch (err) {
    // Fail-safe trace context lookup
  }
  return { traceId: null, spanId: null };
}

const winstonLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

export const logger = {
  info(message, context = {}) {
    const { traceId, spanId } = getActiveTraceContext();
    const payload = { timestamp: new Date().toISOString(), ...context, traceId, spanId };
    winstonLogger.info(message, payload);
    safeEmitOtelLog(SeverityNumber.INFO, 'INFO', message, { ...payload, 'log.type': 'application' });
  },

  error(message, errorOrContext = {}, extraContext = {}) {
    const { traceId, spanId } = getActiveTraceContext();
    const errorDetails = errorOrContext instanceof Error ? {
      errorName: errorOrContext.name,
      errorMessage: errorOrContext.message,
      stack: errorOrContext.stack
    } : errorOrContext;

    const payload = {
      timestamp: new Date().toISOString(),
      ...errorDetails,
      ...extraContext,
      traceId,
      spanId
    };

    winstonLogger.error(message, payload);
    safeEmitOtelLog(SeverityNumber.ERROR, 'ERROR', message, { ...payload, 'log.type': 'exception' });
  },

  warn(message, context = {}) {
    const { traceId, spanId } = getActiveTraceContext();
    const payload = { timestamp: new Date().toISOString(), ...context, traceId, spanId };
    winstonLogger.warn(message, payload);
    safeEmitOtelLog(SeverityNumber.WARN, 'WARN', message, { ...payload, 'log.type': 'warning' });
  }
};
