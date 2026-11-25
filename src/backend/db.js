import pg from 'pg';
import otelApi from '@opentelemetry/api';
const { trace, SpanStatusCode } = otelApi;
import { logger } from './logger.js';
import { hashPassword } from './auth.js';

const tracer = trace.getTracer('db-service');

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || `postgres://${process.env.POSTGRES_USER || 'postgres'}:${process.env.POSTGRES_PASSWORD || 'postgres'}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || 5432}/${process.env.POSTGRES_DB || 'proyecto_parcial2'}`,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

let isPgAvailable = false;
let memoryUsers = [];

export async function initDB() {
  return tracer.startActiveSpan('db.init', async (span) => {
    span.setAttribute('db.system', 'postgresql');
    span.setAttribute('db.operation', 'CREATE_TABLE');

    try {
      const client = await pool.connect();
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'user',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      const defaultPass = await hashPassword('admin123');
      await client.query(`
        INSERT INTO users (name, email, password, role)
        VALUES ('Admin System', 'admin@example.com', $1, 'admin')
        ON CONFLICT (email) DO NOTHING;
      `, [defaultPass]);

      client.release();
      isPgAvailable = true;
      span.setStatus({ code: SpanStatusCode.OK });
      logger.info('Base de datos PostgreSQL inicializada exitosamente');
    } catch (err) {
      isPgAvailable = false;
      span.setStatus({ code: SpanStatusCode.OK, message: 'Fallback to memory store' });
      logger.warn('PostgreSQL no disponible. Usando almacenamiento en memoria con soporte OTEL', { error: err.message });
      if (memoryUsers.length === 0) {
        const pass = await hashPassword('admin123');
        memoryUsers.push({ id: 1, name: 'Admin System', email: 'admin@example.com', password: pass, role: 'admin', created_at: new Date() });
      }
    } finally {
      span.end();
    }
  });
}

export async function getAllUsers() {
  return tracer.startActiveSpan('db.query.getAllUsers', async (span) => {
    span.setAttribute('db.system', 'postgresql');
    span.setAttribute('db.operation', 'SELECT');
    span.setAttribute('db.table', 'users');

    try {
      if (isPgAvailable) {
        const res = await pool.query('SELECT id, name, email, role, created_at FROM users ORDER BY id ASC');
        span.setStatus({ code: SpanStatusCode.OK });
        return res.rows;
      } else {
        span.setStatus({ code: SpanStatusCode.OK });
        return memoryUsers.map(({ password, ...u }) => u);
      }
    } catch (err) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
      span.recordException(err);
      throw err;
    } finally {
      span.end();
    }
  });
}

export async function getUserByEmail(email) {
  return tracer.startActiveSpan('db.query.getUserByEmail', async (span) => {
    span.setAttribute('db.system', 'postgresql');
    span.setAttribute('db.operation', 'SELECT');
    span.setAttribute('db.table', 'users');

    try {
      if (isPgAvailable) {
        const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        span.setStatus({ code: SpanStatusCode.OK });
        return res.rows[0] || null;
      } else {
        const user = memoryUsers.find(u => u.email === email);
        span.setStatus({ code: SpanStatusCode.OK });
        return user ? { ...user } : null;
      }
    } catch (err) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
      span.recordException(err);
      throw err;
    } finally {
      span.end();
    }
  });
}

export async function createUser(user) {
  return tracer.startActiveSpan('db.query.createUser', async (span) => {
    span.setAttribute('db.system', 'postgresql');
    span.setAttribute('db.operation', 'INSERT');
    span.setAttribute('db.table', 'users');

    try {
      const hashedPassword = await hashPassword(user.password);
      const role = user.role || 'user';

      if (isPgAvailable) {
        const res = await pool.query(
          'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
          [user.name, user.email, hashedPassword, role]
        );
        span.setStatus({ code: SpanStatusCode.OK });
        return res.rows[0];
      } else {
        const newUser = {
          id: memoryUsers.length + 1,
          name: user.name,
          email: user.email,
          password: hashedPassword,
          role,
          created_at: new Date()
        };
        memoryUsers.push(newUser);
        span.setStatus({ code: SpanStatusCode.OK });
        const { password, ...result } = newUser;
        return result;
      }
    } catch (err) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
      span.recordException(err);
      throw err;
    } finally {
      span.end();
    }
  });
}

export async function updateUser(id, data) {
  return tracer.startActiveSpan('db.query.updateUser', async (span) => {
    span.setAttribute('db.system', 'postgresql');
    span.setAttribute('db.operation', 'UPDATE');
    span.setAttribute('db.table', 'users');

    try {
      if (isPgAvailable) {
        const res = await pool.query(
          'UPDATE users SET name = $1, email = $2, role = $3 WHERE id = $4 RETURNING id, name, email, role, created_at',
          [data.name, data.email, data.role || 'user', id]
        );
        span.setStatus({ code: SpanStatusCode.OK });
        return res.rows[0] || null;
      } else {
        const index = memoryUsers.findIndex(u => u.id === Number(id));
        if (index === -1) return null;
        memoryUsers[index] = { ...memoryUsers[index], name: data.name, email: data.email, role: data.role || memoryUsers[index].role };
        span.setStatus({ code: SpanStatusCode.OK });
        const { password, ...result } = memoryUsers[index];
        return result;
      }
    } catch (err) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
      span.recordException(err);
      throw err;
    } finally {
      span.end();
    }
  });
}

export async function deleteUser(id) {
  return tracer.startActiveSpan('db.query.deleteUser', async (span) => {
    span.setAttribute('db.system', 'postgresql');
    span.setAttribute('db.operation', 'DELETE');
    span.setAttribute('db.table', 'users');

    try {
      if (isPgAvailable) {
        const res = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
        span.setStatus({ code: SpanStatusCode.OK });
        return res.rowCount > 0;
      } else {
        const index = memoryUsers.findIndex(u => u.id === Number(id));
        if (index === -1) return false;
        memoryUsers.splice(index, 1);
        span.setStatus({ code: SpanStatusCode.OK });
        return true;
      }
    } catch (err) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
      span.recordException(err);
      throw err;
    } finally {
      span.end();
    }
  });
}

initDB().catch(err => logger.error('Error al inicializar DB', err));
