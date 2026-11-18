// Tienda Elástika — todo el contenido sale de data.json (editable desde admin.html)
// Web en español e inglés (botón ES/EN). Precios en dólares, impuestos incluidos.
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const money = n => Number(n || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const get = (o, path) => path.split('.').reduce((a, k) => a?.[k], o);
const store = {
  get(k, def) { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};
const COLORES = ['#1E6FD9', '#FF7A59', '#2BB673', '#8E5BE8', '#F5B301', '#E03B44'];

/* ---------- Idiomas ---------- */
// Clave = texto en español. Valor = texto en inglés. {x} = dato que se rellena.
const EN = {
  // menú y cabecera
  'Productos': 'Products', '¿Cuál elijo?': 'Which one?', 'Nosotros': 'About us', 'Cómo comprar': 'How to buy', 'Envíos': 'Shipping',
  'Tienda': 'Store', 'Ayuda': 'Help', 'Categorías:': 'Categories:', 'Todos': 'All',
  // portada
  '¿Cuál me conviene?': 'Which one is right for me?', 'clientes contentos': 'happy customers', 'Tiras elásticas de colores': 'Colorful resistance bands',
  'Envíos a todo EE. UU.': 'Shipping across the US', 'en NYC, en 24 h': 'next-day in NYC', 'Látex natural': 'Natural latex',
  'resistente y duradero': 'strong and durable', '⭐ El más vendido': '⭐ Best seller',
  // usos y productos
  'Para todo el mundo': 'For everyone', '¿Para qué las vas a usar?': 'What will you use them for?',
  'Una tira elástica cabe en el bolso y sustituye a medio gimnasio.': 'A resistance band fits in your bag and replaces half a gym.',
  'Catálogo': 'Catalog', 'Nuestros productos': 'Our products', 'Pulsa en cualquier producto para ver los detalles.': 'Tap any product to see the details.',
  'Buscar…': 'Search…', 'Destacados': 'Featured', 'Precio: menor a mayor': 'Price: low to high', 'Precio: mayor a menor': 'Price: high to low',
  'No hemos encontrado nada con esa búsqueda 🤔': "We couldn't find anything for that search 🤔",
  'Agotado': 'Sold out', '⭐ Más vendido': '⭐ Best seller', 'Ver detalles': 'View details', 'antes': 'was', 'Ahorras {x}': 'You save {x}',
  'Añadir {x} al carrito': 'Add {x} to cart', 'Suave': 'Light', 'Media': 'Medium', 'Fuerte': 'Heavy', 'Muy fuerte': 'Very heavy', 'Extra fuerte': 'Extra heavy',
  // guía
  'Te ayudamos a elegir': "We'll help you choose", '¿Qué resistencia necesitas?': 'What resistance do you need?',
  'Dinos cómo entrenas y te recomendamos la tira ideal en un clic.': "Tell us how you train and we'll recommend the right band in one click.",
  'Estoy empezando': "I'm just starting", 'o vuelvo tras una lesión': 'or coming back from an injury', 'Entreno a veces': 'I train sometimes',
  'un par de días a la semana': 'a couple of days a week', 'Entreno a menudo': 'I train often', 'quiero progresar': 'I want to progress',
  'Entreno fuerte': 'I train hard', 'busco mucha resistencia': 'I want a lot of resistance',
  'Elige una opción y te diremos cuál es la tuya.': "Pick an option and we'll tell you which one is yours.",
  '✔ Te recomendamos': '✔ We recommend', 'Añadir al carrito': 'Add to cart',
  '💡 ¿Quieres ir progresando? Mira también {x}.': '💡 Want to keep progressing? Also check out {x}.',
  // nosotros y opiniones
  'clientes': 'customers', 'Quiénes somos': 'Who we are', 'Ven a conocernos': 'Come say hi', 'Opiniones': 'Reviews',
  'Lo que dicen nuestros clientes': 'What our customers say', '✔ Compra verificada': '✔ Verified purchase',
  // cómo comprar
  'Fácil y rápido': 'Quick and easy', 'Compra con o sin cuenta: tú eliges.': 'Shop with or without an account: your choice.',
  'Elige': 'Choose', 'Añade al carrito las tiras que quieras.': 'Add the bands you want to your cart.', 'Envía tu pedido': 'Send your order',
  'Rellena tus datos y nos llega por WhatsApp.': 'Fill in your details and it reaches us on WhatsApp.', 'Paga al recibir': 'Pay on delivery',
  'En efectivo o con tarjeta, sin pagar nada por adelantado.': 'Cash or card, nothing to pay upfront.', '¡A entrenar!': 'Start training!',
  'Te lo llevamos o lo recoges en la tienda.': 'We deliver it or you pick it up at the store.', 'Aceptamos': 'We accept',
  'Efectivo': 'Cash', 'Tarjeta': 'Card', 'Impuestos incluidos': 'Taxes included',
  // envíos
  'Envíos y entregas': 'Shipping & delivery', '¿Cuánto tarda y cuánto cuesta?': 'How long does it take and how much is it?',
  'Escribe tu ZIP code y lo calculamos al momento.': "Enter your ZIP code and we'll calculate it right away.", 'Tu ZIP code': 'Your ZIP code',
  'Ej. 11372': 'e.g. 11372', 'Precio y fecha estimada de llegada': 'Price and estimated arrival date',
  'No hacemos envíos a ese ZIP code. Escríbenos y lo vemos.': "We don't ship to that ZIP code. Message us and we'll figure it out.",
  'Gratis desde {x}': 'Free over {x}', ' (gratis desde {x})': ' (free over {x})', '📅 Si pides hoy, llega {x}': '📅 Order today and it arrives {x}',
  '{x} día hábil': '{x} business day', '{x} días hábiles': '{x} business days', 'Recogida en tienda': 'Store pickup', 'Gratis': 'Free',
  'Nos llega tu pedido': 'We get your order', 'Por WhatsApp, con tu número de pedido': 'On WhatsApp, with your order number',
  'Te lo confirmamos': 'We confirm it', 'Te escribimos por WhatsApp': 'We message you on WhatsApp', 'Lo preparamos': 'We pack it',
  'Empaquetado con cariño el mismo día': 'Packed with care the same day', 'Sale hacia tu casa': 'It heads your way', 'Pagas al recibirlo': 'You pay when you get it',
  // dónde
  'Tienda física': 'Our store', 'Dónde estamos': 'Where we are', 'Dirección': 'Address', 'Horario': 'Hours', 'Teléfono': 'Phone',
  '📍 Cómo llegar': '📍 Get directions', '📞 Llamar': '📞 Call', 'Preguntas frecuentes': 'FAQ',
  '¿Tienes dudas? Te respondemos al momento': "Questions? We'll answer right away",
  'Escríbenos por WhatsApp y te asesoramos sin compromiso.': "Message us on WhatsApp and we'll help, no strings attached.",
  '💬 Escribir por WhatsApp': '💬 Message us on WhatsApp', 'Guía de resistencias': 'Resistance guide', 'Envíos y plazos': 'Shipping times',
  'Contacto': 'Contact', 'Hecho con 💙': 'Made with 💙', 'Acceso administración': 'Admin', '¿Hablamos?': "Let's chat!",
  // ficha
  'Envío desde {x}': 'Shipping from {x}', 'ver plazos y precios': 'see times and prices', 'Recogida en tienda sin coste': 'Free store pickup',
  'Te asesoramos por WhatsApp': 'Advice on WhatsApp', '😔 Ahora mismo está agotado.': '😔 Sold out right now.', 'Avísame cuando vuelva': 'Let me know when it is back',
  'Añadir': 'Add', '{x} por unidad · {t} · el envío se calcula en el carrito': '{x} each · {t} · shipping is calculated in the cart',
  '{n} × {x} = {s} · {t} · el envío se calcula en el carrito': '{n} × {x} = {s} · {t} · shipping is calculated in the cart',
  '¿Dudas con este producto?': 'Questions about this product?', 'Pregúntanos por WhatsApp': 'Ask us on WhatsApp',
  'Hola, ¿cuándo volveréis a tener "{x}"?': 'Hi, when will "{x}" be back in stock?', 'Hola, tengo una duda sobre "{x}"': 'Hi, I have a question about "{x}"',
  '¡Hola {x}! Tengo una pregunta sobre vuestras tiras elásticas.': 'Hi {x}! I have a question about your resistance bands.',
  // carrito
  'Tu carrito': 'Your cart', 'Tu carrito está vacío': 'Your cart is empty', '¡Añade alguna tira y empieza a entrenar! 💪': 'Add a band and start training! 💪',
  'Ver productos': 'Shop products', '¿Cómo lo quieres?': 'How do you want it?', '🚚 Envío a casa': '🚚 Delivery', '🏪 Recoger en tienda': '🏪 Store pickup',
  'Dirección (calle, número, apto.)': 'Address (street, number, apt.)', 'Ciudad y estado': 'City and state', 'Tus datos': 'Your details',
  'Nombre y apellidos': 'Full name', 'Teléfono (WhatsApp)': 'Phone (WhatsApp)', 'Forma de pago': 'Payment',
  '¿Algo que debamos saber? (opcional)': 'Anything we should know? (optional)',
  'Acepto que usen mis datos solo para gestionar este pedido.': 'I agree that my details will only be used to handle this order.',
  '💬 Enviar pedido por WhatsApp': '💬 Send order on WhatsApp', '🔒 No pagas nada ahora. Te contestamos por WhatsApp para confirmar el pedido.': "🔒 You don't pay anything now. We'll reply on WhatsApp to confirm your order.",
  '{x} / unidad': '{x} each', 'Quitar': 'Remove', 'Menos': 'Less', 'Más': 'More', 'Productos ({n})': 'Products ({n})', 'Envío': 'Shipping',
  'se calcula abajo ↓': 'calculated below ↓', 'GRATIS': 'FREE', 'Total a pagar': 'Total to pay', 'Total sin envío': 'Total before shipping',
  '{t}. No hay ningún gasto más.': '{t}. No other fees.', '{t}. Falta sumar el envío: escribe tu ZIP code.': '{t}. Shipping not added yet: enter your ZIP code.',
  '{x} + envío': '{x} + shipping', 'Ver carrito: {n} artículos, {x}': 'View cart: {n} items, {x}', 'Abrir carrito': 'Open cart',
  '🏪 Recogida en tienda: <b>sin gastos de envío</b>': '🏪 Store pickup: <b>no shipping fee</b>',
  '🚚 Pon tu ZIP code para calcular el envío. <b>Gratis desde {x}</b> según la zona.': '🚚 Enter your ZIP code to calculate shipping. <b>Free over {x}</b> depending on the area.',
  '🚚 Envío a <b>{z}</b>: {x}': '🚚 Shipping to <b>{z}</b>: {x}', 'Te faltan <b>{x}</b> para el <b>envío gratis</b> 🚚': '<b>{x}</b> more for <b>free shipping</b> 🚚',
  '🎉 ¡Genial! Tienes <b>envío gratis</b>': '🎉 Nice! You get <b>free shipping</b>',
  '⚠️ No enviamos a ese ZIP code. Escríbenos por WhatsApp y lo vemos.': "⚠️ We don't ship to that ZIP code. Message us on WhatsApp and we'll figure it out.",
  'envío gratis': 'free shipping', '📅 Llegada estimada: <b>{x}</b>': '📅 Estimated arrival: <b>{x}</b>', '✓ {x} añadido': '✓ {x} added',
  '💵 Efectivo': '💵 Cash', '💳 Tarjeta': '💳 Card', 'Pagas al recoger en la tienda.': 'You pay when you pick it up at the store.',
  'Pagas al recibir el pedido.': 'You pay when you receive your order.', '🔗 Te mandamos cómo pagar': "🔗 We'll send you how to pay",
  // validación
  'Escribe la dirección de envío.': 'Enter your shipping address.', 'El ZIP code tiene 5 números.': 'The ZIP code has 5 digits.',
  'No enviamos a ese ZIP code. Escríbenos por WhatsApp.': "We don't ship to that ZIP code. Message us on WhatsApp.", 'Escribe la ciudad y el estado.': 'Enter your city and state.',
  'Escribe tu nombre.': 'Enter your name.', 'El teléfono debe tener 10 números.': 'The phone number must have 10 digits.',
  'Elige una forma de pago.': 'Choose a payment method.', 'Marca la casilla de protección de datos para continuar.': 'Check the privacy box to continue.',
  // pedido y confirmación
  'PEDIDO': 'ORDER', 'Subtotal': 'Subtotal', 'TOTAL': 'TOTAL', 'Recoge en tienda': 'Store pickup', 'Llegada estimada': 'Estimated arrival', 'Pago': 'Payment',
  'Pago por enlace (te lo mandamos por WhatsApp)': 'Payment link (we send it on WhatsApp)', 'Idioma del cliente: inglés': 'Customer language: English',
  '¡Pedido listo!': 'Order ready!', 'Tu número de pedido es': 'Your order number is', 'Copiar': 'Copy', '✓ Copiado': '✓ Copied', 'Mantén pulsado': 'Long-press to copy',
  '📲 Te hemos abierto <b>WhatsApp</b> con tu pedido ya escrito. Solo tienes que pulsar <b>Enviar</b> y te contestamos para confirmarlo.': "📲 We opened <b>WhatsApp</b> with your order already written. Just tap <b>Send</b> and we'll reply to confirm.",
  '💬 ¿No se ha abierto? Pulsa aquí': "💬 Didn't open? Tap here", 'Pedido hecho': 'Order placed', 'Te avisamos por WhatsApp': "We'll text you on WhatsApp",
  'Listo para recoger': 'Ready for pickup', 'Lo llevamos a tu casa': 'On its way to you', '¡Ven a por él!': 'Come pick it up!', 'Lo recibes y pagas': 'You get it and pay',
  'Estimado: {x}': 'Estimated: {x}', '💵 Pagas al recoger': '💵 Pay at pickup', '💵 Pagas al recibir': '💵 Pay on delivery',
  'En efectivo o con tarjeta, cuando vengas a por tu pedido.': 'Cash or card, when you come to pick up your order.',
  'En efectivo o con tarjeta, cuando te llegue el pedido.': 'Cash or card, when your order arrives.', '🔗 Pago por enlace': '🔗 Payment link',
  'Resumen': 'Summary', 'Total': 'Total', 'Recogida en {x}': 'Pickup at {x}', 'Seguir comprando': 'Keep shopping', '¡Gracias por tu pedido! 💙': 'Thanks for your order! 💙',
  'Tiras elásticas': 'Resistance bands'
};
let L = store.get('elastika-lang', null) || ((navigator.language || 'es').toLowerCase().startsWith('en') ? 'en' : 'es');
function T(s, v = {}) { let r = (L === 'en' && EN[s]) || s; for (const k in v) r = r.split('{' + k + '}').join(v[k]); return r; }
const tx = (o, k) => (L === 'en' && o?.[k + '_en']) || o?.[k] || '';
const loc = () => L === 'en' ? 'en-US' : 'es-US';
const catName = c => c === 'Todos' ? T('Todos') : (L === 'en' && D.categoriasEn?.[c]) || c;
const impuestos = () => tx(D.tienda, 'impuestosTexto') || T('Impuestos incluidos');
const NIVELES = ['', 'Suave', 'Media', 'Fuerte', 'Muy fuerte', 'Extra fuerte'];

function aplicarIdioma() {
  document.documentElement.lang = L;
  $$('[data-i]').forEach(el => { el.dataset.es ??= el.textContent; el.textContent = T(el.dataset.es); });
  $$('[data-iph]').forEach(el => { el.dataset.es ??= el.placeholder; el.placeholder = T(el.dataset.es); });
  $$('[data-ialt]').forEach(el => { el.dataset.es ??= el.alt; el.alt = T(el.dataset.es); });
  $$('#lang [data-l]').forEach(s => s.classList.toggle('on', s.dataset.l === L));
}

let D, cart = {}, filtro = 'Todos', busqueda = '', orden = '', guia = 2, ultimo = null, fichaId = null;

async function cargar() {
  if (new URLSearchParams(location.search).has('preview')) {
    try {
      const d = localStorage.getItem('elastika-borrador');
      if (d) { $('#preview-bar').hidden = false; return JSON.parse(d); }
    } catch {}
  }
  const r = await fetch('data.json?v=' + Date.now());
  return r.json();
}

const waLink = (texto, num = D.tienda.whatsapp) => `https://wa.me/${String(num).replace(/\D/g, '')}?text=${encodeURIComponent(texto)}`;
const prod = id => D.productos.find(p => p.id === id);
const nivelHTML = n => n ? `<div class="lvl"><div class="bars">${[1, 2, 3, 4, 5].map(i => `<i class="bar ${i <= n ? 'f' : ''}"></i>`).join('')}</div><span>${T(NIVELES[n])}</span></div>` : '';
const precioHTML = p => `<div class="price"><b>${money(p.precio)}</b>${p.precioAntes ? `<span class="was">${T('antes')} <s>${money(p.precioAntes)}</s></span><span class="save">${T('Ahorras {x}', { x: money(p.precioAntes - p.precio) })}</span>` : ''}</div>`;

/* ---------- Envíos: zona por ZIP code y fecha estimada ---------- */
function zonaPorCP(cp) {
  cp = String(cp || '').replace(/\D/g, '');
  if (cp.length !== 5) return null;
  let mejor = null, largo = -1;
  for (const z of D.envios.zonas) {
    for (const pre of String(z.prefijos).split(',').map(s => s.trim()).filter(Boolean)) {
      const l = pre === '*' ? 0 : pre.length;
      if ((pre === '*' || cp.startsWith(pre)) && l > largo) { mejor = z; largo = l; }
    }
  }
  return mejor;
}
const costeZona = (z, sub) => !z ? 0 : (z.gratisDesde && sub >= z.gratisDesde ? 0 : Number(z.precio));
function sumarLaborables(n) {
  const d = new Date();
  if (d.getHours() >= 14) n++;            // pedidos de tarde salen al día siguiente
  while (n > 0) { d.setDate(d.getDate() + 1); if (d.getDay() % 6) n--; }
  return d;
}
const fmtDia = d => d.toLocaleDateString(loc(), { weekday: 'short', month: 'short', day: 'numeric' });
function plazoTexto(z) {
  const a = sumarLaborables(z.diasMin), b = sumarLaborables(z.diasMax);
  return z.diasMin === z.diasMax ? fmtDia(a) : `${fmtDia(a)} – ${fmtDia(b)}`;
}
const diasTexto = z => z.diasMin === z.diasMax ? T(z.diasMin === 1 ? '{x} día hábil' : '{x} días hábiles', { x: z.diasMin }) : T('{x} días hábiles', { x: `${z.diasMin}–${z.diasMax}` });
const pagaAlRecibir = (tienda, zona) => tienda || !zona || zona.pagoAlRecibir !== false;

/* ---------- Pintar la web ---------- */
function pintar() {
  aplicarIdioma();
  $$('[data-t]').forEach(el => {
    const parts = el.dataset.t.split('.'), k = parts.pop(), o = get(D, parts.join('.'));
    const v = tx(o, k); if (v != null) el.textContent = v;
  });
  document.title = `${D.tienda.nombre} · ${T('Tiras elásticas')}`;
  $('#hero-img').src = D.portada.imagen;

  const saludo = T('¡Hola {x}! Tengo una pregunta sobre vuestras tiras elásticas.', { x: D.tienda.nombre });
  ['#wa-float', '#foot-wa', '#cta-wa'].forEach(s => $(s).href = waLink(saludo));
  const tel = 'tel:+1' + String(D.tienda.telefono).replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '');
  $('#tel-link').href = $('#call-link').href = tel;
  $('#mail-link').href = $('#foot-mail').href = 'mailto:' + D.tienda.email;
  $('#ig').href = D.tienda.instagram; $('#fb').href = D.tienda.facebook;
  const q = encodeURIComponent(D.tienda.direccion);
  $('#map').src = `https://maps.google.com/maps?q=${q}&z=16&output=embed`;
  $('#maps-link').href = `https://www.google.com/maps/search/?api=1&query=${q}`;
  $('#year').textContent = new Date().getFullYear();

  const star = D.productos.find(p => p.destacado && !p.agotado) || D.productos[0];
  $('#fc-prod').innerHTML = star ? `<img src="${esc(star.imagen)}" alt=""><div><small>${T('⭐ El más vendido')}</small><b>${esc(tx(star, 'nombre'))}</b><span class="pr">${money(star.precio)}</span></div>` : '';
  $('#fc-prod').onclick = () => star && abrirFicha(star.id);

  const frases = [...(D.ventajas || []).map(v => tx(v, 'titulo')), ...(D.usos || []).map(u => tx(u, 'titulo'))];
  const tira = frases.map(f => `<span>${esc(f)}</span>`).join('');
  $('#marquee').innerHTML = tira + tira;

  $('#usos-grid').innerHTML = (D.usos || []).map((u, i) =>
    `<div class="uso reveal in" style="transition-delay:${i * 80}ms"><div class="ic">${esc(u.icono)}</div><h3>${esc(tx(u, 'titulo'))}</h3><p>${esc(tx(u, 'texto'))}</p></div>`).join('');
  $('#ventajas').innerHTML = D.ventajas.map((v, i) =>
    `<div class="perk reveal in" style="transition-delay:${i * 80}ms"><div class="ic">${esc(v.icono)}</div><div><h3>${esc(tx(v, 'titulo'))}</h3><p>${esc(tx(v, 'texto'))}</p></div></div>`).join('');
  $('#reviews').innerHTML = D.opiniones.map((o, i) =>
    `<div class="review reveal in" style="transition-delay:${i * 80}ms"><div class="st">${'★'.repeat(o.estrellas)}${'☆'.repeat(5 - o.estrellas)}</div><p>${esc(tx(o, 'texto'))}</p>
     <div class="who"><i style="background:${COLORES[i % COLORES.length]}">${esc((o.nombre || '?')[0])}</i><div><b>${esc(o.nombre)}</b><small>${T('✔ Compra verificada')}</small></div></div></div>`).join('');
  $('#faq-list').innerHTML = D.faq.map(f => `<details><summary>${esc(tx(f, 'p'))}</summary><p>${esc(tx(f, 'r'))}</p></details>`).join('');

  const metodos = [D.pagos?.efectivo?.activo && T('Efectivo'), D.pagos?.tarjeta?.activo && T('Tarjeta')].filter(Boolean);
  $('#pay-chips').innerHTML = `<span>${T('Aceptamos')}</span>${metodos.map(m => `<i>${esc(m)}</i>`).join('')}<i class="tax">✓ ${esc(impuestos())}</i>`;

  pintarZonas(); pintarPagos(); calcEnvio();
  pintarFiltros(); pintarCatbar(); pintarProductos(); observar();
}

function pintarZonas() {
  const rec = D.envios.recogida;
  $('#zones').innerHTML = D.envios.zonas.map(z => `
    <div class="zone-card">
      <h3>${esc(tx(z, 'nombre'))}</h3>
      <div class="zc-price">${money(z.precio)}</div>
      <ul>
        <li>⏱ ${diasTexto(z)}</li>
        ${z.gratisDesde ? `<li>🎁 ${T('Gratis desde {x}', { x: money(z.gratisDesde) })}</li>` : ''}
        <li>${z.pagoAlRecibir !== false ? T('💵 Pagas al recibir') : T('🔗 Pago por enlace')}</li>
      </ul>
    </div>`).join('') + (rec?.activa ? `
    <div class="zone-card pick">
      <h3>${T('Recogida en tienda')}</h3>
      <div class="zc-price">${T('Gratis')}</div>
      <ul><li>📍 ${esc(D.tienda.direccion)}</li><li>⏱ ${esc(tx(rec, 'texto'))}</li></ul>
    </div>` : '');
  $('#opt-recogida').hidden = !rec?.activa;
}
function calcEnvio() {
  const v = $('#calc-cp').value, z = zonaPorCP(v), out = $('#calc-out');
  if (v.replace(/\D/g, '').length < 5) { out.innerHTML = T('Precio y fecha estimada de llegada'); out.className = 'calc-out'; return; }
  if (!z) { out.innerHTML = T('No hacemos envíos a ese ZIP code. Escríbenos y lo vemos.'); out.className = 'calc-out bad'; return; }
  out.className = 'calc-out ok';
  out.innerHTML = `<b>${esc(tx(z, 'nombre'))}</b> · ${money(z.precio)}${z.gratisDesde ? T(' (gratis desde {x})', { x: money(z.gratisDesde) }) : ''}<br>${T('📅 Si pides hoy, llega {x}', { x: `<b>${plazoTexto(z)}</b>` })}`;
}

function pintarCatbar() {
  const cats = ['Todos', ...D.categorias.filter(c => D.productos.some(p => p.categoria === c))];
  $('#catbar').innerHTML = `<span class="cb-label">${T('Categorías:')}</span>` + cats.map(c =>
    `<button class="cchip ${c === filtro ? 'on' : ''}" data-cat="${esc(c)}">${esc(catName(c))}</button>`).join('') +
    `<a class="cchip guide-chip" href="#guia">${T('¿Cuál elijo?')}</a>`;
}
function pintarFiltros() {
  const cats = ['Todos', ...D.categorias.filter(c => D.productos.some(p => p.categoria === c))];
  $('#filters').innerHTML = cats.map(c => {
    const n = c === 'Todos' ? D.productos.length : D.productos.filter(p => p.categoria === c).length;
    return `<button class="chip ${c === filtro ? 'on' : ''}" data-c="${esc(c)}">${esc(catName(c))}<small>${n}</small></button>`;
  }).join('');
}

function pintarProductos() {
  const t = busqueda.trim().toLowerCase();
  let lista = D.productos.filter(p => (filtro === 'Todos' || p.categoria === filtro) &&
    (!t || `${p.nombre} ${p.nombre_en || ''} ${p.descripcion} ${p.descripcion_en || ''} ${catName(p.categoria)}`.toLowerCase().includes(t)));
  if (orden) lista = [...lista].sort((a, b) => orden === 'asc' ? a.precio - b.precio : b.precio - a.precio);
  else lista = [...lista].sort((a, b) => (a.agotado - b.agotado));
  $('#noresults').hidden = lista.length > 0;
  $('#grid').innerHTML = lista.map((p, i) => `
    <article class="card ${p.agotado ? 'out' : ''}" data-open="${esc(p.id)}" style="animation-delay:${i * 50}ms">
      ${p.agotado ? `<span class="badge out">${T('Agotado')}</span>` : p.destacado ? `<span class="badge">${T('⭐ Más vendido')}</span>` : ''}
      ${p.precioAntes && !p.agotado ? `<span class="badge sale">-${Math.round(100 - p.precio / p.precioAntes * 100)}%</span>` : ''}
      <div class="ph"><img src="${esc(p.imagen)}" alt="${esc(tx(p, 'nombre'))}" loading="lazy"><span class="quick">${T('Ver detalles')}</span></div>
      <div class="bd">
        <span class="cat">${esc(catName(p.categoria))}</span>
        <h3>${esc(tx(p, 'nombre'))}</h3>
        ${nivelHTML(p.nivel)}
        <p>${esc(tx(p, 'descripcion'))}</p>
        <div class="foot-row">${precioHTML(p)}
          <button class="add" data-id="${esc(p.id)}" ${p.agotado ? 'disabled' : ''} aria-label="${esc(T('Añadir {x} al carrito', { x: tx(p, 'nombre') }))}">+</button>
        </div>
      </div>
    </article>`).join('');
}

/* ---------- Guía de resistencia ---------- */
function recomendar(n) {
  guia = n;
  $$('#opts button').forEach(b => b.classList.toggle('on', +b.dataset.n === n));
  const disp = D.productos.filter(p => !p.agotado && p.nivel);
  const ord = (a, b) => Math.abs(a.nivel - n) - Math.abs(b.nivel - n) || (a.categoria === 'Packs') - (b.categoria === 'Packs') || b.destacado - a.destacado;
  const [p, alt] = [...disp].sort(ord);
  const otra = disp.find(x => x.categoria === 'Packs' && x !== p) || alt;
  if (!p) return;
  $('#guide-r').innerHTML = `<div class="reco">
    <img src="${esc(p.imagen)}" alt="">
    <div><span class="tag">${T('✔ Te recomendamos')}</span><h3>${esc(tx(p, 'nombre'))}</h3>${nivelHTML(p.nivel)}<p>${esc(tx(p, 'descripcion'))}</p>
      <div class="row">${precioHTML(p)}<button class="btn btn-accent add-reco" data-id="${esc(p.id)}">${T('Añadir al carrito')}</button></div></div>
    ${otra ? `<div class="reco-alt">${T('💡 ¿Quieres ir progresando? Mira también {x}.', { x: `<a data-open="${esc(otra.id)}">${esc(tx(otra, 'nombre'))}</a> (${money(otra.precio)})` })}</div>` : ''}
  </div>`;
}

/* ---------- Ficha de producto ---------- */
let fichaQty = 1;
function abrirFicha(id, qty = 1) {
  const p = prod(id); if (!p) return;
  fichaId = id; fichaQty = qty;
  const minEnvio = Math.min(...D.envios.zonas.map(z => z.precio));
  const nombre = tx(p, 'nombre');
  $('#modal-in').innerHTML = `
    <div class="mimg">${p.precioAntes && !p.agotado ? `<span class="badge sale">-${Math.round(100 - p.precio / p.precioAntes * 100)}%</span>` : ''}<img src="${esc(p.imagen)}" alt="${esc(nombre)}"></div>
    <div class="mbody">
      <span class="cat">${esc(catName(p.categoria))}</span>
      <h3>${esc(nombre)}</h3>
      ${nivelHTML(p.nivel)}
      ${precioHTML(p)}
      <p class="desc">${esc(tx(p, 'descripcion'))}</p>
      <ul class="mlist">
        <li>${T('Envío desde {x}', { x: money(minEnvio) })} · <a href="#envios" data-close>${T('ver plazos y precios')}</a></li>
        ${D.envios.recogida?.activa ? `<li>${T('Recogida en tienda sin coste')}</li>` : ''}
        <li>${T('Te asesoramos por WhatsApp')}</li>
      </ul>
      ${p.agotado ? `<p class="mask">${T('😔 Ahora mismo está agotado.')} <a href="${waLink(T('Hola, ¿cuándo volveréis a tener "{x}"?', { x: nombre }))}" target="_blank" rel="noopener">${T('Avísame cuando vuelva')}</a></p>` : `
      <div class="mbuy">
        <div class="stepper"><button data-fq="-1" aria-label="${T('Menos')}">−</button><span id="fq">${qty}</span><button data-fq="1" aria-label="${T('Más')}">+</button></div>
        <button class="btn btn-accent btn-lg" id="m-add" data-id="${esc(p.id)}">${T('Añadir')} · <span id="m-sum">${money(p.precio * qty)}</span></button>
      </div>
      <p class="mask" id="m-calc"></p>
      <p class="mask">${T('¿Dudas con este producto?')} <a href="${waLink(T('Hola, tengo una duda sobre "{x}"', { x: nombre }))}" target="_blank" rel="noopener">${T('Pregúntanos por WhatsApp')}</a></p>`}
    </div>`;
  if (!p.agotado) calcFicha();
  $('#modal').hidden = false; bloquear();
}
function calcFicha() {
  const pr = prod(fichaId).precio;
  $('#fq').textContent = fichaQty;
  $('#m-sum').textContent = money(pr * fichaQty);
  $('#m-calc').textContent = fichaQty === 1
    ? T('{x} por unidad · {t} · el envío se calcula en el carrito', { x: money(pr), t: impuestos() })
    : T('{n} × {x} = {s} · {t} · el envío se calcula en el carrito', { n: fichaQty, x: money(pr), s: money(pr * fichaQty), t: impuestos() });
}
function cerrarFicha() { $('#modal').hidden = true; fichaId = null; bloquear(); }

/* ---------- Carrito ---------- */
const lineas = () => Object.entries(cart).map(([id, q]) => ({ p: prod(id), q })).filter(l => l.p && l.q > 0);
const form = () => $('#checkout');
function calc() {
  const f = form(), ls = lineas();
  const sub = ls.reduce((a, l) => a + l.p.precio * l.q, 0);
  const tienda = f.entrega.value === 'tienda';
  const zona = tienda ? null : zonaPorCP(f.cp.value);
  const envio = tienda || sub === 0 ? 0 : costeZona(zona, sub);
  return { ls, sub, envio, total: sub + envio, tienda, zona };
}

// Pago: efectivo o tarjeta al recibir/recoger. Fuera de la zona de entrega se paga por enlace.
function pintarPagos() {
  const { tienda, zona } = calc();
  const actual = form().pago?.value;
  let ops = [];
  if (pagaAlRecibir(tienda, zona)) {
    if (D.pagos?.efectivo?.activo) ops.push(['efectivo', T('💵 Efectivo')]);
    if (D.pagos?.tarjeta?.activo) ops.push(['tarjeta', T('💳 Tarjeta')]);
  }
  if (!ops.length) ops = [['enlace', T('🔗 Te mandamos cómo pagar')]];
  const sel = ops.some(o => o[0] === actual) ? actual : ops[0][0];
  $('#seg-pago').className = 'seg' + (ops.length === 1 ? ' seg1' : '');
  $('#seg-pago').innerHTML = ops.map(([v, t]) => `<label><input type="radio" name="pago" value="${v}" ${v === sel ? 'checked' : ''}><span>${t}</span></label>`).join('');
  $('#pay-help').textContent = sel === 'enlace' ? tx(D.envios, 'notaPagoEnvio') : tienda ? T('Pagas al recoger en la tienda.') : T('Pagas al recibir el pedido.');
}
const nombrePago = v => v === 'efectivo' ? T('Efectivo') : v === 'tarjeta' ? T('Tarjeta') : T('Pago por enlace (te lo mandamos por WhatsApp)');

function pintarCarrito() {
  const { ls, sub, envio, total, tienda, zona } = calc();
  const n = ls.reduce((a, l) => a + l.q, 0);
  const hecho = !$('#done').hidden;
  $('#cart-count').textContent = n;
  $('#cart-count2').textContent = n && !hecho ? `(${n})` : '';
  $('#cart-empty').hidden = n > 0 || hecho;
  form().hidden = n === 0 || hecho;
  $('#cart-items').hidden = hecho;
  $('#cart-items').innerHTML = ls.map(({ p, q }) => `
    <div class="ci"><img src="${esc(p.imagen)}" alt="">
      <div class="n"><b>${esc(tx(p, 'nombre'))}</b><span class="unit">${T('{x} / unidad', { x: money(p.precio) })}</span><button class="rm" data-rm="${esc(p.id)}">${T('Quitar')}</button></div>
      <div class="ci-r"><div class="qty"><button data-q="-1" data-id="${esc(p.id)}" aria-label="${T('Menos')}">−</button><span>${q}</span><button data-q="1" data-id="${esc(p.id)}" aria-label="${T('Más')}">+</button></div><b class="line">${money(p.precio * q)}</b></div>
    </div>`).join('');

  // barra de envío gratis
  const minGratis = Math.min(...D.envios.zonas.map(z => z.gratisDesde || Infinity));
  let bar = '';
  if (n && !hecho) {
    if (tienda) bar = T('🏪 Recogida en tienda: <b>sin gastos de envío</b>');
    else if (!zona) bar = T('🚚 Pon tu ZIP code para calcular el envío. <b>Gratis desde {x}</b> según la zona.', { x: money(minGratis) });
    else if (!zona.gratisDesde) bar = T('🚚 Envío a <b>{z}</b>: {x}', { z: esc(tx(zona, 'nombre')), x: money(zona.precio) });
    else {
      const falta = zona.gratisDesde - sub;
      bar = `${falta > 0 ? T('Te faltan <b>{x}</b> para el <b>envío gratis</b> 🚚', { x: money(falta) }) : T('🎉 ¡Genial! Tienes <b>envío gratis</b>')}
        <div class="prog ${falta <= 0 ? 'full' : ''}"><div style="width:${Math.min(100, sub / zona.gratisDesde * 100)}%"></div></div>`;
    }
  }
  $('#ship-bar').innerHTML = bar;

  const envioConocido = tienda || !!zona;
  $('#totals').innerHTML = `
    <div><span>${T('Productos ({n})', { n })}</span><span>${money(sub)}</span></div>
    <div><span>${T('Envío')}${zona ? `<small>${esc(tx(zona, 'nombre'))}</small>` : tienda ? `<small>${T('Recogida en tienda')}</small>` : ''}</span>
      <span>${!envioConocido ? `<em>${T('se calcula abajo ↓')}</em>` : envio ? '+ ' + money(envio) : `<b class="free">${T('GRATIS')}</b>`}</span></div>
    <div class="t"><span>${envioConocido ? T('Total a pagar') : T('Total sin envío')}</span><span>${money(total)}</span></div>
    <p class="iva">${envioConocido ? T('{t}. No hay ningún gasto más.', { t: esc(impuestos()) }) : T('{t}. Falta sumar el envío: escribe tu ZIP code.', { t: esc(impuestos()) })}</p>`;
  $('#btn-total').textContent = envioConocido ? money(total) : T('{x} + envío', { x: money(total) });
  pintarBarra(n, sub);

  $('#ship-fields').hidden = tienda;
  $('#pickup-info').hidden = !tienda;
  $('#pickup-info').innerHTML = `📍 <b>${esc(D.tienda.direccion)}</b><br>🕒 ${esc(tx(D.tienda, 'horario'))}<br>✅ ${esc(tx(D.envios.recogida, 'texto'))}`;
  const cpv = form().cp.value.replace(/\D/g, '');
  const zi = $('#zone-info');
  if (cpv.length < 5) { zi.innerHTML = ''; zi.className = 'zone'; }
  else if (!zona) { zi.innerHTML = T('⚠️ No enviamos a ese ZIP code. Escríbenos por WhatsApp y lo vemos.'); zi.className = 'zone bad'; }
  else { zi.className = 'zone ok'; zi.innerHTML = `📦 <b>${esc(tx(zona, 'nombre'))}</b> · ${envio ? money(envio) : T('envío gratis')}<br>${T('📅 Llegada estimada: <b>{x}</b>', { x: plazoTexto(zona) })}`; }
  store.set('elastika-carrito', cart);
}

// carrito de arriba: muestra cuántos artículos y el importe
function pintarBarra(n, sub) {
  $('#open-cart').classList.toggle('full', n > 0);
  $('#cart-sum').hidden = !n;
  $('#cart-sum').textContent = money(sub);
  $('#open-cart').setAttribute('aria-label', n ? T('Ver carrito: {n} artículos, {x}', { n, x: money(sub) }) : T('Abrir carrito'));
}

function anadir(id, d = 1, aviso = true) {
  if (!$('#done').hidden) { $('#done').hidden = true; }
  cart[id] = Math.max(0, (cart[id] || 0) + d);
  if (!cart[id]) delete cart[id];
  pintarCarrito();
  if (d > 0 && aviso) {
    toast(T('✓ {x} añadido', { x: tx(prod(id), 'nombre') }));
    const b = $('#open-cart'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump');
  }
}

/* ---------- Pedido ---------- */
function numeroPedido() {
  const d = new Date(), pad = x => String(x).padStart(2, '0');
  return `${D.pedidos?.prefijo || 'PED'}-${pad(d.getMonth() + 1)}${pad(d.getDate())}-${Math.floor(100 + Math.random() * 900)}`;
}
function validar() {
  const f = form(); const { tienda, zona } = calc();
  $$('.bad-input', f).forEach(e => e.classList.remove('bad-input'));
  const err = (el, msg) => { el.classList.add('bad-input'); el.focus(); $('#form-err').textContent = T(msg); return false; };
  if (!tienda) {
    if (f.direccion.value.trim().length < 5) return err(f.direccion, 'Escribe la dirección de envío.');
    if (!/^\d{5}$/.test(f.cp.value.trim())) return err(f.cp, 'El ZIP code tiene 5 números.');
    if (!zona) return err(f.cp, 'No enviamos a ese ZIP code. Escríbenos por WhatsApp.');
    if (!f.ciudad.value.trim()) return err(f.ciudad, 'Escribe la ciudad y el estado.');
  }
  if (f.nombre.value.trim().length < 2) return err(f.nombre, 'Escribe tu nombre.');
  if (f.telefono.value.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '').length < 10) return err(f.telefono, 'El teléfono debe tener 10 números.');
  if (!f.pago?.value) { $('#form-err').textContent = T('Elige una forma de pago.'); return false; }
  if (!f.acepto.checked) { $('#form-err').textContent = T('Marca la casilla de protección de datos para continuar.'); return false; }
  $('#form-err').textContent = '';
  return true;
}
function crearPedido() {
  const f = form(); const { ls, sub, envio, total, tienda, zona } = calc();
  return {
    n: numeroPedido(), fecha: new Date().toISOString(), lang: L,
    cliente: { nombre: f.nombre.value.trim(), tel: f.telefono.value.trim() },
    entrega: tienda ? { tipo: 'tienda' } : {
      tipo: 'envio', direccion: f.direccion.value.trim(), cp: f.cp.value.trim(), ciudad: f.ciudad.value.trim(),
      zona: tx(zona, 'nombre'), llegada: plazoTexto(zona)
    },
    items: ls.map(l => ({ id: l.p.id, nombre: tx(l.p, 'nombre'), q: l.q, precio: l.p.precio })),
    sub, envio, total, pago: f.pago.value, notas: f.notas.value.trim()
  };
}
// mensaje que le llega a la tienda por WhatsApp (en el idioma del cliente)
function textoPedido(o) {
  const e = o.entrega;
  return [
    `🛒 *${T('PEDIDO')} ${o.n}*`, `${D.tienda.nombre} · ${new Date(o.fecha).toLocaleString(loc(), { dateStyle: 'short', timeStyle: 'short' })}`, '',
    ...o.items.map(i => `• ${i.q} × ${i.nombre} — ${money(i.precio * i.q)}`), '',
    `${T('Subtotal')}: ${money(o.sub)}`, `${T('Envío')}: ${o.envio ? money(o.envio) : T('Gratis')}`, `*${T('TOTAL')}: ${money(o.total)}* (${impuestos()})`, '',
    `👤 ${o.cliente.nombre}`, `📞 ${o.cliente.tel}`,
    e.tipo === 'tienda' ? `🏪 *${T('Recoge en tienda')}*` : `🚚 *${T('Envío')}* (${e.zona})\n${e.direccion}\n${e.ciudad} ${e.cp}\n${T('Llegada estimada')}: ${e.llegada}`,
    `💳 ${T('Pago')}: ${nombrePago(o.pago)}`,
    o.notas ? `📝 ${o.notas}` : '',
    o.lang === 'en' ? `🌐 ${EN['Idioma del cliente: inglés']} / Idioma del cliente: inglés` : ''
  ].filter(x => x !== '').join('\n');
}

function pintarHecho(o) {
  const e = o.entrega;
  const pago = o.pago === 'enlace'
    ? `<h4>${T('🔗 Pago por enlace')}</h4><p class="mini">${esc(tx(D.envios, 'notaPagoEnvio'))}</p>`
    : e.tipo === 'tienda'
      ? `<h4>${T('💵 Pagas al recoger')}</h4><p class="mini">${T('En efectivo o con tarjeta, cuando vengas a por tu pedido.')}</p>`
      : `<h4>${T('💵 Pagas al recibir')}</h4><p class="mini">${T('En efectivo o con tarjeta, cuando te llegue el pedido.')}</p>`;
  const wa = waLink(textoPedido(o));
  $('#done').innerHTML = `
    <div class="done-head">
      <div class="tick"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"/><path d="M15 27l7 7 15-16"/></svg></div>
      <h3>${T('¡Pedido listo!')}</h3>
      <p>${T('Tu número de pedido es')}</p>
      <div class="order-n">${esc(o.n)} <button type="button" class="copy" data-copy="${esc(o.n)}">${T('Copiar')}</button></div>
    </div>
    <div class="step-box warn">${T('📲 Te hemos abierto <b>WhatsApp</b> con tu pedido ya escrito. Solo tienes que pulsar <b>Enviar</b> y te contestamos para confirmarlo.')}</div>
    <a class="btn btn-wa btn-lg wide" href="${wa}" target="_blank" rel="noopener" id="wa-send">${T('💬 ¿No se ha abierto? Pulsa aquí')}</a>
    <ol class="timeline">
      <li class="on"><b>${T('Pedido hecho')}</b><small>${new Date(o.fecha).toLocaleString(loc(), { dateStyle: 'medium', timeStyle: 'short' })}</small></li>
      <li><b>${T('Te lo confirmamos')}</b><small>${T('Te avisamos por WhatsApp')}</small></li>
      <li><b>${e.tipo === 'tienda' ? T('Listo para recoger') : T('Lo llevamos a tu casa')}</b><small>${e.tipo === 'tienda' ? esc(tx(D.envios.recogida, 'texto')) : T('Estimado: {x}', { x: esc(e.llegada) })}</small></li>
      <li><b>${e.tipo === 'tienda' ? T('¡Ven a por él!') : T('Lo recibes y pagas')}</b><small>${e.tipo === 'tienda' ? esc(tx(D.tienda, 'horario')) : esc(nombrePago(o.pago))}</small></li>
    </ol>
    <div class="pay-box">${pago}</div>
    <div class="sum-box">
      <h4>${T('Resumen')}</h4>
      ${o.items.map(i => `<div><span>${i.q} × ${esc(i.nombre)}</span><span>${money(i.precio * i.q)}</span></div>`).join('')}
      <div><span>${T('Envío')}</span><span>${o.envio ? money(o.envio) : T('Gratis')}</span></div>
      <div class="t"><span>${T('Total')}</span><span>${money(o.total)}</span></div>
      <p class="mini">${esc(impuestos())} · ${e.tipo === 'tienda' ? T('Recogida en {x}', { x: esc(D.tienda.direccion) }) : `🚚 ${esc(e.direccion)}, ${esc(e.ciudad)} ${esc(e.cp)}`}</p>
    </div>
    <button class="btn btn-primary wide" id="new-order" type="button">${T('Seguir comprando')}</button>`;
}

function confirmar(e) {
  e.preventDefault();
  if (!validar()) return;
  const o = crearPedido();
  const f = form();
  store.set('elastika-cliente', { nombre: f.nombre.value, telefono: f.telefono.value, direccion: f.direccion.value, cp: f.cp.value, ciudad: f.ciudad.value });
  // abre WhatsApp con el pedido escrito: así le llega a la tienda
  window.Cuenta?.pedido(o);
  window.open(waLink(textoPedido(o)), '_blank');
  cart = {}; store.set('elastika-carrito', cart);
  ultimo = o;
  pintarHecho(o);
  $('#done').hidden = false;
  pintarCarrito();
  $('.drawer-body').scrollTop = 0;
}

function abrir(on) {
  $('#drawer').classList.toggle('open', on);
  $('#overlay').hidden = !on;
  $('#drawer').setAttribute('aria-hidden', !on);
  bloquear();
  pintarCarrito();
}
function bloquear() { document.body.classList.toggle('lock', $('#drawer').classList.contains('open') || !$('#modal').hidden); }
function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), 2200); }

