// Panel de administración — guarda los cambios directamente en el repositorio de GitHub
// (la web se actualiza sola en ~1 minuto gracias a GitHub Pages).

// Repositorio donde vive la web. Si se deja vacío se detecta solo a partir de la URL
// (usuario.github.io/repositorio).
const CONFIG = { owner: '', repo: '' };

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const NIVELES_OPC = [{ v: 1, t: '●○○○○ Suave' }, { v: 2, t: '●●○○○ Media' }, { v: 3, t: '●●●○○ Fuerte' }, { v: 4, t: '●●●●○ Muy fuerte' }, { v: 5, t: '●●●●● Extra fuerte' }];
const KEY_TOKEN = 'elastika-token', KEY_DRAFT = 'elastika-borrador';

let token = '', repo = null, branch = 'main', demo = false;
let D = null, original = '', pendientes = {}; // pendientes: ruta -> {base64, dataUrl}
let tab = 'productos';

/* ---------- utilidades ---------- */
function toast(t, bad) { const el = $('#toast'); el.textContent = t; el.className = 'toast show' + (bad ? ' bad' : ''); clearTimeout(toast.t); toast.t = setTimeout(() => el.className = 'toast', 3200); }
function cargando(t) { $('#loading').hidden = !t; if (t) $('#loading-t').textContent = t; }
function detectarRepo() {
  if (CONFIG.owner && CONFIG.repo) return { owner: CONFIG.owner, repo: CONFIG.repo };
  const m = location.hostname.match(/^([^.]+)\.github\.io$/i);
  if (!m) return null;
  const first = location.pathname.split('/').filter(Boolean)[0];
  const isFile = !first || first.includes('.');
  return { owner: m[1], repo: isFile ? `${m[1]}.github.io` : first };
}
async function gh(path, opts = {}) {
  const r = await fetch(`https://api.github.com/repos/${repo.owner}/${repo.repo}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', ...(opts.headers || {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  if (!r.ok) throw new Error(`GitHub ${r.status}: ${(await r.text()).slice(0, 160)}`);
  return r.status === 204 ? null : r.json();
}
function b64utf8(str) { const bytes = new TextEncoder().encode(str); let s = ''; bytes.forEach(b => s += String.fromCharCode(b)); return btoa(s); }
function imgSrc(ruta) { return pendientes[ruta]?.dataUrl || ruta; }
function slug(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'foto'; }

/* ---------- login ---------- */
async function entrar(t) {
  token = t.trim();
  demo = token.toLowerCase() === 'demo';
  cargando('Comprobando acceso…');
  try {
    if (demo) {
      D = await (await fetch('data.json?v=' + Date.now())).json();
    } else {
      repo = detectarRepo();
      if (!repo) throw new Error('No se pudo detectar el repositorio. Configúralo en admin.js.');
      const info = await gh('');
      if (!info.permissions?.push) throw new Error('Esta clave no tiene permiso para modificar la web.');
      branch = info.default_branch;
      const raw = await fetch(`https://api.github.com/repos/${repo.owner}/${repo.repo}/contents/data.json?ref=${branch}&t=${Date.now()}`,
        { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.raw+json' } });
      if (!raw.ok) throw new Error('No se pudo leer data.json');
      D = JSON.parse(await raw.text());
      if ($('#remember').checked) try { localStorage.setItem(KEY_TOKEN, token); } catch {}
    }
    D.usos ||= []; D.productos.forEach(p => p.nivel ??= 2);
    D.envios ||= { zonas: [], recogida: { activa: true, texto: '' }, transportista: '' };
    if (!D.pagos?.efectivo) D.pagos = { efectivo: { activo: true }, tarjeta: { activo: true } };
    D.categoriasEn ||= {};
    D.pedidos ||= { prefijo: 'PED' };
    original = JSON.stringify(D);
    $('#login').hidden = true; $('#app').hidden = false;
    pintar();
    if (demo) toast('Modo demostración: puedes probarlo todo, pero no se publicará nada.');
  } catch (e) {
    $('#login-err').textContent = /401|Bad credentials/.test(e.message) ? 'Clave incorrecta o caducada.' : e.message;
    try { localStorage.removeItem(KEY_TOKEN); } catch {}
  } finally { cargando(false); }
}
$('#login-form').onsubmit = e => { e.preventDefault(); $('#login-err').textContent = ''; entrar($('#token').value); };
$('#demo-btn').onclick = () => entrar('demo');
$('#logout').onclick = async () => { if (sucio() && !(await preguntar('Tienes cambios sin publicar. ¿Salir igualmente?'))) return; try { localStorage.removeItem(KEY_TOKEN); } catch {} location.reload(); };

