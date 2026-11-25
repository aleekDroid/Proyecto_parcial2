document.addEventListener('DOMContentLoaded', () => {
  const statusEl = document.getElementById('sys-status');
  const itemsListEl = document.getElementById('items-list');
  const itemNameInput = document.getElementById('item-name');
  const btnAddItem = document.getElementById('btn-add-item');
  const btnFetchItems = document.getElementById('btn-fetch-items');
  const btnSimulateError = document.getElementById('btn-simulate-error');
  const errorBox = document.getElementById('error-message');

  function showError(msg) {
    errorBox.style.display = 'block';
    errorBox.textContent = `Error: ${msg}`;
  }

  function clearError() {
    errorBox.style.display = 'none';
    errorBox.textContent = '';
  }

  async function checkHealth() {
    try {
      const res = await fetch('/health');
      const data = await res.json();
      if (data.status === 'UP') {
        statusEl.textContent = 'ONLINE';
        statusEl.style.backgroundColor = '#28a745';
      }
    } catch (err) {
      statusEl.textContent = 'OFFLINE';
      statusEl.style.backgroundColor = '#dc3545';
    }
  }

  async function loadItems() {
    clearError();
    try {
      const res = await fetch('/api/items');
      const result = await res.json();
      if (result.success) {
        itemsListEl.innerHTML = '';
        result.data.forEach((item) => {
          const li = document.createElement('li');
          li.setAttribute('data-testid', `item-row-${item.id}`);
          li.innerHTML = `<strong>${item.name}</strong> <span>[${item.category}]</span>`;
          itemsListEl.appendChild(li);
        });
      }
    } catch (err) {
      showError('No se pudieron obtener los elementos del backend');
    }
  }

  async function addItem() {
    clearError();
    const name = itemNameInput.value.trim();
    if (!name) {
      showError('Por favor ingrese un nombre válido');
      return;
    }

    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category: 'Manual Entry' })
      });
      const result = await res.json();

      if (res.ok && result.success) {
        itemNameInput.value = '';
        await loadItems();
      } else {
        showError(result.message || 'Error al agregar item');
      }
    } catch (err) {
      showError('Error de red al agregar item');
    }
  }

  async function simulateError() {
    clearError();
    try {
      const res = await fetch('/api/error-simulation');
      const result = await res.json();
      if (!res.ok) {
        showError(result.error ? result.error.message : 'Error 500 detectado');
      }
    } catch (err) {
      showError('Fallo en solicitud de simulación de error');
    }
  }

  btnFetchItems.addEventListener('click', loadItems);
  btnAddItem.addEventListener('click', addItem);
  btnSimulateError.addEventListener('click', simulateError);

  checkHealth();
  loadItems();
});
