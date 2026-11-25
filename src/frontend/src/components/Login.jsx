import React, { useState } from 'react';

export default function Login({ onLoginSuccess, onError }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onLoginSuccess(data);
      } else {
        onError(data.message || 'Credenciales inválidas');
      }
    } catch (err) {
      onError('Error de red al iniciar sesión');
    }
  };

  return (
    <div className="card" data-testid="login-card">
      <h2>Iniciar Sesión</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="login-email">Correo Electrónico</label>
          <input
            id="login-email"
            type="email"
            data-testid="input-login-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="login-password">Contraseña</label>
          <input
            id="login-password"
            type="password"
            data-testid="input-login-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" data-testid="btn-login-submit">
          Ingresar al Sistema
        </button>
      </form>
    </div>
  );
}
