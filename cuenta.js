// Cuentas de cliente de Elástika: registro, inicio de sesión, perfil e historial de pedidos.
// La web es estática (GitHub Pages), así que las cuentas se guardan en el navegador de cada
// dispositivo. Las contraseñas nunca se guardan tal cual: se guarda un hash PBKDF2 con sal.
(() => {
  const KEY_USERS = 'elastika-usuarios', KEY_SES = 'elastika-sesion', KEY_TRIES = 'elastika-intentos';
  const MAX_PEDIDOS = 50, MAX_INTENTOS = 5, ESPERA_MS = 30000;

  Object.assign(EN, {
    'Mi cuenta': 'My account', 'Iniciar sesión': 'Sign in', 'Crear cuenta': 'Create account', 'Entrar': 'Sign in',
    '¡Hola de nuevo! 👋': 'Welcome back! 👋', 'Entra para ver tus pedidos y comprar más rápido.': 'Sign in to see your orders and check out faster.',
    'Crea tu cuenta 💙': 'Create your account 💙', 'Guarda tus datos de envío y consulta tus pedidos cuando quieras.': 'Save your shipping details and check your orders anytime.',
    'Correo electrónico': 'Email', 'Contraseña': 'Password', 'Repite la contraseña': 'Repeat password', 'Nombre y apellidos': 'Full name',
    'Teléfono (WhatsApp)': 'Phone (WhatsApp)', 'Mostrar': 'Show', 'Ocultar': 'Hide', 'Recordarme en este dispositivo': 'Remember me on this device',
    '¿No tienes cuenta?': "Don't have an account?", '¿Ya tienes cuenta?': 'Already have an account?', 'Regístrate': 'Sign up',
    'Mínimo 6 caracteres, con al menos una letra y un número.': 'At least 6 characters, with at least one letter and one number.',
    'Escribe un correo válido.': 'Enter a valid email.', 'Escribe tu contraseña.': 'Enter your password.',
    'La contraseña necesita 6 caracteres o más, con letras y números.': 'Password needs 6+ characters with letters and numbers.',
    'Las contraseñas no coinciden.': "Passwords don't match.", 'Ya existe una cuenta con ese correo.': 'An account with that email already exists.',
    'Correo o contraseña incorrectos.': 'Wrong email or password.', 'Demasiados intentos. Espera {x} s.': 'Too many attempts. Wait {x}s.',
    'Escribe tu nombre.': 'Enter your name.', '¡Cuenta creada! Bienvenido/a, {x} 🎉': 'Account created! Welcome, {x} 🎉', '¡Hola, {x}! 👋': 'Hi, {x}! 👋',
    'Sesión cerrada. ¡Hasta pronto!': 'Signed out. See you soon!', 'Tus datos': 'Your details', 'Guardar datos': 'Save details',
    'Datos guardados ✓': 'Details saved ✓', 'Mis pedidos': 'My orders', 'Aún no has hecho ningún pedido.': "You haven't placed any orders yet.",
    'Cerrar sesión': 'Sign out', 'Borrar mi cuenta': 'Delete my account', '¿Seguro? Se borrarán tu cuenta y tu historial de este dispositivo.': 'Are you sure? Your account and order history will be deleted from this device.',
    'Cuenta borrada.': 'Account deleted.', 'Dirección (calle, número, apto.)': 'Address (street, number, apt.)', 'Ciudad y estado': 'City and state',
    'Cambiar contraseña': 'Change password', 'Contraseña actual': 'Current password', 'Nueva contraseña': 'New password',
    'Contraseña cambiada ✓': 'Password changed ✓', 'La contraseña actual no es correcta.': 'Current password is wrong.',
    'Tu cuenta se guarda en este dispositivo y navegador.': 'Your account is stored on this device and browser.',
    'Envío': 'Shipping', 'Recogida': 'Pickup', 'artículos': 'items', 'Repetir pedido': 'Order again', 'Añadido al carrito 🛒': 'Added to cart 🛒',
    'Este navegador no permite cuentas seguras. Abre la tienda desde https://': 'This browser does not support secure accounts. Open the store over https://',
    'Compra con o sin cuenta: tú eliges.': 'Shop with or without an account: your choice.', 'Socio desde {x}': 'Member since {x}', 'Cerrar': 'Close', 'Pulsa otra vez para confirmar.': 'Tap again to confirm.'
  });

  /* ---------- almacenamiento ---------- */
  const leer = (k, def, s = localStorage) => { try { return JSON.parse(s.getItem(k)) ?? def; } catch { return def; } };
  const escribir = (k, v, s = localStorage) => { try { s.setItem(k, JSON.stringify(v)); } catch {} };
  const borrar = k => { try { localStorage.removeItem(k); sessionStorage.removeItem(k); } catch {} };
  const usuarios = () => leer(KEY_USERS, {});
  const guardarUsuarios = u => escribir(KEY_USERS, u);
  const emailOk = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
  const passOk = p => p.length >= 6 && /[a-zA-ZñÑ]/.test(p) && /\d/.test(p);
  const norm = e => String(e || '').trim().toLowerCase();

  function sesion() { return leer(KEY_SES, null) || leer(KEY_SES, null, sessionStorage); }
  function usuario() { const e = sesion(); return e ? usuarios()[e] || null : null; }
  function abrirSesion(email, recordar) { borrar(KEY_SES); escribir(KEY_SES, email, recordar ? localStorage : sessionStorage); }

  /* ---------- contraseñas (PBKDF2-SHA256, 150.000 vueltas) ---------- */
  const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  const deHex = h => new Uint8Array(h.match(/../g).map(x => parseInt(x, 16)));
  async function hash(pass, saltHex) {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveBits']);
    return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: deHex(saltHex), iterations: 150000, hash: 'SHA-256' }, key, 256));
  }
  const nuevaSal = () => hex(crypto.getRandomValues(new Uint8Array(16)));
  function igual(a, b) { if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; }

  /* ---------- límite de intentos ---------- */
  function bloqueado() { const t = leer(KEY_TRIES, { n: 0, hasta: 0 }); return t.hasta > Date.now() ? Math.ceil((t.hasta - Date.now()) / 1000) : 0; }
  function fallo() { const t = leer(KEY_TRIES, { n: 0, hasta: 0 }); t.n++; if (t.n >= MAX_INTENTOS) { t.n = 0; t.hasta = Date.now() + ESPERA_MS; } escribir(KEY_TRIES, t); }
  const acierto = () => borrar(KEY_TRIES);

  /* ---------- interfaz ---------- */
  const box = document.getElementById('acc-in');
  const modal = document.getElementById('acc-modal');
  let vista = 'login', recordarEmail = '';

  function abrirCuenta(v) {
    vista = v || (usuario() ? 'perfil' : 'login');
    pintar(); modal.hidden = false; document.body.classList.add('lock');
    setTimeout(() => box.querySelector('input:not([type=checkbox])')?.focus(), 60);
  }
  function cerrarCuenta() {
    modal.hidden = true;
    if (!document.getElementById('drawer').classList.contains('open') && document.getElementById('modal').hidden) document.body.classList.remove('lock');
  }

  const campoPass = (name, ph, ac) => `
    <div class="acc-pass"><input name="${name}" type="password" placeholder="${T(ph)}" autocomplete="${ac}" required>
    <button type="button" class="acc-eye" data-eye>${T('Mostrar')}</button></div>`;

  function pintar() {
    const sinCrypto = !(window.crypto && crypto.subtle);
    const aviso = sinCrypto ? `<p class="acc-err show">${T('Este navegador no permite cuentas seguras. Abre la tienda desde https://')}</p>` : '';
    if (vista === 'login') box.innerHTML = `
      <div class="acc-head"><span class="acc-ic">🔐</span><h3>${T('¡Hola de nuevo! 👋')}</h3><p>${T('Entra para ver tus pedidos y comprar más rápido.')}</p></div>
      ${aviso}
      <form class="acc-form" id="acc-login" novalidate>
        <input name="email" type="email" placeholder="${T('Correo electrónico')}" autocomplete="email" value="${esc(recordarEmail)}" required>
        ${campoPass('pass', 'Contraseña', 'current-password')}
        <label class="acc-chk"><input type="checkbox" name="recordar" checked> ${T('Recordarme en este dispositivo')}</label>
        <p class="acc-err" id="acc-err" role="alert"></p>
        <button class="btn btn-primary btn-lg acc-wide" type="submit">${T('Entrar')}</button>
      </form>
      <p class="acc-switch">${T('¿No tienes cuenta?')} <button type="button" class="acc-link" data-vista="registro">${T('Regístrate')}</button></p>
      <p class="acc-note">🔒 ${T('Tu cuenta se guarda en este dispositivo y navegador.')}</p>`;
    else if (vista === 'registro') box.innerHTML = `
      <div class="acc-head"><span class="acc-ic">✨</span><h3>${T('Crea tu cuenta 💙')}</h3><p>${T('Guarda tus datos de envío y consulta tus pedidos cuando quieras.')}</p></div>
      ${aviso}
      <form class="acc-form" id="acc-reg" novalidate>
        <input name="nombre" placeholder="${T('Nombre y apellidos')}" autocomplete="name" required>
        <input name="email" type="email" placeholder="${T('Correo electrónico')}" autocomplete="email" required>
        <input name="tel" type="tel" placeholder="${T('Teléfono (WhatsApp)')}" autocomplete="tel">
        ${campoPass('pass', 'Contraseña', 'new-password')}
        <div class="acc-meter"><i></i></div>
        <small class="acc-hint">${T('Mínimo 6 caracteres, con al menos una letra y un número.')}</small>
        ${campoPass('pass2', 'Repite la contraseña', 'new-password')}
        <p class="acc-err" id="acc-err" role="alert"></p>
        <button class="btn btn-accent btn-lg acc-wide" type="submit">${T('Crear cuenta')}</button>
      </form>
      <p class="acc-switch">${T('¿Ya tienes cuenta?')} <button type="button" class="acc-link" data-vista="login">${T('Iniciar sesión')}</button></p>`;
    else pintarPerfil();
  }

  function pintarPerfil() {
    const u = usuario(); if (!u) { vista = 'login'; return pintar(); }
    const desde = new Date(u.creado).toLocaleDateString(loc(), { month: 'long', year: 'numeric' });
    const peds = (u.pedidos || []).slice().reverse();
    box.innerHTML = `
      <div class="acc-head acc-me"><span class="acc-avatar big">${esc(inicial(u))}</span>
        <div><h3>${esc(u.nombre)}</h3><p>${esc(u.email)} · <small>${T('Socio desde {x}', { x: esc(desde) })}</small></p></div></div>
      <div class="acc-tabs"><button type="button" data-tab="pedidos" class="on">📦 ${T('Mis pedidos')}</button><button type="button" data-tab="datos">👤 ${T('Tus datos')}</button></div>
      <div class="acc-pane" data-pane="pedidos">
        ${peds.length ? peds.map((o, i) => `
          <div class="acc-order">
            <div class="acc-order-top"><b>${esc(o.n)}</b><span>${new Date(o.fecha).toLocaleDateString(loc(), { dateStyle: 'medium' })}</span></div>
            <p>${o.items.map(it => `${it.q} × ${esc(it.nombre)}`).join(' · ')}</p>
            <div class="acc-order-bot"><span class="acc-tag">${o.entrega?.tipo === 'tienda' ? '🏪 ' + T('Recogida') : '🚚 ' + T('Envío')}</span><b>${money(o.total)}</b>
            <button type="button" class="btn btn-outline acc-mini" data-repetir="${peds.length - 1 - i}">↻ ${T('Repetir pedido')}</button></div>
          </div>`).join('') : `<div class="acc-empty"><div>📦</div><p>${T('Aún no has hecho ningún pedido.')}</p></div>`}
      </div>
      <div class="acc-pane" data-pane="datos" hidden>
        <form class="acc-form" id="acc-datos" novalidate>
          <input name="nombre" placeholder="${T('Nombre y apellidos')}" autocomplete="name" value="${esc(u.nombre)}">
          <input name="tel" type="tel" placeholder="${T('Teléfono (WhatsApp)')}" autocomplete="tel" value="${esc(u.tel || '')}">
          <input name="direccion" placeholder="${T('Dirección (calle, número, apto.)')}" autocomplete="street-address" value="${esc(u.direccion || '')}">
          <div class="acc-two"><input name="cp" placeholder="ZIP" inputmode="numeric" maxlength="5" autocomplete="postal-code" value="${esc(u.cp || '')}">
          <input name="ciudad" placeholder="${T('Ciudad y estado')}" autocomplete="address-level2" value="${esc(u.ciudad || '')}"></div>
          <p class="acc-err" id="acc-err-datos" role="alert"></p>
          <button class="btn btn-primary acc-wide" type="submit">${T('Guardar datos')}</button>
        </form>
        <details class="acc-det"><summary>🔑 ${T('Cambiar contraseña')}</summary>
          <form class="acc-form" id="acc-pass" novalidate>
            ${campoPass('actual', 'Contraseña actual', 'current-password')}
            ${campoPass('nueva', 'Nueva contraseña', 'new-password')}
            <p class="acc-err" id="acc-err-pass" role="alert"></p>
            <button class="btn btn-outline acc-wide" type="submit">${T('Cambiar contraseña')}</button>
          </form></details>
        <button type="button" class="acc-link danger" id="acc-del">${T('Borrar mi cuenta')}</button>
      </div>
      <button type="button" class="btn btn-outline acc-wide acc-out" id="acc-logout">↪ ${T('Cerrar sesión')}</button>`;
  }

  const inicial = u => (u?.nombre || u?.email || '?').trim()[0].toUpperCase();
  function err(id, msg, el) { const p = document.getElementById(id); p.textContent = msg ? T(msg.t || msg, msg.v || {}) : ''; p.classList.toggle('show', !!msg); if (el) { el.classList.add('bad-input'); el.focus(); } return false; }

  function pintarBoton() {
    const u = usuario(), b = document.getElementById('acc-btn');
    b.classList.toggle('in', !!u);
    b.innerHTML = u ? `<span class="acc-avatar">${esc(inicial(u))}</span>`
      : `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>`;
    b.setAttribute('aria-label', u ? `${T('Mi cuenta')}: ${u.nombre}` : T('Iniciar sesión'));
    b.title = u ? u.nombre : T('Iniciar sesión');
  }

  // rellena el carrito con los datos de la cuenta
  function rellenarCheckout() {
    const u = usuario(), f = document.getElementById('checkout'); if (!u || !f) return;
    const map = { nombre: u.nombre, telefono: u.tel, direccion: u.direccion, cp: u.cp, ciudad: u.ciudad };
    for (const k in map) if (map[k] && f[k]) f[k].value = map[k];
    if (u.cp) f.cp.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /* ---------- acciones ---------- */
  async function entrar(f) {
    err('acc-err');
    const espera = bloqueado(); if (espera) return err('acc-err', { t: 'Demasiados intentos. Espera {x} s.', v: { x: espera } });
    const email = norm(f.email.value), pass = f.pass.value;
    if (!emailOk(email)) return err('acc-err', 'Escribe un correo válido.', f.email);
    if (!pass) return err('acc-err', 'Escribe tu contraseña.', f.pass);
    const u = usuarios()[email];
    // aunque el correo no exista se calcula un hash, para no delatar qué correos tienen cuenta
    const h = await hash(pass, u?.salt || '00000000000000000000000000000000');
    if (!u || !igual(h, u.hash)) { fallo(); return err('acc-err', 'Correo o contraseña incorrectos.', f.pass); }
    acierto(); abrirSesion(email, f.recordar.checked); recordarEmail = '';
    pintarBoton(); rellenarCheckout(); cerrarCuenta(); toast(T('¡Hola, {x}! 👋', { x: u.nombre.split(' ')[0] }));
  }

  async function registrar(f) {
    err('acc-err');
    const nombre = f.nombre.value.trim(), email = norm(f.email.value), tel = f.tel.value.trim(), pass = f.pass.value;
    if (nombre.length < 2) return err('acc-err', 'Escribe tu nombre.', f.nombre);
    if (!emailOk(email)) return err('acc-err', 'Escribe un correo válido.', f.email);
    if (!passOk(pass)) return err('acc-err', 'La contraseña necesita 6 caracteres o más, con letras y números.', f.pass);
    if (pass !== f.pass2.value) return err('acc-err', 'Las contraseñas no coinciden.', f.pass2);
    const us = usuarios();
    if (us[email]) return err('acc-err', 'Ya existe una cuenta con ese correo.', f.email);
    const salt = nuevaSal();
    us[email] = { nombre, email, tel, salt, hash: await hash(pass, salt), creado: new Date().toISOString(), pedidos: [] };
    guardarUsuarios(us); abrirSesion(email, true);
    pintarBoton(); rellenarCheckout(); cerrarCuenta(); toast(T('¡Cuenta creada! Bienvenido/a, {x} 🎉', { x: nombre.split(' ')[0] }));
  }

  function guardarDatos(f) {
    const us = usuarios(), u = us[sesion()]; if (!u) return;
    const nombre = f.nombre.value.trim();
    if (nombre.length < 2) return err('acc-err-datos', 'Escribe tu nombre.', f.nombre);
    Object.assign(u, { nombre, tel: f.tel.value.trim(), direccion: f.direccion.value.trim(), cp: f.cp.value.trim(), ciudad: f.ciudad.value.trim() });
    guardarUsuarios(us); pintarBoton(); rellenarCheckout(); err('acc-err-datos'); toast(T('Datos guardados ✓'));
    box.querySelector('.acc-me h3').textContent = nombre; box.querySelector('.acc-avatar.big').textContent = inicial(u);
  }

  async function cambiarPass(f) {
    const us = usuarios(), u = us[sesion()]; if (!u) return;
    if (!igual(await hash(f.actual.value, u.salt), u.hash)) return err('acc-err-pass', 'La contraseña actual no es correcta.', f.actual);
    if (!passOk(f.nueva.value)) return err('acc-err-pass', 'La contraseña necesita 6 caracteres o más, con letras y números.', f.nueva);
    u.salt = nuevaSal(); u.hash = await hash(f.nueva.value, u.salt);
    guardarUsuarios(us); f.reset(); err('acc-err-pass'); f.closest('details').open = false; toast(T('Contraseña cambiada ✓'));
  }

  function salir() { recordarEmail = usuario()?.email || ''; borrar(KEY_SES); pintarBoton(); cerrarCuenta(); toast(T('Sesión cerrada. ¡Hasta pronto!')); }

  function repetir(i) {
    const o = usuario()?.pedidos?.[i]; if (!o) return;
    o.items.forEach(it => { if (prod(it.id) && !prod(it.id).agotado) cart[it.id] = (cart[it.id] || 0) + it.q; });
    store.set('elastika-carrito', cart); cerrarCuenta(); pintarCarrito(); abrir(true); toast(T('Añadido al carrito 🛒'));
  }

  /* ---------- eventos ---------- */
  document.getElementById('acc-btn').onclick = () => abrirCuenta();
  modal.addEventListener('click', e => { if (e.target === modal || e.target.closest('[data-acc-close]')) cerrarCuenta(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) cerrarCuenta(); });
  box.addEventListener('click', e => {
    const v = e.target.closest('[data-vista]'); if (v) { vista = v.dataset.vista; pintar(); box.querySelector('input')?.focus(); return; }
    const eye = e.target.closest('[data-eye]');
    if (eye) { const i = eye.previousElementSibling, ver = i.type === 'password'; i.type = ver ? 'text' : 'password'; eye.textContent = T(ver ? 'Ocultar' : 'Mostrar'); return; }
    const t = e.target.closest('[data-tab]');
    if (t) { box.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('on', b === t)); box.querySelectorAll('[data-pane]').forEach(p => p.hidden = p.dataset.pane !== t.dataset.tab); return; }
    const r = e.target.closest('[data-repetir]'); if (r) { repetir(+r.dataset.repetir); return; }
    if (e.target.closest('#acc-logout')) { salir(); return; }
    const del = e.target.closest('#acc-del');
    if (del && !del.dataset.ok) { del.dataset.ok = 1; del.textContent = T('¿Seguro? Se borrarán tu cuenta y tu historial de este dispositivo.') + ' ' + T('Pulsa otra vez para confirmar.'); return; }
    if (del) {
      const us = usuarios(); delete us[sesion()]; guardarUsuarios(us); borrar(KEY_SES); pintarBoton(); cerrarCuenta(); toast(T('Cuenta borrada.'));
    }
  });
  box.addEventListener('input', e => {
    e.target.classList.remove('bad-input');
    if (e.target.name === 'pass' && vista === 'registro') {
      const p = e.target.value, n = [p.length >= 6, /[a-z]/i.test(p) && /\d/.test(p), p.length >= 10, /[^a-z0-9]/i.test(p)].filter(Boolean).length;
      const m = box.querySelector('.acc-meter'); m.dataset.n = n;
    }
  });
  box.addEventListener('submit', async e => {
    e.preventDefault();
    if (!(window.crypto && crypto.subtle) && e.target.id !== 'acc-datos') return;
    const btn = e.target.querySelector('[type=submit]'); btn.disabled = true;
    try {
      if (e.target.id === 'acc-login') await entrar(e.target);
      else if (e.target.id === 'acc-reg') await registrar(e.target);
      else if (e.target.id === 'acc-datos') guardarDatos(e.target);
      else if (e.target.id === 'acc-pass') await cambiarPass(e.target);
    } finally { btn.disabled = false; }
  });
  // al cambiar de idioma, repinta la ventana de la cuenta
  document.getElementById('lang').addEventListener('click', () => setTimeout(() => { pintarBoton(); if (!modal.hidden) pintar(); }));

  /* ---------- API para app.js ---------- */
  window.Cuenta = {
    usuario, abrir: abrirCuenta,
    // se llama al confirmar un pedido: lo guarda en el historial y completa los datos que falten
    pedido(o) {
      const us = usuarios(), u = us[sesion()]; if (!u) return;
      u.pedidos = [...(u.pedidos || []), o].slice(-MAX_PEDIDOS);
      if (!u.tel) u.tel = o.cliente.tel;
      if (o.entrega?.tipo === 'envio' && !u.direccion) Object.assign(u, { direccion: o.entrega.direccion, cp: o.entrega.cp, ciudad: o.entrega.ciudad });
      guardarUsuarios(us);
    }
  };

  pintarBoton();
  // espera a que app.js cargue la tienda y rellena el carrito con la cuenta
  const espera = setInterval(() => { if (typeof D !== 'undefined' && D) { clearInterval(espera); rellenarCheckout(); } }, 150);
  setTimeout(() => clearInterval(espera), 15000);
})();
