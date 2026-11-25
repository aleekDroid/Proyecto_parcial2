import winston from 'winston';
import { trace, logs, SeverityNumber } from '@opentelemetry/api';

const otelLogger = logs.getLogger('proyecto-parcial2-logger');

export function getActiveTraceContext() {
  const activeSpan = trace.getActiveSpan();
  if (!activeSpan) return { traceId: null, spanId: null };
  const spanContext = activeSpan.spanContext();
  return {
    traceId: spanContext.traceId,
    spanId: spanContext.spanId
  };
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

    otelLogger.emit({
      severityNumber: SeverityNumber.INFO,
      severityText: 'INFO',
      body: message,
      attributes: {
        ...payload,
        'log.type': 'application'
      }
    });
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

    otelLogger.emit({
      severityNumber: SeverityNumber.ERROR,
      severityText: 'ERROR',
      body: message,
      attributes: {
        ...payload,
        'log.type': 'exception'
      }
    });
  },

  warn(message, context = {}) {
    const { traceId, spanId } = getActiveTraceContext();
    const payload = { timestamp: new Date().toISOString(), ...context, traceId, spanId };
    winstonLogger.warn(message, payload);

    otelLogger.emit({
      severityNumber: SeverityNumber.WARN,
      severityText: 'WARN',
      body: message,
      attributes: {
        ...payload,
        'log.type': 'warning'
      }
    });
  }
};
