// =====================================================
// EATGO - Carrito
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

function renderCart() {
  const cartList  = document.getElementById('cartList');
  const emptyCart = document.getElementById('emptyCart');
  const cartActions = document.getElementById('cartActions');
  const cart = Storage.getCart();

  updateCartBadge();

  if (cart.length === 0) {
    if (cartList)    cartList.innerHTML = '';
    if (emptyCart)   emptyCart.classList.remove('hidden');
    if (cartActions) cartActions.classList.add('hidden');
    updateSummary([]);
    return;
  }

  if (emptyCart)   emptyCart.classList.add('hidden');
  if (cartActions) cartActions.classList.remove('hidden');

  if (cartList) {
    cartList.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div class="cart-item-img">${item.emoji || '🍽️'}</div>
        <div class="cart-item-info">
          <div class="cart-item-name">${item.nombre}</div>
          <div class="cart-item-price">${Storage.formatPrice(item.precio)}</div>
        </div>
        <div class="qty-controls">
          <button class="qty-btn" onclick="changeQty(${item.id}, ${item.qty - 1})">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty(${item.id}, ${item.qty + 1})">+</button>
        </div>
        <div style="font-weight:800;font-size:14px;color:#8B0000;min-width:70px;text-align:right">
          ${Storage.formatPrice(item.precio * item.qty)}
        </div>
      </div>
    `).join('');
  }

  updateSummary(cart);
}

function updateSummary(cart) {
  const subtotal = cart.reduce((t, i) => t + i.precio * i.qty, 0);
  const domicilio = cart.length > 0 ? 3000 : 0;
  const total = subtotal + domicilio;

  const elSub  = document.getElementById('subtotal');
  const elDom  = document.getElementById('domicilio');
  const elTot  = document.getElementById('total');

  if (elSub) elSub.textContent = Storage.formatPrice(subtotal);
  if (elDom) elDom.textContent = Storage.formatPrice(domicilio);
  if (elTot) elTot.textContent = Storage.formatPrice(total);
}

function changeQty(productId, newQty) {
  Storage.updateCartQty(productId, newQty);
  renderCart();
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  renderCart();
});
