// =====================================================
// EATGO - Autenticación
// =====================================================

function showToast(msg, type = 'error') {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.className = 'toast' + (type === 'success' ? ' success' : '');
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => t.classList.remove('show'), 3000);
}

// LOGIN
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  // Redirigir si ya inició sesión
  const u = Storage.getCurrentUser();
  if (u) {
    window.location.href = u.role === 'admin' ? 'admin-dashboard.html' : 'menu.html';
  }

  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    const user = Storage.getUserByEmail(email);
    if (!user) { showToast('Usuario no encontrado'); return; }
    if (user.password !== password) { showToast('Contraseña incorrecta'); return; }

    Storage.setCurrentUser(user);
    showToast('¡Bienvenido, ' + user.nombre + '!', 'success');
    setTimeout(() => {
      window.location.href = user.role === 'admin' ? 'admin-dashboard.html' : 'menu.html';
    }, 800);
  });
}

// REGISTER
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const nombre   = document.getElementById('nombre').value.trim();
    const email    = document.getElementById('email').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const password = document.getElementById('password').value;
    const confirm  = document.getElementById('confirm').value;

    if (!nombre || !email || !password) { showToast('Completa todos los campos'); return; }
    if (password !== confirm) { showToast('Las contraseñas no coinciden'); return; }
    if (password.length < 6) { showToast('La contraseña debe tener al menos 6 caracteres'); return; }
    if (Storage.getUserByEmail(email)) { showToast('Ese correo ya está registrado'); return; }

    const user = Storage.addUser({ nombre, email, telefono, password });
    Storage.setCurrentUser(user);
    showToast('¡Cuenta creada!', 'success');
    setTimeout(() => { window.location.href = 'menu.html'; }, 800);
  });
}
