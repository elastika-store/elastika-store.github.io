# Elástika · Tienda de tiras elásticas

Tienda web estática (HTML + CSS + JavaScript, sin servidor) lista para GitHub Pages.

## Qué incluye

- **Tienda** (`index.html`, `app.js`, `styles.css`): catálogo, guía de resistencias, carrito y pedido por WhatsApp. En español e inglés.
- **Cuentas de cliente** (`cuenta.js`, `cuenta.css`): registro, inicio de sesión, "recordarme", perfil con datos de envío, historial de pedidos con "repetir pedido", cambio de contraseña y borrado de cuenta.
  - Las contraseñas se guardan cifradas con PBKDF2-SHA256 (150.000 vueltas y sal aleatoria), nunca en texto plano.
  - Tras 5 intentos fallidos hay que esperar 30 segundos.
  - Como la web no tiene servidor, cada cuenta se guarda en el navegador del dispositivo donde se creó.
- **Panel de administración** (`admin.html`): edita productos, precios, envíos y textos y los publica directamente en este repositorio con un token de GitHub.
- **Contenido** (`data.json`) e imágenes en `img/`.

## Publicarla con GitHub Pages

1. Settings → Pages → *Deploy from a branch* → rama `main`, carpeta `/ (root)` → Save.
2. En 1–2 minutos la tienda está en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`.
3. El panel está en `.../admin.html`. Para entrar hace falta un token de GitHub (fine-grained) con permiso **Contents: Read and write** sobre este repositorio.

## Probarla en local

```bash
python -m http.server 8000
```

Después abre http://localhost:8000.