/* ---------- estado ---------- */
function sucio() { return JSON.stringify(D) !== original || Object.keys(pendientes).length > 0; }
function cambio() {
  const s = sucio();
  $('#status').textContent = s ? '● Cambios sin publicar' : 'Todo guardado';
  $('#status').className = 'status' + (s ? ' dirty' : '');
  $('#publish').disabled = !s;
  $('#brand').textContent = D.tienda.nombre;
}
window.addEventListener('beforeunload', e => { if (D && sucio()) { e.preventDefault(); e.returnValue = ''; } });

/* ---------- campos genéricos ---------- */
// campo: [ruta en el objeto, etiqueta, tipo, opciones]
function campo(obj, key, label, type = 'text', extra = {}) {
  const v = obj[key] ?? '';
  const id = 'f' + Math.random().toString(36).slice(2);
  let input;
  if (type === 'textarea') input = `<textarea id="${id}" rows="${extra.rows || 3}">${esc(v)}</textarea>`;
  else if (type === 'select') input = `<select id="${id}">${extra.options.map(o => `<option value="${esc(o.v ?? o)}" ${String(o.v ?? o) === String(v) ? 'selected' : ''}>${esc(o.t ?? o)}</option>`).join('')}</select>`;
  else input = `<input id="${id}" type="${type}" value="${esc(v)}" ${type === 'number' ? 'step="0.01" min="0"' : ''} placeholder="${esc(extra.ph || '')}">`;
  setTimeout(() => {
    const el = document.getElementById(id); if (!el) return;
    el.addEventListener('input', () => {
      obj[key] = type === 'number' || extra.num ? (el.value === '' ? null : Number(el.value)) : el.value;
      cambio();
    });
  });
  return `<div class="f ${extra.full ? 'full' : ''}"><label for="${id}">${esc(label)}</label>${input}${extra.help ? `<small>${esc(extra.help)}</small>` : ''}</div>`;
}
function check(obj, key, label) {
  const id = 'c' + Math.random().toString(36).slice(2);
  setTimeout(() => { const el = document.getElementById(id); el && el.addEventListener('change', () => { obj[key] = el.checked; cambio(); }); });
  return `<label class="chk"><input type="checkbox" id="${id}" ${obj[key] ? 'checked' : ''}> ${esc(label)}</label>`;
}
function selectorImagen(obj, key, nombre) {
  const id = 'i' + Math.random().toString(36).slice(2);
  setTimeout(() => {
    const el = document.getElementById(id); if (!el) return;
    el.addEventListener('change', async () => {
      const file = el.files[0]; if (!file) return;
      try {
        const { base64, dataUrl } = await redimensionar(file);
        const ruta = `img/subidas/${Date.now()}-${slug(nombre || file.name)}.jpg`;
        pendientes[ruta] = { base64, dataUrl };
        obj[key] = ruta;
        document.getElementById(id + 'p').src = dataUrl;
        cambio(); toast('Foto lista. Pulsa “Publicar cambios” para subirla.');
      } catch { toast('No se pudo leer esa imagen', true); }
    });
  });
  return `<div class="img-pick"><img id="${id}p" src="${esc(imgSrc(obj[key]))}" alt=""><label>📷 Cambiar foto<input type="file" id="${id}" accept="image/*"></label></div>`;
}
// reduce la foto (las del móvil pesan mucho) a 1200 px y JPG
function redimensionar(file, max = 1200) {
  return new Promise((ok, ko) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      const dataUrl = c.toDataURL('image/jpeg', 0.85);
      URL.revokeObjectURL(img.src);
      ok({ dataUrl, base64: dataUrl.split(',')[1] });
    };
    img.onerror = ko;
    img.src = URL.createObjectURL(file);
  });
}
function mover(arr, i, d) { const j = i + d; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; cambio(); pintar(); }
function botonesFila(arr, i, que) {
  const id = 'r' + Math.random().toString(36).slice(2);
  setTimeout(() => {
    const el = document.getElementById(id); if (!el) return;
    el.querySelector('[data-a=up]').onclick = () => mover(arr, i, -1);
    el.querySelector('[data-a=down]').onclick = () => mover(arr, i, 1);
    el.querySelector('[data-a=del]').onclick = async () => { if (await preguntar(`¿Eliminar ${que}?`)) { arr.splice(i, 1); cambio(); pintar(); } };
  });
  return `<div class="row-actions" id="${id}"><button class="btn ghost small" data-a="up">↑ Subir</button><button class="btn ghost small" data-a="down">↓ Bajar</button><button class="btn danger small" data-a="del">🗑 Eliminar</button></div>`;
}
function botonNuevo(texto, fn) {
  const id = 'n' + Math.random().toString(36).slice(2);
  setTimeout(() => { const el = document.getElementById(id); el && (el.onclick = () => { fn(); cambio(); pintar(); }); });
  return `<button class="add-new" id="${id}">＋ ${esc(texto)}</button>`;
}

