import React, { useState, useEffect } from 'react';

export default function UserCrud({ onError }) {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [editingId, setEditingId] = useState(null);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (err) {
      onError('Error al obtener la lista de usuarios');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (editingId) {
      try {
        const res = await fetch(`/api/users/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, role })
        });
        const data = await res.json();
        if (data.success) {
          setEditingId(null);
          setName('');
          setEmail('');
          setPassword('');
          fetchUsers();
        } else {
          onError(data.message || 'Error al actualizar usuario');
        }
      } catch (err) {
        onError('Error de red al actualizar usuario');
      }
    } else {
      try {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, role })
        });
        const data = await res.json();
        if (data.success) {
          setName('');
          setEmail('');
          setPassword('');
          fetchUsers();
        } else {
          onError(data.message || 'Error al crear usuario');
        }
      } catch (err) {
        onError('Error de red al crear usuario');
      }
    }
  };

  const handleEdit = (user) => {
    setEditingId(user.id);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role || 'user');
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      } else {
        onError(data.message || 'Error al eliminar usuario');
      }
    } catch (err) {
      onError('Error de red al eliminar usuario');
    }
  };

  return (
    <div className="card" data-testid="user-crud-card">
      <h2>Gestión CRUD de Usuarios</h2>
      <form onSubmit={handleSave} style={{ marginBottom: '20px' }}>
        <div className="form-group">
          <label htmlFor="user-name">Nombre</label>
          <input id="user-name" data-testid="input-user-name" type="text" value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div className="form-group">
          <label htmlFor="user-email">Correo</label>
          <input id="user-email" data-testid="input-user-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        {!editingId && (
          <div className="form-group">
            <label htmlFor="user-pass">Contraseña</label>
            <input id="user-pass" data-testid="input-user-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
        )}
        <div className="form-group">
          <label htmlFor="user-role">Rol</label>
          <select id="user-role" data-testid="select-user-role" value={role} onChange={e => setRole(e.target.value)}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button type="submit" className="btn btn-success" data-testid="btn-save-user">
          {editingId ? 'Guardar Cambios' : 'Crear Usuario'}
        </button>
        {editingId && (
          <button type="button" className="btn btn-warning" onClick={() => { setEditingId(null); setName(''); setEmail(''); }}>
            Cancelar
          </button>
        )}
      </form>

      <h3>Usuarios Registrados</h3>
      <table data-testid="users-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Rol</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} data-testid={`user-row-${u.id}`}>
              <td>{u.id}</td>
              <td data-testid={`user-name-${u.id}`}>{u.name}</td>
              <td data-testid={`user-email-${u.id}`}>{u.email}</td>
              <td>{u.role}</td>
              <td>
                <button className="btn btn-primary" data-testid={`btn-edit-user-${u.id}`} onClick={() => handleEdit(u)}>Editar</button>
                <button className="btn btn-danger" data-testid={`btn-delete-user-${u.id}`} onClick={() => handleDelete(u.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
