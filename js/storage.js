// =====================================================
// EATGO - Storage (Persistencia con localStorage)
// =====================================================

const Storage = {
  // ---- USUARIOS ----
  getUsers() {
    return JSON.parse(localStorage.getItem('eatgo_users') || '[]');
  },
  saveUsers(users) {
    localStorage.setItem('eatgo_users', JSON.stringify(users));
  },
  addUser(user) {
    const users = this.getUsers();
    user.id = Date.now();
    user.role = 'cliente';
    users.push(user);
    this.saveUsers(users);
    return user;
  },
  getUserByEmail(email) {
    return this.getUsers().find(u => u.email === email);
  },

  // ---- SESION ----
  setCurrentUser(user) {
    localStorage.setItem('eatgo_current_user', JSON.stringify(user));
  },
  getCurrentUser() {
    return JSON.parse(localStorage.getItem('eatgo_current_user') || 'null');
  },
  logout() {
    localStorage.removeItem('eatgo_current_user');
  },
  requireAuth(redirectTo = 'index.html') {
    const u = this.getCurrentUser();
    if (!u) { window.location.href = redirectTo; return null; }
    return u;
  },
  requireAdmin(redirectTo = 'admin-login.html') {
    const u = this.getCurrentUser();
    if (!u || u.role !== 'admin') { window.location.href = redirectTo; return null; }
    return u;
  },

  // ---- PRODUCTOS ----
  getProducts() {
    const stored = localStorage.getItem('eatgo_products');
    if (stored) return JSON.parse(stored);
    // Productos por defecto
    const defaults = [
      { id:1, nombre:'Hamburguesa', categoria:'hamburguesas', precio:15000, emoji:'🍔', descripcion:'Jugosa hamburguesa con queso cheddar', activo:true, destacado:true },
      { id:2, nombre:'Pizza', categoria:'pizzas', precio:20000, emoji:'🍕', descripcion:'Pizza familiar con mozzarella', activo:true, destacado:true },
      { id:3, nombre:'Malteada', categoria:'bebidas', precio:14000, emoji:'🥤', descripcion:'Malteada cremosa en 3 sabores', activo:true, destacado:true },
      { id:4, nombre:'Salchipapas', categoria:'combos', precio:8000, emoji:'🍟', descripcion:'Salchipapas con salsas especiales', activo:true, destacado:false },
      { id:5, nombre:'Perro caliente', categoria:'combos', precio:16000, emoji:'🌭', descripcion:'Hot dog estilo americano', activo:true, destacado:false },
      { id:6, nombre:'Helado', categoria:'postres', precio:7000, emoji:'🍦', descripcion:'Helado suave de vainilla o chocolate', activo:true, destacado:false },
      { id:7, nombre:'Hamburguesa doble carne', categoria:'hamburguesas', precio:20000, emoji:'🍔', descripcion:'Doble carne, doble queso, extra especial', activo:true, destacado:false },
      { id:8, nombre:'Pizza unidad', categoria:'pizzas', precio:10000, emoji:'🍕', descripcion:'Porción individual de pizza', activo:true, destacado:false },
      { id:9, nombre:'Malteada mini', categoria:'bebidas', precio:15000, emoji:'🥤', descripcion:'Malteada tamaño personal', activo:true, destacado:false },
    ];
    this.saveProducts(defaults);
    return defaults;
  },
  saveProducts(products) {
    localStorage.setItem('eatgo_products', JSON.stringify(products));
  },
  addProduct(product) {
    const products = this.getProducts();
    product.id = Date.now();
    product.activo = true;
    products.push(product);
    this.saveProducts(products);
    return product;
  },
  updateProduct(id, data) {
    const products = this.getProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx > -1) { products[idx] = { ...products[idx], ...data }; this.saveProducts(products); }
  },
  deleteProduct(id) {
    const products = this.getProducts().filter(p => p.id !== id);
    this.saveProducts(products);
  },
  getCategories() {
    return ['hamburguesas','pizzas','bebidas','combos','postres'];
  },

  // ---- CARRITO ----
  getCart() {
    return JSON.parse(localStorage.getItem('eatgo_cart') || '[]');
  },
  saveCart(cart) {
    localStorage.setItem('eatgo_cart', JSON.stringify(cart));
  },
  addToCart(product, qty = 1) {
    const cart = this.getCart();
    const idx = cart.findIndex(i => i.id === product.id);
    if (idx > -1) { cart[idx].qty += qty; }
    else { cart.push({ ...product, qty }); }
    this.saveCart(cart);
    return cart;
  },
  updateCartQty(productId, qty) {
    let cart = this.getCart();
    if (qty <= 0) { cart = cart.filter(i => i.id !== productId); }
    else {
      const idx = cart.findIndex(i => i.id === productId);
      if (idx > -1) cart[idx].qty = qty;
    }
    this.saveCart(cart);
    return cart;
  },
  clearCart() {
    localStorage.removeItem('eatgo_cart');
  },
  getCartTotal() {
    return this.getCart().reduce((t, i) => t + i.precio * i.qty, 0);
  },
  getCartCount() {
    return this.getCart().reduce((t, i) => t + i.qty, 0);
  },

  // ---- PEDIDOS ----
  getOrders() {
    return JSON.parse(localStorage.getItem('eatgo_orders') || '[]');
  },
  saveOrders(orders) {
    localStorage.setItem('eatgo_orders', JSON.stringify(orders));
  },
  createOrder(orderData) {
    const orders = this.getOrders();
    const order = {
      id: 'PED-' + Date.now(),
      fecha: new Date().toLocaleDateString('es-CO'),
      hora: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      estado: 'Preparando',
      items: this.getCart(),
      total: this.getCartTotal(),
      userId: (this.getCurrentUser() || {}).id,
      userName: (this.getCurrentUser() || {}).nombre || 'Cliente',
      ...orderData
    };
    orders.push(order);
    this.saveOrders(orders);
    this.clearCart();
    return order;
  },
  getUserOrders() {
    const user = this.getCurrentUser();
    if (!user) return [];
    return this.getOrders().filter(o => o.userId === user.id);
  },
  updateOrderStatus(orderId, status) {
    const orders = this.getOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx > -1) { orders[idx].estado = status; this.saveOrders(orders); }
  },
  getOrderById(id) {
    return this.getOrders().find(o => o.id === id);
  },
  setCurrentOrder(order) {
    localStorage.setItem('eatgo_current_order', JSON.stringify(order));
  },
  getCurrentOrder() {
    return JSON.parse(localStorage.getItem('eatgo_current_order') || 'null');
  },

  // ---- ADMIN ----
  initAdmin() {
    const users = this.getUsers();
    if (!users.find(u => u.role === 'admin')) {
      users.push({ id: 0, nombre: 'Administrador', email: 'admin@eatgo.com', password: 'admin123', role: 'admin' });
      this.saveUsers(users);
    }
  },

  // ---- UTILIDADES ----
  formatPrice(p) {
    return '$' + p.toLocaleString('es-CO');
  }
};

// Inicializar admin
Storage.initAdmin();
