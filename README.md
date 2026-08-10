# Hipertrofia — instalación en el móvil

App de entrenamiento (5 días, tracker de series, descansos y progresión).
Funciona como aplicación instalable: icono propio, pantalla completa y sin conexión.

---

## 1. Probarla en local

```bash
npm install
npm run dev -- --host
```

Vite imprime dos direcciones. Usa la de tipo `http://192.168.x.x:5173` desde el
móvil, con el teléfono en la misma wifi que el ordenador.

## 2. Publicarla (necesario para instalarla de verdad)

Hace falta HTTPS para que funcione el modo sin conexión. Cualquiera de estas
opciones vale y es gratis:

**Vercel** (recomendado si ya lo usas)

```bash
npm i -g vercel
vercel --prod
```

**Netlify Drop** (sin instalar nada)

```bash
npm run build
```

Arrastra la carpeta `dist/` a https://app.netlify.com/drop

**GitHub Pages** (la que usa este repo): cada push a `main` dispara
`.github/workflows/deploy.yml`, que compila con `npm run build` y publica
`dist/` automáticamente. Solo hace falta, una vez, activar en el repo
*Settings → Pages → Build and deployment → Source: GitHub Actions*. El
`base: "./"` de `vite.config.js` ya está preparado para rutas relativas.

## 3. Instalarla en el teléfono

Abre la URL publicada y:

- **iPhone (Safari)**: botón compartir → *Añadir a pantalla de inicio*.
  Tiene que ser Safari; desde Chrome en iOS no aparece la opción.
- **Android (Chrome)**: menú ⋮ → *Instalar aplicación*.

Queda como una app normal: icono, sin barra del navegador y arranca sin datos.

---

## Qué se ha adaptado respecto a la versión del chat

- **Almacenamiento**: `localStorage`. Los datos viven en el dispositivo. Si
  borras los datos del navegador, se borra el historial (ver copia de seguridad).
- **Cronómetro**: calcula el tiempo restante con una marca de tiempo real, así
  que sigue corriendo aunque bloquees la pantalla o cambies de app.
- **Wake Lock**: la pantalla no se apaga mientras corre el descanso.
- **Service worker**: la app carga sin conexión. Los vídeos de YouTube y las
  miniaturas sí necesitan datos.
- **`font-size: 16px`** en los inputs para que iOS no haga zoom al escribir.

## Vídeos

Rellena `EXERCISE_VIDEOS` al principio de `src/App.jsx` con el ID de YouTube de
cada ejercicio, o pégalos desde **Perfil → Vídeos** dentro de la app. La
miniatura de cada fila sale automáticamente de ese mismo vídeo.

## Copia de seguridad del historial

Todo está en dos claves de `localStorage`. Desde la consola del navegador:

```js
// Exportar
copy(localStorage.getItem("hipertrofia:log:v1"));

// Importar
localStorage.setItem("hipertrofia:log:v1", '<pega aquí el JSON>');
```

Si quieres que el historial se sincronice entre móvil y ordenador, el siguiente
paso es Supabase: tres tablas (`sessions`, `set_logs`, `exercise_videos`) y
sustituir `loadKey` / `saveKey` por llamadas al cliente. Toda la persistencia
pasa por esas dos funciones, así que es un cambio localizado.

## Convertirla en APK (opcional)

Si más adelante quieres notificación de fin de descanso con la app cerrada o
publicarla en Play Store:

```bash
npm i @capacitor/core @capacitor/cli
npx cap init Hipertrofia com.tuapp.hipertrofia --web-dir=dist
npx cap add android
npm run build && npx cap sync && npx cap open android
```

Es el mismo código, envuelto en un contenedor nativo.
