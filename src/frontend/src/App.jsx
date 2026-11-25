import React, { useState, useEffect } from 'react';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import UserCrud from './components/UserCrud.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('login');
  const [token, setToken] = useState('');
  const [sysStatus, setSysStatus] = useState('Cargando...');
  const [errorMessage, setErrorMessage] = useState('');

  const checkHealth = async () => {
    try {
      const res = await fetch('/health');
      const data = await res.json();
      if (data.status === 'UP') {
        setSysStatus('ONLINE');
      } else {
        setSysStatus('OFFLINE');
      }
    } catch (err) {
      setSysStatus('OFFLINE');
    }
  };

  useEffect(() => {
    checkHealth();
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        setToken(token);
        setTab('home');
      } catch (err) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  const handleAuthSuccess = (data) => {
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setErrorMessage('');
    setTab('home');
  };

  const handleLogout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setTab('login');
  };

  return (
    <div className="container">
      <div className="header-bar">
        <div className="brand">
          <span className="brand-kicker">Proyecto parcial 2</span>
          <h1>Gestión de usuarios</h1>
        </div>
        <div className="system-status">
          <span className="status-label">Sistema</span>
          <span className={`status-badge ${sysStatus === 'ONLINE' ? 'status-online' : 'status-offline'}`} data-testid="sys-status">{sysStatus}</span>
        </div>
      </div>

      <div className="nav-tabs">
        {!user ? (
          <div className="auth-nav" aria-label="Acceso">
            <button className={`nav-link ${tab === 'login' ? 'active' : ''}`} data-testid="tab-login" onClick={() => { setErrorMessage(''); setTab('login'); }}>
              Iniciar sesión
            </button>
            <button className={`nav-link ${tab === 'register' ? 'active' : ''}`} data-testid="tab-register" onClick={() => { setErrorMessage(''); setTab('register'); }}>
              Crear cuenta
            </button>
          </div>
        ) : (
          <div className="user-nav">
            <span className="user-identity" data-testid="user-welcome">
              <span className="user-name">{user.name}</span>
              <span className="user-role">{user.role === 'admin' ? 'Administrador' : 'Usuario'}</span>
            </span>
            {user.role === 'admin' && (
              <button className={`nav-link ${tab === 'crud' ? 'active' : ''}`} data-testid="tab-crud" onClick={() => { setErrorMessage(''); setTab(tab === 'crud' ? 'home' : 'crud'); }}>
                {tab === 'crud' ? 'Volver al inicio' : 'Administrar usuarios'}
              </button>
            )}
            <button className="nav-link logout-link" data-testid="btn-logout" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="error-box" role="alert" data-testid="error-message">
          Error: {errorMessage}
        </div>
      )}

      {!user && tab === 'login' && <Login onLoginSuccess={handleAuthSuccess} onError={setErrorMessage} />}
      {!user && tab === 'register' && <Register onRegisterSuccess={handleAuthSuccess} onError={setErrorMessage} />}
      {user && tab === 'home' && (
        <main className="welcome-panel" data-testid="dashboard">
          <p className="eyebrow">{user.role === 'admin' ? 'Administración' : 'Tu espacio'}</p>
          <h2>Hola, {user.name}</h2>
          <p>{user.role === 'admin'
            ? 'Desde aquí puedes administrar las cuentas y sus permisos.'
            : 'Tu cuenta está lista. Las herramientas de administración están reservadas para el equipo administrador.'}</p>
        </main>
      )}
      {user?.role === 'admin' && tab === 'crud' && <UserCrud token={token} onError={setErrorMessage} />}
    </div>
  );
}
