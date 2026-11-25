import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import otelApi from '@opentelemetry/api';
const { metrics } = otelApi;

import { logger } from './logger.js';
import { comparePassword, generateToken, authMiddleware, adminMiddleware } from './auth.js';
import { getAllUsers, getUserByEmail, createUser, updateUser, deleteUser } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
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
      logger.warn(`Petición fallida HTTP ${statusCode}`, { method: req.method, path: req.path, statusCode, durationInSeconds });
    } else {
      logger.info(`Petición HTTP exitosa ${req.method} ${req.path}`, { method: req.method, path: req.path, statusCode, durationInSeconds });
    }
  });

  next();
});

const staticDistPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(staticDistPath)) {
  app.use(express.static(staticDistPath));
} else {
  app.use(express.static(path.join(__dirname, '../frontend')));
}

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

app.post('/api/auth/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Nombre, email y contraseña son obligatorios' });
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'El correo electrónico ya está registrado' });
    }

    const newUser = await createUser({ name, email, password, role: 'user' });
    const token = generateToken(newUser);
    logger.info('Usuario registrado exitosamente', { userId: newUser.id, email: newUser.email });
    res.status(201).json({ success: true, user: newUser, token });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email y contraseña requeridos' });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    const token = generateToken(user);
    const { password: p, ...userWithoutPass } = user;
    logger.info('Inicio de sesión exitoso', { userId: user.id, email: user.email });
    res.status(200).json({ success: true, user: userWithoutPass, token });
  } catch (error) {
    next(error);
  }
});

app.use('/api/users', authMiddleware, adminMiddleware);

app.get('/api/users', async (req, res, next) => {
  try {
    const users = await getAllUsers();
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
});

app.post('/api/users', async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Datos incompletos para crear usuario' });
    }
    if (role && !['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Rol de usuario inválido' });
    }
    const newUser = await createUser({ name, email, password, role });
    res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.put('/api/users/:id', async (req, res, next) => {
  try {
    const { name, email, role } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Nombre y correo son obligatorios' });
    }
    if (role && !['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Rol de usuario inválido' });
    }
    const updated = await updateUser(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/users/:id', async (req, res, next) => {
  try {
    const deleted = await deleteUser(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    res.status(200).json({ success: true, message: 'Usuario eliminado correctamente' });
  } catch (error) {
    next(error);
  }
});

app.get('/api/error-simulation', (req, res, next) => {
  const error = new Error('Simulación intencional de falla interna en backend');
  error.statusCode = 500;
  next(error);
});

app.get('*', (req, res) => {
  const indexHtml = fs.existsSync(staticDistPath)
    ? path.join(staticDistPath, 'index.html')
    : path.join(__dirname, '../frontend/index.html');
  res.sendFile(indexHtml);
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  logger.error('Excepción no controlada en endpoint HTTP', err, { method: req.method, url: req.url, statusCode });

  res.status(statusCode).json({
    success: false,
    error: {
      message: err.message || 'Error interno del servidor',
      statusCode,
      timestamp: new Date().toISOString()
    }
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`Servidor iniciado y escuchando en puerto ${PORT}`, { port: PORT, env: process.env.NODE_ENV });
  });
}
