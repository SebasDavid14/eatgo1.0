// =====================================================
// EATGO - Panel Administrador
// =====================================================

function showToast(msg, type = 'success') {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.className = 'toast' + (type === 'success' ? ' success' : '');
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => t.classList.remove('show'), 2500);
}

function adminLogout() {
  Storage.logout();
  window.location.href = 'admin-login.html';
}

// ===== DASHBOARD =====
function initDashboard() {
  const orders   = Storage.getOrders();
  const products = Storage.getProducts();
  const users    = Storage.getUsers().filter(u => u.role !== 'admin');
  const revenue  = orders.reduce((t, o) => t + (o.total || 0), 0);

  const el = (id) => document.getElementById(id);
  if (el('statOrders'))   el('statOrders').textContent   = orders.length;
  if (el('statProducts')) el('statProducts').textContent = products.length;
  if (el('statUsers'))    el('statUsers').textContent    = users.length;
  if (el('statRevenue'))  el('statRevenue').textContent  = Storage.formatPrice(revenue);

  // Recent orders table
  const tbody = document.getElementById('recentOrdersBody');
  if (tbody) {
    const recent = [...orders].reverse().slice(0, 8);
    if (recent.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:#888">Sin pedidos aún</td></tr>';
      return;
    }
    const statusBadge = (s) => {
      const map = { 'Preparando': 'badge-prep', 'En camino': 'badge-camino', 'Entregado': 'badge-entregado', 'Cancelado': 'badge-cancelado' };
      return `<span class="badge ${map[s] || 'badge-prep'}">${s}</span>`;
    };
    tbody.innerHTML = recent.map(o => `
      <tr>
        <td><strong>${o.id}</strong></td>
        <td>${o.userName || 'Cliente'}</td>
        <td>${o.fecha}</td>
        <td>${statusBadge(o.estado)}</td>
        <td><strong>${Storage.formatPrice(o.total)}</strong></td>
      </tr>
    `).join('');
  }

  // Bar chart
  renderChart();
}

function renderChart() {
  const chartEl = document.getElementById('chartBars');
  if (!chartEl) return;
  const orders = Storage.getOrders();
  const categories = Storage.getCategories();
  const countByCategory = {};
  categories.forEach(c => { countByCategory[c] = 0; });
  orders.forEach(o => {
    (o.items || []).forEach(item => {
      if (countByCategory[item.categoria] !== undefined) countByCategory[item.categoria]++;
    });
  });
  const max = Math.max(1, ...Object.values(countByCategory));
  const labels = { hamburguesas:'Hambur.', pizzas:'Pizzas', bebidas:'Bebidas', combos:'Combos', postres:'Postres' };
  chartEl.innerHTML = categories.map(c => `
    <div class="chart-bar" style="height:${Math.round((countByCategory[c]/max)*130)+10}px" title="${labels[c]}: ${countByCategory[c]}">
      <span class="bar-label">${labels[c]}</span>
    </div>
  `).join('');
}

// ===== PRODUCTS =====
let editingProductId = null;

function initProducts() {
  renderProductsTable();
}

function renderProductsTable() {
  const tbody = document.getElementById('productsTableBody');
  if (!tbody) return;
  const products = Storage.getProducts();
  if (products.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:#888">Sin productos</td></tr>';
    return;
  }
  tbody.innerHTML = products.map(p => `
    <tr>
      <td><div class="product-img-cell">${p.emoji || '🍽️'}</div></td>
      <td><strong>${p.nombre}</strong></td>
      <td>${p.categoria}</td>
      <td><strong>${Storage.formatPrice(p.precio)}</strong></td>
      <td><span class="badge ${p.activo ? 'badge-activo' : 'badge-inactivo'}">${p.activo ? 'Activo' : 'Inactivo'}</span></td>
      <td>${p.destacado ? '⭐' : '—'}</td>
      <td>
        <button class="btn-edit" onclick="openEditProduct(${p.id})">✏️ Editar</button>
        <button class="btn-delete" onclick="deleteProduct(${p.id})">🗑️ Eliminar</button>
      </td>
    </tr>
  `).join('');
}

function openAddProduct() {
  editingProductId = null;
  document.getElementById('modalTitle').textContent = 'Nuevo Producto';
  document.getElementById('prodNombre').value = '';
  document.getElementById('prodCategoria').value = 'hamburguesas';
  document.getElementById('prodPrecio').value = '';
  document.getElementById('prodEmoji').value = '🍔';
  document.getElementById('prodDescripcion').value = '';
  document.getElementById('prodDestacado').checked = false;
  document.getElementById('prodModal').classList.add('show');
}

