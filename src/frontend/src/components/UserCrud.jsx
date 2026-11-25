import React, { useEffect, useState } from 'react';

export default function UserCrud({ token, onError }) {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const authHeaders = { Authorization: `Bearer ${token}` };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', { headers: authHeaders });
      const data = await res.json();
      if (!res.ok || !data.success) {
        onError(data.message || 'Error al obtener la lista de usuarios');
        return;
      }
      setUsers(data.data);
    } catch (err) {
      onError('Error al obtener la lista de usuarios');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('user');
    setIsFormOpen(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const isEditing = editingId !== null;
    try {
      const res = await fetch(isEditing ? `/api/users/${editingId}` : '/api/users', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(isEditing ? { name, email, role } : { name, email, password, role })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        onError(data.message || (isEditing ? 'Error al actualizar usuario' : 'Error al crear usuario'));
        return;
      }
      onError('');
      resetForm();
      await fetchUsers();
    } catch (err) {
      onError(isEditing ? 'Error de red al actualizar usuario' : 'Error de red al crear usuario');
    }
  };

  const handleEdit = (user) => {
    setEditingId(user.id);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role || 'user');
    setIsFormOpen(true);
    onError('');
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        onError(data.message || 'Error al eliminar usuario');
        return;
      }
      onError('');
      await fetchUsers();
    } catch (err) {
      onError('Error de red al eliminar usuario');
    }
  };

  return (
    <main className="management" data-testid="user-crud-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Administración</p>
          <h2>Usuarios</h2>
          <p className="card-description">Administra las cuentas registradas y sus permisos.</p>
        </div>
        {!isFormOpen && (
          <button className="btn btn-primary" data-testid="btn-open-user-form" onClick={() => setIsFormOpen(true)}>
            Crear usuario
          </button>
        )}
      </div>

      {isFormOpen && (
        <section className="card user-form-card" aria-labelledby="user-form-title">
          <div className="section-heading form-heading">
            <h3 id="user-form-title">{editingId ? 'Editar usuario' : 'Nuevo usuario'}</h3>
            <button type="button" className="text-button" onClick={resetForm}>Cancelar</button>
          </div>
          <form onSubmit={handleSave} className="user-form">
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
                <option value="user">Usuario</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" data-testid="btn-save-user">
                {editingId ? 'Guardar cambios' : 'Crear usuario'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="card users-card" aria-labelledby="users-list-title">
        <div className="section-heading list-heading">
          <div>
            <h3 id="users-list-title">Cuentas registradas</h3>
            <p className="card-description">{users.length} {users.length === 1 ? 'cuenta' : 'cuentas'}</p>
          </div>
        </div>
        {isLoading ? (
          <p className="empty-state">Cargando usuarios...</p>
        ) : users.length === 0 ? (
          <p className="empty-state">Aún no hay cuentas registradas.</p>
        ) : (
          <div className="table-scroll">
            <table data-testid="users-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th><span className="visually-hidden">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} data-testid={`user-row-${u.id}`}>
                    <td data-testid={`user-name-${u.id}`}>{u.name}</td>
                    <td data-testid={`user-email-${u.id}`}>{u.email}</td>
                    <td><span className={`role-label ${u.role === 'admin' ? 'role-admin' : ''}`}>{u.role === 'admin' ? 'Administrador' : 'Usuario'}</span></td>
                    <td className="row-actions">
                      <button className="text-button" data-testid={`btn-edit-user-${u.id}`} onClick={() => handleEdit(u)}>Editar</button>
                      <button className="text-button destructive" data-testid={`btn-delete-user-${u.id}`} onClick={() => handleDelete(u.id)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
