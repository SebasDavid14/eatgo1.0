// =====================================================
// EATGO - Menú
// =====================================================

let currentCategory = 'todos';

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

function renderProducts(cat = 'todos') {
  const grid = document.getElementById('foodGrid');
  if (!grid) return;
  let products = Storage.getProducts().filter(p => p.activo);
  if (cat !== 'todos') products = products.filter(p => p.categoria === cat);

  if (products.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#888;font-weight:700">No hay productos en esta categoría</div>';
    return;
  }

  grid.innerHTML = products.map(p => `
    <div class="food-card">
      <div class="food-card-img-placeholder">${p.emoji || '🍽️'}</div>
      <div class="food-card-body">
        <div>
          <span class="food-name">${p.nombre}</span>
          <span class="food-price">${Storage.formatPrice(p.precio)}</span>
        </div>
        <button class="btn-add" onclick="addToCart(${p.id})" title="Agregar al carrito">+</button>
      </div>
    </div>
  `).join('');
}

function addToCart(productId) {
  const product = Storage.getProducts().find(p => p.id === productId);
  if (!product) return;
  Storage.addToCart(product);
  updateCartBadge();
  showToast('✓ ' + product.nombre + ' agregado al carrito');
}

function filterCategory(cat) {
  currentCategory = cat;
  document.querySelectorAll('.sidebar-item').forEach(el => {
    el.classList.toggle('active', el.dataset.cat === cat);
  });
  renderProducts(cat);
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  renderProducts('todos');

  document.querySelectorAll('.sidebar-item').forEach(el => {
    el.addEventListener('click', () => filterCategory(el.dataset.cat));
  });
});
