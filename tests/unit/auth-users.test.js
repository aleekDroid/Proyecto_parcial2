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
        role: 'admin'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(uniqueEmail);
    expect(res.body.user.role).toBe('user');
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

  test('GET /api/users - Debe impedir el acceso sin sesión o con rol de usuario', async () => {
    const anonymousRes = await request(app).get('/api/users');
    expect(anonymousRes.statusCode).toBe(401);

    const userRes = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${testUserToken}`);
    expect(userRes.statusCode).toBe(403);
  });

  test('POST /api/users - Debe impedir que un usuario cree cuentas', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({ name: 'No autorizado', email: 'blocked@example.com', password: 'Password123' });

    expect(res.statusCode).toBe(403);
  });

  test('PUT /api/users/:id - Debe actualizar los datos de un usuario', async () => {
    const res = await request(app)
      .put('/api/users/1')
      .set('Authorization', `Bearer ${generateToken({ id: 1, email: 'admin@example.com', role: 'admin' })}`)
      .send({
        name: 'Admin Actualizado Jest',
        email: 'admin@example.com',
        role: 'user'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

});
