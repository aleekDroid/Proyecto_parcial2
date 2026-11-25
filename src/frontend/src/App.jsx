import React, { useState, useEffect } from 'react';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import UserCrud from './components/UserCrud.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('login');
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
        setTab('crud');
      } catch (err) {
        localStorage.clear();
      }
    }
  }, []);

  const handleAuthSuccess = (data) => {
    setUser(data.user);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setErrorMessage('');
    setTab('crud');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setTab('login');
  };

  const handleSimulateError = async () => {
    setErrorMessage('');
    try {
      const res = await fetch('/api/error-simulation');
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error ? data.error.message : 'Error 500 detectado');
      }
    } catch (err) {
      setErrorMessage('Fallo al simular error en backend');
    }
  };

  return (
    <div className="container">
      <div className="header-bar">
        <h1>Proyecto Parcial 2 - React & PostgreSQL</h1>
        <div>
          Estado: <span className={`status-badge ${sysStatus === 'ONLINE' ? 'status-online' : 'status-offline'}`} data-testid="sys-status">{sysStatus}</span>
        </div>
      </div>

      <div className="nav-tabs">
        {!user ? (
          <>
            <button className={`btn ${tab === 'login' ? 'btn-primary' : ''}`} data-testid="tab-login" onClick={() => setTab('login')}>
              Iniciar Sesión
            </button>
            <button className={`btn ${tab === 'register' ? 'btn-primary' : ''}`} data-testid="tab-register" onClick={() => setTab('register')}>
              Registrarse
            </button>
          </>
        ) : (
          <>
            <span style={{ fontWeight: 'bold', alignSelf: 'center' }} data-testid="user-welcome">
              Hola, {user.name} ({user.role})
            </span>
            <button className="btn btn-primary" data-testid="tab-crud" onClick={() => setTab('crud')}>
              CRUD Usuarios
            </button>
            <button className="btn btn-danger" data-testid="btn-logout" onClick={handleLogout}>
              Cerrar Sesión
            </button>
          </>
        )}
        <button className="btn btn-danger" data-testid="btn-simulate-error" onClick={handleSimulateError} style={{ marginLeft: 'auto' }}>
          Simular Error (500)
        </button>
      </div>

      {errorMessage && (
        <div className="error-box" data-testid="error-message">
          Error: {errorMessage}
        </div>
      )}

      {!user && tab === 'login' && <Login onLoginSuccess={handleAuthSuccess} onError={setErrorMessage} />}
      {!user && tab === 'register' && <Register onRegisterSuccess={handleAuthSuccess} onError={setErrorMessage} />}
      {tab === 'crud' && <UserCrud onError={setErrorMessage} />}
    </div>
  );
}
