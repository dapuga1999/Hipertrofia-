# Hipertrofia — contexto del proyecto

App personal de entrenamiento de hipertrofia. Uso real: en el gimnasio, en un
iPhone, instalada en la pantalla de inicio. Todo lo demás es secundario.

## Estado actual

Proyecto Vite real (no un HTML autocontenido):

- `src/App.jsx` — fuente única. Un solo archivo, ~5.000 líneas, React sin router.
- `index.html` — solo el entry point de Vite (`<div id="root">` + `<script
  type="module" src="/src/main.jsx">`). El bundle real lo genera
  `npm run build` en `dist/`, que se despliega solo (ver "Cómo desplegar").
  No editar `index.html` esperando que sea la app; la app está en `src/`.

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
  (imágenes/GIFs en base64), `hipertrofia:swaps:v1` (sustituciones de ejercicio
  por slot, ver más abajo), `hipertrofia:exercises:v1` (ejercicios creados por
  el usuario).
- Límite de ~5 MB en localStorage. Los GIFs se guardan en base64, así que
  cuidado al añadir funciones que escriban mucho.

## Catálogo de ejercicios y sustituciones

- `EXERCISES` tiene ~90 ejercicios fijos (pecho, espalda, hombro, bíceps,
  tríceps, cuádriceps, isquiotibiales, glúteo, gemelo, antebrazo, core). Los
  22 que usa `DAYS` llevan `inRoutine: true`; el resto es catálogo ampliado
  para sustituciones.
- **Nunca leas `EXERCISES[id]` directamente.** Usa `getExercise(id,
  customExercises)`: fusiona el catálogo fijo con los ejercicios propios del
  usuario y, si el id no existe en ninguno (p. ej. uno propio ya borrado pero
  con historial), devuelve un marcador "Ejercicio eliminado" en vez de
  `undefined`. Todo componente que muestre un ejercicio recibe `customExercises`
  como prop para poder llamar a `getExercise`.
- Las sustituciones de la rutina (`hipertrofia:swaps:v1`, clave
  `${dayId}:${index}` → id de ejercicio) se aplican con `getEffectiveDay(dayId,
  swaps, customExercises)`, que sobrescribe solo el campo `ex` de cada slot.
  `DAYS` en crudo no se toca nunca; `getDay(id)` sigue devolviendo el original.
- Cualquier vista que calcule progreso o listas de ejercicios a partir de un
  día debe usar `getEffectiveDay`, no `getDay`, o mostrará series/estado del
  ejercicio equivocado tras una sustitución.
- El historial (`log`) va por id de ejercicio y puede contener ids que ya no
  están en ningún catálogo ni sustitución activa (ejercicio propio borrado).
  `HistoryView` recorre `Object.keys(log)`, no el catálogo, precisamente para
  no perder esas entradas huérfanas.

## Reglas de la rutina — NO MODIFICAR

Están en la constante `DAYS`. Son de un entrenador, no negociables:

- 5 días. El Día 4 repite el Día 1 a propósito, para facilitar la progresión.
- Día 3, orden exacto: abducción → curl femoral tumbado → extensión de
  cuádriceps → hack squat → peso muerto rumano → gemelos. **Sin prensa.**
- Mantener 2 ejercicios directos de bíceps y 2 de hombro en los días que toca.
- No añadir press militar — **tampoco al catálogo `EXERCISES`**: por eso los
  ejercicios de hombro añadidos son elevaciones/face pull/encogimientos, sin
  ningún press por encima de la cabeza.
- Series, rangos de repeticiones, RIR y descansos son los que están. No
  "optimizar" ninguno. Una sustitución de ejercicio (ver más abajo) mantiene
  intactos estos parámetros del slot; solo cambia qué ejercicio se hace.

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
