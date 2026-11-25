import dotenv from 'dotenv';
dotenv.config();

import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { BatchLogRecordProcessor, LoggerProvider } from '@opentelemetry/sdk-logs';
import { logs, metrics, trace } from '@opentelemetry/api';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';

const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:5080/api/default';
const serviceName = process.env.OTEL_SERVICE_NAME || 'proyecto-parcial2-backend';

function parseHeaders(headersStr) {
  if (!headersStr) return {};
  const headers = {};
  headersStr.split(',').forEach((pair) => {
    const [key, val] = pair.split('=');
    if (key && val) headers[key.trim()] = val.trim();
  });
  return headers;
}

const headers = parseHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS);
if (process.env.OPENOBSERVE_AUTH_TOKEN && !headers['Authorization']) {
  headers['Authorization'] = process.env.OPENOBSERVE_AUTH_TOKEN;
}

const resource = new Resource({
  [ATTR_SERVICE_NAME]: serviceName,
  [ATTR_SERVICE_VERSION]: '1.0.0',
  environment: process.env.NODE_ENV || 'development'
});

const traceExporter = new OTLPTraceExporter({
  url: `${endpoint.replace(/\/$/, '')}/v1/traces`,
  headers
});

const metricExporter = new OTLPMetricExporter({
  url: `${endpoint.replace(/\/$/, '')}/v1/metrics`,
  headers
});

const metricReader = new PeriodicExportingMetricReader({
  exporter: metricExporter,
  exportIntervalMillis: 5000
});

const logExporter = new OTLPLogExporter({
  url: `${endpoint.replace(/\/$/, '')}/v1/logs`,
  headers
});

const loggerProvider = new LoggerProvider({ resource });
loggerProvider.addLogRecordProcessor(new BatchLogRecordProcessor(logExporter));
logs.setGlobalLoggerProvider(loggerProvider);

const sdk = new NodeSDK({
  resource,
  traceExporter,
  metricReader,
  instrumentations: [
    new HttpInstrumentation(),
    new ExpressInstrumentation()
  ]
});

sdk.start();

process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('OTEL SDK shutdown complete'))
    .catch((err) => console.error('Error shutting down OTEL SDK', err))
    .finally(() => process.exit(0));
});

export { sdk, trace, metrics, logs };
