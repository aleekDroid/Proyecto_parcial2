import React, { useState } from 'react';

export default function Register({ onRegisterSuccess, onError }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
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
      <h2>Registro de Usuario</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="reg-name">Nombre Completo</label>
          <input
            id="reg-name"
            type="text"
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
            data-testid="input-register-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="reg-role">Rol de Usuario</label>
          <select id="reg-role" data-testid="select-register-role" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="user">Usuario Standard</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        <button type="submit" className="btn btn-success" data-testid="btn-register-submit">
          Registrar Usuario
        </button>
      </form>
    </div>
  );
}
