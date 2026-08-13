# Hipertrofia — contexto del proyecto

App personal de entrenamiento de hipertrofia. Uso real: en el gimnasio, en un
iPhone, instalada en la pantalla de inicio. Todo lo demás es secundario.

## Estado actual

Proyecto Vite real (no un HTML autocontenido):

- `src/App.jsx` — fuente única. Un solo archivo, ~6.750 líneas, React sin router.
- `index.html` — solo el entry point de Vite (`<div id="root">` + `<script
  type="module" src="/src/main.jsx">`). El bundle real lo genera
  `npm run build` en `dist/`, que se despliega solo (ver "Cómo desplegar").
  No editar `index.html` esperando que sea la app; la app está en `src/`.

Publicado en `https://dapuga1999.github.io/Hipertrofia-`.

## Stack y restricciones

- React 18 + Vite. **Sin Tailwind**: los estilos son inline con un objeto de
  paleta `C`. Hay un puñado de utilidades CSS (`flex`, `gap-2`…) definidas a
  mano en `index.html`. No introducir Tailwind sin instalarlo de verdad.
- **Sin backend propio**. Todo en `localStorage` a través de `loadKey` /
  `saveKey`. Toda la persistencia pasa por esas dos funciones: es el único
  punto a tocar si algún día se migra a Supabase. Única excepción: el
  registro de comidas llama directamente a la API pública de Open Food
  Facts desde el cliente (ver más abajo) — es la única función de la app que
  hace peticiones de red.
- Claves: `hipertrofia:log:v1` (historial), `hipertrofia:config:v1` (vídeos y
  calendario), `hipertrofia:session:v1` (sesión en curso), `hipertrofia:media:v1`
  (imágenes/GIFs en base64), `hipertrofia:swaps:v1` (sustituciones de ejercicio
  por slot, ver más abajo), `hipertrofia:exercises:v1` (ejercicios creados por
  el usuario), `hipertrofia:nutrition:v1` (calculadora nutricional + peso),
  `hipertrofia:food:v1` (registro de comidas por fecha), `hipertrofia:foods:v1`
  (alimentos recientes/propios).
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

## Nutrición (pestaña Dieta)

- `computeNutritionTargets(profile, adjustment)` es pura, sin efectos, igual
  que `getProgression`: recibe el perfil (sexo/edad/altura/peso/actividad/
  objetivo) y el ajuste acumulado, y devuelve BMR, TDEE y el objetivo de
  calorías/macros para la media diaria, día de entreno y día de descanso.
- **El suelo de seguridad (nunca por debajo del BMR ni más de 25% de déficit
  sobre el TDEE) se aplica tres veces por separado** — a la media, al día de
  entreno y al día de descanso ya calculados — no solo a la media. El reparto
  entreno/descanso (`TRAINING_DAY_MULT`/`REST_DAY_MULT`, ×1.05/×0.875) hace
  que el día de descanso reciba menos que la media, así que puede caer por
  debajo del suelo aunque la media esté bien; si solo se protegiera la media,
  el número que ve el usuario en "Descanso" podría estar mal. Verificado con
  un caso real (mujer 45kg/150cm/25a/sedentaria/definición): sin este fix, el
  día de descanso caía a 964 kcal con un BMR de 1102.
- `movingAverage7` da un punto por entrada de peso real (no por día natural),
  porque `Chart` posiciona los puntos por índice del array, no por fecha —
  igual que `HistoryBody` con las sesiones de entreno.
- `getCalorieAdjustmentSuggestion` exige ≥21 días de datos y una densidad
  mínima en ambos extremos del periodo antes de sugerir nada; nunca cambia
  las calorías sola, solo ofrece un botón "Aplicar" que el usuario pulsa. El
  ajuste aplicado (`adjustment.amount`) se resetea a `null` si el usuario
  cambia de objetivo (`saveNutritionProfile`), porque un ajuste calibrado
  para "definición" no tiene sentido arrastrado a "volumen".

## Registro de comidas y Open Food Facts

- Búsqueda de alimentos vía `searchOffFoods`/`lookupOffBarcode`, que llaman a
  `world.openfoodfacts.org` — **no** a `search.openfoodfacts.org` (el
  servicio "search-a-licious", más nuevo, no manda cabecera
  `Access-Control-Allow-Origin` y el navegador bloquea la respuesta por CORS;
  se comprobó en un navegador real, no solo con `curl` — `curl` no aplica
  CORS y hace parecer que funciona cuando en realidad no lo haría desde la
  app). El buscador de texto usa el endpoint legacy
  `world.openfoodfacts.org/cgi/search.pl` (con `search_terms=`), que sí tiene
  CORS y además da resultados más relevantes que search-a-licious para
  marcas españolas. El código de barras usa
  `world.openfoodfacts.org/api/v2/product/<code>.json`.
