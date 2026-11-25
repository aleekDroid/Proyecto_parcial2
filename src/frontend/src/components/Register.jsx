import React, { useState } from 'react';

export default function Register({ onRegisterSuccess, onError }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onRegisterSuccess(data);
      } else {
        onError(data.message || 'Error al registrar usuario');
      }
    } catch (err) {
      onError('Error de red al registrar usuario');
    }
  };

  return (
    <div className="card" data-testid="register-card">
      <p className="eyebrow">Nuevo acceso</p>
      <h2>Crear cuenta</h2>
      <p className="card-description">Regístrate para acceder a tu espacio de usuario.</p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="reg-name">Nombre Completo</label>
          <input
            id="reg-name"
            type="text"
            autoComplete="name"
            data-testid="input-register-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="reg-email">Correo Electrónico</label>
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            data-testid="input-register-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="reg-password">Contraseña</label>
          <input
            id="reg-password"
            type="password"
            autoComplete="new-password"
            data-testid="input-register-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" data-testid="btn-register-submit">
          Crear cuenta
        </button>
      </form>
    </div>
  );
}