function cambiarIdioma(nuevo) {
  L = nuevo; store.set('elastika-lang', L);
  pintar(); pintarPagos(); pintarCarrito(); recomendar(guia);
  if (fichaId) abrirFicha(fichaId, fichaQty);
  if (ultimo && !$('#done').hidden) pintarHecho(ultimo);
}

/* ---------- Animaciones y navegación ---------- */
let io;
function observar() {
  if (!('IntersectionObserver' in window)) return $$('.reveal').forEach(e => e.classList.add('in'));
  io = io || new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
  $$('.reveal:not(.in)').forEach(e => io.observe(e));
}
const spy = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) $$('.links a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id));
}), { rootMargin: '-45% 0px -50% 0px' });
$$('main section[id]').forEach(s => spy.observe(s));
addEventListener('scroll', () => $('#nav').classList.toggle('scrolled', scrollY > 10), { passive: true });
setTimeout(() => { const t = $('.wa-tip'); t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 4000); }, 6000);

/* ---------- Eventos ---------- */
document.addEventListener('click', async e => {
  const add = e.target.closest('.add, .add-reco');
  if (add) {
    e.stopPropagation(); anadir(add.dataset.id);
    if (add.classList.contains('add')) { add.classList.add('ok'); add.textContent = '✓'; setTimeout(() => { add.classList.remove('ok'); add.textContent = '+'; }, 1200); }
    return;
  }
  const cp = e.target.closest('[data-copy]');
  if (cp) {
    try { await navigator.clipboard.writeText(cp.dataset.copy); cp.textContent = T('✓ Copiado'); }
    catch { cp.textContent = T('Mantén pulsado'); }
    setTimeout(() => cp.textContent = T('Copiar'), 1800); return;
  }
  if (e.target.closest('#lang')) { cambiarIdioma(L === 'es' ? 'en' : 'es'); return; }
  if (e.target.closest('#new-order')) { $('#done').hidden = true; ultimo = null; pintarCarrito(); abrir(false); toast(T('¡Gracias por tu pedido! 💙')); return; }
  const mAdd = e.target.closest('#m-add');
  if (mAdd) { anadir(mAdd.dataset.id, fichaQty); cerrarFicha(); abrir(true); return; }
  const fq = e.target.closest('[data-fq]');
  if (fq) { fichaQty = Math.max(1, fichaQty + +fq.dataset.fq); calcFicha(); return; }
  const open = e.target.closest('[data-open]');
  if (open) { abrirFicha(open.dataset.open); return; }
  const q = e.target.closest('[data-q]');
  if (q) { anadir(q.dataset.id, +q.dataset.q, false); return; }
  const rm = e.target.closest('[data-rm]');
  if (rm) { delete cart[rm.dataset.rm]; pintarCarrito(); return; }
  const chip = e.target.closest('.chip');
  if (chip) { filtro = chip.dataset.c; pintarFiltros(); pintarCatbar(); pintarProductos(); return; }
  const cc = e.target.closest('[data-cat]');
  if (cc) {
    filtro = cc.dataset.cat; pintarFiltros(); pintarCatbar(); pintarProductos();
    $('#productos').scrollIntoView({ behavior: 'smooth' });
    return;
  }
  const opt = e.target.closest('#opts button');
  if (opt) { recomendar(+opt.dataset.n); return; }
  if (e.target.closest('[data-close]') || e.target === $('#modal')) cerrarFicha();
  if (e.target.closest('.links a')) { $('#links').classList.remove('open'); $('#burger').classList.remove('open'); }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') { cerrarFicha(); abrir(false); } });
$('#open-cart').onclick = () => abrir(true);
$('#close-cart').onclick = $('#overlay').onclick = () => abrir(false);
$('#go-shop').onclick = () => abrir(false);
$('#burger').onclick = () => { $('#links').classList.toggle('open'); $('#burger').classList.toggle('open'); };
$('#q').oninput = e => { busqueda = e.target.value; pintarProductos(); };
$('#orden').onchange = e => { orden = e.target.value; pintarProductos(); };
$('#calc-cp').oninput = calcEnvio;
form().addEventListener('change', e => { if (e.target.name !== 'pago') pintarPagos(); pintarCarrito(); });
form().addEventListener('input', e => {
  e.target.classList.remove('bad-input');
  if (e.target.name === 'cp') { if (!$('#calc-cp').value) { $('#calc-cp').value = e.target.value; calcEnvio(); } pintarPagos(); pintarCarrito(); }
});
form().addEventListener('submit', confirmar);

(async () => {
  D = await cargar();
  D.envios ||= { zonas: [{ nombre: 'EE. UU.', prefijos: '*', precio: 9.99, gratisDesde: 75, diasMin: 3, diasMax: 6 }], recogida: { activa: true, texto: '' } };
  D.pagos ||= { efectivo: { activo: true }, tarjeta: { activo: true } };
  cart = store.get('elastika-carrito', {});
  const c = store.get('elastika-cliente', null);
  if (c) for (const k in c) if (form()[k]) form()[k].value = c[k];
  pintar(); pintarCarrito(); recomendar(2);
  if (c?.cp) { $('#calc-cp').value = c.cp; calcEnvio(); }
})();
