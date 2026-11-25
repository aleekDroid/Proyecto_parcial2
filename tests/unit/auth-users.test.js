import request from 'supertest';
import { app } from '../../src/backend/server.js';
import { hashPassword, comparePassword, generateToken, verifyToken } from '../../src/backend/auth.js';

describe('Pruebas Unitarias - Módulo de Autenticación y Criptografía', () => {

  test('Debe encriptar y verificar contraseñas correctamente con bcrypt', async () => {
    const rawPass = 'SecretPassword123!';
    const hashed = await hashPassword(rawPass);
    expect(hashed).not.toBe(rawPass);
    const matches = await comparePassword(rawPass, hashed);
    expect(matches).toBe(true);
  });

  test('Debe generar y validar un token JWT adecuadamente', () => {
    const userPayload = { id: 100, email: 'unit@test.com', role: 'admin' };
    const token = generateToken(userPayload);
    expect(token).toBeDefined();

    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded.email).toBe('unit@test.com');
  });

});

describe('Pruebas Unitarias - API Backend (Endpoints Auth & Users CRUD)', () => {

  let testUserToken = '';
  const uniqueEmail = `user_unit_${Date.now()}@example.com`;

  test('POST /api/auth/register - Debe registrar un nuevo usuario', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Usuario Jest Unit',
        email: uniqueEmail,
        password: 'PassJest123',
        role: 'user'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(uniqueEmail);
    expect(res.body.token).toBeDefined();
    testUserToken = res.body.token;
  });

  test('POST /api/auth/login - Debe autenticar al usuario creado', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: uniqueEmail,
        password: 'PassJest123'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  test('GET /api/users - Debe obtener la lista de usuarios', async () => {
    const res = await request(app).get('/api/users');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('PUT /api/users/:id - Debe actualizar los datos de un usuario', async () => {
    const res = await request(app)
      .put('/api/users/1')
      .send({
        name: 'Admin Actualizado Jest',
        email: 'admin@example.com',
        role: 'superadmin'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

});
