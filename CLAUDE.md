# Hipertrofia — contexto del proyecto

App personal de entrenamiento de hipertrofia. Uso real: en el gimnasio, en un
iPhone, instalada en la pantalla de inicio. Todo lo demás es secundario.

## Estado actual

Dos formatos del mismo código:

- `src/App.jsx` — fuente única. Un solo archivo, ~3.000 líneas, React sin router.
- `index.html` desplegado — versión autocontenida (React compilado embebido),
  subida a GitHub Pages para instalar en el móvil.

Publicado en `https://dapuga1999.github.io/Hipertrofia-`.

## Stack y restricciones

- React 18 + Vite. **Sin Tailwind**: los estilos son inline con un objeto de
  paleta `C`. Hay un puñado de utilidades CSS (`flex`, `gap-2`…) definidas a
  mano en `index.html`. No introducir Tailwind sin instalarlo de verdad.
- **Sin backend**. Todo en `localStorage` a través de `loadKey` / `saveKey`.
  Toda la persistencia pasa por esas dos funciones: es el único punto a tocar
  si algún día se migra a Supabase.
- Claves: `hipertrofia:log:v1` (historial), `hipertrofia:config:v1` (vídeos y
  calendario), `hipertrofia:session:v1` (sesión en curso), `hipertrofia:media:v1`
  (imágenes/GIFs en base64).
- Límite de ~5 MB en localStorage. Los GIFs se guardan en base64, así que
  cuidado al añadir funciones que escriban mucho.

## Reglas de la rutina — NO MODIFICAR

Están en la constante `DAYS`. Son de un entrenador, no negociables:

- 5 días. El Día 4 repite el Día 1 a propósito, para facilitar la progresión.
- Día 3, orden exacto: abducción → curl femoral tumbado → extensión de
  cuádriceps → hack squat → peso muerto rumano → gemelos. **Sin prensa.**
- Mantener 2 ejercicios directos de bíceps y 2 de hombro en los días que toca.
- No añadir press militar.
- Series, rangos de repeticiones, RIR y descansos son los que están. No
  "optimizar" ninguno.

## Lógica de progresión

En `getProgression`. Compara con la última sesión del mismo rango:

- Todas las series llegan al tope del rango → SUBE EL PESO (+1 / +2,5 / +5 kg
  según la carga).
- Todas dentro del rango pero sin llegar al tope → MANTÉN EL PESO.
- Alguna por debajo del mínimo → MANTÉN E INTENTA MEJORAR LAS REPETICIONES.

No subir peso solo porque la primera serie llegue al tope.

## Prioridades de diseño

Móvil primero, y concretamente: móvil con las manos sudadas, entre series, con
prisa. Áreas de toque grandes, jerarquía clara, cero adornos.

- Paleta: negro/grafito + un único azul de acento (`#0A84FF`).
- Respetar siempre `env(safe-area-inset-top/bottom)`: en modo standalone iOS
  no hay barra de navegador y el contenido se mete bajo la hora.
- En standalone tampoco existe el gesto de volver atrás del navegador. Hay un
  `useSwipeBack` propio. Si añades pantallas nuevas, engánchalas ahí.

## Cómo desplegar

Automático: cada `git push` a `main` dispara
`.github/workflows/deploy.yml`, que hace `npm ci && npm run build` y publica
`dist/` en GitHub Pages. No hay que subir `dist/` a mano ni commitearlo (está
en `.gitignore`). Requiere, una única vez, tener activado en el repo
*Settings → Pages → Build and deployment → Source: GitHub Actions*.

Para probar el build en local antes de pushear:

```bash
npm install
npm run build       # genera dist/
npm run preview      # sirve dist/ para revisarlo
```

## Pendientes

- Ilustraciones por ejercicio en `public/images/animations/<id>.webp` o
  `poses/<id>-start.webp` + `-peak.webp` (la app alterna las dos poses).
  Identificadores en `public/images/README.md`.
- Exportar/importar el historial desde la propia app (ahora solo por consola).
- Notificación de fin de descanso con la app cerrada (requiere Capacitor).

## Cómo trabajar aquí

- Verificar los cambios en un navegador real antes de darlos por buenos. Ya se
  colaron así dos fallos: el diseño roto por asumir Tailwind, y el cronómetro
  congelándose al bloquear la pantalla.
- El cronómetro debe calcularse con marcas de tiempo (`Date.now()`), nunca
  decrementando un contador: se para al bloquear el móvil.
- Nunca pongas `overflowX: "hidden"` sin fijar también `overflowY` en un
  contenedor que sea ancestro de un `position: "sticky"` (p. ej. el `<div>`
  raíz de `App()`). El navegador fuerza el eje sin fijar a `auto` aunque lo
  pongas explícito en `"visible"`, y eso convierte ese contenedor en el
  "scroll container" del sticky en vez del viewport — el header sticky dejaba
  de pegarse y se iba con el scroll. Si hace falta cortar desbordamiento
  horizontal, hazlo en un contenedor que no envuelva a los headers sticky
  (`WorkoutScreen`, `WeekStrip` en `RoutineView`), no en el root de `App()`.
- Los inputs necesitan `font-size: 16px` o iOS hace zoom al tocarlos.
- Nada de `localStorage` dentro de artifacts de Claude.ai — ahí usa
  `window.storage`. El proyecto real sí usa `localStorage`.
