import { trace, SpanStatusCode } from '@opentelemetry/api';
import { logger } from './logger.js';

const tracer = trace.getTracer('db-service');

const mockDatabase = [
  { id: 1, name: 'Servidor EC2 Instance', status: 'Active', category: 'Cloud Infrastructure' },
  { id: 2, name: 'OpenObserve Log Collector', status: 'Active', category: 'Observability' },
  { id: 3, name: 'Playwright E2E Suite', status: 'Active', category: 'Testing' }
];

export async function fetchItemsFromDB() {
  return tracer.startActiveSpan('db.query.fetchItems', async (span) => {
    span.setAttribute('db.system', 'mock_db');
    span.setAttribute('db.operation', 'SELECT');
    span.setAttribute('db.table', 'items');

    try {
      const delay = Math.floor(Math.random() * 50) + 20;
      await new Promise((resolve) => setTimeout(resolve, delay));
      span.setStatus({ code: SpanStatusCode.OK });
      logger.info('Consulta DB ejecutada exitosamente', { count: mockDatabase.length, durationMs: delay });
      return [...mockDatabase];
    } catch (err) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
      span.recordException(err);
      logger.error('Error al realizar consulta en DB', err);
      throw err;
    } finally {
      span.end();
    }
  });
}

export async function addItemToDB(item) {
  return tracer.startActiveSpan('db.query.addItem', async (span) => {
    span.setAttribute('db.system', 'mock_db');
    span.setAttribute('db.operation', 'INSERT');
    span.setAttribute('db.table', 'items');

    try {
      if (!item || !item.name) {
        throw new Error('El nombre del item es obligatorio');
      }

      const newItem = {
        id: mockDatabase.length + 1,
        name: item.name,
        status: item.status || 'Active',
        category: item.category || 'General'
      };

      const delay = Math.floor(Math.random() * 40) + 15;
      await new Promise((resolve) => setTimeout(resolve, delay));
      mockDatabase.push(newItem);

      span.setStatus({ code: SpanStatusCode.OK });
      logger.info('Item insertado en la base de datos', { itemId: newItem.id, itemName: newItem.name });
      return newItem;
    } catch (err) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
      span.recordException(err);
      logger.error('Fallo al insertar en DB', err, { itemInput: item });
      throw err;
    } finally {
      span.end();
    }
  });
}
