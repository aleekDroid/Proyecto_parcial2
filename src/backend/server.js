import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import otelApi from '@opentelemetry/api';
const { metrics } = otelApi;

import { logger } from './logger.js';
import { fetchItemsFromDB, addItemToDB } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const meter = metrics.getMeter('proyecto-parcial2-backend-meter');

const httpRequestDuration = meter.createHistogram('http_request_duration_seconds', {
  description: 'Latencia y tiempo de respuesta de peticiones HTTP',
  unit: 's'
});

const httpRequestsCounter = meter.createCounter('http_requests_total', {
  description: 'Peticiones por segundo y total de peticiones recibidas'
});

const httpErrorsCounter = meter.createCounter('http_errors_total', {
  description: 'Tasa de errores HTTP por endpoint y status code'
});

app.use((req, res, next) => {
  const startTime = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(startTime);
    const durationInSeconds = diff[0] + diff[1] / 1e9;
    const route = req.route ? req.route.path : req.path;
    const statusCode = res.statusCode;

    const attributes = {
      'http.method': req.method,
      'http.route': route,
      'http.status_code': statusCode
    };

    httpRequestDuration.record(durationInSeconds, attributes);
    httpRequestsCounter.add(1, attributes);

    if (statusCode >= 400) {
      httpErrorsCounter.add(1, attributes);
      logger.warn(`Petición fallida HTTP ${statusCode}`, {
        method: req.method,
        path: req.path,
        statusCode,
        durationInSeconds
      });
    } else {
      logger.info(`Petición HTTP exitosa ${req.method} ${req.path}`, {
        method: req.method,
        path: req.path,
        statusCode,
        durationInSeconds
      });
    }
  });

  next();
});

app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

app.get('/api/items', async (req, res, next) => {
  try {
    const items = await fetchItemsFromDB();
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
});

app.post('/api/items', async (req, res, next) => {
  try {
    const newItem = await addItemToDB(req.body);
    res.status(201).json({ success: true, data: newItem });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.get('/api/error-simulation', (req, res, next) => {
  const error = new Error('Simulación intencional de falla interna en backend');
  error.statusCode = 500;
  next(error);
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  logger.error('Excepción no controlada en endpoint HTTP', err, {
    method: req.method,
    url: req.url,
    statusCode
  });

  res.status(statusCode).json({
    success: false,
    error: {
      message: err.message || 'Error interno del servidor',
      statusCode,
      timestamp: new Date().toISOString()
    }
  });
});

app.listen(PORT, () => {
  logger.info(`Servidor iniciado y escuchando en puerto ${PORT}`, { port: PORT, env: process.env.NODE_ENV });
});