/* ---------- pestañas ---------- */
// bi(): el mismo texto en español y en inglés, uno al lado del otro
function bi(obj, key, label, type = 'text', extra = {}) {
  const full = type === 'textarea' || extra.full;
  return `<div class="bi ${full ? 'full' : ''}">${campo(obj, key, '🇪🇸 ' + label, type, { ...extra, full: false })}${campo(obj, key + '_en', '🇺🇸 ' + label + ' (inglés)', type, { ...extra, full: false, help: '' })}</div>`;
}
const BI_HINT = '<div class="hint">🌐 La web está en <b>español e inglés</b>. Cada texto tiene dos casillas: 🇪🇸 español y 🇺🇸 inglés. Si dejas el inglés vacío, se muestra el español.</div>';
const TABS = {
  productos: { t: 'Productos', r: () => `
    <div class="stats">
      <div><b>${D.productos.length}</b><span>productos</span></div>
      <div><b>${D.productos.filter(p => p.precioAntes).length}</b><span>en oferta</span></div>
      <div><b>${D.productos.filter(p => p.agotado).length}</b><span>agotados</span></div>
      <div><b>${D.productos.filter(p => p.destacado).length}</b><span>más vendidos</span></div>
    </div>
    <div class="box"><h3>Categorías</h3><div class="fields">
      ${(() => {
        const o = { v: D.categorias.join(', '), e: D.categorias.map(c => D.categoriasEn?.[c] || '').join(', ') };
        const html = campo(o, 'v', '🇪🇸 Categorías (separadas por comas)', 'text') + campo(o, 'e', '🇺🇸 En inglés, en el mismo orden', 'text');
        setTimeout(() => $$('.cats-box input').forEach(el => el.addEventListener('change', () => {
          D.categorias = o.v.split(',').map(s => s.trim()).filter(Boolean);
          const en = o.e.split(',').map(s => s.trim());
          D.categoriasEn = Object.fromEntries(D.categorias.map((c, i) => [c, en[i] || c]));
          cambio(); pintar();
        })));
        return `<div class="bi full cats-box">${html}</div>`; })()}
    </div></div>
    ${D.productos.map((p, i) => `
      <div class="box"><div class="prod">
        ${selectorImagen(p, 'imagen', p.nombre)}
        <div>
          <div class="fields">
            ${bi(p, 'nombre', 'Nombre', 'text', { full: true })}
            ${campo(p, 'precio', 'Precio ($)', 'number', { help: 'Con impuestos incluidos: es lo que paga el cliente' })}
            ${campo(p, 'precioAntes', 'Precio anterior ($) — para ofertas', 'number', { help: 'Déjalo vacío si no está de oferta' })}
            ${campo(p, 'categoria', 'Categoría', 'select', { options: D.categorias })}
            ${campo(p, 'nivel', 'Resistencia', 'select', { num: true, options: NIVELES_OPC })}
            <div class="f full"><label>Etiquetas</label><div class="toggles">${check(p, 'destacado', '⭐ Más vendido')}${check(p, 'agotado', 'Agotado')}</div></div>
            ${bi(p, 'descripcion', 'Descripción', 'textarea')}
          </div>
        </div>
      </div>${botonesFila(D.productos, i, 'este producto')}</div>`).join('')}
    ${botonNuevo('Añadir producto', () => D.productos.push({ id: 'p' + Date.now(), nombre: 'Nuevo producto', nombre_en: 'New product', categoria: D.categorias[0] || '', nivel: 2, precio: 0, precioAntes: null, descripcion: '', descripcion_en: '', imagen: 'img/banda-azul.svg', destacado: false, agotado: false }))}` },

  portada: { t: 'Portada', r: () => `${BI_HINT}
    <div class="box"><div class="prod">
      ${selectorImagen(D.portada, 'imagen', 'portada')}
      <div class="fields">
        ${bi(D.portada, 'titulo', 'Título grande', 'text', { full: true })}
        ${bi(D.portada, 'subtitulo', 'Texto debajo del título', 'textarea')}
        ${bi(D.portada, 'boton', 'Texto del botón')}
        ${bi(D.tienda, 'eslogan', 'Eslogan (etiqueta superior)')}
        ${campo(D.portada, 'clientes', 'Nº de clientes', 'text', { ph: '+1,500' })}
        ${campo(D.portada, 'valoracion', 'Valoración media', 'text', { ph: '4.9' })}
      </div>
    </div></div>` },

  tienda: { t: 'Datos de la tienda', r: () => `
    <div class="box"><h3>General</h3><div class="fields">
      ${campo(D.tienda, 'nombre', 'Nombre de la tienda')}
      ${campo(D.tienda, 'whatsapp', '📲 WhatsApp donde te llegan los pedidos', 'text', { ph: '17185550123', help: 'Con el 1 delante y sin espacios ni guiones. Ej.: 17185550123' })}
      ${campo(D.tienda, 'telefono', 'Teléfono visible', 'text', { ph: '(718) 555-0123' })}
      ${campo(D.tienda, 'email', 'Email', 'email')}
      ${campo(D.tienda, 'direccion', 'Dirección (sale en el mapa)', 'text', { full: true, ph: '37-15 82nd St, Jackson Heights, NY 11372' })}
      ${bi(D.tienda, 'horario', 'Horario', 'text', { full: true })}
      ${bi(D.tienda, 'aviso', 'Aviso de la barra superior', 'text', { full: true, help: 'Déjalo vacío para ocultar la barra' })}
      ${bi(D.tienda, 'impuestosTexto', 'Texto de impuestos', 'text', { help: 'Los precios llevan los impuestos incluidos. Ej.: “Impuestos incluidos”' })}
    </div></div>
    <div class="box"><h3>Redes sociales</h3><div class="fields">
      ${campo(D.tienda, 'instagram', 'Enlace de Instagram', 'url')}
      ${campo(D.tienda, 'facebook', 'Enlace de Facebook', 'url')}
    </div></div>` },

  envios: { t: 'Envíos y pagos', r: () => `
    <div class="hint">📮 La web elige la zona según el <b>ZIP code</b> del cliente. Gana el prefijo más largo: “112” (Brooklyn) antes que “11”. Usa <b>*</b> para “todo lo demás”.</div>
    ${D.envios.zonas.map((z, i) => `<div class="box"><div class="fields">
      ${bi(z, 'nombre', 'Nombre de la zona', 'text', { full: true })}
      ${campo(z, 'prefijos', 'ZIP codes que empiezan por', 'text', { ph: '100, 112', help: 'Separados por comas. * = resto' })}
      ${campo(z, 'precio', 'Precio del envío ($)', 'number')}
      ${campo(z, 'gratisDesde', 'Gratis a partir de ($)', 'number', { help: 'Vacío = nunca gratis' })}
      <div class="f"><label>Plazo (días hábiles)</label><div class="two-mini">${campo(z, 'diasMin', 'Mín.', 'number')}${campo(z, 'diasMax', 'Máx.', 'number')}</div></div>
      <div class="f full">${check(z, 'pagoAlRecibir', '💵 El cliente paga al recibir (efectivo o tarjeta)')}<small>Si lo desmarcas, le decimos que le mandarás por WhatsApp cómo pagar antes de enviarlo.</small></div>
    </div>${botonesFila(D.envios.zonas, i, 'esta zona')}</div>`).join('')}
    ${botonNuevo('Añadir zona de envío', () => D.envios.zonas.push({ nombre: 'Nueva zona', nombre_en: 'New area', prefijos: '', precio: 7.99, gratisDesde: 50, diasMin: 2, diasMax: 4, pagoAlRecibir: true }))}
    <div class="box"><h3>🔗 Envíos lejanos</h3><div class="fields">
      ${bi(D.envios, 'notaPagoEnvio', 'Mensaje de pago para zonas sin pago al recibir', 'textarea')}
    </div></div>
    <div class="box"><h3>🏪 Recogida en tienda</h3><div class="fields">
      <div class="f full">${check(D.envios.recogida, 'activa', 'Ofrecer recogida en tienda (gratis)')}</div>
      ${bi(D.envios.recogida, 'texto', 'Mensaje para el cliente', 'text', { full: true, ph: 'Listo en 2 horas' })}
    </div></div>
    <div class="box"><h3>💳 Formas de pago (al recibir o recoger)</h3><div class="fields">
      <div class="f full"><div class="toggles">${check(D.pagos.efectivo, 'activo', '💵 Efectivo')}${check(D.pagos.tarjeta, 'activo', '💳 Tarjeta')}</div></div>
    </div></div>
    <div class="box"><h3>📲 Cómo te llegan los pedidos</h3>
      <p class="mini">Cada pedido te llega como un <b>mensaje de WhatsApp</b> al número de “Datos de la tienda”, con los productos, el total, la dirección y la forma de pago. Si el cliente compró en inglés, el mensaje llega en inglés y lo indica al final. Le contestas por ahí mismo, como siempre.</p>
      <div class="fields">${campo(D.pedidos, 'prefijo', 'Letras del nº de pedido', 'text', { ph: 'EL', help: 'Ej.: EL-1118-472' })}</div>
    </div>` },

  sobre: { t: 'Sobre nosotros', r: () => `${BI_HINT}
    <div class="box"><div class="fields">
      ${bi(D.sobre, 'titulo', 'Título', 'text', { full: true })}
      ${bi(D.sobre, 'texto', 'Texto', 'textarea', { rows: 6 })}
    </div></div>` },

  opiniones: { t: 'Opiniones de clientes', r: () => `
    ${D.opiniones.map((o, i) => `<div class="box"><div class="fields">
      ${campo(o, 'nombre', 'Nombre')}
      ${campo(o, 'estrellas', 'Estrellas', 'select', { num: true, options: [5, 4, 3, 2, 1].map(n => ({ v: n, t: '★'.repeat(n) })) })}
      ${bi(o, 'texto', 'Opinión', 'textarea')}
    </div>${botonesFila(D.opiniones, i, 'esta opinión')}</div>`).join('')}
    ${botonNuevo('Añadir opinión', () => D.opiniones.push({ nombre: '', texto: '', texto_en: '', estrellas: 5 }))}` },

  usos: { t: '¿Para qué las usas?', r: () => `
    ${D.usos.map((v, i) => `<div class="box"><div class="fields">
      ${campo(v, 'icono', 'Icono (emoji)')}
      ${bi(v, 'titulo', 'Título', 'text', { full: true })}
      ${bi(v, 'texto', 'Texto', 'text', { full: true })}
    </div>${botonesFila(D.usos, i, 'este uso')}</div>`).join('')}
    ${botonNuevo('Añadir uso', () => D.usos.push({ icono: '✨', titulo: '', titulo_en: '', texto: '', texto_en: '' }))}` },

  ventajas: { t: 'Ventajas', r: () => `
    ${D.ventajas.map((v, i) => `<div class="box"><div class="fields">
      ${campo(v, 'icono', 'Icono (emoji)')}
      ${bi(v, 'titulo', 'Título', 'text', { full: true })}
      ${bi(v, 'texto', 'Texto', 'text', { full: true })}
    </div>${botonesFila(D.ventajas, i, 'esta ventaja')}</div>`).join('')}
    ${botonNuevo('Añadir ventaja', () => D.ventajas.push({ icono: '✨', titulo: '', titulo_en: '', texto: '', texto_en: '' }))}` },

  faq: { t: 'Preguntas frecuentes', r: () => `
    ${D.faq.map((f, i) => `<div class="box"><div class="fields">
      ${bi(f, 'p', 'Pregunta', 'text', { full: true })}
      ${bi(f, 'r', 'Respuesta', 'textarea')}
    </div>${botonesFila(D.faq, i, 'esta pregunta')}</div>`).join('')}
    ${botonNuevo('Añadir pregunta', () => D.faq.push({ p: '', p_en: '', r: '', r_en: '' }))}` }
};