function openEditProduct(id) {
  const p = Storage.getProducts().find(pr => pr.id === id);
  if (!p) return;
  editingProductId = id;
  document.getElementById('modalTitle').textContent = 'Editar Producto';
  document.getElementById('prodNombre').value = p.nombre;
  document.getElementById('prodCategoria').value = p.categoria;
  document.getElementById('prodPrecio').value = p.precio;
  document.getElementById('prodEmoji').value = p.emoji || '';
  document.getElementById('prodDescripcion').value = p.descripcion || '';
  document.getElementById('prodDestacado').checked = p.destacado || false;
  document.getElementById('prodModal').classList.add('show');
}

function closeModal() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('show'));
}

function saveProduct() {
  const nombre      = document.getElementById('prodNombre').value.trim();
  const categoria   = document.getElementById('prodCategoria').value;
  const precio      = parseInt(document.getElementById('prodPrecio').value);
  const emoji       = document.getElementById('prodEmoji').value.trim();
  const descripcion = document.getElementById('prodDescripcion').value.trim();
  const destacado   = document.getElementById('prodDestacado').checked;

  if (!nombre || !precio) { showToast('Completa los campos requeridos', 'error'); return; }

  if (editingProductId) {
    Storage.updateProduct(editingProductId, { nombre, categoria, precio, emoji, descripcion, destacado });
    showToast('Producto actualizado', 'success');
  } else {
    Storage.addProduct({ nombre, categoria, precio, emoji, descripcion, destacado });
    showToast('Producto agregado', 'success');
  }

  closeModal();
  renderProductsTable();
}

function deleteProduct(id) {
  if (!confirm('¿Eliminar este producto?')) return;
  Storage.deleteProduct(id);
  renderProductsTable();
  showToast('Producto eliminado', 'success');
}

// ===== ORDERS (ADMIN) =====
function initAdminOrders() {
  renderAdminOrders();
}

function renderAdminOrders(filter = 'todos') {
  const tbody = document.getElementById('adminOrdersBody');
  if (!tbody) return;
  let orders = [...Storage.getOrders()].reverse();
  if (filter !== 'todos') orders = orders.filter(o => o.estado === filter);

  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:#888">Sin pedidos</td></tr>';
    return;
  }

  const statusBadge = (s) => {
    const map = { 'Preparando': 'badge-prep', 'En camino': 'badge-camino', 'Entregado': 'badge-entregado', 'Cancelado': 'badge-cancelado' };
    return `<span class="badge ${map[s] || 'badge-prep'}">${s}</span>`;
  };

  tbody.innerHTML = orders.map(o => `
    <tr>
      <td><strong>${o.id}</strong></td>
      <td>${o.userName || 'Cliente'}</td>
      <td>${o.fecha} ${o.hora || ''}</td>
      <td>${(o.items || []).length} item(s)</td>
      <td>${statusBadge(o.estado)}</td>
      <td><strong>${Storage.formatPrice(o.total)}</strong></td>
      <td>
        <select onchange="changeOrderStatus('${o.id}', this.value)" style="padding:5px 8px;border-radius:6px;border:2px solid #eee;font-family:Nunito,sans-serif;font-size:11px;font-weight:700;cursor:pointer">
          <option ${o.estado==='Preparando'?'selected':''}>Preparando</option>
          <option ${o.estado==='En camino'?'selected':''}>En camino</option>
          <option ${o.estado==='Entregado'?'selected':''}>Entregado</option>
          <option ${o.estado==='Cancelado'?'selected':''}>Cancelado</option>
        </select>
      </td>
    </tr>
  `).join('');
}

function changeOrderStatus(orderId, status) {
  Storage.updateOrderStatus(orderId, status);
  showToast('Estado actualizado: ' + status, 'success');
}

function filterOrders(status) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  renderAdminOrders(status);
}

// ===== USERS (ADMIN) =====
function initAdminUsers() {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;
  const users = Storage.getUsers().filter(u => u.role !== 'admin');
  if (users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:30px;color:#888">Sin usuarios registrados</td></tr>';
    return;
  }
  tbody.innerHTML = users.map(u => `
    <tr>
      <td>${u.id}</td>
      <td><strong>${u.nombre}</strong></td>
      <td>${u.email}</td>
      <td>${u.telefono || '—'}</td>
      <td>${Storage.getOrders().filter(o => o.userId === u.id).length} pedidos</td>
    </tr>
  `).join('');
}