- Esa API pública, sin clave, devuelve de vez en cuando un fallo de red suelto
  bajo carga (probablemente un desafío anti-bot que no lleva CORS). `fetchOffWithRetry`
  reintenta hasta 2 veces con backoff (800ms/1600ms) antes de rendirse — es
  intencional, no lo quites pensando que es ruido.
- `normalizeOffProduct` descarta (devuelve `null`) cualquier producto sin
  kcal/proteína/hidratos/grasa numéricos — muchos productos de Open Food
  Facts tienen datos incompletos.
- `prioritizeSpain` reordena los resultados (España primero) sin filtrar: un
  filtro estricto por país puede dejar búsquedas legítimas sin resultados.
- Sin conexión (`navigator.onLine === false` o el propio `fetch` falla), la
  búsqueda lanza y el selector muestra un aviso claro; los alimentos
  "recientes" (`hipertrofia:foods:v1`) siguen disponibles porque son locales.
- Emoji por alimento vía `emojiForFood`: coincidencia de palabras clave sobre
  `categories_tags` + nombre, con `🍽️` como último recurso.

## Escáner de código de barras (cámara)

- El botón "📷 Escanear" del selector de alimentos (`FoodPickerSheet`) abre
  `BarcodeScanner`, que usa `@zxing/browser` (paquete en `package.json`) en
  vez del `BarcodeDetector` nativo del navegador porque Safari/iOS —el
  navegador real de esta app— no lo implementa.
- `@zxing/browser` se carga con `import("@zxing/browser")` dinámico dentro
  del `useEffect` de `BarcodeScanner`, no en el import estático de arriba del
  archivo: así Vite lo separa en su propio chunk y ese ~450 KB solo se
  descarga si el usuario llega a abrir el escáner, no en la carga inicial.
- Pide la cámara con `facingMode: "environment"` (no `exact`): en el móvil
  pide la trasera, pero si algún día se prueba en un portátil con solo
  webcam frontal no revienta, cae a la que haya. También pide
  `width/height: { ideal: 1280x720 }` — sin esto algunos móviles eligen una
  resolución por defecto insuficiente para leer bien un código de barras
  real (con cámara falsa de escritorio no se nota, ahí siempre sale nítido).
- `BrowserMultiFormatReader` se construye con `hints` (`DecodeHintType` de
  `@zxing/library`, importado también con `import()` dinámico junto a
  `@zxing/browser`): `POSSIBLE_FORMATS` restringido a formatos de código de
  barras de producto (EAN-13/8, UPC-A/E, Code128/39, ITF) para no perder
  frames probando QR/DataMatrix/Aztec/PDF417, que nunca van a matchear un
  producto — y `TRY_HARDER: true`, que hace la detección bastante más
  robusta en condiciones reales (foco imperfecto, algo de temblor de mano) a
  cambio de más CPU por frame; aceptable porque es un escaneo puntual, no
  algo corriendo en segundo plano todo el rato.
- **Bug real encontrado y corregido probando con cámara falsa de Chromium**
  (`--use-fake-device-for-media-stream` + un vídeo con un EAN-13 real
  generado con `bwip-js`): el callback de `decodeFromConstraints` puede
  dispararse — y detectar el código — *antes* de que la promesa que lo
  arranca resuelva y asigne la variable donde se guarda `controls`. Si el
  callback hace `c.stop()` sobre esa variable externa, salta un
  `ReferenceError` de TDZ que aborta la llamada a `onDetect` en silencio (el
  error lo traga el bucle interno de zxing, no llega a consola): la cámara
  se queda encendida y la app parece congelada en "Abriendo la cámara…" para
  siempre, aunque la lectura fue correcta. Con una lectura instantánea (como
  la de la cámara falsa, siempre enfocada y sin motion blur) esto pasa
  siempre; en un móvil real es más raro pero no imposible. Arreglo: usar el
  tercer argumento que el propio callback recibe (`controls`, distinto de la
  variable externa) para pararlo — es justo para eso que la API de zxing lo
  pasa. No repetir el patrón `const c = await decodeFromConstraints(...,
  callback-que-referencia-c)` en ningún sitio nuevo que toque esta librería.
- Al detectar un código, `BarcodeScanner` no dibuja su propio resultado: hace
  `onDetect(code)` → `FoodPickerSheet` mete el código en el mismo `q` que ya
  usa la búsqueda por texto, y el `useEffect` existente que ya distingue
  código de barras vs. texto (`looksLikeBarcode`) hace el resto. No hay
  ruta de resultados duplicada para el escáner.

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

- Paleta: negro/grafito + un único azul de acento (`#0A84FF`), **excepto la
  pestaña Dieta**, que usa verde (`C.dietAccent`, `#30D158`) para diferenciar
  nutrición de entrenamiento a propósito. `Btn` tiene variante `"diet"` y
  `Chart` acepta un prop `color` (por defecto el azul) precisamente para
  esto — no generalices el azul de vuelta ahí pensando que es un descuido.
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