function pintar() {
  $('#tab-title').textContent = TABS[tab].t;
  $('#editor').innerHTML = (demo ? '<div class="hint">🧪 Modo demostración: los cambios solo se ven en la vista previa de este navegador.</div>' : '') + TABS[tab].r();
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  // estrellas se guardan como número
  D.opiniones.forEach(o => o.estrellas = Number(o.estrellas));
  cambio();
}
$('#tabs').onclick = e => { const b = e.target.closest('button'); if (b) { tab = b.dataset.tab; pintar(); window.scrollTo(0, 0); } };

/* ---------- acciones ---------- */
$('#preview').onclick = () => {
  D.opiniones.forEach(o => o.estrellas = Number(o.estrellas));
  const copia = JSON.parse(JSON.stringify(D));
  const fix = o => { for (const k in o) { if (typeof o[k] === 'string' && pendientes[o[k]]) o[k] = pendientes[o[k]].dataUrl; else if (o[k] && typeof o[k] === 'object') fix(o[k]); } };
  fix(copia);
  try { localStorage.setItem(KEY_DRAFT, JSON.stringify(copia)); window.open('index.html?preview', '_blank'); }
  catch { toast('La vista previa no cabe en memoria (demasiadas fotos nuevas). Publica y revisa la web.', true); }
};
$('#discard').onclick = async () => {
  if (!sucio() || !(await preguntar('¿Descartar todos los cambios sin publicar?'))) return;
  D = JSON.parse(original); pendientes = {}; pintar(); toast('Cambios descartados');
};
$('#publish').onclick = async () => {
  D.opiniones.forEach(o => o.estrellas = Number(o.estrellas));
  if (demo) { toast('En modo demostración no se publica. ¡Pero así funcionaría! 😉'); return; }
  cargando('Publicando cambios…');
  try {
    // Un solo "commit" con data.json y todas las fotos nuevas
    const ref = await gh(`/git/ref/heads/${branch}`);
    const base = await gh(`/git/commits/${ref.object.sha}`);
    const usadas = JSON.stringify(D);
    const archivos = [{ path: 'data.json', content: b64utf8(JSON.stringify(D, null, 2) + '\n') },
      ...Object.entries(pendientes).filter(([r]) => usadas.includes(r)).map(([path, p]) => ({ path, content: p.base64 }))];
    const tree = [];
    for (const a of archivos) {
      const blob = await gh('/git/blobs', { method: 'POST', body: { content: a.content, encoding: 'base64' } });
      tree.push({ path: a.path, mode: '100644', type: 'blob', sha: blob.sha });
    }
    const nt = await gh('/git/trees', { method: 'POST', body: { base_tree: base.tree.sha, tree } });
    const c = await gh('/git/commits', { method: 'POST', body: { message: 'Actualización desde el panel de administración', tree: nt.sha, parents: [ref.object.sha] } });
    await gh(`/git/refs/heads/${branch}`, { method: 'PATCH', body: { sha: c.sha } });
    original = JSON.stringify(D); pendientes = {};
    pintar();
    toast('✅ ¡Publicado! La web se actualizará en 1–2 minutos.');
  } catch (e) {
    console.error(e); toast('Error al publicar: ' + e.message, true);
  } finally { cargando(false); }
};

/* ---------- diálogo de confirmación (sustituye a confirm) ---------- */
function preguntar(texto, si = 'Sí, continuar') {
  return new Promise(ok => {
    $('#dialog-t').textContent = texto; $('#dialog-si').textContent = si; $('#dialog').hidden = false;
    const fin = v => { $('#dialog').hidden = true; ok(v); };
    $('#dialog-si').onclick = () => fin(true); $('#dialog-no').onclick = () => fin(false);
  });
}

/* ---------- inicio ---------- */
try { const t = localStorage.getItem(KEY_TOKEN); if (t) entrar(t); } catch {}
