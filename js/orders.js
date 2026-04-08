// =====================================================
// EATGO - Pedidos
// =====================================================

function showToast(msg, type = 'success') {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.className = 'toast' + (type === 'success' ? ' success' : '');
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => t.classList.remove('show'), 2500);
}

function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  if (badge) badge.textContent = Storage.getCartCount();
}

// ---- CONFIRM ORDER ----
function initConfirmPage() {
  updateCartBadge();
  const cart = Storage.getCart();
  if (cart.length === 0) { window.location.href = 'cart.html'; return; }

  const orderList = document.getElementById('orderItemsList');
  if (orderList) {
    orderList.innerHTML = cart.map(item => `
      <div class="order-item-row">
        <div class="order-item-img">${item.emoji || '🍽️'}</div>
        <div class="order-item-info">
          <div class="order-item-name">${item.nombre}</div>
          <div class="order-item-qty">x${item.qty}</div>
        </div>
        <div class="order-item-total">${Storage.formatPrice(item.precio * item.qty)}</div>
      </div>
    `).join('');
  }

  const subtotal  = Storage.getCartTotal();
  const domicilio = 3000;
  const total     = subtotal + domicilio;

  const elSub = document.getElementById('confirmSubtotal');
  const elDom = document.getElementById('confirmDomicilio');
  const elTot = document.getElementById('confirmTotal');
  if (elSub) elSub.textContent = Storage.formatPrice(subtotal);
  if (elDom) elDom.textContent = Storage.formatPrice(domicilio);
  if (elTot) elTot.textContent = Storage.formatPrice(total);
}

function placeOrder() {
  const user = Storage.getCurrentUser();
  if (!user) { window.location.href = 'index.html'; return; }

  const payMethod = document.querySelector('input[name="pago"]:checked');
  const direccion = document.getElementById('direccion');

  if (!payMethod) { showToast('Selecciona un método de pago', 'error'); return; }
  if (direccion && !direccion.value.trim()) { showToast('Ingresa la dirección de entrega', 'error'); return; }

  const order = Storage.createOrder({
    metodoPago: payMethod.value,
    direccion: direccion ? direccion.value : ''
  });

  Storage.setCurrentOrder(order);
  showToast('¡Pedido confirmado!', 'success');
  setTimeout(() => { window.location.href = 'order-status.html'; }, 800);
}

// ---- ORDER STATUS ----
function initStatusPage() {
  updateCartBadge();
  const order = Storage.getCurrentOrder();
  if (!order) { window.location.href = 'my-orders.html'; return; }

  const elOrderId = document.getElementById('statusOrderId');
  if (elOrderId) elOrderId.textContent = 'Pedido ' + order.id;

  const statuses = ['Preparando', 'En camino', 'Entregado'];
  const currentIdx = statuses.indexOf(order.estado);

  const steps = document.querySelectorAll('.step-circle');
  const lines = document.querySelectorAll('.step-line');
  const labels = document.querySelectorAll('.step-label');

  steps.forEach((step, i) => {
    if (i < currentIdx) { step.classList.add('done'); }
    else if (i === currentIdx) { step.classList.add('active'); labels[i].classList.add('active'); }
  });

  lines.forEach((line, i) => {
    if (i < currentIdx) line.classList.add('done');
  });

  // Simular actualización de estado
  if (order.estado !== 'Entregado') {
    const nextIdx = Math.min(currentIdx + 1, statuses.length - 1);
    setTimeout(() => {
      Storage.updateOrderStatus(order.id, statuses[nextIdx]);
      const updatedOrder = Storage.getOrderById(order.id);
      Storage.setCurrentOrder(updatedOrder);
    }, 5000);
  }
}

// ---- MY ORDERS ----
function initMyOrdersPage() {
  updateCartBadge();
  const orders = Storage.getUserOrders().reverse();
  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;

  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:#888;font-weight:700">No tienes pedidos aún</td></tr>';
    return;
  }

  const statusBadge = (s) => {
    const map = { 'Preparando': 'badge-prep', 'En camino': 'badge-camino', 'Entregado': 'badge-entregado', 'Cancelado': 'badge-cancelado' };
    return `<span class="badge ${map[s] || 'badge-prep'}">${s}</span>`;
  };

  tbody.innerHTML = orders.map(o => `
    <tr>
      <td><strong>${o.id}</strong></td>
      <td>${o.fecha}</td>
      <td>${(o.items || []).map(i => i.nombre).join(', ').substring(0, 30)}${(o.items||[]).length > 1 ? '...' : ''}</td>
      <td>${statusBadge(o.estado)}</td>
      <td><strong>${Storage.formatPrice(o.total)}</strong></td>
      <td>
        ${o.estado !== 'Entregado' ? `<a class="btn-track" onclick="trackOrder('${o.id}')">📍 Seguir</a>` : ''}
        <a class="btn-view" onclick="viewOrder('${o.id}')">Ver</a>
      </td>
    </tr>
  `).join('');
}

function trackOrder(orderId) {
  const order = Storage.getOrderById(orderId);
  if (order) { Storage.setCurrentOrder(order); window.location.href = 'order-status.html'; }
}

function viewOrder(orderId) {
  const order = Storage.getOrderById(orderId);
  if (!order) return;
  const items = (order.items || []).map(i => `• ${i.nombre} x${i.qty} - ${Storage.formatPrice(i.precio * i.qty)}`).join('\n');
  alert(`PEDIDO: ${order.id}\nFecha: ${order.fecha}\nEstado: ${order.estado}\nTotal: ${Storage.formatPrice(order.total)}\n\nProductos:\n${items}`);
}
