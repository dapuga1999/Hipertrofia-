import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";

/* ============================================================================
   PALETA / TOKENS
   Monocromo grafito + un único acento (naranja señal) reservado para el
   esfuerzo: RIR 0, series al fallo y el veredicto de progresión.
   ========================================================================== */
const C = {
  ink: "#0A0A0B",
  panel: "#141416",
  panel2: "#1C1C1E",
  line: "#2A2A2D",
  line2: "#3A3A3E",
  chalk: "#FFFFFF",
  muted: "#8E8E93",
  dim: "#636366",
  signal: "#0A84FF",
  signalDim: "#0C2A4D",
  signalSoft: "#1B4B7A",
  ok: "#30D158",
  muscle: "#FF453A", // solo para el resaltado de grupo muscular en las siluetas del selector
  dietAccent: "#30D158", // acento de la pestaña Dieta (verde), en vez del azul del resto de la app
  dietAccentDim: "#0F3D22",
};

const FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", Roboto, sans-serif';

/* ============================================================================
   1. VÍDEOS  —  ARCHIVO ÚNICO DE CONFIGURACIÓN
   ----------------------------------------------------------------------------
   No se inventan IDs de YouTube. Rellena aquí el videoId de cada ejercicio
   (el trozo que va después de v= en la URL) y el reproductor funcionará solo.
   También puedes pegarlos desde Ajustes → Vídeos sin tocar el código.
   ========================================================================== */
const EXERCISE_VIDEOS = {
  "incline-dumbbell-curl": { provider: "youtube", videoId: "" },
  "preacher-curl": { provider: "youtube", videoId: "" },
  "incline-dumbbell-press": { provider: "youtube", videoId: "" },
  "machine-chest-press": { provider: "youtube", videoId: "" },
  "cable-fly": { provider: "youtube", videoId: "" },
  "lateral-raise": { provider: "youtube", videoId: "" },
  "reverse-pec-deck": { provider: "youtube", videoId: "" },
  "overhead-triceps-extension": { provider: "youtube", videoId: "" },
  "triceps-pressdown": { provider: "youtube", videoId: "" },
  "unilateral-triceps-extension": { provider: "youtube", videoId: "" },
  "lat-pulldown": { provider: "youtube", videoId: "" },
  "chest-supported-row": { provider: "youtube", videoId: "" },
  "unilateral-cable-row": { provider: "youtube", videoId: "" },
  "cable-pullover": { provider: "youtube", videoId: "" },
  "pullup-neutral-pulldown": { provider: "youtube", videoId: "" },
  "machine-row": { provider: "youtube", videoId: "" },
  "hip-abduction": { provider: "youtube", videoId: "" },
  "lying-leg-curl": { provider: "youtube", videoId: "" },
  "leg-extension": { provider: "youtube", videoId: "" },
  "hack-squat": { provider: "youtube", videoId: "" },
  "romanian-deadlift": { provider: "youtube", videoId: "" },
  "calf-raise": { provider: "youtube", videoId: "" },
};

/* ============================================================================
   1b. ILUSTRACIONES / ANIMACIONES
   ----------------------------------------------------------------------------
   La app busca los archivos por convención, en este orden, y usa el primero
   que exista. Si no hay ninguno, cae en la miniatura del vídeo de YouTube.

     images/animations/<id>.webp          → animación en bucle (WebP animado)
     images/poses/<id>-start.webp
     images/poses/<id>-peak.webp          → dos poses que la app alterna sola

   <id> es el identificador del ejercicio (p. ej. "incline-dumbbell-curl").
   Puedes forzar una ruta concreta en MEDIA_OVERRIDES.
   ========================================================================== */
const MEDIA_BASE = "/images";
const MEDIA_OVERRIDES = {
  // "hack-squat": { animation: "./images/animations/hack-squat.webp" },
  // "preacher-curl": { poses: ["./mis/curl-a.webp", "./mis/curl-b.webp"] },
};
const POSE_INTERVAL = 900; // ms entre poses

function mediaCandidates(exId, videos, custom) {
  const o = MEDIA_OVERRIDES[exId] || {};
  const list = [];
  if (custom && custom[exId]) list.push({ type: "animation", src: custom[exId] });
  if (o.animation) list.push({ type: "animation", src: o.animation });
  ["webp", "gif", "png", "jpg"].forEach((ext) =>
    list.push({ type: "animation", src: `${MEDIA_BASE}/animations/${exId}.${ext}` })
  );
  if (o.poses?.length === 2) list.push({ type: "poses", src: o.poses });
  list.push({
    type: "poses",
    src: [`${MEDIA_BASE}/poses/${exId}-start.webp`, `${MEDIA_BASE}/poses/${exId}-peak.webp`],
  });
  const t = thumbUrl(videos, exId);
  if (t) list.push({ type: "thumb", src: t });
  return list;
}

/* ============================================================================
   2. CATÁLOGO DE EJERCICIOS
   ========================================================================== */
const EXERCISES = {
  "incline-dumbbell-curl": {
    id: "incline-dumbbell-curl",
    inRoutine: true,
    name: "Curl inclinado con mancuernas",
    short: "Curl inclinado",
    muscleGroup: "Bíceps",
    primary: ["Bíceps braquial (porción larga)"],
    secondary: ["Braquial", "Braquiorradial"],
    howTo:
      "Curl con el brazo por detrás del tronco. La posición estirada del bíceps es el punto fuerte de este ejercicio: se entrena mejor la porción larga.",
    setup: [
      "Banco a 45-60°, espalda apoyada en todo momento.",
      "Brazos colgando en vertical, ligeramente por detrás del cuerpo.",
      "Agarre supino, muñeca neutra y firme.",
      "Hombros atrás y abajo, pecho alto.",
      "Pies en el suelo dando estabilidad.",
    ],
    execution: [
      "Flexiona el codo sin mover el brazo del sitio.",
      "Sube hasta contraer, sin llevar el codo hacia delante.",
      "Aprieta arriba medio segundo.",
      "Baja controlado 2-3 segundos hasta el estiramiento completo.",
    ],
    mistakes: [
      "Balancear el cuerpo o despegar la espalda del banco.",
      "Usar impulso en la subida.",
      "Adelantar el hombro para ayudarse.",
      "Cortar el recorrido abajo y perder el estiramiento.",
      "Muñeca doblada hacia atrás.",
    ],
    cues: ["Controla la bajada.", "No adelantes el hombro.", "Aprieta arriba.", "Solo se mueve el antebrazo."],
    alternatives: ["Curl con mancuernas de pie", "Curl en banco a 45° unilateral", "Curl en polea baja tras el cuerpo"],
  },
  "preacher-curl": {
    id: "preacher-curl",
    inRoutine: true,
    name: "Curl predicador",
    short: "Curl predicador",
    muscleGroup: "Bíceps",
    primary: ["Bíceps braquial (porción corta)"],
    secondary: ["Braquial"],
    howTo:
      "Brazo por delante del tronco y apoyado. Máxima tensión en la parte media-final del recorrido y cero posibilidad de trampa.",
    setup: [
      "Ajusta el banco: la axila debe apoyar arriba del respaldo.",
      "Tríceps apoyado en todo el recorrido.",
      "Agarre supino a la anchura de los hombros.",
      "Hombros bajos, sin encogerlos.",
      "Pies firmes en el suelo.",
    ],
    execution: [
      "Parte con el codo casi extendido, sin bloquear de golpe.",
      "Flexiona subiendo hasta antes de perder tensión.",
      "Pausa breve en la contracción.",
      "Baja lento hasta la extensión controlada.",
    ],
    mistakes: [
      "Despegar el codo o el tríceps del apoyo.",
      "Extender de golpe abajo (riesgo en el codo).",
      "Levantar el culo del asiento para ayudarse.",
      "Subir demasiado y descargar la tensión.",
    ],
    cues: ["Tríceps pegado al banco.", "Extiende sin rebotar.", "Sube apretando, no lanzando."],
    alternatives: ["Curl predicador en máquina", "Curl concentrado", "Curl en polea con banco predicador"],
  },
  "incline-dumbbell-press": {
    id: "incline-dumbbell-press",
    inRoutine: true,
    name: "Press inclinado con mancuernas",
    short: "Press inclinado",
    muscleGroup: "Pecho",
    primary: ["Pectoral mayor (porción clavicular)"],
    secondary: ["Deltoides anterior", "Tríceps"],
    howTo:
      "Empuje sobre banco inclinado. Es el básico del día: prioriza la carga progresiva y el recorrido completo.",
    setup: [
      "Banco entre 30 y 45°. Más de 45° pasa el trabajo al hombro.",
      "Escápulas retraídas y deprimidas contra el banco.",
      "Pies firmes en el suelo, tres puntos de apoyo.",
      "Mancuernas en línea con la parte alta del pecho.",
      "Muñecas rectas, no hacia atrás.",
    ],
    execution: [
      "Baja controlado hasta sentir estiramiento en el pecho.",
      "Codos a unos 45-60° respecto al tronco.",
      "Empuja juntando ligeramente las mancuernas arriba.",
      "No bloquees ni choques las mancuernas.",
    ],
    mistakes: [
      "Abrir los codos a 90° y cargar el hombro.",
      "Despegar la espalda alta o hacer puente excesivo.",
      "Bajar poco recorrido por exceso de peso.",
      "Rebotar en la parte baja.",
      "Perder la retracción escapular al fatigarse.",
    ],
    cues: ["Pecho alto, escápulas fijas.", "Codos ligeramente cerrados.", "Baja lento, empuja fuerte."],
    alternatives: ["Press inclinado en máquina", "Press inclinado en multipower", "Press inclinado con barra"],
  },
  "machine-chest-press": {
    id: "machine-chest-press",
    inRoutine: true,
    name: "Press plano en máquina",
    short: "Press plano máquina",
    muscleGroup: "Pecho",
    primary: ["Pectoral mayor (porción esternal)"],
    secondary: ["Deltoides anterior", "Tríceps"],
    howTo:
      "Empuje horizontal guiado. Al no tener que estabilizar puedes llevar las series muy cerca del fallo con seguridad.",
    setup: [
      "Ajusta el asiento: agarres a la altura media del pecho.",
      "Espalda pegada al respaldo, escápulas atrás.",
      "Pies planos en el suelo.",
      "Agarre a la anchura natural, muñeca neutra.",
      "Hombros abajo, no encogidos.",
    ],
    execution: [
      "Empuja hasta casi extender, sin bloquear el codo.",
      "Vuelve controlado hasta sentir estiramiento en el pecho.",
      "Mantén el codo por debajo de la línea del hombro.",
      "Ritmo constante, sin rebote en el tope de las placas.",
    ],
    mistakes: [
      "Asiento mal ajustado (agarres a la altura del cuello).",
      "Despegar la espalda del respaldo al empujar.",
      "Encoger los hombros hacia las orejas.",
      "Recorrido corto para mover más placas.",
    ],
    cues: ["Aleja las manos del pecho.", "Hombros abajo.", "Estira al volver."],
    alternatives: ["Press banca con mancuernas", "Press en multipower", "Fondos en paralelas con lastre"],
  },
  "cable-fly": {
    id: "cable-fly",
    inRoutine: true,
    name: "Aperturas en polea",
    short: "Aperturas polea",
    muscleGroup: "Pecho",
    primary: ["Pectoral mayor"],
    secondary: ["Deltoides anterior"],
    howTo:
      "Aislamiento del pecho con tensión constante. Aquí no busques peso: busca estiramiento y contracción limpia.",
    setup: [
      "Poleas a la altura de los hombros o un poco por encima.",
      "Un pie adelantado, tronco ligeramente inclinado.",
      "Codos con una flexión fija de 10-20°.",
      "Escápulas atrás, pecho abierto.",
      "Core activo para no arquearte.",
    ],
    execution: [
      "Junta las manos describiendo un arco, no empujando.",
      "Cruza ligeramente las manos al final para más contracción.",
      "Aprieta un segundo.",
      "Abre lento hasta sentir el estiramiento completo.",
    ],
    mistakes: [
      "Convertirlo en un press flexionando y extendiendo el codo.",
      "Usar demasiado peso y balancear el cuerpo.",
      "Adelantar los hombros al juntar.",
      "Cortar el estiramiento final.",
    ],
    cues: ["Abraza, no empujes.", "Codo fijo.", "Estira sin soltar la tensión."],
    alternatives: ["Pec deck", "Aperturas con mancuernas en banco", "Cruce de poleas altas"],
  },
  "lateral-raise": {
    id: "lateral-raise",
    inRoutine: true,
    name: "Elevaciones laterales",
    short: "Elevaciones laterales",
    muscleGroup: "Hombro",
    primary: ["Deltoides lateral"],
    secondary: ["Deltoides anterior", "Trapecio superior"],
    howTo:
      "El ejercicio clave para la anchura del hombro. Peso moderado, recorrido limpio y muchas repeticiones de calidad.",
    setup: [
      "De pie, pies a la anchura de las caderas.",
      "Mancuernas a los lados o ligeramente por delante.",
      "Ligera inclinación del tronco hacia delante (5-10°).",
      "Codos casi extendidos con flexión mínima.",
      "Hombros abajo antes de empezar.",
    ],
    execution: [
      "Sube llevando los codos hacia fuera, no las manos.",
      "Detente a la altura del hombro.",
      "Meñique ligeramente más alto que el pulgar.",
      "Baja controlado en 2 segundos.",
    ],
    mistakes: [
      "Impulsar con las piernas o el tronco.",
      "Encoger el trapecio y subir los hombros.",
      "Subir por encima de la horizontal.",
      "Bajar en caída libre sin control.",
      "Rotar internamente en exceso ('vaciar la jarra' de forma agresiva).",
    ],
    cues: ["Sube el codo.", "Hombros lejos de las orejas.", "Frena arriba, baja lento."],
    alternatives: ["Elevaciones laterales en polea", "Elevaciones en máquina", "Elevaciones sentado con mancuernas"],
  },
  "reverse-pec-deck": {
    id: "reverse-pec-deck",
    inRoutine: true,
    name: "Reverse pec deck",
    short: "Reverse pec deck",
    muscleGroup: "Hombro",
    primary: ["Deltoides posterior"],
    secondary: ["Romboides", "Trapecio medio"],
    howTo:
      "Aislamiento del deltoides posterior. Poco peso, mucho control: si tiras con la espalda pierdes el objetivo.",
    setup: [
      "Pecho apoyado en el respaldo, asiento a la altura de los hombros.",
      "Agarres a la altura del hombro, agarre neutro o prono.",
      "Codos casi extendidos y fijos.",
      "Pecho firme contra el respaldo.",
      "Cuello relajado.",
    ],
    execution: [
      "Abre los brazos en arco hacia atrás.",
      "Piensa en separar los codos, no en juntar las escápulas.",
      "Pausa breve al final del recorrido.",
      "Vuelve lento sin dejar chocar las placas.",
    ],
    mistakes: [
      "Juntar escápulas y convertirlo en un remo.",
      "Flexionar y extender el codo.",
      "Despegar el pecho del respaldo.",
      "Demasiado peso y recorrido corto.",
    ],
    cues: ["Codos hacia atrás y afuera.", "Pecho pegado al respaldo.", "Sin tirón de espalda."],
    alternatives: ["Pájaros con mancuernas en banco inclinado", "Face pull en polea", "Aperturas invertidas en polea cruzada"],
  },
  "overhead-triceps-extension": {
    id: "overhead-triceps-extension",
    inRoutine: true,
    name: "Extensión de tríceps por encima de la cabeza",
    short: "Extensión sobre cabeza",
    muscleGroup: "Tríceps",
    primary: ["Tríceps braquial (porción larga)"],
    secondary: ["Tríceps lateral y medial"],
    howTo:
      "Con el brazo por encima de la cabeza la porción larga trabaja estirada: es la posición más productiva para el tríceps.",
    setup: [
      "Polea baja con cuerda, de espaldas a la máquina, o mancuerna a dos manos.",
      "Un pie adelantado, tronco ligeramente inclinado.",
      "Codos apuntando al frente y pegados a la cabeza.",
      "Core activo, sin arquear la zona lumbar.",
      "Hombros estables.",
    ],
    execution: [
      "Parte con el codo muy flexionado, sintiendo el estiramiento.",
      "Extiende sin mover el codo del sitio.",
      "Separa ligeramente la cuerda al final.",
      "Vuelve controlado al estiramiento máximo.",
    ],
    mistakes: [
      "Abrir los codos hacia los lados.",
      "Mover el hombro y convertirlo en un pullover.",
      "Arquear la lumbar por exceso de peso.",
      "No llegar al estiramiento completo abajo.",
    ],
    cues: ["Codos quietos y estrechos.", "Estira arriba del todo.", "Extiende, no empujes."],
    alternatives: ["Extensión con barra EZ tumbado", "Extensión en máquina", "Extensión unilateral sobre la cabeza"],
  },
  "triceps-pressdown": {
    id: "triceps-pressdown",
    inRoutine: true,
    name: "Pressdown en polea",
    short: "Pressdown",
    muscleGroup: "Tríceps",
    primary: ["Tríceps braquial (porción lateral)"],
    secondary: ["Porción medial", "Ancóneo"],
    howTo: "Extensión con el brazo pegado al cuerpo. Tensión constante y muy fácil de progresar.",
    setup: [
      "Polea alta con barra recta, EZ o cuerda.",
      "De pie, un paso atrás de la polea.",
      "Codos pegados al costado, ligera inclinación del tronco.",
      "Muñecas rectas, agarre firme.",
      "Pies a la anchura de las caderas.",
    ],
    execution: [
      "Extiende el codo hasta el bloqueo suave.",
      "Aprieta un instante abajo.",
      "Vuelve dejando que el codo suba hasta unos 90-100°.",
      "Mantén el codo en el mismo sitio todo el recorrido.",
    ],
    mistakes: [
      "Adelantar los codos y empujar con el hombro.",
      "Inclinar el cuerpo para bajar el peso.",
      "Recorrido corto arriba.",
      "Muñeca doblada.",
    ],
    cues: ["Codos clavados al costado.", "Solo se mueve el antebrazo.", "Aprieta abajo."],
    alternatives: ["Pressdown con cuerda", "Fondos en máquina asistida", "Extensión en máquina"],
  },
  "unilateral-triceps-extension": {
    id: "unilateral-triceps-extension",
    inRoutine: true,
    name: "Extensión unilateral de tríceps",
    short: "Extensión unilateral",
    muscleGroup: "Tríceps",
    primary: ["Tríceps braquial"],
    secondary: ["Ancóneo"],
    howTo:
      "Trabajo a un brazo para corregir descompensaciones y llegar a una contracción más limpia que con barra.",
    setup: [
      "Polea alta con agarre individual, supino o neutro.",
      "Codo pegado al costado.",
      "Tronco ligeramente inclinado hacia la polea.",
      "Hombro bajo y estable.",
      "Mano libre en la cadera o sujetando la máquina.",
    ],
    execution: [
      "Extiende completamente el codo.",
      "Gira ligeramente la muñeca a supinación al final si usas agarre supino.",
      "Pausa y aprieta.",
      "Vuelve controlado sin dejar que el codo se despegue.",
    ],
    mistakes: [
      "Rotar el tronco para ayudarse.",
      "Elevar el hombro.",
      "Usar demasiado peso y perder el recorrido.",
      "Cambiar la posición del codo entre repeticiones.",
    ],
    cues: ["Codo fijo.", "Extiende del todo.", "Mismo peso en ambos brazos."],
    alternatives: ["Patada de tríceps en polea", "Extensión unilateral sobre cabeza", "Pressdown a una mano con cuerda"],
  },
  "lat-pulldown": {
    id: "lat-pulldown",
    inRoutine: true,
    name: "Jalón al pecho",
    short: "Jalón al pecho",
    muscleGroup: "Espalda",
    primary: ["Dorsal ancho"],
    secondary: ["Redondo mayor", "Bíceps", "Trapecio inferior"],
    howTo: "Tracción vertical. Busca anchura: recorrido completo desde el estiramiento hasta el pecho.",
    setup: [
      "Rodilleras ajustadas para que no te despeguen del asiento.",
      "Agarre prono algo más ancho que los hombros.",
      "Pecho alto, ligera inclinación atrás (10-20°) constante.",
      "Escápulas ligeramente deprimidas antes de tirar.",
      "Pies planos en el suelo.",
    ],
    execution: [
      "Empieza bajando los hombros, luego flexiona los codos.",
      "Tira la barra hacia la parte alta del pecho.",
      "Aprieta abajo un instante.",
      "Sube controlado hasta el estiramiento completo del dorsal.",
    ],
    mistakes: [
      "Balancear el tronco adelante y atrás para tirar.",
      "Tirar solo con los brazos sin bajar la escápula.",
      "Jalón por detrás de la nuca.",
      "Soltar de golpe la subida y perder el control.",
      "Encoger los hombros arriba.",
    ],
    cues: ["Codos al bolsillo.", "Pecho hacia la barra.", "Estira arriba, no te encojas."],
    alternatives: ["Dominadas asistidas", "Jalón unilateral", "Jalón con agarre neutro"],
  },
  "chest-supported-row": {
    id: "chest-supported-row",
    inRoutine: true,
    name: "Remo con pecho apoyado",
    short: "Remo pecho apoyado",
    muscleGroup: "Espalda",
    primary: ["Dorsal ancho", "Romboides"],
    secondary: ["Trapecio medio", "Deltoides posterior", "Bíceps"],
    howTo:
      "Tracción horizontal sin que la lumbar sea el factor limitante. Ideal para llevarlo cerca del fallo.",
    setup: [
      "Pecho apoyado, respaldo ajustado para tener recorrido libre.",
      "Agarre neutro o prono según la máquina.",
      "Brazos estirados con el dorsal estirado al inicio.",
      "Pies firmes, cadera estable.",
      "Cuello neutro.",
    ],
    execution: [
      "Tira llevando los codos hacia atrás y abajo.",
      "Junta ligeramente las escápulas al final.",
      "Pausa breve en la contracción.",
      "Vuelve lento hasta el estiramiento completo.",
    ],
    mistakes: [
      "Despegar el pecho del apoyo para ganar recorrido.",
      "Tirar con impulso de cadera.",
      "Encoger los hombros.",
      "No estirar del todo entre repeticiones.",
    ],
    cues: ["Pecho pegado.", "Codos atrás.", "Estira al volver."],
    alternatives: ["Remo en máquina", "Remo con mancuerna a una mano", "Remo Gironda en polea"],
  },
  "unilateral-cable-row": {
    id: "unilateral-cable-row",
    inRoutine: true,
    name: "Remo unilateral en polea",
    short: "Remo unilateral",
    muscleGroup: "Espalda",
    primary: ["Dorsal ancho"],
    secondary: ["Redondo mayor", "Deltoides posterior", "Bíceps"],
    howTo:
      "Un brazo cada vez para aprovechar el recorrido extra de la escápula y corregir asimetrías.",
    setup: [
      "Polea a la altura del abdomen, agarre individual.",
      "Sentado o de pie con un pie adelantado.",
      "Brazo extendido dejando que la escápula se estire hacia delante.",
      "Tronco estable, sin rotar en exceso.",
      "Mano libre apoyada para dar estabilidad.",
    ],
    execution: [
      "Tira llevando el codo hacia la cadera.",
      "Deja que la escápula se retraiga al final.",
      "Aprieta un segundo.",
      "Vuelve extendiendo y estirando el dorsal por completo.",
    ],
    mistakes: [
      "Rotar el tronco para mover más peso.",
      "Tirar solo con el bíceps.",
      "No permitir el estiramiento de la escápula.",
      "Diferente número de repeticiones entre lados.",
    ],
    cues: ["Codo a la cadera.", "Estira el hombro hacia delante.", "Mismo trabajo en ambos lados."],
    alternatives: ["Remo con mancuerna en banco", "Remo en máquina unilateral", "Remo en polea baja a dos manos"],
  },
  "cable-pullover": {
    id: "cable-pullover",
    inRoutine: true,
    name: "Pullover en polea",
    short: "Pullover polea",
    muscleGroup: "Espalda",
    primary: ["Dorsal ancho"],
    secondary: ["Redondo mayor", "Tríceps (porción larga)"],
    howTo:
      "Aislamiento del dorsal sin implicación del bíceps. Perfecto para acabar el día de espalda.",
    setup: [
      "Polea alta con cuerda o barra recta.",
      "De pie, un paso atrás, cadera algo atrasada.",
      "Tronco inclinado unos 30-45°.",
      "Codos ligeramente flexionados y fijos.",
      "Core activo.",
    ],
    execution: [
      "Lleva los brazos desde arriba hasta los muslos en arco.",
      "Mantén el codo con la misma flexión todo el rato.",
      "Aprieta el dorsal abajo.",
      "Sube controlado hasta el estiramiento máximo.",
    ],
    mistakes: [
      "Flexionar el codo y convertirlo en un pressdown.",
      "Mover el tronco arriba y abajo.",
      "Exceso de peso y recorrido corto.",
      "Perder la posición de la cadera.",
    ],
    cues: ["Brazos largos.", "Arco amplio.", "Siente el dorsal, no el tríceps."],
    alternatives: ["Pullover en máquina", "Pullover con mancuerna", "Jalón con brazos rectos en barra"],
  },
  "pullup-neutral-pulldown": {
    id: "pullup-neutral-pulldown",
    inRoutine: true,
    name: "Dominadas o jalón neutro",
    short: "Dominadas / jalón neutro",
    muscleGroup: "Espalda",
    primary: ["Dorsal ancho"],
    secondary: ["Redondo mayor", "Bíceps", "Braquial"],
    howTo:
      "Tracción vertical con agarre neutro o prono. Si haces las 3 series en el rango con buena técnica, añade lastre.",
    setup: [
      "Agarre neutro a la anchura de los hombros (o prono en barra).",
      "Cuelga con los hombros activos, no del todo relajados.",
      "Piernas juntas, ligeramente adelantadas, core firme.",
      "Pecho alto y mirada al frente.",
      "Si usas jalón: rodilleras bien ajustadas.",
    ],
    execution: [
      "Empieza bajando la escápula.",
      "Sube hasta que la barbilla pase la barra o la barra toque el pecho.",
      "Aprieta arriba.",
      "Baja controlado hasta la extensión completa.",
    ],
    mistakes: [
      "Kipping o balanceo de piernas.",
      "Recorrido parcial sin bajar del todo.",
      "Encoger los hombros al colgar.",
      "Cuello adelantado buscando la barra con la barbilla.",
    ],
    cues: ["Codos abajo y atrás.", "Pecho a la barra.", "Cuelga estirado, sube fuerte."],
    alternatives: ["Dominadas asistidas en máquina", "Jalón con agarre neutro", "Dominadas con goma elástica"],
  },
  "machine-row": {
    id: "machine-row",
    inRoutine: true,
    name: "Remo en máquina",
    short: "Remo máquina",
    muscleGroup: "Espalda",
    primary: ["Dorsal ancho", "Romboides"],
    secondary: ["Trapecio medio", "Deltoides posterior", "Bíceps"],
    howTo: "Tracción horizontal guiada. Estable, segura y fácil de progresar semana a semana.",
    setup: [
      "Ajusta asiento y apoyo de pecho a la altura correcta.",
      "Agarres a la altura del abdomen bajo.",
      "Brazos extendidos con estiramiento inicial del dorsal.",
      "Pecho firme, escápulas libres al inicio.",
      "Pies apoyados y cadera estable.",
    ],
    execution: [
      "Tira los codos hacia atrás pegados al cuerpo.",
      "Retrae escápulas al final del recorrido.",
      "Mantén un instante la contracción.",
      "Vuelve lento hasta estirar por completo.",
    ],
    mistakes: [
      "Usar el tronco como palanca.",
      "Encoger los hombros.",
      "Recorrido corto por exceso de carga.",
      "Soltar el peso de golpe al volver.",
    ],
    cues: ["Codos atrás.", "Pecho quieto.", "Estira y vuelve a tirar."],
    alternatives: ["Remo con pecho apoyado", "Remo en polea baja", "Remo con barra T"],
  },
  "hip-abduction": {
    id: "hip-abduction",
    inRoutine: true,
    name: "Abducción en máquina",
    short: "Abducción",
    muscleGroup: "Pierna",
    primary: ["Glúteo medio", "Glúteo menor"],
    secondary: ["Tensor de la fascia lata", "Glúteo mayor (fibras superiores)"],
    howTo:
      "Va primero de forma intencionada: activa el glúteo medio y estabiliza la cadera para el resto del día.",
    setup: [
      "Ajusta los topes al ancho de tus caderas.",
      "Espalda apoyada; inclínate ligeramente adelante para más glúteo medio.",
      "Pies apoyados en las plataformas.",
      "Rodillas en línea con las caderas.",
      "Agarra los laterales sin tirar con los brazos.",
    ],
    execution: [
      "Abre las piernas de forma controlada hasta el final del recorrido.",
      "Aprieta 1 segundo en la apertura máxima.",
      "Cierra lento resistiendo el peso.",
      "No dejes chocar las placas.",
    ],
    mistakes: [
      "Usar impulso y rebotes rápidos.",
      "Empujar con los brazos en los laterales.",
      "Recorrido mínimo con peso excesivo.",
      "Levantar la espalda del respaldo.",
    ],
    cues: ["Abre despacio, cierra más despacio.", "Aprieta el glúteo arriba.", "Sin rebote."],
    alternatives: ["Abducción en polea de pie", "Abducción con banda elástica sentado", "Abducción tumbado de lado"],
  },
  "lying-leg-curl": {
    id: "lying-leg-curl",
    inRoutine: true,
    name: "Curl femoral tumbado",
    short: "Curl femoral",
    muscleGroup: "Pierna",
    primary: ["Isquiosurales (bíceps femoral, semitendinoso, semimembranoso)"],
    secondary: ["Gemelo", "Poplíteo"],
    howTo:
      "Flexión de rodilla aislada. Al ir antes del hack squat, prepara la rodilla y no compromete el trabajo de cuádriceps.",
    setup: [
      "Rodilla alineada con el eje de giro de la máquina.",
      "Rodillo justo encima del tendón de Aquiles.",
      "Cadera pegada al banco.",
      "Agarra las asas, hombros relajados.",
      "Pies en flexión dorsal (punta hacia la espinilla).",
    ],
    execution: [
      "Flexiona la rodilla llevando el talón al glúteo.",
      "Aprieta arriba un instante.",
      "Baja controlado en 2-3 segundos.",
      "No extiendas del todo entre repeticiones para no perder tensión.",
    ],
    mistakes: [
      "Despegar la cadera del banco para ayudarse.",
      "Rebotar en la parte baja.",
      "Recorrido incompleto arriba.",
      "Rodillo mal colocado sobre el gemelo.",
    ],
    cues: ["Cadera pegada.", "Talón al glúteo.", "Baja lento."],
    alternatives: ["Curl femoral sentado", "Curl femoral de pie unilateral", "Curl nórdico asistido"],
  },
  "leg-extension": {
    id: "leg-extension",
    inRoutine: true,
    name: "Extensión de cuádriceps",
    short: "Extensión cuádriceps",
    muscleGroup: "Pierna",
    primary: ["Cuádriceps (recto femoral, vastos)"],
    secondary: [],
    howTo:
      "Aislamiento de cuádriceps antes del hack squat: pre-fatiga el músculo objetivo y calienta la rodilla.",
    setup: [
      "Rodilla alineada con el eje de la máquina.",
      "Rodillo sobre la parte baja de la espinilla, encima del tobillo.",
      "Espalda apoyada en el respaldo.",
      "Agarra las asas laterales.",
      "Cadera bien atrás en el asiento.",
    ],
    execution: [
      "Extiende hasta bloquear suavemente la rodilla.",
      "Aprieta 1 segundo arriba.",
      "Baja controlado hasta unos 90° o algo más.",
      "Mantén la tensión, sin apoyar las placas.",
    ],
    mistakes: [
      "Levantar el glúteo del asiento.",
      "Lanzar el peso con impulso.",
      "Bajar en caída libre.",
      "Rodilla desalineada con el eje.",
    ],
    cues: ["Extiende y aprieta.", "Culo pegado al asiento.", "Controla la bajada."],
    alternatives: ["Extensión unilateral", "Sissy squat", "Extensión con banda elástica"],
  },
  "hack-squat": {
    id: "hack-squat",
    inRoutine: true,
    name: "Hack squat",
    short: "Hack squat",
    muscleGroup: "Pierna",
    primary: ["Cuádriceps"],
    secondary: ["Glúteo mayor", "Aductores"],
    howTo:
      "El ejercicio pesado del día. Recorrido profundo con la espalda apoyada: máximo estímulo de cuádriceps con poca fatiga lumbar.",
    setup: [
      "Espalda y cadera completamente pegadas al respaldo.",
      "Pies a la anchura de los hombros, en el centro-bajo de la plataforma.",
      "Puntas ligeramente hacia fuera (10-20°).",
      "Hombros bien encajados bajo las almohadillas.",
      "Core activo, mirada al frente.",
    ],
    execution: [
      "Baja controlado hasta que el muslo pase la paralela.",
      "Rodillas siguiendo la línea de los pies.",
      "Empuja con todo el pie, sin levantar el talón.",
      "Sube sin bloquear la rodilla del todo arriba.",
    ],
    mistakes: [
      "Despegar la lumbar del respaldo en la parte baja.",
      "Levantar los talones.",
      "Meter las rodillas hacia dentro.",
      "Media sentadilla con exceso de peso.",
      "Rebotar en el fondo.",
    ],
    cues: ["Espalda pegada.", "Empuja con el mediopié.", "Baja profundo y controlado."],
    alternatives: ["Prensa 45° (fuera de este día)", "Sentadilla en multipower", "Pendulum squat"],
  },
  "romanian-deadlift": {
    id: "romanian-deadlift",
    inRoutine: true,
    name: "Peso muerto rumano",
    short: "Peso muerto rumano",
    muscleGroup: "Pierna",
    primary: ["Isquiosurales", "Glúteo mayor"],
    secondary: ["Erectores espinales", "Dorsal ancho (estabilización)"],
    howTo:
      "Bisagra de cadera con las rodillas casi fijas. Cierra el día con trabajo de cadena posterior en estiramiento.",
    setup: [
      "Barra o mancuernas pegadas al cuerpo.",
      "Pies a la anchura de las caderas.",
      "Rodillas con una flexión ligera y constante.",
      "Escápulas retraídas, pecho alto, lumbar neutra.",
      "Peso en el mediopié.",
    ],
    execution: [
      "Lleva la cadera hacia atrás bajando la barra pegada a las piernas.",
      "Baja hasta sentir el estiramiento del isquio, sin redondear la espalda.",
      "Sube empujando la cadera hacia delante.",
      "Termina de pie sin hiperextender la lumbar.",
    ],
    mistakes: [
      "Redondear la espalda baja.",
      "Convertirlo en una sentadilla flexionando mucho la rodilla.",
      "Separar la barra del cuerpo.",
      "Buscar profundidad extra a costa de la técnica.",
      "Hiperextender al final del movimiento.",
    ],
    cues: ["Cadera atrás, no bajes el pecho.", "Barra pegada a la pierna.", "Para cuando tire el isquio."],
    alternatives: ["Peso muerto rumano con mancuernas", "Buenos días en multipower", "Hip thrust (si hay molestia lumbar)"],
  },
  "calf-raise": {
    id: "calf-raise",
    inRoutine: true,
    name: "Gemelos",
    short: "Gemelos",
    muscleGroup: "Pierna",
    primary: ["Gemelo (gastrocnemio)"],
    secondary: ["Sóleo"],
    howTo:
      "Elevación de talones con recorrido completo. La clave es la pausa abajo en estiramiento, no el rebote.",
    setup: [
      "Metatarso apoyado en el borde de la plataforma.",
      "Talones libres para bajar por debajo del escalón.",
      "Rodilla casi extendida (de pie) para más gemelo.",
      "Tronco erguido, core activo.",
      "Agarre firme para estabilizarte.",
    ],
    execution: [
      "Baja hasta el estiramiento máximo y pausa 1-2 segundos.",
      "Sube hasta la punta del pie contrayendo fuerte.",
      "Aprieta 1 segundo arriba.",
      "Repite sin usar rebote elástico.",
    ],
    mistakes: [
      "Rebotar abajo aprovechando el tendón.",
      "Recorrido corto arriba.",
      "Flexionar la rodilla para ayudarse.",
      "Ir demasiado rápido.",
    ],
    cues: ["Pausa abajo.", "Sube a la punta.", "Sin rebote."],
    alternatives: ["Gemelos sentado (más sóleo)", "Gemelos en prensa", "Gemelos a una pierna con mancuerna"],
  },

  /* --- PECHO (ampliación) --- */
  "barbell-bench-press": {
    id: "barbell-bench-press",
    name: "Press de banca con barra",
    short: "Press banca barra",
    muscleGroup: "Pecho",
    primary: ["Pectoral mayor"],
    secondary: ["Deltoides anterior", "Tríceps"],
    howTo: "El básico de empuje horizontal. Permite mover más carga que con mancuernas gracias a la estabilidad de la barra.",
    setup: ["Escápulas retraídas contra el banco.", "Pies firmes en el suelo, ligero arco lumbar natural.", "Agarre algo más ancho que los hombros."],
    execution: ["Baja la barra controlada hasta rozar el pecho.", "Codos a 45-60° del tronco.", "Empuja hasta extender sin bloquear de golpe."],
    mistakes: ["Rebotar la barra en el pecho.", "Despegar los glúteos del banco."],
    cues: ["Pecho alto.", "Barra en línea recta."],
    alternatives: ["Press con mancuernas", "Press en máquina"],
  },
  "dumbbell-bench-press": {
    id: "dumbbell-bench-press",
    name: "Press de banca con mancuernas",
    short: "Press banca mancuernas",
    muscleGroup: "Pecho",
    primary: ["Pectoral mayor"],
    secondary: ["Deltoides anterior", "Tríceps"],
    howTo: "Mismo patrón que con barra pero con mayor recorrido y trabajo de estabilización a cada lado.",
    setup: ["Mancuernas a la altura del pecho, codos abajo.", "Escápulas retraídas.", "Pies firmes en el suelo."],
    execution: ["Empuja las mancuernas hacia arriba y ligeramente hacia dentro.", "Extiende sin chocar las mancuernas.", "Baja controlado hasta el estiramiento."],
    mistakes: ["Bajar demasiado y forzar el hombro.", "Perder el control en la fase excéntrica."],
    cues: ["Codos bajo las muñecas.", "Trayectoria en arco."],
    alternatives: ["Press con barra", "Press inclinado con mancuernas"],
  },
  "incline-barbell-press": {
    id: "incline-barbell-press",
    name: "Press inclinado con barra",
    short: "Press inclinado barra",
    muscleGroup: "Pecho",
    primary: ["Pectoral mayor (porción clavicular)"],
    secondary: ["Deltoides anterior", "Tríceps"],
    howTo: "Versión con barra del press inclinado, prioriza carga sobre la parte alta del pecho.",
    setup: ["Banco a 30-45°.", "Agarre a la anchura de los hombros.", "Escápulas fijas contra el banco."],
    execution: ["Baja la barra a la parte alta del pecho.", "Empuja en línea recta hacia arriba.", "No bloquees de golpe arriba."],
    mistakes: ["Inclinar el banco más de 45° (pasa el trabajo al hombro).", "Rebotar abajo."],
    cues: ["Barra hacia la clavícula.", "Codos ligeramente cerrados."],
    alternatives: ["Press inclinado con mancuernas", "Press inclinado en máquina"],
  },
  "decline-bench-press": {
    id: "decline-bench-press",
    name: "Press declinado con barra",
    short: "Press declinado",
    muscleGroup: "Pecho",
    primary: ["Pectoral mayor (porción esternal/inferior)"],
    secondary: ["Tríceps", "Deltoides anterior"],
    howTo: "Empuje en banco declinado, enfatiza la parte baja del pectoral.",
    setup: ["Pies asegurados en los topes del banco.", "Escápulas retraídas.", "Agarre a la anchura de los hombros."],
    execution: ["Baja la barra a la parte baja del pecho.", "Empuja en línea recta.", "Control total en la bajada."],
    mistakes: ["Recorrido corto por miedo a la posición.", "Mover mucho la cabeza."],
    cues: ["Barra hacia el esternón bajo.", "Ritmo constante."],
    alternatives: ["Press plano con barra", "Fondos en paralelas"],
  },
  "dips-chest": {
    id: "dips-chest",
    name: "Fondos en paralelas (pecho)",
    short: "Fondos pecho",
    muscleGroup: "Pecho",
    primary: ["Pectoral mayor (porción inferior)"],
    secondary: ["Tríceps", "Deltoides anterior"],
    howTo: "Inclinando el tronco hacia delante, los fondos cargan más el pectoral que el tríceps.",
    setup: ["Tronco inclinado hacia delante.", "Codos ligeramente abiertos.", "Piernas cruzadas o flexionadas atrás."],
    execution: ["Baja hasta sentir estiramiento en el pecho.", "Empuja volviendo a extender los brazos.", "No bloquees bruscamente arriba."],
    mistakes: ["Bajar demasiado y cargar el hombro.", "Mantener el tronco vertical (pasa el trabajo al tríceps)."],
    cues: ["Inclínate hacia delante.", "Codos afuera."],
    alternatives: ["Press declinado", "Aperturas en polea"],
  },
  "dumbbell-pullover": {
    id: "dumbbell-pullover",
    name: "Pullover con mancuerna",
    short: "Pullover",
    muscleGroup: "Pecho",
    primary: ["Pectoral mayor", "Dorsal ancho"],
    secondary: ["Tríceps (cabeza larga)", "Serrato anterior"],
    howTo: "Movimiento de arco por encima de la cabeza, útil como aislamiento de pecho y dorsal a la vez.",
    setup: ["Tumbado transversal en el banco, solo hombros apoyados.", "Mancuerna sujeta con ambas manos.", "Codos con flexión fija y suave."],
    execution: ["Baja el peso en arco por detrás de la cabeza.", "Siente el estiramiento en el pecho y dorsal.", "Vuelve trazando el mismo arco."],
    mistakes: ["Flexionar y extender el codo (lo convierte en tríceps).", "Arquear demasiado la zona lumbar."],
    cues: ["Codos fijos.", "Trayectoria en arco, no en línea recta."],
    alternatives: ["Cable pullover", "Aperturas en polea"],
  },
  "smith-machine-press": {
    id: "smith-machine-press",
    name: "Press de banca en multipower",
    short: "Press multipower",
    muscleGroup: "Pecho",
    primary: ["Pectoral mayor"],
    secondary: ["Deltoides anterior", "Tríceps"],
    howTo: "Press guiado en máquina Smith, útil para entrenar cerca del fallo con seguridad y sin estabilizar la barra.",
    setup: ["Banco centrado bajo la barra guiada.", "Escápulas retraídas.", "Pies firmes en el suelo."],
    execution: ["Desengancha y baja controlado al pecho.", "Empuja en línea recta hacia arriba.", "Vuelve a enganchar al terminar la serie."],
    mistakes: ["Colocar el banco descentrado respecto a la barra.", "Usar demasiado peso por la sensación de seguridad."],
    cues: ["Trayectoria fija, tú controlas el ritmo.", "Pecho alto."],
    alternatives: ["Press con barra libre", "Press en máquina"],
  },
  "flat-dumbbell-fly": {
    id: "flat-dumbbell-fly",
    name: "Aperturas con mancuernas en banco plano",
    short: "Aperturas mancuernas",
    muscleGroup: "Pecho",
    primary: ["Pectoral mayor"],
    secondary: ["Deltoides anterior"],
    howTo: "Aislamiento del pecho en banco plano, con más estiramiento que la variante en polea.",
    setup: ["Mancuernas arriba con codos casi extendidos.", "Flexión de codo fija y ligera.", "Escápulas retraídas contra el banco."],
    execution: ["Abre los brazos en arco hasta el estiramiento.", "Junta las mancuernas arriba sin chocarlas.", "No las conviertas en un press."],
    mistakes: ["Flexionar y extender el codo como en un press.", "Bajar demasiado y forzar el hombro."],
    cues: ["Codo fijo todo el recorrido.", "Abraza un tronco grande."],
    alternatives: ["Aperturas en polea", "Pec deck"],
  },
  "cable-crossover": {
    id: "cable-crossover",
    name: "Cruce de poleas",
    short: "Cruce de poleas",
    muscleGroup: "Pecho",
    primary: ["Pectoral mayor"],
    secondary: ["Deltoides anterior"],
    howTo: "Variante de aperturas con poleas altas cruzando las manos abajo, tensión constante en todo el recorrido.",
    setup: ["Poleas altas, un pie adelantado.", "Tronco ligeramente inclinado hacia delante.", "Codos con flexión fija."],
    execution: ["Junta las manos por delante y abajo del cuerpo.", "Cruza ligeramente al final.", "Vuelve controlado hasta el estiramiento."],
    mistakes: ["Usar demasiado peso y perder el recorrido.", "Balancear el cuerpo."],
    cues: ["Arco amplio.", "Aprieta y cruza abajo."],
    alternatives: ["Aperturas con mancuernas", "Pec deck"],
  },

  /* --- ESPALDA (ampliación) --- */
  "conventional-deadlift": {
    id: "conventional-deadlift",
    name: "Peso muerto convencional",
    short: "Peso muerto",
    muscleGroup: "Espalda",
    primary: ["Erectores espinales", "Dorsal ancho"],
    secondary: ["Glúteo", "Isquiotibiales", "Trapecio"],
    howTo: "El ejercicio de fuerza global por excelencia. Exige técnica cuidada por la carga que mueve.",
    setup: ["Barra pegada a las espinillas.", "Espalda neutra, pecho alto.", "Agarre justo fuera de las piernas."],
    execution: ["Empuja el suelo con las piernas mientras la barra sube pegada al cuerpo.", "Extiende cadera y rodillas a la vez.", "Baja controlado invirtiendo el patrón."],
    mistakes: ["Redondear la zona lumbar.", "Alejar la barra del cuerpo."],
    cues: ["Barra pegada a la pierna.", "Pecho alto, espalda neutra."],
    alternatives: ["Peso muerto rumano", "Peso muerto piernas rígidas"],
  },
  "barbell-row": {
    id: "barbell-row",
    name: "Remo con barra",
    short: "Remo barra",
    muscleGroup: "Espalda",
    primary: ["Dorsal ancho", "Trapecio medio"],
    secondary: ["Romboides", "Bíceps"],
    howTo: "Tirón horizontal con barra, tronco inclinado. Muy efectivo para espesor de espalda.",
    setup: ["Tronco inclinado unos 45°, espalda neutra.", "Barra colgando con brazos extendidos.", "Rodillas con flexión suave."],
    execution: ["Tira de la barra hacia el abdomen.", "Aprieta las escápulas arriba.", "Baja controlado sin perder la postura."],
    mistakes: ["Usar impulso con la zona lumbar.", "Enderezar el tronco en cada repetición."],
    cues: ["Codos hacia atrás.", "Espalda fija todo el recorrido."],
    alternatives: ["Remo en máquina T", "Remo en polea sentado"],
  },
  "seated-cable-row": {
    id: "seated-cable-row",
    name: "Remo en polea sentado",
    short: "Remo polea",
    muscleGroup: "Espalda",
    primary: ["Dorsal ancho", "Trapecio medio"],
    secondary: ["Romboides", "Bíceps"],
    howTo: "Tirón horizontal guiado, fácil de dosificar y con tensión constante.",
    setup: ["Sentado con rodillas ligeramente flexionadas.", "Espalda recta, pecho alto.", "Agarre firme al frente."],
    execution: ["Tira hacia el abdomen llevando los codos atrás.", "Aprieta las escápulas al final.", "Vuelve controlado sin redondear la espalda."],
    mistakes: ["Balancear el tronco adelante y atrás.", "Encoger los hombros al tirar."],
    cues: ["Pecho al frente.", "Tira con la espalda, no con el brazo."],
    alternatives: ["Remo con barra", "Remo en máquina"],
  },
  "close-grip-pulldown-supinated": {
    id: "close-grip-pulldown-supinated",
    name: "Jalón al pecho agarre cerrado supino",
    short: "Jalón cerrado supino",
    muscleGroup: "Espalda",
    primary: ["Dorsal ancho"],
    secondary: ["Bíceps", "Romboides"],
    howTo: "Variante de jalón con agarre estrecho y supino, mayor implicación del bíceps y buena sensación de contracción dorsal.",
    setup: ["Agarre cerrado, palmas hacia ti.", "Tronco ligeramente reclinado.", "Piernas fijas bajo los soportes."],
    execution: ["Tira de la barra hacia la parte alta del pecho.", "Lleva los codos hacia abajo y atrás.", "Vuelve controlado hasta el estiramiento."],
    mistakes: ["Usar impulso con el tronco.", "Tirar detrás de la nuca."],
    cues: ["Codos hacia las caderas.", "Pecho al encuentro de la barra."],
    alternatives: ["Jalón al pecho agarre supino", "Dominadas"],
  },
  "pull-up": {
    id: "pull-up",
    name: "Dominadas",
    short: "Dominadas",
    muscleGroup: "Espalda",
    primary: ["Dorsal ancho"],
    secondary: ["Bíceps", "Romboides", "Trapecio"],
    howTo: "Tirón vertical con el propio peso corporal, uno de los mejores ejercicios de espalda que existen.",
    setup: ["Agarre a la anchura de los hombros o algo más ancho.", "Cuerpo estable, sin balanceo.", "Core activo."],
    execution: ["Tira hasta que la barbilla pase la barra.", "Lleva los codos hacia abajo y atrás.", "Baja controlado hasta la extensión completa."],
    mistakes: ["Usar impulso o balanceo (kipping) fuera de contexto.", "Recorrido corto arriba."],
    cues: ["Codos hacia los bolsillos.", "Pecho hacia la barra."],
    alternatives: ["Jalón al pecho", "Dominadas asistidas en máquina"],
  },
  "t-bar-row": {
    id: "t-bar-row",
    name: "Remo en máquina T",
    short: "Remo T",
    muscleGroup: "Espalda",
    primary: ["Dorsal ancho", "Trapecio medio"],
    secondary: ["Romboides", "Bíceps"],
    howTo: "Remo con apoyo en el pecho o tronco inclinado fijo, permite cargar mucho peso con la zona lumbar protegida.",
    setup: ["Pecho apoyado o tronco fijo según la máquina.", "Agarre firme en las asas.", "Espalda neutra."],
    execution: ["Tira del peso hacia el abdomen.", "Aprieta las escápulas arriba.", "Baja controlado hasta el estiramiento."],
    mistakes: ["Tirar con tirones bruscos.", "Encoger los hombros en vez de llevar los codos atrás."],
    cues: ["Codos pegados al cuerpo.", "Aprieta arriba un instante."],
    alternatives: ["Remo con barra", "Remo en polea sentado"],
  },
  "single-arm-dumbbell-row": {
    id: "single-arm-dumbbell-row",
    name: "Remo a una mano con mancuerna",
    short: "Remo a una mano",
    muscleGroup: "Espalda",
    primary: ["Dorsal ancho"],
    secondary: ["Romboides", "Bíceps"],
    howTo: "Remo unilateral apoyado en banco, permite un recorrido más largo y corregir descompensaciones.",
    setup: ["Rodilla y mano de apoyo sobre el banco.", "Espalda paralela al suelo y neutra.", "Mancuerna colgando con el brazo extendido."],
    execution: ["Tira de la mancuerna hacia la cadera.", "Lleva el codo hacia atrás pegado al cuerpo.", "Baja controlado hasta el estiramiento."],
    mistakes: ["Rotar el tronco para ayudarse.", "Tirar hacia el hombro en vez de hacia la cadera."],
    cues: ["Codo pegado al cuerpo.", "Tira con la espalda."],
    alternatives: ["Remo en polea sentado", "Remo con barra"],
  },
  "straight-arm-pulldown": {
    id: "straight-arm-pulldown",
    name: "Jalón con brazos rectos",
    short: "Jalón brazos rectos",
    muscleGroup: "Espalda",
    primary: ["Dorsal ancho"],
    secondary: ["Serrato anterior", "Tríceps (cabeza larga)"],
    howTo: "Aislamiento puro del dorsal en polea alta, sin implicar apenas el bíceps.",
    setup: ["De pie frente a la polea alta con barra o cuerda.", "Codos con flexión mínima y fija.", "Ligera inclinación del tronco."],
    execution: ["Baja el peso en arco hasta los muslos.", "Mantén los codos casi extendidos todo el recorrido.", "Vuelve controlado hasta el estiramiento."],
    mistakes: ["Flexionar el codo y convertirlo en un jalón normal.", "Usar demasiado peso y perder el recorrido."],
    cues: ["Codos fijos.", "Empuja con el dorsal, no con el brazo."],
    alternatives: ["Pullover con mancuerna", "Jalón al pecho"],
  },
  "back-extension": {
    id: "back-extension",
    name: "Hiperextensión lumbar",
    short: "Hiperextensión",
    muscleGroup: "Espalda",
    primary: ["Erectores espinales"],
    secondary: ["Glúteo", "Isquiotibiales"],
    howTo: "Extensión de tronco en banco romano, fortalece la zona lumbar y protege la espalda en otros ejercicios.",
    setup: ["Caderas apoyadas en el borde del banco.", "Piernas fijas bajo los rodillos.", "Cuerpo en línea recta al empezar."],
    execution: ["Baja el tronco controlado hasta sentir el estiramiento.", "Sube hasta la línea recta, sin hiperextender.", "Aprieta glúteo e isquios al subir."],
    mistakes: ["Hiperextender la zona lumbar arriba.", "Subir de golpe con impulso."],
    cues: ["Sube hasta la línea recta y para.", "Aprieta glúteo arriba."],
    alternatives: ["Peso muerto rumano", "Buenos días"],
  },

  /* --- HOMBRO (ampliación, sin presses por encima de la cabeza) --- */
  "front-raise": {
    id: "front-raise",
    name: "Elevación frontal con mancuernas",
    short: "Elevación frontal",
    muscleGroup: "Hombro",
    primary: ["Deltoides anterior"],
    secondary: ["Pectoral (porción clavicular)"],
    howTo: "Aislamiento de la parte frontal del hombro, con poco peso y recorrido controlado.",
    setup: ["De pie, mancuernas por delante de los muslos.", "Codos con flexión mínima y fija.", "Core activo, sin balanceo."],
    execution: ["Sube hasta la altura del hombro.", "Pausa breve arriba.", "Baja controlado sin dejar caer el peso."],
    mistakes: ["Usar impulso con el cuerpo.", "Subir por encima de la altura del hombro."],
    cues: ["Sube con control.", "Sin balanceo del tronco."],
    alternatives: ["Elevación frontal en polea", "Elevación frontal con disco"],
  },
  "cable-lateral-raise": {
    id: "cable-lateral-raise",
    name: "Elevación lateral en polea",
    short: "Elevación lateral polea",
    muscleGroup: "Hombro",
    primary: ["Deltoides lateral"],
    secondary: ["Deltoides anterior"],
    howTo: "Variante en polea de la elevación lateral, con tensión constante desde el primer grado del recorrido.",
    setup: ["De costado a la polea baja.", "Brazo cruzado por delante del cuerpo al empezar.", "Codo con flexión mínima y fija."],
    execution: ["Sube el brazo hacia el lateral hasta la altura del hombro.", "Pausa breve arriba.", "Baja controlado manteniendo la tensión."],
    mistakes: ["Encoger el trapecio al subir.", "Usar el tronco para impulsar."],
    cues: ["Sube el codo.", "Tensión constante, sin soltar abajo."],
    alternatives: ["Elevaciones laterales con mancuernas", "Elevaciones en máquina"],
  },
  "machine-lateral-raise": {
    id: "machine-lateral-raise",
    name: "Elevación lateral en máquina",
    short: "Elevación lateral máquina",
    muscleGroup: "Hombro",
    primary: ["Deltoides lateral"],
    secondary: [],
    howTo: "Elevación lateral guiada, permite series muy cerca del fallo sin problema de estabilización.",
    setup: ["Ajusta el asiento a la altura correcta.", "Espalda pegada al respaldo.", "Codos apoyados en las almohadillas."],
    execution: ["Sube los brazos hasta la altura del hombro.", "Pausa breve arriba.", "Baja controlado sin soltar el peso."],
    mistakes: ["Asiento mal ajustado.", "Subir por encima del hombro encogiendo el trapecio."],
    cues: ["Sube con los codos.", "Ritmo constante."],
    alternatives: ["Elevaciones laterales con mancuernas", "Elevaciones en polea"],
  },
  "face-pull": {
    id: "face-pull",
    name: "Face pull en polea",
    short: "Face pull",
    muscleGroup: "Hombro",
    primary: ["Deltoides posterior"],
    secondary: ["Trapecio medio", "Romboides", "Rotadores externos"],
    howTo: "Tirón hacia la cara en polea alta, clave para la salud del hombro y el equilibrio con el trabajo de empuje.",
    setup: ["Polea a la altura de la cara con cuerda.", "Un pie adelantado, tronco firme.", "Agarre con las palmas hacia dentro."],
    execution: ["Tira hacia la cara separando las manos.", "Rota los hombros hacia fuera al final.", "Vuelve controlado sin perder tensión."],
    mistakes: ["Tirar solo con el brazo sin abrir los codos.", "Usar demasiado peso y perder la forma."],
    cues: ["Codos altos.", "Rota hacia fuera al final."],
    alternatives: ["Reverse pec deck", "Pájaros con mancuernas"],
  },
  "rear-delt-fly-dumbbell": {
    id: "rear-delt-fly-dumbbell",
    name: "Pájaros con mancuernas",
    short: "Pájaros",
    muscleGroup: "Hombro",
    primary: ["Deltoides posterior"],
    secondary: ["Romboides", "Trapecio medio"],
    howTo: "Aislamiento del deltoides posterior con mancuernas, inclinado hacia delante.",
    setup: ["Tronco inclinado casi paralelo al suelo.", "Mancuernas colgando, codos con flexión mínima.", "Espalda neutra, core activo."],
    execution: ["Abre los brazos en arco hacia atrás.", "Aprieta las escápulas al final.", "Baja controlado hasta el estiramiento."],
    mistakes: ["Enderezar el tronco para ayudarse.", "Convertirlo en un remo flexionando el codo."],
    cues: ["Codo casi fijo.", "Separa los codos, no juntes las manos."],
    alternatives: ["Reverse pec deck", "Face pull"],
  },
  "upright-row": {
    id: "upright-row",
    name: "Remo al mentón en polea",
    short: "Remo al mentón",
    muscleGroup: "Hombro",
    primary: ["Deltoides lateral", "Trapecio"],
    secondary: ["Bíceps"],
    howTo: "Tirón vertical hasta la altura del pecho-mentón, trabaja hombro lateral y trapecio.",
    setup: ["De pie, barra o polea baja con agarre estrecho.", "Espalda neutra.", "Core activo."],
    execution: ["Tira hacia arriba llevando los codos por delante y afuera.", "Sube hasta la altura del pecho, no más.", "Baja controlado."],
    mistakes: ["Subir demasiado alto forzando el hombro.", "Usar impulso de piernas y cadera."],
    cues: ["Codos guían el movimiento.", "Para a la altura del pecho."],
    alternatives: ["Elevaciones laterales", "Encogimientos"],
  },
  "barbell-shrug": {
    id: "barbell-shrug",
    name: "Encogimientos con barra",
    short: "Encogimientos",
    muscleGroup: "Hombro",
    primary: ["Trapecio superior"],
    secondary: [],
    howTo: "Movimiento simple de elevación de hombros, clave para el desarrollo del trapecio.",
    setup: ["De pie, barra con agarre a la anchura de los hombros.", "Brazos extendidos y relajados.", "Core activo."],
    execution: ["Encoge los hombros hacia las orejas.", "Pausa breve arriba.", "Baja controlado sin rotar los hombros."],
    mistakes: ["Rotar los hombros en círculo (innecesario y puede irritar la articulación).", "Usar impulso de piernas."],
    cues: ["Sube en línea recta.", "Pausa arriba."],
    alternatives: ["Encogimientos con mancuernas", "Encogimientos en máquina"],
  },

  /* --- BÍCEPS (ampliación) --- */
  "barbell-curl": {
    id: "barbell-curl",
    name: "Curl con barra",
    short: "Curl barra",
    muscleGroup: "Bíceps",
    primary: ["Bíceps braquial"],
    secondary: ["Braquial", "Braquiorradial"],
    howTo: "El curl clásico, permite mover más carga que con mancuernas.",
    setup: ["De pie, barra con agarre supino a la anchura de los hombros.", "Codos pegados al costado.", "Core activo, sin balanceo."],
    execution: ["Flexiona el codo subiendo la barra.", "Aprieta arriba un instante.", "Baja controlado hasta la extensión completa."],
    mistakes: ["Balancear el cuerpo para impulsar.", "Adelantar los codos al subir."],
    cues: ["Codos fijos al costado.", "Sin impulso de cadera."],
    alternatives: ["Curl con barra EZ", "Curl con mancuernas"],
  },
  "hammer-curl": {
    id: "hammer-curl",
    name: "Curl martillo",
    short: "Curl martillo",
    muscleGroup: "Bíceps",
    primary: ["Braquial", "Braquiorradial"],
    secondary: ["Bíceps braquial"],
    howTo: "Agarre neutro que prioriza el braquial y el antebrazo sobre el bíceps.",
    setup: ["De pie, mancuernas con agarre neutro.", "Codos pegados al costado.", "Core activo."],
    execution: ["Flexiona el codo manteniendo el agarre neutro.", "Sube hasta contraer.", "Baja controlado."],
    mistakes: ["Balancear el cuerpo.", "Abrir los codos al subir."],
    cues: ["Pulgares hacia arriba todo el recorrido.", "Codos quietos."],
    alternatives: ["Curl martillo en polea", "Curl con barra"],
  },
  "cable-curl": {
    id: "cable-curl",
    name: "Curl en polea baja",
    short: "Curl polea",
    muscleGroup: "Bíceps",
    primary: ["Bíceps braquial"],
    secondary: ["Braquial"],
    howTo: "Curl con tensión constante gracias a la polea, buena sensación de contracción.",
    setup: ["De pie frente a la polea baja con barra recta o EZ.", "Codos pegados al costado.", "Core activo."],
    execution: ["Flexiona el codo subiendo la barra.", "Aprieta arriba.", "Baja controlado sin soltar la tensión."],
    mistakes: ["Adelantar los codos.", "Usar impulso del tronco."],
    cues: ["Tensión constante.", "Codos fijos."],
    alternatives: ["Curl con barra", "Curl con mancuernas"],
  },
  "concentration-curl": {
    id: "concentration-curl",
    name: "Curl concentrado",
    short: "Curl concentrado",
    muscleGroup: "Bíceps",
    primary: ["Bíceps braquial"],
    secondary: ["Braquial"],
    howTo: "Curl unilateral sentado con el codo apoyado en el muslo, máximo aislamiento y control.",
    setup: ["Sentado, codo apoyado en la cara interna del muslo.", "Brazo colgando con el codo casi extendido.", "Tronco ligeramente inclinado."],
    execution: ["Flexiona el codo subiendo la mancuerna.", "Aprieta arriba un instante.", "Baja controlado hasta la extensión completa."],
    mistakes: ["Mover el codo del apoyo.", "Usar el hombro para ayudarse."],
    cues: ["Codo fijo en el muslo.", "Solo se mueve el antebrazo."],
    alternatives: ["Curl predicador", "Curl con mancuernas"],
  },
  "spider-curl": {
    id: "spider-curl",
    name: "Curl araña",
    short: "Curl araña",
    muscleGroup: "Bíceps",
    primary: ["Bíceps braquial (porción corta)"],
    secondary: ["Braquial"],
    howTo: "Curl tumbado boca abajo en banco inclinado, con el brazo por delante y sin ayuda del hombro.",
    setup: ["Tumbado boca abajo en banco inclinado a 45-60°.", "Brazos colgando por delante, agarre supino.", "Pecho apoyado en todo momento."],
    execution: ["Flexiona el codo subiendo el peso.", "Aprieta arriba sin despegar el pecho.", "Baja controlado hasta la extensión."],
    mistakes: ["Despegar el pecho del banco.", "Recorrido corto arriba."],
    cues: ["Pecho pegado al banco.", "Sube apretando."],
    alternatives: ["Curl predicador", "Curl concentrado"],
  },
  "drag-curl": {
    id: "drag-curl",
    name: "Curl arrastrado con barra",
    short: "Curl arrastrado",
    muscleGroup: "Bíceps",
    primary: ["Bíceps braquial"],
    secondary: ["Braquial"],
    howTo: "El codo va hacia atrás mientras la barra 'arrastra' pegada al cuerpo, quita tensión del hombro y la pone toda en el bíceps.",
    setup: ["De pie, barra con agarre supino.", "Codos pegados al cuerpo.", "Core activo."],
    execution: ["Sube la barra arrastrándola pegada al cuerpo.", "Lleva el codo hacia atrás según sube.", "Baja por el mismo camino controlado."],
    mistakes: ["Separar la barra del cuerpo (lo convierte en un curl normal).", "Usar impulso."],
    cues: ["Barra pegada al cuerpo.", "El codo va hacia atrás, no hacia delante."],
    alternatives: ["Curl con barra", "Curl en polea baja"],
  },

  /* --- TRÍCEPS (ampliación) --- */
  "bench-dips": {
    id: "bench-dips",
    name: "Fondos en banco",
    short: "Fondos banco",
    muscleGroup: "Tríceps",
    primary: ["Tríceps braquial"],
    secondary: ["Deltoides anterior"],
    howTo: "Ejercicio con el propio peso corporal, manos apoyadas en un banco detrás del cuerpo.",
    setup: ["Manos en el borde del banco, dedos hacia delante.", "Piernas extendidas o flexionadas según la dificultad.", "Cuerpo cerca del banco."],
    execution: ["Baja flexionando los codos hacia atrás.", "Baja hasta 90° de flexión aproximadamente.", "Empuja para extender los brazos."],
    mistakes: ["Bajar demasiado y forzar el hombro.", "Alejar demasiado los pies (sube la dificultad de golpe)."],
    cues: ["Codos hacia atrás, no hacia fuera.", "Cuerpo pegado al banco."],
    alternatives: ["Fondos en paralelas", "Pressdown en polea"],
  },
  "skull-crusher": {
    id: "skull-crusher",
    name: "Press francés con barra EZ",
    short: "Press francés",
    muscleGroup: "Tríceps",
    primary: ["Tríceps braquial (cabeza larga)"],
    secondary: [],
    howTo: "Extensión de tríceps tumbado con barra EZ, buen estiramiento de la cabeza larga.",
    setup: ["Tumbado en banco, barra sobre el pecho con brazos extendidos.", "Codos apuntando al techo, fijos.", "Agarre a la anchura de los hombros."],
    execution: ["Baja la barra hacia la frente flexionando el codo.", "Mantén los codos fijos y apuntando arriba.", "Extiende de vuelta sin bloquear de golpe."],
    mistakes: ["Mover los codos hacia fuera o atrás.", "Bajar demasiado rápido cerca de la cabeza."],
    cues: ["Codos fijos y verticales.", "Solo se mueve el antebrazo."],
    alternatives: ["Extensión sobre la cabeza", "Pressdown en polea"],
  },
  "close-grip-bench-press": {
    id: "close-grip-bench-press",
    name: "Press banca agarre cerrado",
    short: "Press cerrado",
    muscleGroup: "Tríceps",
    primary: ["Tríceps braquial"],
    secondary: ["Pectoral", "Deltoides anterior"],
    howTo: "Press de banca con agarre estrecho, mueve el énfasis del pecho al tríceps.",
    setup: ["Agarre a la anchura de los hombros o algo menos.", "Escápulas retraídas.", "Codos cerca del cuerpo."],
    execution: ["Baja la barra al pecho con los codos pegados.", "Empuja en línea recta hacia arriba.", "No bloquees bruscamente."],
    mistakes: ["Agarre demasiado estrecho (fuerza la muñeca).", "Abrir los codos como en un press normal."],
    cues: ["Codos rozando el cuerpo.", "Empuja con el tríceps."],
    alternatives: ["Press francés", "Pressdown en polea"],
  },
  "triceps-kickback": {
    id: "triceps-kickback",
    name: "Patada de tríceps con mancuerna",
    short: "Patada de tríceps",
    muscleGroup: "Tríceps",
    primary: ["Tríceps braquial"],
    secondary: [],
    howTo: "Extensión unilateral con el brazo pegado al cuerpo y el tronco inclinado, buena contracción final.",
    setup: ["Tronco inclinado, apoyo en banco con una mano.", "Brazo con el codo a 90° pegado al costado.", "Espalda neutra."],
    execution: ["Extiende el codo hacia atrás.", "Aprieta un instante con el brazo recto.", "Vuelve controlado a los 90°."],
    mistakes: ["Mover el hombro en vez del codo.", "Usar demasiado peso perdiendo el recorrido."],
    cues: ["Codo fijo y alto.", "Aprieta atrás."],
    alternatives: ["Pressdown en polea", "Extensión unilateral"],
  },
  "diamond-pushup": {
    id: "diamond-pushup",
    name: "Flexiones diamante",
    short: "Flexiones diamante",
    muscleGroup: "Tríceps",
    primary: ["Tríceps braquial"],
    secondary: ["Pectoral (porción esternal)"],
    howTo: "Flexión con las manos juntas formando un diamante, gran énfasis en el tríceps.",
    setup: ["Manos juntas bajo el pecho formando un rombo.", "Cuerpo en línea recta.", "Core activo."],
    execution: ["Baja controlado con los codos pegados al cuerpo.", "Roza el pecho con las manos.", "Empuja hasta extender los brazos."],
    mistakes: ["Abrir los codos hacia fuera.", "Arquear la cadera."],
    cues: ["Codos pegados al cuerpo.", "Cuerpo en línea recta."],
    alternatives: ["Fondos en banco", "Press cerrado"],
  },
  "machine-triceps-dip": {
    id: "machine-triceps-dip",
    name: "Fondos en máquina asistida",
    short: "Fondos asistidos",
    muscleGroup: "Tríceps",
    primary: ["Tríceps braquial"],
    secondary: ["Pectoral", "Deltoides anterior"],
    howTo: "Versión guiada de los fondos, permite dosificar el peso asistido con precisión.",
    setup: ["Ajusta el contrapeso según tu nivel.", "Agarre firme en las asas.", "Tronco vertical o algo inclinado."],
    execution: ["Baja controlado flexionando los codos.", "Baja hasta sentir el estiramiento.", "Empuja hasta extender los brazos."],
    mistakes: ["Usar demasiada asistencia y no progresar.", "Bajar demasiado rápido."],
    cues: ["Codos cerca del cuerpo.", "Control en la bajada."],
    alternatives: ["Fondos en paralelas", "Pressdown en polea"],
  },

  /* --- CUÁDRICEPS --- */
  "barbell-back-squat": {
    id: "barbell-back-squat",
    name: "Sentadilla libre con barra",
    short: "Sentadilla libre",
    muscleGroup: "Cuádriceps",
    primary: ["Cuádriceps"],
    secondary: ["Glúteo", "Isquiotibiales", "Core"],
    howTo: "El básico de pierna por excelencia, movimiento global de cadera y rodilla con barra en la espalda.",
    setup: ["Barra apoyada en la parte alta de la espalda.", "Pies a la anchura de los hombros.", "Core activo, pecho alto."],
    execution: ["Baja flexionando cadera y rodilla a la vez.", "Baja hasta que el muslo pase de paralelo si la movilidad lo permite.", "Sube empujando el suelo con todo el pie."],
    mistakes: ["Que las rodillas colapsen hacia dentro.", "Redondear la zona lumbar abajo."],
    cues: ["Pecho alto.", "Rodillas en la dirección de los pies."],
    alternatives: ["Sentadilla goblet", "Prensa de piernas"],
  },
  "leg-press": {
    id: "leg-press",
    name: "Prensa de piernas",
    short: "Prensa",
    muscleGroup: "Cuádriceps",
    primary: ["Cuádriceps"],
    secondary: ["Glúteo", "Isquiotibiales"],
    howTo: "Empuje de piernas guiado, permite cargar mucho peso con la zona lumbar protegida.",
    setup: ["Pies a la anchura de los hombros en la plataforma.", "Espalda y zona lumbar pegadas al respaldo.", "Ajusta el recorrido según tu movilidad."],
    execution: ["Baja controlado flexionando las rodillas.", "Baja hasta 90° o donde la zona lumbar se mantenga pegada.", "Empuja sin bloquear las rodillas de golpe."],
    mistakes: ["Despegar la zona lumbar del respaldo abajo.", "Bloquear las rodillas con fuerza arriba."],
    cues: ["Lumbar pegada siempre.", "Empuja con todo el pie."],
    alternatives: ["Sentadilla libre", "Sentadilla goblet"],
  },
  "dumbbell-lunge": {
    id: "dumbbell-lunge",
    name: "Zancadas con mancuernas",
    short: "Zancadas",
    muscleGroup: "Cuádriceps",
    primary: ["Cuádriceps"],
    secondary: ["Glúteo", "Isquiotibiales"],
    howTo: "Patrón unilateral de zancada, muy útil para corregir descompensaciones entre piernas.",
    setup: ["Mancuernas a los lados, tronco erguido.", "Pies a la anchura de las caderas.", "Core activo."],
    execution: ["Da un paso adelante y baja flexionando ambas rodillas.", "La rodilla trasera casi roza el suelo.", "Empuja con la pierna delantera para volver."],
    mistakes: ["Que la rodilla delantera sobrepase mucho la punta del pie.", "Dar un paso demasiado corto."],
    cues: ["Tronco erguido.", "Baja recto, no hacia delante."],
    alternatives: ["Sentadilla búlgara", "Step-up"],
  },
  "bulgarian-split-squat": {
    id: "bulgarian-split-squat",
    name: "Sentadilla búlgara",
    short: "Búlgara",
    muscleGroup: "Cuádriceps",
    primary: ["Cuádriceps"],
    secondary: ["Glúteo"],
    howTo: "Sentadilla unilateral con el pie trasero elevado, exige equilibrio y aísla muy bien cada pierna.",
    setup: ["Pie trasero apoyado en un banco.", "Pie delantero adelantado lo suficiente.", "Tronco erguido, core activo."],
    execution: ["Baja flexionando la rodilla delantera.", "Baja hasta sentir tensión en el cuádriceps.", "Empuja con la pierna delantera para subir."],
    mistakes: ["Colocar el pie delantero demasiado cerca del banco.", "Perder el equilibrio por ir demasiado rápido."],
    cues: ["Peso en el talón delantero.", "Baja en línea recta."],
    alternatives: ["Zancadas con mancuernas", "Step-up"],
  },
  "goblet-squat": {
    id: "goblet-squat",
    name: "Sentadilla goblet",
    short: "Goblet squat",
    muscleGroup: "Cuádriceps",
    primary: ["Cuádriceps"],
    secondary: ["Glúteo", "Core"],
    howTo: "Sentadilla con una mancuerna o kettlebell sujeta al pecho, buena para aprender el patrón antes de cargar más peso.",
    setup: ["Mancuerna sujeta verticalmente contra el pecho.", "Pies algo más anchos que los hombros.", "Core activo, pecho alto."],
    execution: ["Baja flexionando cadera y rodilla.", "Los codos pueden rozar la cara interna de las rodillas abajo.", "Sube empujando el suelo."],
    mistakes: ["Redondear la espalda alta.", "Levantar los talones del suelo."],
    cues: ["Pecho alto.", "Rodillas hacia los pies."],
    alternatives: ["Sentadilla libre", "Prensa de piernas"],
  },
  "step-up": {
    id: "step-up",
    name: "Step-up con mancuernas",
    short: "Step-up",
    muscleGroup: "Cuádriceps",
    primary: ["Cuádriceps"],
    secondary: ["Glúteo"],
    howTo: "Subida a un cajón o banco, patrón unilateral muy funcional para el cuádriceps y el glúteo.",
    setup: ["Cajón o banco a una altura donde la rodilla quede a 90° al subir.", "Mancuernas a los lados.", "Pie completo apoyado en el cajón."],
    execution: ["Empuja con la pierna de arriba para subir el cuerpo.", "Sube hasta extender la pierna del cajón.", "Baja controlado sin dejarte caer."],
    mistakes: ["Impulsarte con la pierna de abajo.", "Cajón demasiado alto para tu movilidad."],
    cues: ["Empuja con el talón de arriba.", "Sube controlado, sin saltar."],
    alternatives: ["Sentadilla búlgara", "Zancadas"],
  },

  /* --- ISQUIOTIBIALES --- */
  "dumbbell-romanian-deadlift": {
    id: "dumbbell-romanian-deadlift",
    name: "Peso muerto rumano con mancuernas",
    short: "RDL mancuernas",
    muscleGroup: "Isquiotibiales",
    primary: ["Isquiotibiales", "Glúteo"],
    secondary: ["Erectores espinales"],
    howTo: "Bisagra de cadera con mancuernas, buen estiramiento de isquios manteniendo la espalda neutra.",
    setup: ["Mancuernas por delante de los muslos.", "Rodillas con flexión mínima y fija.", "Espalda neutra, pecho alto."],
    execution: ["Empuja la cadera hacia atrás bajando el peso.", "Baja hasta sentir el estiramiento en los isquios.", "Sube empujando la cadera hacia delante."],
    mistakes: ["Redondear la espalda.", "Flexionar demasiado la rodilla (lo convierte en sentadilla)."],
    cues: ["Cadera atrás.", "Peso pegado a las piernas."],
    alternatives: ["Peso muerto piernas rígidas", "Buenos días"],
  },
  "seated-leg-curl": {
    id: "seated-leg-curl",
    name: "Curl femoral sentado en máquina",
    short: "Curl femoral sentado",
    muscleGroup: "Isquiotibiales",
    primary: ["Isquiotibiales"],
    secondary: [],
    howTo: "Aislamiento de isquios sentado, buena alternativa al curl tumbado con distinto ángulo de trabajo.",
    setup: ["Espalda pegada al respaldo.", "Rodillos justo encima del tobillo.", "Piernas casi extendidas al empezar."],
    execution: ["Flexiona las rodillas llevando el rodillo hacia abajo.", "Aprieta un instante al final.", "Vuelve controlado sin soltar de golpe."],
    mistakes: ["Recorrido corto.", "Levantar la cadera del asiento."],
    cues: ["Aprieta al final.", "Control en la vuelta."],
    alternatives: ["Curl femoral tumbado", "Peso muerto rumano"],
  },
  "good-morning": {
    id: "good-morning",
    name: "Buenos días con barra",
    short: "Buenos días",
    muscleGroup: "Isquiotibiales",
    primary: ["Isquiotibiales", "Erectores espinales"],
    secondary: ["Glúteo"],
    howTo: "Bisagra de cadera con la barra en la espalda, exige buena técnica y control del peso.",
    setup: ["Barra apoyada en la parte alta de la espalda.", "Rodillas con flexión mínima y fija.", "Espalda neutra."],
    execution: ["Empuja la cadera hacia atrás inclinando el tronco.", "Baja hasta sentir el estiramiento en los isquios.", "Sube empujando la cadera hacia delante."],
    mistakes: ["Redondear la espalda.", "Usar demasiado peso para el nivel de técnica."],
    cues: ["Cadera atrás primero.", "Espalda neutra siempre."],
    alternatives: ["Peso muerto rumano", "Peso muerto piernas rígidas"],
  },
  "stiff-leg-deadlift": {
    id: "stiff-leg-deadlift",
    name: "Peso muerto piernas rígidas",
    short: "Peso muerto rígido",
    muscleGroup: "Isquiotibiales",
    primary: ["Isquiotibiales"],
    secondary: ["Glúteo", "Erectores espinales"],
    howTo: "Variante de peso muerto con las rodillas casi bloqueadas, más énfasis en el estiramiento del isquio.",
    setup: ["Barra por delante de los muslos.", "Rodillas casi extendidas, sin bloquear.", "Espalda neutra."],
    execution: ["Baja la barra pegada a las piernas empujando la cadera atrás.", "Baja hasta el estiramiento máximo cómodo.", "Sube empujando la cadera hacia delante."],
    mistakes: ["Redondear la espalda para llegar más abajo.", "Bloquear las rodillas por completo."],
    cues: ["Barra pegada a la pierna.", "Cadera atrás, no rodillas adelante."],
    alternatives: ["Peso muerto rumano", "Buenos días"],
  },
  "nordic-curl": {
    id: "nordic-curl",
    name: "Curl nórdico",
    short: "Curl nórdico",
    muscleGroup: "Isquiotibiales",
    primary: ["Isquiotibiales"],
    secondary: [],
    howTo: "Trabajo excéntrico de isquios con el propio peso corporal, muy exigente y útil para prevención de lesiones.",
    setup: ["Rodillas apoyadas, tobillos fijados por un compañero o un soporte.", "Cuerpo recto desde las rodillas.", "Core activo."],
    execution: ["Baja el tronco lo más lento posible controlando con los isquios.", "Frena la caída todo lo que puedas.", "Ayúdate con las manos al final si hace falta."],
    mistakes: ["Doblar la cadera en vez de bajar recto.", "Caer sin control."],
    cues: ["Baja lo más lento posible.", "Cuerpo en línea recta."],
    alternatives: ["Curl femoral tumbado", "Peso muerto rumano"],
  },

  /* --- GLÚTEO --- */
  "hip-thrust": {
    id: "hip-thrust",
    name: "Hip thrust con barra",
    short: "Hip thrust",
    muscleGroup: "Glúteo",
    primary: ["Glúteo mayor"],
    secondary: ["Isquiotibiales"],
    howTo: "El ejercicio más directo para el glúteo, empuje de cadera con la espalda apoyada en un banco.",
    setup: ["Espalda alta apoyada en el banco.", "Barra sobre la cadera, con protección.", "Pies firmes a la anchura de las caderas."],
    execution: ["Empuja la cadera hacia arriba apretando el glúteo.", "Extiende la cadera por completo arriba.", "Baja controlado sin tocar del todo el suelo."],
    mistakes: ["Hiperextender la zona lumbar arriba en vez de usar el glúteo.", "Pies demasiado lejos o cerca del cuerpo."],
    cues: ["Aprieta el glúteo arriba.", "Barbilla metida, sin arquear el cuello."],
    alternatives: ["Puente de glúteo", "Sentadilla sumo"],
  },
  "cable-glute-kickback": {
    id: "cable-glute-kickback",
    name: "Patada de glúteo en polea",
    short: "Patada de glúteo",
    muscleGroup: "Glúteo",
    primary: ["Glúteo mayor"],
    secondary: ["Isquiotibiales"],
    howTo: "Extensión de cadera unilateral en polea baja, buena contracción aislada del glúteo.",
    setup: ["Tobillera enganchada a la polea baja.", "Tronco ligeramente inclinado, apoyo en el marco.", "Core activo."],
    execution: ["Extiende la cadera llevando la pierna hacia atrás.", "Aprieta el glúteo al final.", "Vuelve controlado sin perder la tensión."],
    mistakes: ["Balancear el tronco para impulsar la pierna.", "Arquear la zona lumbar."],
    cues: ["Aprieta el glúteo, no balancees.", "Rodilla con flexión suave y fija."],
    alternatives: ["Hip thrust", "Puente de glúteo"],
  },
  "glute-bridge": {
    id: "glute-bridge",
    name: "Puente de glúteo",
    short: "Puente de glúteo",
    muscleGroup: "Glúteo",
    primary: ["Glúteo mayor"],
    secondary: ["Isquiotibiales"],
    howTo: "Versión en el suelo del hip thrust, buena para activación o como ejercicio con peso moderado.",
    setup: ["Tumbado boca arriba, rodillas flexionadas.", "Pies firmes cerca de los glúteos.", "Disco o mancuerna sobre la cadera si añades peso."],
    execution: ["Empuja la cadera hacia arriba apretando el glúteo.", "Extiende la cadera por completo arriba.", "Baja controlado sin soltar de golpe."],
    mistakes: ["Arquear la zona lumbar en vez de usar el glúteo.", "Recorrido corto."],
    cues: ["Aprieta arriba con fuerza.", "Empuja con los talones."],
    alternatives: ["Hip thrust", "Sentadilla sumo"],
  },
  "band-hip-abduction-standing": {
    id: "band-hip-abduction-standing",
    name: "Abducción de cadera de pie con banda",
    short: "Abducción con banda",
    muscleGroup: "Glúteo",
    primary: ["Glúteo medio"],
    secondary: [],
    howTo: "Trabajo del glúteo medio de pie con banda elástica, útil para estabilidad de cadera.",
    setup: ["Banda elástica por encima de los tobillos.", "De pie, apoyo firme en una pierna.", "Tronco erguido, core activo."],
    execution: ["Lleva la pierna hacia el lateral contra la banda.", "Aprieta el glúteo al final.", "Vuelve controlado sin perder la tensión de la banda."],
    mistakes: ["Inclinar el tronco para ganar recorrido.", "Usar impulso en vez de control."],
    cues: ["Tronco quieto.", "Aprieta el lateral del glúteo."],
    alternatives: ["Abducción de cadera en máquina", "Patada de glúteo en polea"],
  },
  "sumo-squat": {
    id: "sumo-squat",
    name: "Sentadilla sumo",
    short: "Sentadilla sumo",
    muscleGroup: "Glúteo",
    primary: ["Glúteo mayor", "Aductores"],
    secondary: ["Cuádriceps"],
    howTo: "Sentadilla con stance ancho y puntas hacia fuera, mayor implicación de glúteo y aductores.",
    setup: ["Pies bien abiertos, puntas rotadas hacia fuera.", "Mancuerna o kettlebell colgando con ambas manos.", "Pecho alto, core activo."],
    execution: ["Baja flexionando cadera y rodillas siguiendo la línea de los pies.", "Baja hasta donde la movilidad lo permita.", "Sube empujando el suelo y apretando el glúteo."],
    mistakes: ["Rodillas hacia dentro.", "Tronco inclinado hacia delante en exceso."],
    cues: ["Rodillas en la línea de los pies.", "Aprieta el glúteo arriba."],
    alternatives: ["Sentadilla goblet", "Hip thrust"],
  },

  /* --- GEMELO --- */
  "standing-calf-raise-machine": {
    id: "standing-calf-raise-machine",
    name: "Gemelo de pie en máquina",
    short: "Gemelo de pie",
    muscleGroup: "Gemelo",
    primary: ["Gastrocnemio"],
    secondary: ["Sóleo"],
    howTo: "Elevación de talones de pie con carga sobre los hombros, prioriza el gastrocnemio.",
    setup: ["Hombros bajo las almohadillas.", "Punta de los pies en el borde de la plataforma.", "Rodillas casi extendidas."],
    execution: ["Sube a la punta de los pies lo más alto posible.", "Pausa un instante arriba.", "Baja controlado hasta el estiramiento completo."],
    mistakes: ["Recorrido corto por usar demasiado peso.", "Rebotar abajo."],
    cues: ["Sube todo lo que puedas.", "Pausa abajo en el estiramiento."],
    alternatives: ["Gemelo sentado", "Gemelo en prensa"],
  },
  "seated-calf-raise": {
    id: "seated-calf-raise",
    name: "Gemelo sentado",
    short: "Gemelo sentado",
    muscleGroup: "Gemelo",
    primary: ["Sóleo"],
    secondary: ["Gastrocnemio"],
    howTo: "Con la rodilla flexionada, el énfasis pasa del gastrocnemio al sóleo.",
    setup: ["Sentado, rodillas bajo las almohadillas.", "Punta de los pies en el borde de la plataforma.", "Espalda apoyada."],
    execution: ["Sube los talones lo más alto posible.", "Pausa un instante arriba.", "Baja controlado hasta el estiramiento completo."],
    mistakes: ["Recorrido corto.", "Rebotar en vez de controlar."],
    cues: ["Sube despacio, pausa arriba.", "Estira bien abajo."],
    alternatives: ["Gemelo de pie", "Gemelo en prensa"],
  },
  "leg-press-calf-raise": {
    id: "leg-press-calf-raise",
    name: "Gemelo en prensa",
    short: "Gemelo en prensa",
    muscleGroup: "Gemelo",
    primary: ["Gastrocnemio"],
    secondary: ["Sóleo"],
    howTo: "Elevación de talones usando la plataforma de la prensa de piernas, cómodo para series largas.",
    setup: ["Solo la punta de los pies en la plataforma.", "Piernas casi extendidas.", "Zona lumbar pegada al respaldo."],
    execution: ["Empuja con la punta de los pies extendiendo el tobillo.", "Pausa arriba un instante.", "Baja controlado hasta el estiramiento."],
    mistakes: ["Flexionar y extender la rodilla en vez del tobillo.", "Recorrido corto."],
    cues: ["Solo se mueve el tobillo.", "Estira bien abajo."],
    alternatives: ["Gemelo de pie", "Gemelo sentado"],
  },
  "single-leg-dumbbell-calf-raise": {
    id: "single-leg-dumbbell-calf-raise",
    name: "Gemelo a una pierna con mancuerna",
    short: "Gemelo unilateral",
    muscleGroup: "Gemelo",
    primary: ["Gastrocnemio"],
    secondary: ["Sóleo"],
    howTo: "Versión unilateral con mancuerna, útil para igualar fuerza entre piernas.",
    setup: ["Mancuerna en la mano del mismo lado.", "Punta del pie en un step o disco.", "Apoyo libre en algo estable."],
    execution: ["Sube el talón lo más alto posible.", "Pausa arriba un instante.", "Baja controlado hasta el estiramiento completo."],
    mistakes: ["Usar el apoyo para impulsarte.", "Recorrido corto."],
    cues: ["Sube recto, sin balanceo.", "Estira bien abajo."],
    alternatives: ["Gemelo de pie en máquina", "Gemelo en prensa"],
  },

  /* --- ANTEBRAZO --- */
  "wrist-curl": {
    id: "wrist-curl",
    name: "Curl de muñeca con barra",
    short: "Curl de muñeca",
    muscleGroup: "Antebrazo",
    primary: ["Flexores del antebrazo"],
    secondary: [],
    howTo: "Aislamiento de los flexores de la muñeca, mejora el agarre y el grosor del antebrazo.",
    setup: ["Sentado, antebrazos apoyados en los muslos o un banco.", "Barra con agarre supino.", "Muñecas justo fuera del apoyo."],
    execution: ["Flexiona las muñecas subiendo la barra.", "Aprieta arriba un instante.", "Baja controlado hasta el estiramiento."],
    mistakes: ["Mover el antebrazo entero en vez de solo la muñeca.", "Usar demasiado peso."],
    cues: ["Solo se mueve la muñeca.", "Recorrido completo."],
    alternatives: ["Curl de muñeca invertido", "Farmer's walk"],
  },
  "reverse-wrist-curl": {
    id: "reverse-wrist-curl",
    name: "Curl de muñeca invertido",
    short: "Curl invertido",
    muscleGroup: "Antebrazo",
    primary: ["Extensores del antebrazo"],
    secondary: [],
    howTo: "Trabaja los extensores de la muñeca, importantes para el equilibrio y la salud del antebrazo.",
    setup: ["Sentado, antebrazos apoyados.", "Barra con agarre prono.", "Muñecas justo fuera del apoyo."],
    execution: ["Extiende las muñecas subiendo la barra.", "Aprieta arriba un instante.", "Baja controlado hasta el estiramiento."],
    mistakes: ["Usar demasiado peso (los extensores son más débiles).", "Mover el codo."],
    cues: ["Peso ligero, recorrido completo.", "Solo se mueve la muñeca."],
    alternatives: ["Curl de muñeca", "Farmer's walk"],
  },
  "farmers-walk": {
    id: "farmers-walk",
    name: "Farmer's walk",
    short: "Farmer's walk",
    muscleGroup: "Antebrazo",
    primary: ["Flexores del antebrazo (agarre)"],
    secondary: ["Trapecio", "Core"],
    howTo: "Caminar cargando peso a los lados, trabajo de agarre y core muy funcional.",
    setup: ["Mancuernas o kettlebells pesadas a los lados.", "Pecho alto, hombros abajo.", "Core activo."],
    execution: ["Camina a paso firme manteniendo la postura.", "Evita balancear el peso.", "Suelta con control al terminar la distancia."],
    mistakes: ["Encorvar la espalda por el peso.", "Pasos demasiado largos e inestables."],
    cues: ["Pecho alto todo el recorrido.", "Agarre firme."],
    alternatives: ["Curl de muñeca", "Dead hang en barra"],
  },
  "reverse-curl-barbell": {
    id: "reverse-curl-barbell",
    name: "Curl inverso con barra",
    short: "Curl inverso",
    muscleGroup: "Antebrazo",
    primary: ["Braquiorradial", "Extensores del antebrazo"],
    secondary: ["Bíceps braquial"],
    howTo: "Curl con agarre prono, prioriza el braquiorradial y los extensores sobre el bíceps.",
    setup: ["De pie, barra con agarre prono a la anchura de los hombros.", "Codos pegados al costado.", "Core activo."],
    execution: ["Flexiona el codo manteniendo el agarre prono.", "Sube sin rotar la muñeca.", "Baja controlado."],
    mistakes: ["Usar demasiado peso y perder la muñeca recta.", "Balancear el cuerpo."],
    cues: ["Muñeca recta y firme.", "Codos fijos."],
    alternatives: ["Curl martillo", "Curl de muñeca"],
  },

  /* --- CORE --- */
  "plank": {
    id: "plank",
    name: "Plancha abdominal",
    short: "Plancha",
    muscleGroup: "Core",
    primary: ["Recto abdominal", "Transverso"],
    secondary: ["Glúteo", "Hombro"],
    howTo: "Isométrico básico de core, entrena la capacidad de mantener el tronco estable.",
    setup: ["Antebrazos y puntas de los pies en el suelo.", "Cuerpo en línea recta de cabeza a talones.", "Core y glúteo activos."],
    execution: ["Mantén la posición sin dejar caer la cadera.", "Respira de forma controlada.", "Aguanta el tiempo objetivo."],
    mistakes: ["Dejar caer o elevar demasiado la cadera.", "Aguantar la respiración."],
    cues: ["Cuerpo en línea recta.", "Aprieta el core, no aguantes el aire."],
    alternatives: ["Plancha lateral", "Dead bug"],
  },
  "cable-crunch": {
    id: "cable-crunch",
    name: "Crunch en polea alta",
    short: "Crunch polea",
    muscleGroup: "Core",
    primary: ["Recto abdominal"],
    secondary: [],
    howTo: "Crunch de rodillas con carga añadida por la polea, permite progresar el abdomen con peso.",
    setup: ["De rodillas frente a la polea alta con cuerda.", "Cuerda sujeta a ambos lados de la cabeza.", "Cadera fija durante el movimiento."],
    execution: ["Flexiona el tronco llevando los codos hacia las rodillas.", "Aprieta el abdomen al final.", "Vuelve controlado sin perder tensión."],
    mistakes: ["Mover la cadera hacia atrás (tirar con los brazos y no con el abdomen).", "Usar impulso."],
    cues: ["Curva la columna, no tires con los brazos.", "Aprieta al final."],
    alternatives: ["Rueda abdominal", "Elevación de piernas colgado"],
  },
  "hanging-leg-raise": {
    id: "hanging-leg-raise",
    name: "Elevación de piernas colgado",
    short: "Elevación colgado",
    muscleGroup: "Core",
    primary: ["Recto abdominal", "Flexores de cadera"],
    secondary: ["Antebrazo (agarre)"],
    howTo: "Colgado de una barra, eleva las piernas o rodillas para trabajar el abdomen inferior.",
    setup: ["Colgado de la barra con agarre firme.", "Cuerpo estable, sin balanceo inicial.", "Core activo antes de empezar."],
    execution: ["Eleva las piernas o rodillas flexionando la cadera.", "Sube todo lo que la técnica permita sin balanceo.", "Baja controlado hasta la extensión."],
    mistakes: ["Usar balanceo para subir las piernas.", "Bajar de golpe sin control."],
    cues: ["Sube con el abdomen, no con impulso.", "Baja despacio."],
    alternatives: ["Crunch en polea", "Rueda abdominal"],
  },
  "ab-wheel-rollout": {
    id: "ab-wheel-rollout",
    name: "Rueda abdominal",
    short: "Rueda abdominal",
    muscleGroup: "Core",
    primary: ["Recto abdominal", "Transverso"],
    secondary: ["Dorsal ancho", "Hombro"],
    howTo: "Uno de los ejercicios más exigentes para el core, requiere buen control de la zona lumbar.",
    setup: ["De rodillas, rueda sujeta con ambas manos.", "Core activo antes de empezar a rodar.", "Espalda neutra."],
    execution: ["Rueda hacia delante manteniendo el core apretado.", "Llega hasta donde controles sin arquear la lumbar.", "Vuelve tirando con el abdomen, no con los brazos."],
    mistakes: ["Arquear la zona lumbar al extender.", "Ir más lejos de lo que el core puede controlar."],
    cues: ["No dejes caer la cadera.", "Vuelve con el abdomen."],
    alternatives: ["Plancha abdominal", "Crunch en polea"],
  },
  "russian-twist": {
    id: "russian-twist",
    name: "Giro ruso con peso",
    short: "Giro ruso",
    muscleGroup: "Core",
    primary: ["Oblicuos"],
    secondary: ["Recto abdominal"],
    howTo: "Rotación de tronco sentado con un peso, trabaja los oblicuos con control.",
    setup: ["Sentado, tronco inclinado atrás unos 45°.", "Pies elevados o apoyados según el nivel.", "Peso sujeto con ambas manos delante del pecho."],
    execution: ["Gira el tronco llevando el peso a un lateral.", "Vuelve al centro con control.", "Repite hacia el otro lado."],
    mistakes: ["Mover solo los brazos sin rotar el tronco.", "Ir demasiado rápido perdiendo el control."],
    cues: ["Gira desde el tronco.", "Ritmo controlado, no lances el peso."],
    alternatives: ["Plancha lateral", "Crunch en polea"],
  },
  "side-plank": {
    id: "side-plank",
    name: "Plancha lateral",
    short: "Plancha lateral",
    muscleGroup: "Core",
    primary: ["Oblicuos"],
    secondary: ["Transverso", "Glúteo medio"],
    howTo: "Isométrico lateral, clave para la estabilidad del tronco en el plano frontal.",
    setup: ["Apoyo en antebrazo y borde del pie, de costado.", "Cuerpo en línea recta.", "Cadera elevada del suelo."],
    execution: ["Mantén la cadera elevada y alineada.", "Respira de forma controlada.", "Aguanta el tiempo objetivo sin que la cadera caiga."],
    mistakes: ["Dejar caer la cadera.", "Rotar el tronco hacia delante o atrás."],
    cues: ["Cadera arriba y alineada.", "Cuerpo en línea recta."],
    alternatives: ["Plancha abdominal", "Giro ruso"],
  },
  "dead-bug": {
    id: "dead-bug",
    name: "Dead bug",
    short: "Dead bug",
    muscleGroup: "Core",
    primary: ["Transverso", "Recto abdominal"],
    secondary: [],
    howTo: "Ejercicio de control de core tumbado, enseña a estabilizar la zona lumbar mientras se mueven brazos y piernas.",
    setup: ["Tumbado boca arriba, brazos hacia el techo.", "Caderas y rodillas a 90°.", "Zona lumbar pegada al suelo."],
    execution: ["Baja un brazo y la pierna contraria a la vez.", "Mantén la zona lumbar pegada al suelo todo el rato.", "Vuelve al centro y repite con el lado contrario."],
    mistakes: ["Despegar la zona lumbar del suelo.", "Ir demasiado rápido perdiendo el control."],
    cues: ["Lumbar pegada al suelo siempre.", "Movimiento lento y controlado."],
    alternatives: ["Plancha abdominal", "Rueda abdominal"],
  },

};

/* ============================================================================
   3. RUTINA — 5 DÍAS (no modificar el orden ni el contenido)
   rest en segundos = punto medio del rango recomendado. Editable en el timer.
   ========================================================================== */
const DAYS = [
  {
    id: "d1",
    label: "Día 1",
    title: "Bíceps + Pecho + Hombro",
    slots: [
      { ex: "incline-dumbbell-curl", sets: 3, repRange: [6, 10], rir: [1, 0, 0], rest: 150, restLabel: "2-3 min" },
      { ex: "preacher-curl", sets: 3, repRange: [6, 10], rir: [1, 0, 0], rest: 150, restLabel: "2-3 min" },
      { ex: "incline-dumbbell-press", sets: 3, repRange: [6, 10], rir: [1, 0, 0], rest: 180, restLabel: "3 min" },
      { ex: "machine-chest-press", sets: 3, repRange: [6, 10], rir: [1, 0, 0], rest: 150, restLabel: "2-3 min" },
      { ex: "cable-fly", sets: 2, repRange: [8, 12], rir: [1, 0], rest: 120, restLabel: "2 min" },
      { ex: "lateral-raise", sets: 3, repRange: [8, 12], rir: [1, 0, 0], rest: 105, restLabel: "1,5-2 min" },
      { ex: "reverse-pec-deck", sets: 2, repRange: [8, 12], rir: [1, 0], rest: 105, restLabel: "1,5-2 min" },
    ],
  },
  {
    id: "d2",
    label: "Día 2",
    title: "Tríceps + Espalda",
    slots: [
      { ex: "overhead-triceps-extension", sets: 3, repRange: [6, 10], rir: [1, 0, 0], rest: 120, restLabel: "2 min" },
      { ex: "triceps-pressdown", sets: 3, repRange: [6, 10], rir: [1, 0, 0], rest: 120, restLabel: "2 min" },
      { ex: "lat-pulldown", sets: 3, repRange: [6, 10], rir: [1, 0, 0], rest: 165, restLabel: "2,5-3 min" },
      { ex: "chest-supported-row", sets: 3, repRange: [6, 10], rir: [1, 0, 0], rest: 165, restLabel: "2,5-3 min" },
      { ex: "unilateral-cable-row", sets: 2, repRange: [8, 12], rir: [1, 0], rest: 120, restLabel: "2 min" },
      { ex: "cable-pullover", sets: 2, repRange: [8, 12], rir: [1, 0], rest: 105, restLabel: "1,5-2 min" },
    ],
  },
  {
    id: "d3",
    label: "Día 3",
    title: "Pierna",
    note: "Orden fijo. Sin prensa.",
    slots: [
      { ex: "hip-abduction", sets: 2, repRange: [10, 15], rir: [1, 0], rest: 105, restLabel: "1,5-2 min" },
      { ex: "lying-leg-curl", sets: 3, repRange: [6, 10], rir: [1, 0, 0], rest: 150, restLabel: "2-3 min" },
      { ex: "leg-extension", sets: 3, repRange: [8, 12], rir: [1, 0, 0], rest: 120, restLabel: "2 min" },
      { ex: "hack-squat", sets: 3, repRange: [6, 10], rir: [2, 1, 0], rest: 210, restLabel: "3-4 min" },
      { ex: "romanian-deadlift", sets: 3, repRange: [6, 10], rir: [2, 1, 1], rest: 180, restLabel: "3 min", optionalLast: true },
      { ex: "calf-raise", sets: 3, repRange: [8, 12], rir: [1, 0, 0], rest: 105, restLabel: "1,5-2 min" },
    ],
  },
  {
    id: "d4",
    label: "Día 4",
    title: "Bíceps + Pecho + Hombro",
    slots: [
      { ex: "incline-dumbbell-curl", sets: 3, repRange: [6, 10], rir: [1, 0, 0], rest: 150, restLabel: "2-3 min" },
      { ex: "preacher-curl", sets: 3, repRange: [6, 10], rir: [1, 0, 0], rest: 150, restLabel: "2-3 min" },
      { ex: "incline-dumbbell-press", sets: 3, repRange: [6, 10], rir: [1, 0, 0], rest: 180, restLabel: "3 min" },
      { ex: "machine-chest-press", sets: 3, repRange: [6, 10], rir: [1, 0, 0], rest: 150, restLabel: "2-3 min" },
      { ex: "cable-fly", sets: 2, repRange: [8, 12], rir: [1, 0], rest: 120, restLabel: "2 min" },
      { ex: "lateral-raise", sets: 3, repRange: [8, 12], rir: [1, 0, 0], rest: 105, restLabel: "1,5-2 min" },
      { ex: "reverse-pec-deck", sets: 2, repRange: [8, 12], rir: [1, 0], rest: 105, restLabel: "1,5-2 min" },
    ],
  },
  {
    id: "d5",
    label: "Día 5",
    title: "Tríceps + Espalda + Pierna",
    slots: [
      { ex: "triceps-pressdown", sets: 3, repRange: [6, 10], rir: [1, 0, 0], rest: 120, restLabel: "2 min" },
      { ex: "unilateral-triceps-extension", sets: 2, repRange: [8, 12], rir: [1, 0], rest: 105, restLabel: "1,5-2 min" },
      { ex: "pullup-neutral-pulldown", sets: 3, repRange: [6, 10], rir: [1, 0, 0], rest: 165, restLabel: "2,5-3 min" },
      { ex: "machine-row", sets: 3, repRange: [6, 10], rir: [1, 0, 0], rest: 165, restLabel: "2,5-3 min" },
      { ex: "leg-extension", sets: 2, repRange: [8, 12], rir: [1, 0], rest: 105, restLabel: "1,5-2 min" },
      { ex: "lying-leg-curl", sets: 2, repRange: [8, 12], rir: [1, 0], rest: 105, restLabel: "1,5-2 min" },
      { ex: "calf-raise", sets: 3, repRange: [8, 12], rir: [1, 0, 0], rest: 105, restLabel: "1,5-2 min" },
    ],
  },
];

const WARMUP = {
  Bíceps: ["1 serie de 12-15 reps con el 50% del peso de trabajo", "Movilidad de codo y muñeca, 30 s"],
  Pecho: [
    "1 serie de 10-12 reps con el 50%",
    "1 serie de 5 reps con el 70-75%",
    "Rotaciones de hombro y aperturas sin peso",
  ],
  Hombro: ["1 serie ligera de 15 reps", "Movilidad escapular y rotación externa con banda"],
  Tríceps: ["1 serie de 12-15 reps con el 50%", "Movilidad de codo"],
  Espalda: ["1 serie de 10-12 reps con el 50%", "1 serie de 5 reps con el 70%", "Activación escapular colgado o en polea"],
  Pierna: [
    "5 min de bici o caminata en pendiente",
    "1 serie de 12-15 reps con el 40-50%",
    "1 serie de 6-8 reps con el 70%",
    "Movilidad de cadera y tobillo",
  ],
  Cuádriceps: [
    "5 min de bici o caminata en pendiente",
    "1 serie de 12-15 reps con el 40-50%",
    "Movilidad de cadera y tobillo",
  ],
  Isquiotibiales: ["1 serie de 12-15 reps con el 50%", "Movilidad de cadera, balanceos de pierna"],
  Glúteo: ["1 serie de 12-15 reps con el 50%", "Activación con puente de glúteo sin peso"],
  Gemelo: ["1 serie de 15-20 reps con poco peso", "Movilidad de tobillo"],
  Antebrazo: ["1 serie de 15-20 reps con poco peso", "Movilidad de muñeca"],
  Core: ["Movilidad de columna y cadera", "1 serie corta sin peso para sentir la técnica"],
};

/* Grupos musculares válidos, en el orden en que se muestran en el selector. */
const MUSCLE_GROUPS = Object.keys(WARMUP);

/* --- CATÁLOGO + EJERCICIOS PROPIOS -------------------------------------------
   EXERCISES es fijo (90 ejercicios). Los que crea el usuario viven aparte
   (hipertrofia:exercises:v1) y se fusionan en tiempo de lectura. getExercise()
   es la ÚNICA forma correcta de leer un ejercicio por id en toda la app: nunca
   devuelve undefined, así que ningún componente necesita comprobar null. Un id
   que no existe en ningún catálogo (p. ej. un ejercicio propio ya borrado pero
   con historial) cae en un marcador "Ejercicio eliminado" en vez de petar. */
const EXERCISE_DEFAULTS = {
  short: "",
  primary: [],
  secondary: [],
  howTo: "",
  setup: [],
  execution: [],
  mistakes: [],
  cues: [],
  alternatives: [],
};
function normalizeExercise(ex) {
  return { ...EXERCISE_DEFAULTS, ...ex };
}
function unknownExercise(id) {
  return { ...EXERCISE_DEFAULTS, id, name: "Ejercicio eliminado", short: "Eliminado", muscleGroup: "—" };
}
function mergeExercises(customExercises) {
  return { ...EXERCISES, ...(customExercises || {}) };
}
function getExercise(id, customExercises) {
  const custom = customExercises || {};
  return custom[id] || EXERCISES[id] || unknownExercise(id);
}
/* Catálogo agrupado por grupo muscular, con los de la rutina (inRoutine)
   siempre primero bajo su propio grupo. Lo usa el selector de sustitución. */
function buildExerciseGroups(customExercises) {
  const all = Object.values(mergeExercises(customExercises));
  const inRoutine = all.filter((e) => e.inRoutine);
  const rest = MUSCLE_GROUPS.map((group) => ({
    group,
    items: all.filter((e) => !e.inRoutine && e.muscleGroup === group),
  }));
  return [{ group: "En tu rutina", items: inRoutine }, ...rest];
}

/* ============================================================================
   4. ALMACENAMIENTO
   ========================================================================== */
const K_LOG = "hipertrofia:log:v1";
const K_CFG = "hipertrofia:config:v1";
const K_SESSION = "hipertrofia:session:v1";
const K_MEDIA = "hipertrofia:media:v1";
const K_SWAPS = "hipertrofia:swaps:v1";
const K_EXERCISES = "hipertrofia:exercises:v1";
const K_NUTRITION = "hipertrofia:nutrition:v1";
const NUTRITION_DEFAULT = { profile: null, weights: [], adjustment: null, mealCount: 4 };
const K_FOOD = "hipertrofia:food:v1"; // registro diario de comidas, indexado por fecha
const K_FOODS = "hipertrofia:foods:v1"; // alimentos recientes/propios, indexados por id

async function loadKey(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}
async function saveKey(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/* ============================================================================
   5. LÓGICA DE PROGRESIÓN
   ========================================================================== */
function stepFor(weight) {
  if (!weight) return 2.5;
  if (weight < 15) return 1;
  if (weight < 40) return 2.5;
  return 5;
}

function getProgression(history, repRange) {
  const [min, max] = repRange;
  const relevant = history.filter((h) => h.repMin === min && h.repMax === max);
  const source = relevant.length ? relevant : history;
  const last = source[0];
  if (!last) {
    return {
      code: "first",
      title: "PRIMERA SESIÓN",
      detail: "Elige un peso con el que llegues al rango objetivo respetando el RIR de cada serie.",
    };
  }
  const reps = last.sets.map((s) => Number(s.reps) || 0).filter((r) => r > 0);
  if (!reps.length) {
    return { code: "first", title: "SIN DATOS", detail: "Registra las repeticiones de la última sesión." };
  }
  const w = last.sets.find((s) => Number(s.weight) > 0);
  const lastWeight = w ? Number(w.weight) : 0;
  const allTop = reps.every((r) => r >= max) && reps.length >= (last.sets.length || 1);
  const allInRange = reps.every((r) => r >= min);

  if (allTop) {
    const next = lastWeight ? +(lastWeight + stepFor(lastWeight)).toFixed(1) : null;
    return {
      code: "up",
      title: "SUBE EL PESO",
      detail: next
        ? `Todas las series llegaron a ${max}. Prueba con ${next} kg y vuelve a la parte baja del rango.`
        : `Todas las series llegaron a ${max}. Sube al siguiente escalón de peso.`,
      lastWeight,
      suggested: next,
    };
  }
  if (allInRange) {
    return {
      code: "hold",
      title: "MANTÉN EL PESO",
      detail: `Estás dentro del rango (${min}-${max}) pero no en el tope en todas las series. Repite el peso y suma repeticiones.`,
      lastWeight,
    };
  }
  return {
    code: "improve",
    title: "MANTÉN EL PESO E INTENTA MEJORAR LAS REPETICIONES",
    detail: `Alguna serie cayó por debajo de ${min}. Consolida este peso hasta completar todas las series dentro del rango.`,
    lastWeight,
  };
}

/* ============================================================================
   5b. LÓGICA DE NUTRICIÓN
   ========================================================================== */
const ACTIVITY_FACTORS = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
const ACTIVITY_LABELS = {
  sedentary: "Sedentario",
  light: "Ligero",
  moderate: "Moderado",
  active: "Activo",
  very_active: "Muy activo",
};
const ACTIVITY_DESCRIPTIONS = {
  sedentary: "Poco o ningún ejercicio",
  light: "Ejercicio ligero 1-3 días/semana",
  moderate: "Ejercicio moderado 3-5 días/semana",
  active: "Ejercicio intenso 6-7 días/semana",
  very_active: "Ejercicio muy intenso o trabajo físico",
};
const GOAL_KCAL_PCT = { bulk: 0.125, recomp: 0, cut: -0.175 }; // ajuste sobre TDEE
const GOAL_WEEKLY_RATE = { bulk: 0.00375, recomp: 0, cut: -0.0075 }; // % peso corporal / semana esperado
const GOAL_LABELS = { bulk: "Volumen", recomp: "Recomposición", cut: "Definición" };
const PROTEIN_PER_KG = { bulk: 2.0, recomp: 2.0, cut: 2.3 };
const FAT_PER_KG_MIN = 0.8;
const TRAINING_DAY_MULT = 1.05;
const REST_DAY_MULT = 0.875; // 5×1.05 + 2×0.875 = 7 exacto: misma media semanal

function mifflinBMR(sex, weightKg, heightCm, age) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "m" ? base + 5 : base - 161;
}

/* Nunca por debajo del metabolismo basal ni más de un 25% de déficit sobre
   el gasto total. Se aplica por separado a la media, al día de entreno y al
   de descanso: si solo se aplicara a la media, el día de descanso (que
   recibe menos que la media) podría caer por debajo del BMR sin que se
   notase en el número que más se enseña. La seguridad manda sobre la
   precisión de la media semanal. */
function applySafetyFloor(kcal, bmr, tdee) {
  const floor = Math.max(bmr, tdee * 0.75);
  return kcal < floor ? { value: floor, limited: true } : { value: kcal, limited: false };
}

function macrosForCalories(calories, weightKg, proteinPerKg) {
  const protein = Math.round(proteinPerKg * weightKg);
  const fat = Math.round(FAT_PER_KG_MIN * weightKg);
  const carbCals = calories - protein * 4 - fat * 9;
  const carbsClamped = carbCals < 0;
  const carbs = Math.round(Math.max(0, carbCals) / 4);
  return { protein, fat, carbs, carbsClamped };
}

/* Sin efectos secundarios, como getProgression: recibe perfil + ajuste ya
   guardados y devuelve todo lo necesario para pintar las tarjetas. */
function computeNutritionTargets(profile, adjustment) {
  const { sex, weightKg, heightCm, age, activity, goal } = profile;
  const bmr = mifflinBMR(sex, weightKg, heightCm, age);
  const tdee = bmr * (ACTIVITY_FACTORS[activity] || ACTIVITY_FACTORS.moderate);
  const base = tdee * (1 + (GOAL_KCAL_PCT[goal] || 0)) + (adjustment?.amount || 0);

  const avgFloor = applySafetyFloor(base, bmr, tdee);
  const trainingFloor = applySafetyFloor(avgFloor.value * TRAINING_DAY_MULT, bmr, tdee);
  const restFloor = applySafetyFloor(avgFloor.value * REST_DAY_MULT, bmr, tdee);

  const proteinPerKg = PROTEIN_PER_KG[goal] || PROTEIN_PER_KG.recomp;
  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    avg: { calories: Math.round(avgFloor.value), limited: avgFloor.limited },
    training: {
      calories: Math.round(trainingFloor.value),
      limited: trainingFloor.limited,
      ...macrosForCalories(trainingFloor.value, weightKg, proteinPerKg),
    },
    rest: {
      calories: Math.round(restFloor.value),
      limited: restFloor.limited,
      ...macrosForCalories(restFloor.value, weightKg, proteinPerKg),
    },
    anyLimited: avgFloor.limited || trainingFloor.limited || restFloor.limited,
  };
}

/* Sobrescribe si ya hay una entrada para esa fecha (mismo patrón que
   saveSet con el historial de series), ordena desc. */
function upsertWeightEntry(weights, date, weight) {
  const list = [...weights];
  const i = list.findIndex((w) => w.date === date);
  if (i >= 0) list[i] = { date, weight };
  else list.unshift({ date, weight });
  list.sort((a, b) => (a.date < b.date ? 1 : -1));
  return list;
}

/* Un punto por entrada real (no por día natural): Chart posiciona los
   puntos por índice del array, así que un hueco sin dato distorsionaría el
   eje X igual que le pasaría a HistoryBody con las sesiones. Cada punto es
   la media de los últimos <=7 días naturales terminando en esa fecha. */
function movingAverage7(weights) {
  const sorted = [...weights].sort((a, b) => (a.date < b.date ? -1 : 1));
  return sorted.map((entry, i) => {
    const cutoff = addDays(entry.date, -6);
    const window = sorted.slice(0, i + 1).filter((e) => e.date >= cutoff);
    const avg = window.reduce((a, e) => a + e.weight, 0) / window.length;
    return { date: entry.date, weight: Math.round(avg * 10) / 10 };
  });
}

/* Solo cuenta lo registrado después del último ajuste aplicado, para que una
   sugerencia nueva no mezcle la tendencia de antes y después de aplicar la
   anterior. */
function trendWindow(weights, adjustment) {
  if (!adjustment?.appliedAt) return weights;
  return weights.filter((w) => w.date > adjustment.appliedAt);
}

function getCalorieAdjustmentSuggestion(profile, weights, adjustment) {
  const window = trendWindow(weights, adjustment);
  if (window.length < 2) return { code: "insufficient_data" };
  const sorted = [...window].sort((a, b) => (a.date < b.date ? -1 : 1));
  const first = sorted[0],
    last = sorted[sorted.length - 1];
  const daysSpan = (fromISO(last.date) - fromISO(first.date)) / 86400000;
  if (daysSpan < 21) return { code: "insufficient_data" };

  const inWindow = (from, to) => sorted.filter((e) => e.date >= from && e.date <= to).length;
  if (inWindow(first.date, addDays(first.date, 6)) < 2 || inWindow(addDays(last.date, -6), last.date) < 2) {
    return { code: "low_density" };
  }

  const avg = movingAverage7(sorted);
  const weeks = daysSpan / 7;
  const actualWeeklyKg = (avg[avg.length - 1].weight - avg[0].weight) / weeks;
  const expectedWeeklyKg = (GOAL_WEEKLY_RATE[profile.goal] || 0) * avg[avg.length - 1].weight;
  const diffKg = expectedWeeklyKg - actualWeeklyKg;
  if (Math.abs(diffKg) < 0.1) return { code: "on_track", actualWeeklyKg, expectedWeeklyKg };

  const deltaKcal = Math.round((diffKg * 7700) / 7 / 25) * 25;
  if (deltaKcal === 0) return { code: "on_track", actualWeeklyKg, expectedWeeklyKg };
  return {
    code: deltaKcal > 0 ? "increase" : "decrease",
    actualWeeklyKg: Math.round(actualWeeklyKg * 100) / 100,
    expectedWeeklyKg: Math.round(expectedWeeklyKg * 100) / 100,
    weeks: Math.round(weeks * 10) / 10,
    deltaKcal,
  };
}

/* Reparte gramos enteros entre n comidas sin perder nada por el redondeo:
   el resto (0..n-1 g) se distribuye de uno en uno entre las primeras
   comidas, así que sumar todas las partes siempre da el total exacto. */
function splitGrams(totalG, n) {
  const base = Math.floor(totalG / n);
  const remainder = totalG - base * n;
  return Array.from({ length: n }, (_, i) => base + (i < remainder ? 1 : 0));
}

/* Reparto de un día (entreno o descanso, tal como los devuelve
   computeNutritionTargets) en n comidas. Las calorías de cada comida se
   calculan a partir de sus propios macros (no dividiendo las kcal del día
   aparte), para que macros y calorías mostradas en cada comida cuadren
   entre sí. */
function splitIntoMeals(day, mealCount) {
  const proteinParts = splitGrams(day.protein, mealCount);
  const fatParts = splitGrams(day.fat, mealCount);
  const carbParts = splitGrams(day.carbs, mealCount);
  return proteinParts.map((protein, i) => {
    const fat = fatParts[i];
    const carbs = carbParts[i];
    return { protein, fat, carbs, calories: Math.round(protein * 4 + fat * 9 + carbs * 4) };
  });
}

/* ============================================================================
   5c. ALIMENTOS (OPEN FOOD FACTS)
   ----------------------------------------------------------------------------
   Sin backend propio: se llama directamente a la API pública de Open Food
   Facts desde el cliente (es abierta, sin clave y sin límites estrictos para
   uso personal). Dos endpoints:
     - Búsqueda de texto: search-a-licious (search.openfoodfacts.org/search).
     - Producto por código de barras: world.openfoodfacts.org/api/v2/product.
   Muchos productos tienen datos incompletos: normalizeOffProduct() descarta
   (devuelve null) cualquiera sin kcal/proteína/hidratos/grasa numéricos.
   ========================================================================== */
const MEALS = ["Desayuno", "Comida", "Merienda", "Cena"];

const uid = (prefix) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const FOOD_EMOJI_RULES = [
  [/chicken|poultry|turkey|pollo|pavo/, "🍗"],
  [/beef|pork|meat|carn|jam[oó]n|salchich|sausage|bacon|chorizo/, "🥩"],
  [/fish|seafood|salmon|tuna|at[uú]n|pescado|marisco|gamba|shrimp/, "🐟"],
  [/egg|huevo/, "🥚"],
  [/cheese|queso/, "🧀"],
  [/yogurt|yogur|dair|milk|leche/, "🥛"],
  [/legume|bean|lenteja|garbanzo|jud[ií]a/, "🫘"],
  [/nut|seed|almendra|nuez|fruto-seco|peanut/, "🥜"],
  [/bread|pan|toast|cereal|pasta|rice|arroz|noodle/, "🍞"],
  [/fruit|fruta|manzana|pl[aá]tano|apple|banana/, "🍎"],
  [/vegetable|verdura|tomate|lettuce|ensalada/, "🥦"],
  [/pizza/, "🍕"],
  [/chocolate|candy|sweet|dulce|galleta|biscuit|cookie|pastry|cake|tarta|bollo/, "🍫"],
  [/beverage|drink|juice|zumo|soda|refresco|water|agua|bebida/, "🥤"],
  [/oil|aceite|butter|mantequilla/, "🧈"],
  [/protein|supplement|bodybuilding|suplemento|prote[ií]na/, "💪"],
];
function emojiForFood(categoriesTags, name) {
  const haystack = `${(categoriesTags || []).join(" ")} ${name || ""}`.toLowerCase();
  for (const [re, emoji] of FOOD_EMOJI_RULES) {
    if (re.test(haystack)) return emoji;
  }
  return "🍽️";
}

function nutrimentsAreValid(n) {
  if (!n) return false;
  const vals = [n["energy-kcal_100g"], n["proteins_100g"], n["carbohydrates_100g"], n["fat_100g"]];
  return vals.every((v) => typeof v === "number" && Number.isFinite(v)) && n["energy-kcal_100g"] >= 0;
}
function normalizeOffProduct(p) {
  if (!p || !nutrimentsAreValid(p.nutriments)) return null;
  const n = p.nutriments;
  const name = String(p.product_name || "").split("\n")[0].trim();
  if (!name) return null;
  const brandsRaw = Array.isArray(p.brands) ? p.brands[0] : p.brands;
  return {
    id: `off-${p.code}`,
    source: "off",
    code: p.code,
    name,
    brand: (brandsRaw || "").split(",")[0].trim(),
    emoji: emojiForFood(p.categories_tags, name),
    kcal100: Math.round(n["energy-kcal_100g"]),
    protein100: Math.round(n["proteins_100g"] * 10) / 10,
    carbs100: Math.round(n["carbohydrates_100g"] * 10) / 10,
    fat100: Math.round(n["fat_100g"] * 10) / 10,
    countries: p.countries_tags || [],
  };
}
/* Prioriza (no filtra) los resultados con presencia en España, manteniendo
   el orden de relevancia original dentro de cada grupo. */
function prioritizeSpain(hits) {
  const spain = [];
  const rest = [];
  for (const h of hits || []) {
    (h.countries_tags || []).includes("en:spain") ? spain.push(h) : rest.push(h);
  }
  return [...spain, ...rest];
}
const looksLikeBarcode = (q) => /^\d{6,14}$/.test(q.trim());

const OFF_FIELDS = "code,product_name,brands,nutriments,categories_tags,countries_tags";

/* Un solo fetch con timeout, sin reintento — lo usa fetchOffWithRetry(). */
async function fetchOffOnce(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error("http-" + res.status);
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}
/* world.openfoodfacts.org (a diferencia de search.openfoodfacts.org, que no
   manda cabecera CORS y el navegador bloquea la respuesta) sí permite
   llamadas desde el cliente, pero a veces devuelve un fallo de red suelto
   bajo carga alta — un reintento corto lo resuelve casi siempre. */
async function fetchOffWithRetry(url) {
  const delays = [800, 1600];
  let lastErr;
  for (let i = 0; i <= delays.length; i++) {
    try {
      return await fetchOffOnce(url);
    } catch (e) {
      lastErr = e;
      if (e.name === "AbortError" || i === delays.length) break;
      await new Promise((r) => setTimeout(r, delays[i]));
    }
  }
  throw lastErr;
}

async function searchOffFoods(query) {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    throw new Error("offline");
  }
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
    query
  )}&search_simple=1&action=process&json=1&page_size=24&fields=${OFF_FIELDS}`;
  const data = await fetchOffWithRetry(url);
  return prioritizeSpain(data.products).map(normalizeOffProduct).filter(Boolean);
}
async function lookupOffBarcode(code) {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    throw new Error("offline");
  }
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
    code.trim()
  )}.json?fields=${OFF_FIELDS}`;
  const data = await fetchOffWithRetry(url);
  if (data.status !== 1) return null;
  return normalizeOffProduct(data.product);
}

function computeFoodQuantity(food, grams) {
  const factor = grams / 100;
  return {
    grams: Math.round(grams),
    kcal: Math.round(food.kcal100 * factor),
    protein: Math.round(food.protein100 * factor * 10) / 10,
    carbs: Math.round(food.carbs100 * factor * 10) / 10,
    fat: Math.round(food.fat100 * factor * 10) / 10,
  };
}
function sumDayMacros(dayLog) {
  const totals = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  if (!dayLog) return totals;
  for (const meal of MEALS) {
    for (const item of dayLog[meal] || []) {
      totals.kcal += item.kcal || 0;
      totals.protein += item.protein || 0;
      totals.carbs += item.carbs || 0;
      totals.fat += item.fat || 0;
    }
  }
  return {
    kcal: Math.round(totals.kcal),
    protein: Math.round(totals.protein * 10) / 10,
    carbs: Math.round(totals.carbs * 10) / 10,
    fat: Math.round(totals.fat * 10) / 10,
  };
}

/* ============================================================================
   6. UTILIDADES
   ========================================================================== */
const todayISO = () => new Date().toISOString().slice(0, 10);
const fmtDate = (iso) => {
  const d = new Date(iso + "T00:00:00");
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
};
const mmss = (s) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;

function parseVideoId(input) {
  if (!input) return "";
  const v = input.trim();
  if (!v.includes("/") && !v.includes("?")) return v;
  const m =
    v.match(/[?&]v=([A-Za-z0-9_-]{6,})/) ||
    v.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/) ||
    v.match(/embed\/([A-Za-z0-9_-]{6,})/) ||
    v.match(/shorts\/([A-Za-z0-9_-]{6,})/);
  return m ? m[1] : v;
}

function dayStats(day) {
  const sets = day.slots.reduce((a, s) => a + s.sets, 0);
  const seconds = day.slots.reduce((a, s) => a + s.sets * (s.rest + 45), 0) + 300;
  return { exercises: day.slots.length, sets, minutes: Math.round(seconds / 60) };
}

/* --- CALENDARIO ------------------------------------------------------------ */
const WD = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const iso = (d) => {
  const x = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return x.toISOString().slice(0, 10);
};
const fromISO = (s) => new Date(s + "T12:00:00");
const addDays = (s, n) => {
  const d = fromISO(s);
  d.setDate(d.getDate() + n);
  return iso(d);
};
function weekOf(dateISO) {
  const d = fromISO(dateISO);
  const dow = (d.getDay() + 6) % 7; // lunes = 0
  const monday = addDays(dateISO, -dow);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}
/* Plan por defecto: Día 1-5 de lunes a viernes, fin de semana libre. */
const DEFAULT_WEEK = ["d1", "d2", "d3", "d4", "d5", null, null];
function dayIdFor(dateISO, schedule) {
  if (schedule && Object.prototype.hasOwnProperty.call(schedule, dateISO)) return schedule[dateISO];
  const dow = (fromISO(dateISO).getDay() + 6) % 7;
  return DEFAULT_WEEK[dow];
}
const getDay = (id) => DAYS.find((d) => d.id === id) || null;

/* --- SUSTITUCIONES DE EJERCICIO ---------------------------------------------
   DAYS no se toca. Las sustituciones viven aparte (hipertrofia:swaps:v1,
   clave `${dayId}:${index}` → exerciseId) y se aplican solo sobre el campo
   `ex` de cada slot al leerlo. Todo lo demás del slot (series, reps, RIR,
   descanso) sigue viniendo de DAYS tal cual. */
const swapKey = (dayId, index) => `${dayId}:${index}`;
function getEffectiveDay(dayId, swaps, customExercises) {
  const day = getDay(dayId);
  if (!day || !swaps) return day;
  const all = mergeExercises(customExercises);
  let changed = false;
  const slots = day.slots.map((slot, i) => {
    const exId = swaps[swapKey(dayId, i)];
    if (exId && exId !== slot.ex && all[exId]) {
      changed = true;
      return { ...slot, ex: exId };
    }
    return slot;
  });
  return changed ? { ...day, slots } : day;
}

/* --- MINIATURA ------------------------------------------------------------- */
function thumbUrl(videos, exId) {
  const v = videos[exId]?.videoId;
  return v ? `https://img.youtube.com/vi/${v}/mqdefault.jpg` : null;
}

/* --- PROGRESO DE UNA FECHA -------------------------------------------------- */
function slotProgress(log, slot, dateISO) {
  const list = log[slot.ex] || [];
  const rec = list.find(
    (h) => h.date === dateISO && h.repMin === slot.repRange[0] && h.repMax === slot.repRange[1]
  );
  const done = rec ? rec.sets.filter((s) => s.reps > 0).length : 0;
  const weights = rec ? rec.sets.map((s) => s.weight) : [];
  return { done, total: slot.sets, complete: done >= slot.sets, weights };
}
function dayProgress(log, day, dateISO) {
  if (!day) return { done: 0, total: 0, pct: 0 };
  let done = 0,
    total = 0;
  day.slots.forEach((s) => {
    const p = slotProgress(log, s, dateISO);
    done += Math.min(p.done, p.total);
    total += p.total;
  });
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

/* ============================================================================
   7. COMPONENTES BASE
   ========================================================================== */
const Label = ({ children, style }) => (
  <div
    className="uppercase"
    style={{ fontSize: 10, letterSpacing: "0.14em", color: C.dim, fontWeight: 600, ...style }}
  >
    {children}
  </div>
);

function Panel({ children, style, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: C.panel,
        border: `1px solid ${C.line}`,
        borderRadius: 18,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Btn({ children, onClick, variant = "solid", disabled, style }) {
  const base = {
    width: "100%",
    borderRadius: 14,
    padding: "15px 18px",
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    border: "1px solid transparent",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.4 : 1,
    transition: "transform .12s ease, background .15s ease",
    fontFamily: FONT,
  };
  const variants = {
    solid: { background: C.chalk, color: C.ink },
    signal: { background: C.signal, color: "#FFFFFF" },
    diet: { background: C.dietAccent, color: "#FFFFFF" },
    ghost: { background: "transparent", color: C.chalk, border: `1px solid ${C.line2}` },
    quiet: { background: C.panel2, color: C.muted, border: `1px solid ${C.line}` },
  };
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{ ...base, ...variants[variant], ...style }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.985)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {children}
    </button>
  );
}

function Stepper({ value, onChange, step = 1, decimals = 0, compact = false }) {
  const dec = () => onChange(Math.max(0, +(Number(value || 0) - step).toFixed(decimals)));
  const inc = () => onChange(+(Number(value || 0) + step).toFixed(decimals));
  const bw = compact ? 40 : 46;
  const btn = {
    width: bw,
    height: 48,
    flexShrink: 0,
    background: C.panel2,
    border: `1px solid ${C.line}`,
    color: C.chalk,
    fontSize: 21,
    fontWeight: 400,
    lineHeight: 1,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    boxSizing: "border-box",
    fontFamily: FONT,
  };
  return (
    <div style={{ display: "flex", alignItems: "stretch", width: "100%", minWidth: 0 }}>
      <button onClick={dec} style={{ ...btn, borderRadius: "12px 0 0 12px" }} aria-label="restar">
        −
      </button>
      <input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value.replace(",", "."))}
        inputMode="decimal"
        placeholder="0"
        style={{
          flex: "1 1 0",
          width: "100%",
          minWidth: 0,
          textAlign: "center",
          background: C.panel2,
          border: `1px solid ${C.line}`,
          borderLeft: "none",
          borderRight: "none",
          color: C.chalk,
          fontSize: 18,
          fontWeight: 700,
          fontVariantNumeric: "tabular-nums",
          outline: "none",
          padding: "0 2px",
          boxSizing: "border-box",
          fontFamily: FONT,
        }}
      />
      <button onClick={inc} style={{ ...btn, borderRadius: "0 12px 12px 0" }} aria-label="sumar">
        +
      </button>
    </div>
  );
}

/* ============================================================================
   8. VÍDEO
   ========================================================================== */
function VideoBlock({ exerciseId, videos, onSetVideo }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const cfg = videos[exerciseId] || {};
  const id = cfg.videoId;

  if (id && open) {
    return (
      <div>
        <div
          style={{
            position: "relative",
            paddingTop: "56.25%",
            borderRadius: 14,
            overflow: "hidden",
            background: "#000",
            border: `1px solid ${C.line}`,
          }}
        >
          <iframe
            title="Vídeo del ejercicio"
            src={`https://www.youtube.com/embed/${id}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
          />
        </div>
        <button
          onClick={() => setOpen(false)}
          style={{ marginTop: 8, background: "none", border: "none", color: C.muted, fontSize: 12, cursor: "pointer", fontFamily: FONT }}
        >
          Ocultar vídeo
        </button>
      </div>
    );
  }

  if (id) {
    return (
      <Btn variant="ghost" onClick={() => setOpen(true)}>
        ▶ Ver vídeo
      </Btn>
    );
  }

  return (
    <div style={{ background: C.panel2, border: `1px dashed ${C.line2}`, borderRadius: 14, padding: 16 }}>
      {!editing ? (
        <>
          <Label>Vídeo no configurado</Label>
          <p style={{ color: C.muted, fontSize: 13, margin: "8px 0 12px", lineHeight: 1.5 }}>
            No se han inventado enlaces. Pega el enlace de YouTube que quieras usar y quedará guardado para
            este ejercicio.
          </p>
          <Btn variant="quiet" onClick={() => setEditing(true)}>
            Añadir vídeo
          </Btn>
        </>
      ) : (
        <>
          <Label>Enlace o ID de YouTube</Label>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            style={{
              width: "100%",
              marginTop: 8,
              marginBottom: 10,
              background: C.ink,
              border: `1px solid ${C.line}`,
              borderRadius: 10,
              padding: "12px 14px",
              color: C.chalk,
              fontSize: 14,
              outline: "none",
              fontFamily: FONT,
            }}
          />
          <div className="flex gap-2">
            <Btn
              onClick={() => {
                const vid = parseVideoId(draft);
                if (vid) onSetVideo(exerciseId, vid);
                setEditing(false);
                setDraft("");
              }}
            >
              Guardar
            </Btn>
            <Btn variant="quiet" onClick={() => setEditing(false)}>
              Cancelar
            </Btn>
          </div>
        </>
      )}
    </div>
  );
}

/* ============================================================================
   8b. ILUSTRACIÓN DEL EJERCICIO (animación, dos poses o miniatura)
   ========================================================================== */
function ExerciseMedia({ exerciseId, videos, media, size = 62, radius = 12, contain = false, hideIfEmpty = false }) {
  const candidates = useMemo(() => mediaCandidates(exerciseId, videos, media), [exerciseId, videos, media]);
  const [i, setI] = useState(0);
  const [pose, setPose] = useState(0);
  const cur = candidates[i];

  useEffect(() => setI(0), [exerciseId, media]);

  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (!cur || cur.type !== "poses" || reduced) return;
    const t = setInterval(() => setPose((p) => 1 - p), POSE_INTERVAL);
    return () => clearInterval(t);
  }, [cur, reduced]);

  const pct = typeof size === "string";
  const box = {
    width: size,
    height: pct ? "auto" : size,
    aspectRatio: pct ? "4 / 3" : undefined,
    flexShrink: 0,
    borderRadius: radius,
    overflow: "hidden",
    background: C.panel2,
    border: `1px solid ${C.line}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  };

  if (!cur) {
    if (hideIfEmpty) return null;
    return (
      <div style={box}>
        <svg width={pct ? 34 : size * 0.4} height={pct ? 34 : size * 0.4} viewBox="0 0 24 24" fill="none">
          <path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10" stroke={C.dim} strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  const fit = { width: "100%", height: "100%", objectFit: contain ? "contain" : "cover", display: "block" };
  const next = () => setI((n) => n + 1);

  if (cur.type === "poses") {
    return (
      <div style={box}>
        {cur.src.map((src, k) => (
          <img
            key={src}
            src={src}
            alt=""
            onError={k === 0 ? next : undefined}
            style={{
              ...fit,
              position: "absolute",
              inset: 0,
              opacity: reduced ? (k === 1 ? 1 : 0) : pose === k ? 1 : 0,
              transition: "opacity .28s ease",
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div style={box}>
      <img src={cur.src} alt="" onError={next} style={fit} />
    </div>
  );
}

/* ============================================================================
   9. FICHA TÉCNICA DEL EJERCICIO
   ========================================================================== */
function ExerciseSheet({ slot, videos, media, onSetVideo, history, onClose, initialTab = "tecnica", customExercises }) {
  const ex = getExercise(slot.ex, customExercises);
  const [tab, setTab] = useState(initialTab);
  const prog = getProgression(history, slot.repRange);
  useSwipeBack(onClose);

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: 22 }}>
      <Label style={{ marginBottom: 10 }}>{title}</Label>
      {children}
    </div>
  );
  const List = ({ items, marker = "—" }) => (
    <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
      {items.map((t, i) => (
        <li key={i} className="flex gap-3" style={{ marginBottom: 8, alignItems: "baseline" }}>
          <span style={{ color: C.dim, fontSize: 11, flexShrink: 0 }}>{marker}</span>
          <span style={{ color: C.chalk, fontSize: 14, lineHeight: 1.55, opacity: 0.9 }}>{t}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(6,7,8,0.86)",
        zIndex: 60,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 520,
          maxHeight: "92vh",
          overflowY: "auto",
          background: C.ink,
          borderTop: `1px solid ${C.line2}`,
          borderRadius: "22px 22px 0 0",
          padding: "10px 20px 40px",
          paddingBottom: "calc(40px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div
          style={{ width: 40, height: 4, background: C.line2, borderRadius: 4, margin: "6px auto 18px" }}
        />
        <Label>{ex.muscleGroup}</Label>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: C.chalk, margin: "6px 0 4px", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
          {ex.name}
        </h2>
        {ex.howTo && (
          <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.55, margin: "0 0 18px" }}>{ex.howTo}</p>
        )}

        <div style={{ marginBottom: 14 }}>
          <ExerciseMedia
            exerciseId={ex.id}
            videos={videos}
            media={media}
            size="100%"
            radius={16}
            contain
            hideIfEmpty
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <VideoBlock exerciseId={ex.id} videos={videos} onSetVideo={onSetVideo} />
        </div>

        <div className="flex gap-2" style={{ marginBottom: 22 }}>
          {[
            ["tecnica", "Técnica"],
            ["errores", "Errores"],
            ["historial", "Historial"],
          ].map(([k, l]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              style={{
                flex: 1,
                padding: "10px 0",
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                cursor: "pointer",
                background: tab === k ? C.chalk : "transparent",
                color: tab === k ? C.ink : C.muted,
                border: `1px solid ${tab === k ? C.chalk : C.line}`,
                fontFamily: FONT,
              }}
            >
              {l}
            </button>
          ))}
        </div>

        {tab === "tecnica" && (
          <>
            {(ex.primary.length > 0 || ex.secondary.length > 0) && (
              <Section title="Músculos principales">
                <List items={ex.primary} marker="●" />
                {ex.secondary.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <Label style={{ marginBottom: 8 }}>Secundarios</Label>
                    <List items={ex.secondary} marker="○" />
                  </div>
                )}
              </Section>
            )}
            {ex.setup.length > 0 && (
              <Section title="Posición inicial">
                <List items={ex.setup} />
              </Section>
            )}
            {ex.execution.length > 0 && (
              <Section title="Ejecución">
                <ol style={{ margin: 0, paddingLeft: 0, listStyle: "none" }}>
                  {ex.execution.map((t, i) => (
                    <li key={i} className="flex gap-3" style={{ marginBottom: 10 }}>
                      <span
                        style={{
                          color: C.dim,
                          fontSize: 11,
                          fontWeight: 700,
                          fontVariantNumeric: "tabular-nums",
                          paddingTop: 3,
                        }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span style={{ color: C.chalk, fontSize: 14, lineHeight: 1.55, opacity: 0.9 }}>{t}</span>
                    </li>
                  ))}
                </ol>
              </Section>
            )}
            {ex.cues.length > 0 && (
              <Section title="Cues">
                <div className="flex flex-wrap gap-2">
                  {ex.cues.map((c, i) => (
                    <span
                      key={i}
                      style={{
                        background: C.panel2,
                        border: `1px solid ${C.line}`,
                        borderRadius: 999,
                        padding: "8px 14px",
                        fontSize: 13,
                        color: C.chalk,
                        opacity: 0.9,
                      }}
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </Section>
            )}
            {ex.alternatives.length > 0 && (
              <Section title="Si no puedes hacerlo">
                <List items={ex.alternatives} marker="↳" />
              </Section>
            )}
            {!ex.primary.length &&
              !ex.setup.length &&
              !ex.execution.length &&
              !ex.cues.length &&
              !ex.alternatives.length && (
                <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.6 }}>
                  Ejercicio propio sin ficha técnica detallada.
                </div>
              )}
          </>
        )}

        {tab === "errores" && (
          <Section title="Errores frecuentes">
            {ex.mistakes.length > 0 ? (
              ex.mistakes.map((m, i) => (
                <div
                  key={i}
                  className="flex gap-3"
                  style={{
                    background: C.panel,
                    border: `1px solid ${C.line}`,
                    borderRadius: 12,
                    padding: "13px 15px",
                    marginBottom: 9,
                  }}
                >
                  <span style={{ color: C.signal, fontSize: 13, fontWeight: 700 }}>✕</span>
                  <span style={{ color: C.chalk, fontSize: 14, lineHeight: 1.5, opacity: 0.9 }}>{m}</span>
                </div>
              ))
            ) : (
              <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.6 }}>Sin errores frecuentes registrados.</div>
            )}
          </Section>
        )}

        {tab === "historial" && (
          <div>
            <ProgressionCard prog={prog} />
            <div style={{ height: 18 }} />
            <HistoryBody history={history} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================================
   10. TARJETA DE PROGRESIÓN
   ========================================================================== */
function ProgressionCard({ prog, compact }) {
  const isUp = prog.code === "up";
  return (
    <div
      style={{
        background: isUp ? C.signalDim : C.panel2,
        border: `1px solid ${isUp ? C.signal : C.line}`,
        borderRadius: 14,
        padding: compact ? "12px 14px" : "16px 18px",
      }}
    >
      <div
        style={{
          color: isUp ? C.signal : C.chalk,
          fontSize: compact ? 12 : 13,
          fontWeight: 800,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          lineHeight: 1.3,
        }}
      >
        {prog.title}
      </div>
      <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.5, margin: "6px 0 0" }}>{prog.detail}</p>
    </div>
  );
}

/* ============================================================================
   11. HISTORIAL + GRÁFICA
   ========================================================================== */
function Chart({ data, metric, color = C.signal }) {
  if (data.length < 2) return null;
  const W = 320,
    H = 110,
    P = 10;
  const vals = data.map((d) => d[metric]);
  const min = Math.min(...vals),
    max = Math.max(...vals);
  const span = max - min || 1;
  const pts = data.map((d, i) => {
    const x = P + (i * (W - 2 * P)) / (data.length - 1);
    const y = H - P - ((d[metric] - min) / span) * (H - 2 * P);
    return [x, y];
  });
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${path} L${pts[pts.length - 1][0].toFixed(1)},${H} L${pts[0][0].toFixed(1)},${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 110, display: "block" }}>
      <path d={area} fill={color} opacity="0.08" />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="3" fill={C.ink} stroke={color} strokeWidth="2" />
      ))}
    </svg>
  );
}

function HistoryBody({ history }) {
  const [metric, setMetric] = useState("weight");
  const chartData = useMemo(
    () =>
      [...history]
        .reverse()
        .slice(-10)
        .map((h) => {
          const sets = h.sets.filter((s) => Number(s.reps) > 0);
          const weight = Math.max(0, ...h.sets.map((s) => Number(s.weight) || 0));
          const reps = sets.reduce((a, s) => a + Number(s.reps), 0);
          const volume = sets.reduce((a, s) => a + Number(s.weight || 0) * Number(s.reps || 0), 0);
          return { date: h.date, weight, reps, volume };
        }),
    [history]
  );

  if (!history.length)
    return (
      <div style={{ color: C.muted, fontSize: 14, padding: "24px 0", textAlign: "center" }}>
        Sin sesiones registradas. Guarda tu primera serie y aparecerá aquí.
      </div>
    );

  return (
    <div>
      <div className="flex gap-2" style={{ marginBottom: 12 }}>
        {[
          ["weight", "Peso"],
          ["reps", "Reps"],
          ["volume", "Volumen"],
        ].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setMetric(k)}
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              cursor: "pointer",
              background: metric === k ? C.panel2 : "transparent",
              color: metric === k ? C.chalk : C.dim,
              border: `1px solid ${metric === k ? C.line2 : C.line}`,
              fontFamily: FONT,
            }}
          >
            {l}
          </button>
        ))}
      </div>
      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: "14px 6px 6px" }}>
        <Chart data={chartData} metric={metric} />
      </div>
      <div style={{ marginTop: 14 }}>
        {history.slice(0, 12).map((h) => {
          const weight = Math.max(0, ...h.sets.map((s) => Number(s.weight) || 0));
          return (
            <div
              key={h.id}
              className="flex items-center justify-between"
              style={{ padding: "13px 2px", borderBottom: `1px solid ${C.line}` }}
            >
              <div className="flex items-baseline gap-3">
                <span style={{ color: C.dim, fontSize: 12, fontVariantNumeric: "tabular-nums", width: 42 }}>
                  {fmtDate(h.date)}
                </span>
                <span style={{ color: C.chalk, fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                  {weight ? `${weight} kg` : "—"}
                </span>
              </div>
              <span style={{ color: C.muted, fontSize: 14, fontVariantNumeric: "tabular-nums" }}>
                {h.sets.map((s) => s.reps || "–").join(" / ")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================================
   12. TEMPORIZADOR DE DESCANSO
   ========================================================================== */
function RestTimer({ seconds, onClose }) {
  const [left, setLeft] = useState(seconds);
  const [total, setTotal] = useState(seconds);
  const [done, setDone] = useState(false);
  const ref = useRef(null);

  const endRef = useRef(Date.now() + seconds * 1000);

  useEffect(() => {
    ref.current = setInterval(() => {
      setLeft(() => {
        const l = Math.round((endRef.current - Date.now()) / 1000);
        if (l <= 0) {
          clearInterval(ref.current);
          setDone(true);
          try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.connect(g);
            g.connect(ctx.destination);
            o.frequency.value = 660;
            g.gain.setValueAtTime(0.0001, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
            g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
            o.start();
            o.stop(ctx.currentTime + 0.65);
          } catch {}
          return 0;
        }
        return l;
      });
    }, 500);
    return () => clearInterval(ref.current);
  }, []);

  useEffect(() => {
    let lock;
    (async () => {
      try {
        lock = await navigator.wakeLock.request("screen");
      } catch {}
    })();
    return () => {
      try {
        lock && lock.release();
      } catch {}
    };
  }, []);

  const adjust = (d) => {
    endRef.current += d * 1000;
    setLeft((l) => Math.max(0, l + d));
    setTotal((t) => Math.max(1, t + d));
    if (done && d > 0) setDone(false);
  };
  const pct = done ? 0 : Math.max(0, Math.min(1, left / total));

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(6,7,8,0.94)",
        zIndex: 70,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
      }}
    >
      <Label style={{ color: done ? C.signal : C.dim }}>{done ? "Descanso terminado" : "Descanso"}</Label>
      <div
        style={{
          fontSize: 78,
          fontWeight: 200,
          color: done ? C.signal : C.chalk,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "-0.03em",
          margin: "10px 0 6px",
          lineHeight: 1,
        }}
      >
        {mmss(left)}
      </div>
      <div style={{ width: 220, height: 2, background: C.line, borderRadius: 2, marginBottom: 34 }}>
        <div
          style={{
            width: `${pct * 100}%`,
            height: "100%",
            background: C.signal,
            borderRadius: 2,
            transition: "width 1s linear",
          }}
        />
      </div>
      <div className="flex gap-3" style={{ width: "100%", maxWidth: 300, marginBottom: 12 }}>
        <Btn variant="ghost" onClick={() => adjust(-30)}>
          −30 s
        </Btn>
        <Btn variant="ghost" onClick={() => adjust(30)}>
          +30 s
        </Btn>
      </div>
      <div style={{ width: "100%", maxWidth: 300 }}>
        <Btn onClick={onClose}>{done ? "Continuar" : "Omitir"}</Btn>
      </div>
    </div>
  );
}

/* ============================================================================
   13. CALENTAMIENTO
   ========================================================================== */
function WarmupCard({ group, state, onChange }) {
  const [open, setOpen] = useState(false);
  const rows = state?.rows || [{ weight: "", reps: "" }];
  const set = (i, k, v) => {
    const next = rows.map((r, j) => (i === j ? { ...r, [k]: v } : r));
    onChange({ ...state, rows: next });
  };
  return (
    <Panel style={{ marginBottom: 14, background: C.panel, borderStyle: "dashed" }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full"
        style={{ background: "none", border: "none", padding: "15px 17px", cursor: "pointer", fontFamily: FONT }}
      >
        <div className="flex items-center gap-3">
          <span style={{ fontSize: 15 }}>◐</span>
          <div style={{ textAlign: "left" }}>
            <Label>Calentamiento · {group}</Label>
            <div style={{ color: C.muted, fontSize: 12, marginTop: 3 }}>No cuenta como serie efectiva</div>
          </div>
        </div>
        <span style={{ color: C.dim, fontSize: 12 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={{ padding: "0 17px 17px" }}>
          <ul style={{ margin: "0 0 14px", padding: 0, listStyle: "none" }}>
            {(WARMUP[group] || []).map((t, i) => (
              <li key={i} className="flex gap-2" style={{ marginBottom: 6 }}>
                <span style={{ color: C.dim, fontSize: 11 }}>—</span>
                <span style={{ color: C.chalk, opacity: 0.85, fontSize: 13, lineHeight: 1.5 }}>{t}</span>
              </li>
            ))}
          </ul>
          <Label style={{ marginBottom: 8 }}>Series de aproximación</Label>
          {rows.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
              <div style={{ flex: "1 1 0", minWidth: 0 }}>
                <Label style={{ marginBottom: 5 }}>Peso kg</Label>
                <Stepper value={r.weight} onChange={(v) => set(i, "weight", v)} step={2.5} decimals={1} compact />
              </div>
              <div style={{ flex: "1 1 0", minWidth: 0 }}>
                <Label style={{ marginBottom: 5 }}>Reps</Label>
                <Stepper value={r.reps} onChange={(v) => set(i, "reps", v)} step={1} compact />
              </div>
            </div>
          ))}
          <button
            onClick={() => onChange({ ...state, rows: [...rows, { weight: "", reps: "" }] })}
            style={{ background: "none", border: "none", color: C.muted, fontSize: 12, cursor: "pointer", fontFamily: FONT, padding: 0 }}
          >
            + Añadir serie de aproximación
          </button>
        </div>
      )}
    </Panel>
  );
}

/* --- Gesto: deslizar desde el borde izquierdo para volver atrás --------------- */
function useSwipeBack(onBack) {
  useEffect(() => {
    let x0 = null,
      y0 = null,
      t0 = 0;
    const start = (e) => {
      const t = e.touches[0];
      if (t.clientX > 44) {
        x0 = null;
        return;
      }
      x0 = t.clientX;
      y0 = t.clientY;
      t0 = Date.now();
    };
    const end = (e) => {
      if (x0 === null) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - x0;
      const dy = Math.abs(t.clientY - y0);
      if (dx > 70 && dy < 60 && Date.now() - t0 < 700) onBack();
      x0 = null;
    };
    window.addEventListener("touchstart", start, { passive: true });
    window.addEventListener("touchend", end, { passive: true });
    return () => {
      window.removeEventListener("touchstart", start);
      window.removeEventListener("touchend", end);
    };
  }, [onBack]);
}

/* ============================================================================
   14. PANTALLA DE ENTRENAMIENTO
   ========================================================================== */
function WorkoutScreen({ day, session, setSession, log, saveSet, videos, media, onSetVideo, onExit, openSheet, customExercises }) {
  const [idx, setIdx] = useState(session.currentIndex || 0);
  useEffect(() => {
    if (typeof session.jumpTo === "number") {
      setIdx(session.jumpTo);
      setSession((s) => ({ ...s, jumpTo: null }));
      window.scrollTo({ top: 0 });
    }
  }, [session.jumpTo]);
  const [rest, setRest] = useState(null);
  const slot = day.slots[idx];
  const ex = getExercise(slot.ex, customExercises);
  const key = `${idx}:${slot.ex}`;
  const entry = session.entries[key] || { sets: [], warmup: null };
  const history = log[slot.ex] || [];
  const prog = getProgression(history, slot.repRange);

  const prevGroup = idx > 0 ? getExercise(day.slots[idx - 1].ex, customExercises).muscleGroup : null;
  const startsGroup = ex.muscleGroup !== prevGroup;

  useEffect(() => {
    setSession((s) => ({ ...s, currentIndex: idx }));
  }, [idx]);

  const goBack = useCallback(() => {
    if (rest !== null) return;
    if (idx > 0) {
      setIdx(idx - 1);
      window.scrollTo({ top: 0 });
    } else {
      onExit();
    }
  }, [idx, rest, onExit]);
  useSwipeBack(goBack);

  const updateSet = (i, field, value) => {
    setSession((s) => {
      const e = s.entries[key] || { sets: [] };
      const sets = [...(e.sets || [])];
      while (sets.length < slot.sets) sets.push({ weight: "", reps: "", rir: "", saved: false });
      sets[i] = { ...sets[i], [field]: value };
      return { ...s, entries: { ...s.entries, [key]: { ...e, sets } } };
    });
  };

  const sets = useMemo(() => {
    const arr = [...(entry.sets || [])];
    if (!arr.length) {
      const rec = (log[slot.ex] || []).find(
        (h) => h.date === session.date && h.repMin === slot.repRange[0] && h.repMax === slot.repRange[1]
      );
      if (rec)
        rec.sets.forEach((r) =>
          arr.push({ weight: r.weight || "", reps: r.reps || "", rir: r.rir ?? "", saved: true })
        );
    }
    while (arr.length < slot.sets) arr.push({ weight: "", reps: "", rir: "", saved: false });
    return arr.slice(0, slot.sets);
  }, [entry.sets, slot.sets, slot.ex, session.date]);

  const savedCount = sets.filter((s) => s.saved).length;

  const onSaveSet = (i) => {
    const s = sets[i];
    if (!s.reps) return;
    const nextSets = sets.map((x, j) => (j === i ? { ...x, saved: true } : x));
    setSession((prev) => ({
      ...prev,
      entries: { ...prev.entries, [key]: { ...entry, sets: nextSets } },
    }));
    saveSet(slot, nextSets, session.date);
    setRest(slot.rest);
  };

  const isLast = idx === day.slots.length - 1;

  return (
    <div style={{ paddingBottom: 40 }}>
      {rest !== null && <RestTimer seconds={rest} onClose={() => setRest(null)} />}

      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: C.ink,
          borderBottom: `1px solid ${C.line}`,
          padding: "12px 18px",
          paddingTop: "calc(12px + env(safe-area-inset-top, 0px))",
        }}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
          <button
            onClick={onExit}
            style={{
              background: "none",
              border: "none",
              color: C.signal,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              padding: "4px 8px 4px 0",
              flexShrink: 0,
              fontFamily: FONT,
            }}
          >
            ← Salir
          </button>
          <Label
            style={{
              flex: "1 1 0",
              minWidth: 0,
              textAlign: "center",
              padding: "0 10px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {day.title}
          </Label>
          <span
            style={{
              color: C.chalk,
              fontSize: 13,
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
              flexShrink: 0,
            }}
          >
            {idx + 1}/{day.slots.length}
          </span>
        </div>
        <div className="flex gap-1">
          {day.slots.map((_, i) => (
            <div
              key={i}
              onClick={() => setIdx(i)}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                cursor: "pointer",
                background: i < idx ? C.muted : i === idx ? C.signal : C.line,
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ padding: "20px 18px 0" }}>
        {startsGroup && (
          <WarmupCard
            group={ex.muscleGroup}
            state={entry.warmup}
            onChange={(w) =>
              setSession((s) => ({
                ...s,
                entries: { ...s.entries, [key]: { ...(s.entries[key] || { sets: [] }), warmup: w } },
              }))
            }
          />
        )}

        <Label>{ex.muscleGroup}</Label>
        <h1
          style={{
            fontSize: 27,
            fontWeight: 800,
            color: C.chalk,
            margin: "6px 0 14px",
            letterSpacing: "-0.025em",
            lineHeight: 1.1,
          }}
        >
          {ex.name}
        </h1>

        <div className="flex gap-2" style={{ marginBottom: 16 }}>
          {[
            [`${slot.repRange[0]}-${slot.repRange[1]}`, "reps"],
            [slot.rir.join(" / "), "rir"],
            [slot.restLabel, "descanso"],
          ].map(([v, l]) => (
            <div
              key={l}
              style={{
                flex: 1,
                background: C.panel,
                border: `1px solid ${C.line}`,
                borderRadius: 12,
                padding: "11px 8px",
                textAlign: "center",
              }}
            >
              <div style={{ color: C.chalk, fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{v}</div>
              <Label style={{ marginTop: 3 }}>{l}</Label>
            </div>
          ))}
        </div>

        <div className="flex gap-2" style={{ marginBottom: 16 }}>
          <Btn variant="quiet" onClick={() => openSheet(slot)}>
            Ficha técnica
          </Btn>
        </div>

        <div style={{ marginBottom: 14 }}>
          <ExerciseMedia exerciseId={ex.id} videos={videos} media={media} size="100%" radius={16} contain hideIfEmpty />
        </div>

        <div style={{ marginBottom: 18 }}>
          <VideoBlock exerciseId={ex.id} videos={videos} onSetVideo={onSetVideo} />
        </div>

        <div style={{ marginBottom: 18 }}>
          <ProgressionCard prog={prog} compact />
        </div>

        {sets.map((s, i) => (
          <Panel
            key={i}
            style={{
              marginBottom: 12,
              padding: "15px 16px",
              borderColor: s.saved ? C.line2 : C.line,
              opacity: s.saved ? 0.72 : 1,
            }}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
              <div className="flex items-center gap-3">
                <Label style={{ color: s.saved ? C.ok : C.dim }}>Serie {i + 1}</Label>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    color: slot.rir[i] === 0 ? C.signal : C.dim,
                    border: `1px solid ${slot.rir[i] === 0 ? C.signal : C.line2}`,
                    borderRadius: 999,
                    padding: "3px 9px",
                  }}
                >
                  RIR {slot.rir[i]}
                </span>
              </div>
              {s.saved && <span style={{ color: C.ok, fontSize: 13 }}>✓</span>}
            </div>

            <div style={{ marginBottom: 10 }}>
              <Label style={{ marginBottom: 6 }}>Peso kg</Label>
              <Stepper value={s.weight} onChange={(v) => updateSet(i, "weight", v)} step={2.5} decimals={1} />
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <div style={{ flex: "1 1 0", minWidth: 0 }}>
                <Label style={{ marginBottom: 6 }}>Reps</Label>
                <Stepper value={s.reps} onChange={(v) => updateSet(i, "reps", v)} step={1} compact />
              </div>
              <div style={{ flex: "1 1 0", minWidth: 0 }}>
                <Label style={{ marginBottom: 6 }}>RIR real</Label>
                <Stepper value={s.rir} onChange={(v) => updateSet(i, "rir", v)} step={1} compact />
              </div>
            </div>

            {!s.saved ? (
              <Btn onClick={() => onSaveSet(i)} disabled={!s.reps}>
                Guardar serie
              </Btn>
            ) : (
              <div className="flex gap-2">
                <Btn variant="quiet" onClick={() => setRest(slot.rest)}>
                  Iniciar descanso
                </Btn>
                <Btn variant="quiet" onClick={() => updateSet(i, "saved", false)}>
                  Editar
                </Btn>
              </div>
            )}
          </Panel>
        ))}

        <div style={{ marginTop: 22 }}>
          {isLast ? (
            <Btn variant="signal" onClick={onExit}>
              Terminar entrenamiento
            </Btn>
          ) : (
            <Btn
              variant={savedCount === slot.sets ? "signal" : "ghost"}
              onClick={() => {
                setIdx(idx + 1);
                window.scrollTo({ top: 0 });
              }}
            >
              Siguiente ejercicio →
            </Btn>
          )}
        </div>
        {idx > 0 && (
          <button
            onClick={() => {
              setIdx(idx - 1);
              window.scrollTo({ top: 0 });
            }}
            style={{
              width: "100%",
              background: "none",
              border: "none",
              color: C.dim,
              fontSize: 13,
              padding: "16px 0",
              cursor: "pointer",
              fontFamily: FONT,
            }}
          >
            ← Ejercicio anterior
          </button>
        )}
      </div>
    </div>
  );
}

/* ============================================================================
   15. INICIO
   ========================================================================== */
function HomeView({ log, schedule, swaps, customExercises, onGo, onStart }) {
  const today = todayISO();
  const week = weekOf(today);
  const dayId = dayIdFor(today, schedule);
  const day = getEffectiveDay(dayId, swaps, customExercises);
  const p = dayProgress(log, day, today);
  const st = day ? dayStats(day) : null;
  const totalSets = Object.values(log).reduce(
    (a, h) => a + h.reduce((b, e) => b + e.sets.length, 0),
    0
  );
  const trained = new Set(
    Object.values(log).flatMap((h) => h.map((e) => e.date))
  );
  const weekTrained = week.filter((d) => trained.has(d)).length;

  return (
    <div style={{ padding: "28px 18px 30px", paddingTop: "calc(28px + env(safe-area-inset-top, 0px))" }}>
      <Label>
        {fromISO(today).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
      </Label>
      <h1 style={{ fontSize: 30, fontWeight: 800, color: C.chalk, margin: "8px 0 22px", letterSpacing: "-0.03em" }}>
        Hoy
      </h1>

      <Panel style={{ padding: 22, marginBottom: 16 }}>
        {day ? (
          <>
            <Label>{day.label}</Label>
            <h2
              style={{
                fontSize: 25,
                fontWeight: 800,
                color: C.chalk,
                margin: "8px 0 18px",
                letterSpacing: "-0.025em",
                lineHeight: 1.1,
              }}
            >
              {day.title}
            </h2>
            <div className="flex" style={{ marginBottom: 20 }}>
              {[
                [st.exercises, "ejercicios"],
                [st.sets, "series"],
                [`${st.minutes}′`, "estimado"],
              ].map(([v, l], i) => (
                <div key={l} style={{ flex: 1, borderLeft: i ? `1px solid ${C.line}` : "none", paddingLeft: i ? 14 : 0 }}>
                  <div style={{ color: C.chalk, fontSize: 21, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{v}</div>
                  <Label style={{ marginTop: 3 }}>{l}</Label>
                </div>
              ))}
            </div>
            {p.done > 0 && (
              <div style={{ marginBottom: 18 }}>
                <div className="flex justify-between" style={{ marginBottom: 7 }}>
                  <Label>Progreso</Label>
                  <span style={{ color: C.signal, fontSize: 11, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                    {p.done}/{p.total}
                  </span>
                </div>
                <div style={{ height: 4, background: C.line, borderRadius: 2 }}>
                  <div style={{ width: `${p.pct}%`, height: "100%", background: C.signal, borderRadius: 2 }} />
                </div>
              </div>
            )}
            {day.note && <div style={{ color: C.dim, fontSize: 12, marginBottom: 16 }}>· {day.note}</div>}
            <Btn variant="signal" onClick={() => onStart(day.id, today)}>
              {p.done > 0 ? "Continuar entrenamiento" : "Empezar entrenamiento"}
            </Btn>
          </>
        ) : (
          <>
            <Label>Sin entrenamiento</Label>
            <h2 style={{ fontSize: 25, fontWeight: 800, color: C.chalk, margin: "8px 0 12px", letterSpacing: "-0.025em" }}>
              Día de descanso
            </h2>
            <p style={{ color: C.muted, fontSize: 14, margin: "0 0 18px", lineHeight: 1.5 }}>
              Puedes asignar un entrenamiento a hoy desde el calendario.
            </p>
            <Btn variant="quiet" onClick={() => onGo(today)}>
              Ir al calendario
            </Btn>
          </>
        )}
      </Panel>

      <div className="flex" style={{ gap: 10 }}>
        <Panel style={{ flex: 1, padding: 18 }}>
          <div style={{ color: C.chalk, fontSize: 24, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
            {weekTrained}
          </div>
          <Label style={{ marginTop: 4 }}>días esta semana</Label>
        </Panel>
        <Panel style={{ flex: 1, padding: 18 }}>
          <div style={{ color: C.chalk, fontSize: 24, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
            {totalSets}
          </div>
          <Label style={{ marginTop: 4 }}>series registradas</Label>
        </Panel>
      </div>
    </div>
  );
}

/* ============================================================================
   16. VISTA RUTINA — CALENDARIO + LISTA DE EJERCICIOS
   ========================================================================== */
function WeekStrip({ selected, onSelect, log, schedule, swaps, customExercises }) {
  const week = useMemo(() => weekOf(selected), [selected]);
  const d0 = fromISO(week[0]);
  const d6 = fromISO(week[6]);
  const monthLabel =
    d0.getMonth() === d6.getMonth()
      ? `${MONTHS[d0.getMonth()]} ${d0.getFullYear()}`
      : `${MONTHS[d0.getMonth()].slice(0, 3)} – ${MONTHS[d6.getMonth()].slice(0, 3)} ${d6.getFullYear()}`;

  const Arrow = ({ dir }) => (
    <button
      onClick={() => onSelect(addDays(selected, dir * 7))}
      style={{ background: "none", border: "none", cursor: "pointer", padding: "6px 10px", lineHeight: 0 }}
      aria-label={dir < 0 ? "Semana anterior" : "Semana siguiente"}
    >
      <svg width="13" height="21" viewBox="0 0 13 21" fill="none">
        <path
          d={dir < 0 ? "M11 2L3 10.5L11 19" : "M2 2L10 10.5L2 19"}
          stroke={C.signal}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );

  return (
    <div style={{ padding: "8px 8px 14px", paddingTop: "calc(10px + env(safe-area-inset-top, 0px))" }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
        <Arrow dir={-1} />
        <div style={{ color: C.chalk, fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em" }}>
          {monthLabel}
        </div>
        <Arrow dir={1} />
      </div>
      <div className="flex" style={{ gap: 6 }}>
        {week.map((dt, i) => {
          const dayId = dayIdFor(dt, schedule);
          const day = getEffectiveDay(dayId, swaps, customExercises);
          const p = dayProgress(log, day, dt);
          const isSel = dt === selected;
          const isToday = dt === todayISO();
          const done = day && p.total > 0 && p.done >= p.total;
          const ring = !day ? C.line : done ? C.ok : C.signal;
          return (
            <button
              key={dt}
              onClick={() => onSelect(dt)}
              style={{
                flex: 1,
                minWidth: 0,
                aspectRatio: "1 / 1",
                borderRadius: "50%",
                border: `2.5px solid ${isSel ? C.signal : ring}`,
                background: isSel ? C.signal : "transparent",
                boxShadow: isSel ? `0 0 14px ${C.signalSoft}` : "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontFamily: FONT,
                padding: 0,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: isSel ? "#fff" : day ? C.muted : C.dim,
                  lineHeight: 1.3,
                }}
              >
                {WD[i]}
              </span>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: isSel ? "#fff" : day ? C.chalk : C.dim,
                  fontVariantNumeric: "tabular-nums",
                  lineHeight: 1.15,
                  textDecoration: isToday && !isSel ? "underline" : "none",
                  textUnderlineOffset: 2,
                }}
              >
                {fromISO(dt).getDate()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ExerciseRow({ slot, index, videos, media, log, dateISO, isSwapped, onOpen, onToggle, onSwap, customExercises }) {
  const ex = getExercise(slot.ex, customExercises);
  const p = slotProgress(log, slot, dateISO);
  const scheme = Array.from({ length: slot.sets }, (_, i) => {
    const w = p.weights[i];
    return `${w ? w : "(-)"} x (${slot.repRange[0]}-${slot.repRange[1]})`;
  }).join(" - ");

  return (
    <div
      className="flex items-center"
      style={{ gap: 14, padding: "12px 4px", borderBottom: `1px solid ${C.line}` }}
    >
      <button
        onClick={() => onOpen(index)}
        className="flex items-center"
        style={{
          flex: 1,
          minWidth: 0,
          gap: 14,
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          textAlign: "left",
          fontFamily: FONT,
        }}
      >
        <ExerciseMedia exerciseId={slot.ex} videos={videos} media={media} size={62} radius={12} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            className="uppercase"
            style={{
              color: C.chalk,
              fontSize: 15,
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: "-0.01em",
            }}
          >
            {ex.name}
          </div>
          <div
            style={{
              color: C.dim,
              fontSize: 12,
              marginTop: 5,
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1.35,
            }}
          >
            {scheme}
          </div>
        </div>
      </button>
      <button
        onClick={() => onSwap(index)}
        aria-label={isSwapped ? "Ejercicio sustituido. Cambiar de nuevo" : "Sustituir ejercicio"}
        style={{
          width: 34,
          height: 34,
          flexShrink: 0,
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 8h13M17 8l-4-4M17 8l-4 4M20 16H7M7 16l4-4M7 16l4 4"
            stroke={isSwapped ? C.signal : C.dim}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <button
        onClick={() => onToggle(index)}
        aria-label={p.complete ? "Marcar como pendiente" : "Marcar como completado"}
        style={{
          width: 30,
          height: 30,
          flexShrink: 0,
          borderRadius: "50%",
          border: `2px solid ${p.complete ? C.ok : p.done > 0 ? C.signal : C.line2}`,
          background: p.complete ? C.ok : "transparent",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
        }}
      >
        {p.complete ? (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M5 12.5L10 17.5L19 7" stroke="#0A0A0B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : p.done > 0 ? (
          <span style={{ color: C.signal, fontSize: 10, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
            {p.done}
          </span>
        ) : null}
      </button>
    </div>
  );
}

/* --- SELECTOR DE SUSTITUCIÓN DE EJERCICIO ----------------------------------- */
function ExerciseForm({ initial, onCancel, onSave }) {
  const [name, setName] = useState(initial?.name || "");
  const [muscleGroup, setMuscleGroup] = useState(initial?.muscleGroup || MUSCLE_GROUPS[0]);
  const [howTo, setHowTo] = useState(initial?.howTo || "");
  const valid = name.trim().length > 0 && muscleGroup;

  const inputStyle = {
    width: "100%",
    background: C.panel2,
    border: `1px solid ${C.line}`,
    borderRadius: 11,
    padding: "12px 14px",
    color: C.chalk,
    fontSize: 16,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: FONT,
  };

  return (
    <div style={{ padding: "4px 18px 18px" }}>
      <Label style={{ marginBottom: 6 }}>Nombre *</Label>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ej. Curl 21 con barra"
        style={{ ...inputStyle, marginBottom: 14 }}
      />

      <Label style={{ marginBottom: 6 }}>Grupo muscular *</Label>
      <select
        value={muscleGroup}
        onChange={(e) => setMuscleGroup(e.target.value)}
        style={{ ...inputStyle, marginBottom: 14, appearance: "none" }}
      >
        {MUSCLE_GROUPS.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>

      <Label style={{ marginBottom: 6 }}>Descripción (opcional)</Label>
      <textarea
        value={howTo}
        onChange={(e) => setHowTo(e.target.value)}
        placeholder="Cómo se hace, en pocas palabras…"
        rows={3}
        style={{ ...inputStyle, marginBottom: 16, resize: "vertical", fontFamily: FONT }}
      />

      <div className="flex gap-2">
        <Btn variant="quiet" onClick={onCancel} style={{ flex: 1 }}>
          Cancelar
        </Btn>
        <Btn
          variant="signal"
          disabled={!valid}
          onClick={() => onSave({ name: name.trim(), muscleGroup, howTo })}
          style={{ flex: 1 }}
        >
          Guardar
        </Btn>
      </div>
    </div>
  );
}

/* --- SILUETAS DE FILTRO POR GRUPO MUSCULAR -----------------------------------
   SVG propio, sin dependencias. Cuerpo simplificado a bloques (cabeza + torso +
   2 brazos + 2 piernas): a 44×64 no aporta nada intentar más detalle, solo hay
   que reconocer de un vistazo qué zona es. Espalda/Isquiotibiales/Glúteo usan
   la vista trasera (línea de columna); el resto, la delantera. Bíceps/Tríceps
   comparten brazo delantero: como una silueta plana no puede distinguir delante
   de detrás del mismo brazo, se separan por la mitad interior/exterior del
   brazo en vez de por vista — no es anatómicamente exacto, pero junto con la
   etiqueta debajo basta para identificar la zona. */
const BODY_GROUPS = [
  "Pecho",
  "Espalda",
  "Hombro",
  "Bíceps",
  "Tríceps",
  "Cuádriceps",
  "Isquiotibiales",
  "Glúteo",
  "Gemelo",
  "Core",
];
const BODY_GROUP_BACK = { Espalda: true, Isquiotibiales: true, Glúteo: true };
const BODY_HIGHLIGHTS = {
  Pecho: [{ x: 14, y: 14, w: 16, h: 9, rx: 4 }],
  Core: [{ x: 15, y: 24, w: 14, h: 8, rx: 3 }],
  Hombro: [
    { cx: 8, cy: 15, r: 4.5 },
    { cx: 36, cy: 15, r: 4.5 },
  ],
  /* Bíceps no usa este mapa: se dibuja con el brazo flexionado (ver
     BodySilhouette), la pose clásica de "bíceps" que se reconoce sin
     necesidad de comparar posiciones sutiles dentro del brazo. */
  Tríceps: [
    { x: 4, y: 15, w: 7, h: 11, rx: 3 },
    { x: 33, y: 15, w: 7, h: 11, rx: 3 },
  ],
  Cuádriceps: [
    { x: 13, y: 35, w: 8, h: 13, rx: 3 },
    { x: 23, y: 35, w: 8, h: 13, rx: 3 },
  ],
  Gemelo: [
    { x: 13, y: 49, w: 8, h: 12, rx: 3 },
    { x: 23, y: 49, w: 8, h: 12, rx: 3 },
  ],
  Espalda: [{ x: 13, y: 14, w: 18, h: 18, rx: 5 }],
  Isquiotibiales: [
    { x: 13, y: 35, w: 8, h: 13, rx: 3 },
    { x: 23, y: 35, w: 8, h: 13, rx: 3 },
  ],
  Glúteo: [{ x: 13, y: 31, w: 18, h: 7, rx: 3 }],
};

function BodySilhouette({ group, active, onClick }) {
  const back = !!BODY_GROUP_BACK[group];
  const flexed = group === "Bíceps";
  const shapes = flexed ? [] : BODY_HIGHLIGHTS[group] || [];
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      aria-label={`Filtrar por ${group}`}
      style={{
        flexShrink: 0,
        width: 50,
        background: "none",
        border: `1.5px solid ${active ? C.signal : "transparent"}`,
        borderRadius: 12,
        padding: "4px 3px 5px",
        cursor: "pointer",
        fontFamily: FONT,
      }}
    >
      <svg width="40" height="58" viewBox="0 0 44 64">
        <circle cx="22" cy="7" r="5" fill={C.line2} />
        <rect x="13" y="13" width="18" height="20" rx="6" fill={C.line2} />
        {back && <line x1="22" y1="15" x2="22" y2="31" stroke={C.ink} strokeWidth="0.6" opacity="0.5" />}
        {flexed ? (
          <>
            {/* brazo flexionado: bíceps (tramo hombro-codo) en rojo, antebrazo doblado hacia el hombro en gris */}
            <line x1="9" y1="15" x2="4" y2="27" stroke={C.muscle} strokeWidth="6" strokeLinecap="round" />
            <line x1="4" y1="27" x2="10" y2="17" stroke={C.line2} strokeWidth="5" strokeLinecap="round" />
            <line x1="35" y1="15" x2="40" y2="27" stroke={C.muscle} strokeWidth="6" strokeLinecap="round" />
            <line x1="40" y1="27" x2="34" y2="17" stroke={C.line2} strokeWidth="5" strokeLinecap="round" />
          </>
        ) : (
          <>
            <rect x="4" y="14" width="7" height="22" rx="3.5" fill={C.line2} />
            <rect x="33" y="14" width="7" height="22" rx="3.5" fill={C.line2} />
          </>
        )}
        <rect x="13" y="34" width="8" height="28" rx="3.5" fill={C.line2} />
        <rect x="23" y="34" width="8" height="28" rx="3.5" fill={C.line2} />
        {shapes.map((s, i) =>
          s.r != null ? (
            <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={C.muscle} />
          ) : (
            <rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} rx={s.rx} fill={C.muscle} />
          )
        )}
      </svg>
      <div
        style={{
          fontSize: 9,
          fontWeight: 600,
          color: active ? C.chalk : C.dim,
          marginTop: 3,
          whiteSpace: "nowrap",
          textAlign: "center",
        }}
      >
        {group}
      </div>
    </button>
  );
}

function ExerciseSwapSheet({
  currentExId,
  originalExId,
  log,
  customExercises,
  onPick,
  onRestore,
  onClose,
  onCreateExercise,
  onUpdateExercise,
  onDeleteExercise,
}) {
  const [q, setQ] = useState("");
  const [activeGroup, setActiveGroup] = useState(null);
  const [mode, setMode] = useState("list"); // "list" | "create" | "edit"
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const query = q.trim().toLowerCase();
  const allGroups = buildExerciseGroups(customExercises);
  const groups = allGroups
    .map((g) => ({
      ...g,
      items: g.items.filter(
        (e) =>
          (!activeGroup || e.muscleGroup === activeGroup) &&
          (!query || e.name.toLowerCase().includes(query) || e.muscleGroup.toLowerCase().includes(query))
      ),
    }))
    .filter((g) => g.items.length);

  const deleteTarget = deleteId ? getExercise(deleteId, customExercises) : null;
  const deleteHistoryCount = deleteId ? (log?.[deleteId] || []).length : 0;

  const title =
    mode === "create" ? "Nuevo ejercicio" : mode === "edit" ? "Editar ejercicio" : "Sustituir ejercicio";

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(5,5,6,0.86)",
        zIndex: 60,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 520,
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          background: C.ink,
          borderRadius: "22px 22px 0 0",
          borderTop: `1px solid ${C.line2}`,
          paddingBottom: "calc(18px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div style={{ width: 40, height: 4, background: C.line2, borderRadius: 4, margin: "10px auto 4px", flexShrink: 0 }} />

        <div className="flex items-center justify-between" style={{ padding: "8px 18px 10px", flexShrink: 0 }}>
          <Label>{title}</Label>
          {mode !== "list" && (
            <button
              onClick={() => setMode("list")}
              style={{
                background: "none",
                border: "none",
                color: C.signal,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                padding: 0,
                fontFamily: FONT,
              }}
            >
              ← Volver
            </button>
          )}
        </div>

        {mode === "create" && (
          <ExerciseForm onCancel={() => setMode("list")} onSave={(data) => onCreateExercise(data)} />
        )}

        {mode === "edit" && editingId && (
          <ExerciseForm
            initial={getExercise(editingId, customExercises)}
            onCancel={() => setMode("list")}
            onSave={(data) => {
              onUpdateExercise(editingId, data);
              setMode("list");
            }}
          />
        )}

        {mode === "list" && (
          <>
            <div
              className="flex"
              style={{
                gap: 10,
                padding: "0 18px 14px",
                overflowX: "auto",
                flexShrink: 0,
                WebkitOverflowScrolling: "touch",
              }}
            >
              {BODY_GROUPS.filter((g) =>
                Object.values(mergeExercises(customExercises)).some((e) => e.muscleGroup === g)
              ).map((g) => (
                <BodySilhouette
                  key={g}
                  group={g}
                  active={activeGroup === g}
                  onClick={() => setActiveGroup((prev) => (prev === g ? null : g))}
                />
              ))}
            </div>

            <div style={{ padding: "0 18px 14px", flexShrink: 0 }}>
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar ejercicio…"
                style={{
                  width: "100%",
                  background: C.panel2,
                  border: `1px solid ${C.line}`,
                  borderRadius: 11,
                  padding: "12px 14px",
                  color: C.chalk,
                  fontSize: 16,
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: FONT,
                  marginBottom: 10,
                }}
              />
              <div className="flex gap-2">
                {originalExId && currentExId !== originalExId && (
                  <button
                    onClick={onRestore}
                    className="flex items-center justify-center"
                    style={{
                      flex: 1,
                      background: "transparent",
                      border: `1px solid ${C.line}`,
                      borderRadius: 11,
                      padding: "11px 14px",
                      color: C.signal,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: FONT,
                      textAlign: "center",
                    }}
                  >
                    ↺ Restaurar {getExercise(originalExId, customExercises).short}
                  </button>
                )}
                <button
                  onClick={() => setMode("create")}
                  className="flex items-center justify-center"
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: `1px dashed ${C.line2}`,
                    borderRadius: 11,
                    padding: "11px 14px",
                    color: C.chalk,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: FONT,
                    textAlign: "center",
                  }}
                >
                  + Crear ejercicio
                </button>
              </div>
            </div>

            <div style={{ overflowY: "auto", padding: "0 18px 8px" }}>
              {!groups.some((g) => g.items.length) && (
                <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: "24px 0" }}>
                  Sin resultados para "{q}"
                </div>
              )}
              {groups.map(
                (g) =>
                  g.items.length > 0 && (
                    <div key={g.group} style={{ marginBottom: 14 }}>
                      <Label style={{ marginBottom: 6 }}>{g.group}</Label>
                      {g.items.map((e) => {
                        const active = e.id === currentExId;
                        return (
                          <div key={e.id} className="flex items-center" style={{ gap: 6, marginBottom: 7 }}>
                            <button
                              onClick={() => onPick(e.id)}
                              className="flex items-center justify-between w-full"
                              style={{
                                flex: 1,
                                minWidth: 0,
                                background: active ? C.panel2 : "transparent",
                                border: `1px solid ${active ? C.signal : C.line}`,
                                borderRadius: 12,
                                padding: "13px 14px",
                                cursor: "pointer",
                                fontFamily: FONT,
                                textAlign: "left",
                              }}
                            >
                              <span
                                style={{
                                  color: C.chalk,
                                  fontSize: 14,
                                  fontWeight: 600,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {e.name}
                              </span>
                              {active && <span style={{ color: C.signal, fontSize: 13, flexShrink: 0 }}>●</span>}
                            </button>
                            {e.custom && (
                              <>
                                <button
                                  aria-label={`Editar ${e.name}`}
                                  onClick={() => {
                                    setEditingId(e.id);
                                    setMode("edit");
                                  }}
                                  style={{
                                    width: 34,
                                    height: 34,
                                    flexShrink: 0,
                                    background: "none",
                                    border: "none",
                                    color: C.dim,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    padding: 0,
                                  }}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path
                                      d="M4 20h4L19.5 8.5a2 2 0 0 0 0-2.8l-1.2-1.2a2 2 0 0 0-2.8 0L4 16v4Z"
                                      stroke="currentColor"
                                      strokeWidth="1.8"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </button>
                                <button
                                  aria-label={`Borrar ${e.name}`}
                                  onClick={() => setDeleteId(e.id)}
                                  style={{
                                    width: 34,
                                    height: 34,
                                    flexShrink: 0,
                                    background: "none",
                                    border: "none",
                                    color: C.dim,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    padding: 0,
                                  }}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path
                                      d="M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0 1 13h8l1-13"
                                      stroke="currentColor"
                                      strokeWidth="1.8"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </button>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )
              )}
            </div>
          </>
        )}

        {deleteId && deleteTarget && (
          <div
            onClick={() => setDeleteId(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(5,5,6,0.86)",
              zIndex: 70,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: 380,
                background: C.panel,
                border: `1px solid ${C.line2}`,
                borderRadius: 16,
                padding: 20,
              }}
            >
              <div style={{ color: C.chalk, fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
                ¿Borrar "{deleteTarget.name}"?
              </div>
              <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.55, margin: "0 0 18px" }}>
                {deleteHistoryCount > 0
                  ? `Tiene ${deleteHistoryCount} sesión${deleteHistoryCount === 1 ? "" : "es"} guardada${
                      deleteHistoryCount === 1 ? "" : "s"
                    } en el historial. El historial se conserva, pero el ejercicio dejará de estar disponible para elegirlo.`
                  : "No tiene historial guardado."}
              </p>
              <div className="flex gap-2">
                <Btn variant="quiet" onClick={() => setDeleteId(null)} style={{ flex: 1 }}>
                  Cancelar
                </Btn>
                <Btn
                  variant="signal"
                  style={{ flex: 1 }}
                  onClick={() => {
                    onDeleteExercise(deleteId);
                    setDeleteId(null);
                  }}
                >
                  Borrar
                </Btn>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RoutineView({
  selected,
  setSelected,
  log,
  videos,
  media,
  schedule,
  setDayForDate,
  onOpenExercise,
  swaps,
  onSetExerciseSwap,
  customExercises,
  onCreateExercise,
  onUpdateExercise,
  onDeleteExercise,
}) {
  const [picking, setPicking] = useState(false);
  const [swapIndex, setSwapIndex] = useState(null);
  const dayId = dayIdFor(selected, schedule);
  const rawDay = getDay(dayId);
  const day = getEffectiveDay(dayId, swaps, customExercises);
  const p = dayProgress(log, day, selected);
  const d = fromISO(selected);
  const dateLabel = `${WD[(d.getDay() + 6) % 7]}. ${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1
  ).padStart(2, "0")}`;

  return (
    <div>
      <div style={{ position: "sticky", top: 0, zIndex: 20, background: C.ink }}>
        <WeekStrip
          selected={selected}
          onSelect={setSelected}
          log={log}
          schedule={schedule}
          swaps={swaps}
          customExercises={customExercises}
        />
      </div>

      <div
        style={{
          background: C.panel,
          borderTop: `1px solid ${C.line}`,
          borderRadius: "22px 22px 0 0",
          minHeight: "60vh",
          padding: "22px 18px 24px",
        }}
      >
        <div className="flex items-center" style={{ gap: 11, marginBottom: 18 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10" stroke={C.chalk} strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          <h1 style={{ color: C.chalk, fontSize: 21, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
            Rutina {dateLabel}
          </h1>
        </div>

        {!day ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ color: C.chalk, fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Día de descanso</div>
            <p style={{ color: C.muted, fontSize: 14, margin: "0 0 20px", lineHeight: 1.5 }}>
              No hay entrenamiento asignado a esta fecha.
            </p>
            <Btn variant="quiet" onClick={() => setPicking(true)}>
              Asignar un día
            </Btn>
          </div>
        ) : (
          <>
            <div
              style={{
                background: C.signalDim,
                borderRadius: 12,
                height: 42,
                marginBottom: 18,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${p.pct}%`,
                  height: "100%",
                  background: C.signal,
                  transition: "width .35s ease",
                }}
              />
              <div
                className="flex items-center justify-center"
                style={{ position: "absolute", inset: 0, color: "#fff", fontSize: 16, fontWeight: 700 }}
              >
                {p.pct}%
              </div>
            </div>

            <button
              onClick={() => setPicking(true)}
              className="flex items-center justify-between w-full"
              style={{
                background: "none",
                border: "none",
                padding: "0 4px 10px",
                cursor: "pointer",
                fontFamily: FONT,
              }}
            >
              <Label>
                {day.label} · {day.title}
              </Label>
              <span style={{ color: C.signal, fontSize: 12, fontWeight: 600 }}>Cambiar</span>
            </button>

            {day.slots.map((slot, i) => (
              <ExerciseRow
                key={i}
                slot={slot}
                index={i}
                videos={videos}
                media={media}
                log={log}
                dateISO={selected}
                isSwapped={slot.ex !== rawDay.slots[i].ex}
                onOpen={(idx) => onOpenExercise(day.id, idx, selected)}
                onToggle={(idx) => onOpenExercise(day.id, idx, selected)}
                onSwap={setSwapIndex}
                customExercises={customExercises}
              />
            ))}

            <div style={{ marginTop: 22 }}>
              <Btn variant="signal" onClick={() => onOpenExercise(day.id, 0, selected)}>
                {p.done > 0 ? "Continuar entrenamiento" : "Empezar entrenamiento"}
              </Btn>
            </div>
          </>
        )}
      </div>

      {picking && (
        <div
          onClick={() => setPicking(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(5,5,6,0.86)",
            zIndex: 60,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 520,
              background: C.ink,
              borderRadius: "22px 22px 0 0",
              borderTop: `1px solid ${C.line2}`,
              padding: "10px 18px 34px",
            }}
          >
            <div style={{ width: 40, height: 4, background: C.line2, borderRadius: 4, margin: "6px auto 18px" }} />
            <Label style={{ marginBottom: 12 }}>Entrenamiento del {dateLabel}</Label>
            {DAYS.map((dd) => (
              <button
                key={dd.id}
                onClick={() => {
                  setDayForDate(selected, dd.id);
                  setPicking(false);
                }}
                className="flex items-center justify-between w-full"
                style={{
                  background: dd.id === dayId ? C.panel2 : "transparent",
                  border: `1px solid ${dd.id === dayId ? C.signal : C.line}`,
                  borderRadius: 13,
                  padding: "14px 16px",
                  marginBottom: 8,
                  cursor: "pointer",
                  fontFamily: FONT,
                  textAlign: "left",
                }}
              >
                <div>
                  <div style={{ color: C.chalk, fontSize: 14, fontWeight: 700 }}>{dd.title}</div>
                  <div style={{ color: C.dim, fontSize: 12, marginTop: 2 }}>
                    {dd.label} · {dd.slots.length} ejercicios · {dayStats(dd).sets} series
                  </div>
                </div>
                {dd.id === dayId && <span style={{ color: C.signal, fontSize: 13 }}>●</span>}
              </button>
            ))}
            <button
              onClick={() => {
                setDayForDate(selected, null);
                setPicking(false);
              }}
              style={{
                width: "100%",
                background: "transparent",
                border: `1px solid ${C.line}`,
                borderRadius: 13,
                padding: "14px 16px",
                color: C.muted,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: FONT,
              }}
            >
              Marcar como descanso
            </button>
          </div>
        </div>
      )}

      {swapIndex !== null && day && (
        <ExerciseSwapSheet
          currentExId={day.slots[swapIndex].ex}
          originalExId={rawDay.slots[swapIndex].ex}
          log={log}
          customExercises={customExercises}
          onPick={(exId) => {
            onSetExerciseSwap(dayId, swapIndex, exId);
            setSwapIndex(null);
          }}
          onRestore={() => {
            onSetExerciseSwap(dayId, swapIndex, null);
            setSwapIndex(null);
          }}
          onCreateExercise={(data) => {
            const id = onCreateExercise(data);
            onSetExerciseSwap(dayId, swapIndex, id);
            setSwapIndex(null);
          }}
          onUpdateExercise={onUpdateExercise}
          onDeleteExercise={onDeleteExercise}
          onClose={() => setSwapIndex(null)}
        />
      )}
    </div>
  );
}

/* ============================================================================
   17. HISTORIAL GLOBAL
   ========================================================================== */
function HistoryView({ log, openSheet, swaps, customExercises }) {
  // Recorre las claves del log, no el catálogo: un ejercicio propio ya
  // borrado no está en el catálogo pero su historial debe seguir viéndose.
  const entries = Object.keys(log)
    .map((id) => ({ id, history: log[id] || [] }))
    .filter((e) => e.history.length)
    .sort((a, b) => (a.history[0].date < b.history[0].date ? 1 : -1));

  // Busca en los días YA con sus sustituciones aplicadas: un ejercicio
  // propio o del catálogo ampliado no aparece nunca en DAYS en crudo.
  const slotFor = (exId) => {
    for (const d of DAYS) {
      const eff = getEffectiveDay(d.id, swaps, customExercises);
      const s = eff.slots.find((x) => x.ex === exId);
      if (s) return s;
    }
    return null;
  };

  return (
    <div style={{ padding: "26px 18px 30px", paddingTop: "calc(26px + env(safe-area-inset-top, 0px))" }}>
      <Label>Historial</Label>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: C.chalk, margin: "6px 0 22px", letterSpacing: "-0.03em" }}>
        Progresión
      </h1>
      {!entries.length && (
        <div style={{ color: C.muted, fontSize: 14, lineHeight: 1.6 }}>
          Aún no hay series guardadas. Empieza un entrenamiento y aparecerán aquí, con gráfica y
          recomendación de peso para cada ejercicio.
        </div>
      )}
      {entries.map(({ id, history }) => {
        const last = history[0];
        const slot = slotFor(id) || { ex: id, repRange: [last.repMin, last.repMax] };
        const prog = getProgression(history, slot.repRange);
        const w = Math.max(0, ...last.sets.map((s) => Number(s.weight) || 0));
        return (
          <button
            key={id}
            onClick={() => openSheet(slot, "historial")}
            className="w-full"
            style={{
              display: "block",
              textAlign: "left",
              background: C.panel,
              border: `1px solid ${C.line}`,
              borderRadius: 14,
              padding: "15px 17px",
              marginBottom: 9,
              cursor: "pointer",
              fontFamily: FONT,
            }}
          >
            <div className="flex items-start justify-between" style={{ marginBottom: 8 }}>
              <div>
                <div style={{ color: C.chalk, fontSize: 14, fontWeight: 700 }}>{getExercise(id, customExercises).name}</div>
                <div style={{ color: C.dim, fontSize: 11, marginTop: 3, fontVariantNumeric: "tabular-nums" }}>
                  {fmtDate(last.date)} · {w ? `${w} kg` : "—"} · {last.sets.map((s) => s.reps || "–").join("/")}
                </div>
              </div>
              <span style={{ color: C.dim, fontSize: 12 }}>›</span>
            </div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: prog.code === "up" ? C.signal : C.muted,
              }}
            >
              {prog.title}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ============================================================================
   18. AJUSTES
   ========================================================================== */
function SettingsView({ videos, media, onSetVideo, onSetMedia, onReset, customExercises }) {
  const [confirm, setConfirm] = useState(false);
  const allExercises = mergeExercises(customExercises);
  const exerciseCount = Object.keys(allExercises).length;
  const missing = Object.keys(allExercises).filter((id) => !(videos[id] && videos[id].videoId)).length;
  const mediaKB = Math.round(
    Object.values(media).reduce((a, v) => a + (v ? v.length : 0), 0) / 1024
  );

  return (
    <div style={{ padding: "26px 18px 30px", paddingTop: "calc(26px + env(safe-area-inset-top, 0px))" }}>
      <Label>Ajustes</Label>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: C.chalk, margin: "6px 0 22px", letterSpacing: "-0.03em" }}>
        Vídeos y datos
      </h1>

      <Panel style={{ padding: 17, marginBottom: 18 }}>
        <Label>Ejercicios con imagen</Label>
        <div style={{ color: C.chalk, fontSize: 26, fontWeight: 800, margin: "6px 0 6px", fontVariantNumeric: "tabular-nums" }}>
          {Object.keys(media).length} / {exerciseCount}
        </div>
        <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.55, margin: "0 0 4px" }}>
          Guarda un GIF o imagen para cada ejercicio desde el carrete del móvil. Ocupado: {mediaKB} KB
          de unos 4.500 disponibles.
        </p>
      </Panel>

      <Panel style={{ padding: 17, marginBottom: 18 }}>
        <Label>Vídeos pendientes</Label>
        <div style={{ color: C.chalk, fontSize: 26, fontWeight: 800, margin: "6px 0 6px", fontVariantNumeric: "tabular-nums" }}>
          {missing} / {exerciseCount}
        </div>
        <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.55, margin: 0 }}>
          Pega el enlace de YouTube de cada ejercicio. Se guarda en el dispositivo y sustituye al valor del
          archivo de configuración.
        </p>
      </Panel>

      {Object.values(allExercises).map((ex) => {
        const vid = videos[ex.id]?.videoId;
        const img = media[ex.id];
        return (
          <div
            key={ex.id}
            style={{
              background: C.panel,
              border: `1px solid ${C.line}`,
              borderRadius: 12,
              padding: "12px 14px",
              marginBottom: 8,
            }}
          >
            <div className="flex items-center" style={{ gap: 12, marginBottom: 10 }}>
              <ExerciseMedia exerciseId={ex.id} videos={videos} media={media} size={46} radius={9} />
              <div style={{ color: C.chalk, fontSize: 13, fontWeight: 600, flex: 1, minWidth: 0 }}>
                {ex.name}
              </div>
            </div>

            <Label style={{ marginBottom: 5 }}>Imagen o GIF</Label>
            <div className="flex" style={{ gap: 8, marginBottom: 9 }}>
              <label
                style={{
                  flex: 1,
                  textAlign: "center",
                  background: C.panel2,
                  border: `1px solid ${C.line}`,
                  borderRadius: 9,
                  padding: "10px 8px",
                  color: img ? C.ok : C.muted,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {img ? "✓ Cambiar archivo" : "Subir archivo"}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onSetMedia(ex.id, f);
                    e.target.value = "";
                  }}
                />
              </label>
              {img && (
                <button
                  onClick={() => onSetMedia(ex.id, null)}
                  style={{
                    background: "transparent",
                    border: `1px solid ${C.line}`,
                    borderRadius: 9,
                    padding: "10px 14px",
                    color: C.muted,
                    fontSize: 12,
                    cursor: "pointer",
                    fontFamily: FONT,
                  }}
                >
                  Quitar
                </button>
              )}
            </div>

            <Label style={{ marginBottom: 5 }}>Vídeo de YouTube</Label>
            <input
              defaultValue={vid || ""}
              placeholder="Enlace o ID"
              onBlur={(e) => {
                const v = parseVideoId(e.target.value);
                if (v !== (vid || "")) onSetVideo(ex.id, v);
              }}
              style={{
                width: "100%",
                background: C.ink,
                border: `1px solid ${C.line}`,
                borderRadius: 9,
                padding: "10px 12px",
                color: C.chalk,
                fontSize: 13,
                outline: "none",
                boxSizing: "border-box",
                fontFamily: FONT,
              }}
            />
          </div>
        );
      })}

      <div style={{ marginTop: 26 }}>
        {!confirm ? (
          <Btn variant="quiet" onClick={() => setConfirm(true)}>
            Borrar todo el historial
          </Btn>
        ) : (
          <Panel style={{ padding: 16, borderColor: C.signal }}>
            <p style={{ color: C.chalk, fontSize: 14, margin: "0 0 14px", lineHeight: 1.5 }}>
              Se borran todas las series guardadas. No se puede deshacer.
            </p>
            <div className="flex gap-2">
              <Btn variant="signal" onClick={() => { onReset(); setConfirm(false); }}>
                Borrar
              </Btn>
              <Btn variant="quiet" onClick={() => setConfirm(false)}>
                Cancelar
              </Btn>
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}

/* ============================================================================
   18b. DIETA
   ========================================================================== */
function NutritionForm({ initial, onCancel, onSave }) {
  const [sex, setSex] = useState(initial?.sex || "m");
  const [age, setAge] = useState(initial?.age ? String(initial.age) : "");
  const [heightCm, setHeightCm] = useState(initial?.heightCm ? String(initial.heightCm) : "");
  const [weightKg, setWeightKg] = useState(initial?.weightKg ?? "");
  const [activity, setActivity] = useState(initial?.activity || "moderate");
  const [goal, setGoal] = useState(initial?.goal || "recomp");

  const ageNum = Number(age);
  const heightNum = Number(heightCm);
  const weightNum = Number(weightKg);
  const valid = ageNum > 0 && ageNum < 100 && heightNum > 0 && heightNum < 250 && weightNum > 0 && weightNum < 300;

  const inputStyle = {
    width: "100%",
    background: C.panel2,
    border: `1px solid ${C.line}`,
    borderRadius: 11,
    padding: "12px 14px",
    color: C.chalk,
    fontSize: 16,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: FONT,
  };

  const Pill = ({ active, onClick, children }) => (
    <button
      onClick={onClick}
      className="flex items-center justify-center"
      style={{
        flex: 1,
        padding: "11px 6px",
        borderRadius: 11,
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        background: active ? C.panel2 : "transparent",
        color: active ? C.chalk : C.dim,
        border: `1px solid ${active ? C.dietAccent : C.line}`,
        fontFamily: FONT,
      }}
    >
      {children}
    </button>
  );

  return (
    <div>
      <Label style={{ marginBottom: 6 }}>Sexo</Label>
      <div className="flex gap-2" style={{ marginBottom: 14 }}>
        <Pill active={sex === "m"} onClick={() => setSex("m")}>
          Hombre
        </Pill>
        <Pill active={sex === "f"} onClick={() => setSex("f")}>
          Mujer
        </Pill>
      </div>

      <div className="flex gap-2" style={{ marginBottom: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Label style={{ marginBottom: 6 }}>Edad</Label>
          <input
            value={age}
            onChange={(e) => setAge(e.target.value.replace(/[^\d]/g, ""))}
            inputMode="numeric"
            placeholder="30"
            style={inputStyle}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Label style={{ marginBottom: 6 }}>Altura (cm)</Label>
          <input
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value.replace(/[^\d]/g, ""))}
            inputMode="numeric"
            placeholder="175"
            style={inputStyle}
          />
        </div>
      </div>

      <Label style={{ marginBottom: 6 }}>Peso (kg)</Label>
      <div style={{ marginBottom: 14 }}>
        <Stepper value={weightKg} onChange={setWeightKg} step={0.5} decimals={1} />
      </div>

      <Label style={{ marginBottom: 6 }}>Nivel de actividad</Label>
      <select
        value={activity}
        onChange={(e) => setActivity(e.target.value)}
        style={{ ...inputStyle, marginBottom: 14, appearance: "none" }}
      >
        {Object.keys(ACTIVITY_FACTORS).map((a) => (
          <option key={a} value={a}>
            {ACTIVITY_LABELS[a]} — {ACTIVITY_DESCRIPTIONS[a]}
          </option>
        ))}
      </select>

      <Label style={{ marginBottom: 6 }}>Objetivo</Label>
      <div className="flex gap-2" style={{ marginBottom: 20 }}>
        {Object.keys(GOAL_LABELS).map((g) => (
          <Pill key={g} active={goal === g} onClick={() => setGoal(g)}>
            {GOAL_LABELS[g]}
          </Pill>
        ))}
      </div>

      <div className="flex gap-2">
        <Btn variant="quiet" onClick={onCancel} style={{ flex: 1 }}>
          Cancelar
        </Btn>
        <Btn
          variant="diet"
          disabled={!valid}
          onClick={() =>
            onSave({ sex, age: ageNum, heightCm: heightNum, weightKg: weightNum, activity, goal })
          }
          style={{ flex: 1 }}
        >
          Guardar
        </Btn>
      </div>
    </div>
  );
}

function NutritionResultCard({ targets, isTrainingToday }) {
  const Macro = ({ label, value }) => (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ color: C.chalk, fontSize: 16, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
        {value}g
      </div>
      <Label
        style={{
          marginTop: 2,
          letterSpacing: "0.03em",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {label}
      </Label>
    </div>
  );
  const DayCard = ({ title, day, active }) => (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        background: active ? C.dietAccentDim : C.panel2,
        border: `1px solid ${active ? C.dietAccent : C.line}`,
        borderRadius: 14,
        padding: 14,
      }}
    >
      <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
        <Label>{title}</Label>
        {active && <span style={{ color: C.dietAccent, fontSize: 10, fontWeight: 800 }}>HOY</span>}
      </div>
      <div
        style={{
          color: C.chalk,
          fontSize: 22,
          fontWeight: 800,
          marginBottom: 10,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {day.calories} <span style={{ fontSize: 12, fontWeight: 600, color: C.muted }}>kcal</span>
      </div>
      <div className="flex" style={{ gap: 8 }}>
        <Macro label="Prot" value={day.protein} />
        <Macro label="Grasa" value={day.fat} />
        <Macro label="Carbs" value={day.carbs} />
      </div>
    </div>
  );
  return (
    <Panel style={{ padding: 18, marginBottom: 16 }}>
      <div className="flex" style={{ gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <Label>Metabolismo basal</Label>
          <div style={{ color: C.chalk, fontSize: 19, fontWeight: 800, marginTop: 4 }}>{targets.bmr} kcal</div>
        </div>
        <div style={{ flex: 1 }}>
          <Label>Gasto total</Label>
          <div style={{ color: C.chalk, fontSize: 19, fontWeight: 800, marginTop: 4 }}>{targets.tdee} kcal</div>
        </div>
      </div>
      <div className="flex gap-2">
        <DayCard title="Entreno" day={targets.training} active={isTrainingToday} />
        <DayCard title="Descanso" day={targets.rest} active={!isTrainingToday} />
      </div>
    </Panel>
  );
}

function SafetyLimitNotice({ targets }) {
  if (!targets.anyLimited) return null;
  return (
    <Panel style={{ padding: 16, marginBottom: 16, border: `1px solid ${C.dietAccent}`, background: C.dietAccentDim }}>
      <div className="flex gap-2" style={{ alignItems: "flex-start" }}>
        <span style={{ color: C.dietAccent, fontSize: 15, lineHeight: 1.4, flexShrink: 0 }}>⚠</span>
        <p style={{ color: C.chalk, fontSize: 13, lineHeight: 1.55, margin: 0 }}>
          Ajustado al mínimo seguro: no se baja del metabolismo basal ({targets.bmr} kcal) ni de un déficit del
          25% sobre el gasto total ({targets.tdee} kcal).
        </p>
      </div>
    </Panel>
  );
}

function AdjustmentSuggestionCard({ suggestion, onApply }) {
  if (suggestion.code !== "increase" && suggestion.code !== "decrease") return null;
  const up = suggestion.code === "increase";
  return (
    <Panel style={{ padding: 16, marginBottom: 16, border: `1px solid ${C.dietAccent}` }}>
      <Label style={{ marginBottom: 8 }}>Ajuste sugerido</Label>
      <div style={{ color: C.dietAccent, fontSize: 15, fontWeight: 800, marginBottom: 6 }}>
        {up ? "Sube" : "Baja"} {Math.abs(suggestion.deltaKcal)} kcal/día
      </div>
      <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.55, margin: "0 0 14px" }}>
        En las últimas {suggestion.weeks} semanas tu peso cambió a un ritmo de {suggestion.actualWeeklyKg} kg/semana
        (esperado: {suggestion.expectedWeeklyKg} kg/semana). Es solo una sugerencia: se aplica cuando tú quieras.
      </p>
      <Btn variant="diet" onClick={() => onApply(suggestion.deltaKcal)}>
        Aplicar ajuste
      </Btn>
    </Panel>
  );
}

function WeightLogForm({ onLogWeight }) {
  const [date, setDate] = useState(todayISO());
  const [weight, setWeight] = useState("");
  const valid = Number(weight) > 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <input
        type="date"
        value={date}
        max={todayISO()}
        onChange={(e) => setDate(e.target.value)}
        style={{
          width: "100%",
          background: C.panel2,
          border: `1px solid ${C.line}`,
          borderRadius: 11,
          padding: "12px 14px",
          color: C.chalk,
          fontSize: 16,
          outline: "none",
          boxSizing: "border-box",
          fontFamily: FONT,
          marginBottom: 10,
        }}
      />
      <div className="flex gap-2">
        <div style={{ flex: 1, minWidth: 0 }}>
          <Stepper value={weight} onChange={setWeight} step={0.1} decimals={1} />
        </div>
        <Btn
          variant="diet"
          disabled={!valid}
          onClick={() => {
            onLogWeight(Number(weight), date);
            setWeight("");
          }}
          style={{ width: 96, flexShrink: 0, padding: "0 4px" }}
        >
          Guardar
        </Btn>
      </div>
    </div>
  );
}

function WeightHistorySection({ weights, onDeleteWeight }) {
  const avgData = useMemo(() => movingAverage7(weights).slice(-30), [weights]);
  return (
    <div>
      <div
        style={{
          background: C.panel,
          border: `1px solid ${C.line}`,
          borderRadius: 14,
          padding: "14px 6px 6px",
          marginBottom: 14,
        }}
      >
        {avgData.length >= 2 ? (
          <Chart data={avgData} metric="weight" color={C.dietAccent} />
        ) : (
          <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: "24px 6px" }}>
            Registra un par de días más para ver la gráfica (media móvil de 7 días).
          </div>
        )}
      </div>
      {!weights.length && (
        <div style={{ color: C.muted, fontSize: 14, textAlign: "center", padding: "10px 0" }}>
          Aún no hay pesos registrados.
        </div>
      )}
      {weights.slice(0, 10).map((w) => (
        <div
          key={w.date}
          className="flex items-center justify-between"
          style={{ padding: "11px 2px", borderBottom: `1px solid ${C.line}` }}
        >
          <span style={{ color: C.dim, fontSize: 12, fontVariantNumeric: "tabular-nums" }}>{fmtDate(w.date)}</span>
          <span style={{ color: C.chalk, fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
            {w.weight} kg
          </span>
          <button
            onClick={() => onDeleteWeight(w.date)}
            aria-label={`Borrar peso del ${fmtDate(w.date)}`}
            style={{ background: "none", border: "none", color: C.dim, cursor: "pointer", padding: 4, fontSize: 13 }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

function MealSplitCard({ targets, isTrainingToday, mealCount, onSetMealCount }) {
  const [dayType, setDayType] = useState(isTrainingToday ? "training" : "rest");
  const day = targets[dayType];
  const meals = useMemo(() => splitIntoMeals(day, mealCount), [day, mealCount]);

  const Pill = ({ active, onClick, children }) => (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: "9px 6px",
        borderRadius: 10,
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer",
        background: active ? C.panel2 : "transparent",
        color: active ? C.chalk : C.dim,
        border: `1px solid ${active ? C.line2 : C.line}`,
        fontFamily: FONT,
      }}
    >
      {children}
    </button>
  );

  return (
    <Panel style={{ padding: 16, marginBottom: 16 }}>
      <Label style={{ marginBottom: 10 }}>Reparto por comidas</Label>

      <div className="flex gap-2" style={{ marginBottom: 12 }}>
        <Pill active={dayType === "training"} onClick={() => setDayType("training")}>
          Día de entreno
        </Pill>
        <Pill active={dayType === "rest"} onClick={() => setDayType("rest")}>
          Día de descanso
        </Pill>
      </div>

      <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
        <Label style={{ marginBottom: 0 }}>Nº de comidas</Label>
        <div className="flex gap-2">
          {[3, 4, 5, 6].map((n) => (
            <button
              key={n}
              onClick={() => onSetMealCount(n)}
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                background: mealCount === n ? C.dietAccent : "transparent",
                color: mealCount === n ? "#fff" : C.dim,
                border: `1px solid ${mealCount === n ? C.dietAccent : C.line}`,
                fontFamily: FONT,
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {meals.map((m, i) => (
        <div
          key={i}
          className="flex items-center justify-between"
          style={{ padding: "11px 2px", borderBottom: i < meals.length - 1 ? `1px solid ${C.line}` : "none" }}
        >
          <span style={{ color: C.chalk, fontSize: 13, fontWeight: 700, width: 66, flexShrink: 0 }}>
            Comida {i + 1}
          </span>
          <span style={{ color: C.chalk, fontSize: 13, fontVariantNumeric: "tabular-nums" }}>{m.calories} kcal</span>
          <span style={{ color: C.dim, fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
            {m.protein}g · {m.fat}g · {m.carbs}g
          </span>
        </div>
      ))}
    </Panel>
  );
}

/* --- REGISTRO DE COMIDAS --------------------------------------------------- */
function FoodResultRow({ food, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center w-full"
      style={{
        gap: 12,
        background: "transparent",
        border: `1px solid ${C.line}`,
        borderRadius: 12,
        padding: "10px 12px",
        marginBottom: 7,
        cursor: "pointer",
        fontFamily: FONT,
        textAlign: "left",
      }}
    >
      <span style={{ fontSize: 22, flexShrink: 0 }}>{food.emoji}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            color: C.chalk,
            fontSize: 13,
            fontWeight: 600,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {food.name}
        </div>
        <div style={{ color: C.dim, fontSize: 11, marginTop: 2 }}>
          {food.brand ? `${food.brand} · ` : ""}
          {food.kcal100} kcal /100g
        </div>
      </div>
    </button>
  );
}

function FoodQuantityPicker({ food, onCancel, onConfirm }) {
  const [mode, setMode] = useState("grams"); // "grams" | "units"
  const [grams, setGrams] = useState(100);
  const [units, setUnits] = useState(1);
  const [gramsPerUnit, setGramsPerUnit] = useState(100);

  const totalGrams = mode === "grams" ? Number(grams) || 0 : (Number(units) || 0) * (Number(gramsPerUnit) || 0);
  const computed = computeFoodQuantity(food, totalGrams);

  const inputStyle = {
    background: C.panel2,
    border: `1px solid ${C.line}`,
    borderRadius: 11,
    padding: "10px 12px",
    color: C.chalk,
    fontSize: 16,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: FONT,
  };

  return (
    <div style={{ padding: "4px 18px 18px" }}>
      <div className="flex items-center gap-2" style={{ marginBottom: 16 }}>
        <span style={{ fontSize: 26 }}>{food.emoji}</span>
        <div style={{ color: C.chalk, fontSize: 15, fontWeight: 700 }}>{food.name}</div>
      </div>

      <div className="flex gap-2" style={{ marginBottom: 14 }}>
        {[
          ["grams", "Gramos"],
          ["units", "Unidades"],
        ].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setMode(k)}
            style={{
              flex: 1,
              padding: "10px 6px",
              borderRadius: 11,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              background: mode === k ? C.panel2 : "transparent",
              color: mode === k ? C.chalk : C.dim,
              border: `1px solid ${mode === k ? C.dietAccent : C.line}`,
              fontFamily: FONT,
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {mode === "grams" ? (
        <>
          <Label style={{ marginBottom: 6 }}>Cantidad (g)</Label>
          <Stepper value={grams} onChange={setGrams} step={10} />
        </>
      ) : (
        <div className="flex gap-2">
          <div style={{ flex: 1 }}>
            <Label style={{ marginBottom: 6 }}>Unidades</Label>
            <Stepper value={units} onChange={setUnits} step={1} compact />
          </div>
          <div style={{ flex: 1 }}>
            <Label style={{ marginBottom: 6 }}>g por unidad</Label>
            <input
              value={gramsPerUnit}
              onChange={(e) => setGramsPerUnit(e.target.value.replace(/[^\d]/g, ""))}
              inputMode="numeric"
              style={{ ...inputStyle, width: "100%", height: 48 }}
            />
          </div>
        </div>
      )}

      <div
        style={{
          background: C.panel2,
          border: `1px solid ${C.line}`,
          borderRadius: 12,
          padding: "14px 16px",
          margin: "16px 0",
        }}
      >
        <div style={{ color: C.chalk, fontSize: 20, fontWeight: 800, marginBottom: 6 }}>
          {computed.kcal} <span style={{ fontSize: 12, fontWeight: 600, color: C.muted }}>kcal</span>
        </div>
        <div style={{ color: C.dim, fontSize: 12 }}>
          {computed.protein}g proteína · {computed.carbs}g hidratos · {computed.fat}g grasa · {computed.grams}g total
        </div>
      </div>

      <div className="flex gap-2">
        <Btn variant="quiet" onClick={onCancel} style={{ flex: 1 }}>
          Cancelar
        </Btn>
        <Btn
          variant="diet"
          disabled={totalGrams <= 0}
          onClick={() => onConfirm({ ...computed, foodId: food.id, name: food.name, emoji: food.emoji })}
          style={{ flex: 1 }}
        >
          Añadir
        </Btn>
      </div>
    </div>
  );
}

function CustomFoodForm({ onCancel, onSave }) {
  const [name, setName] = useState("");
  const [kcal100, setKcal100] = useState("");
  const [protein100, setProtein100] = useState("");
  const [carbs100, setCarbs100] = useState("");
  const [fat100, setFat100] = useState("");

  const valid =
    name.trim().length > 0 &&
    [kcal100, protein100, carbs100, fat100].every((v) => v !== "" && Number(v) >= 0 && Number.isFinite(Number(v)));

  const inputStyle = {
    width: "100%",
    background: C.panel2,
    border: `1px solid ${C.line}`,
    borderRadius: 11,
    padding: "12px 14px",
    color: C.chalk,
    fontSize: 16,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: FONT,
  };

  return (
    <div style={{ padding: "4px 18px 18px" }}>
      <Label style={{ marginBottom: 6 }}>Nombre *</Label>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ej. Tortilla de la abuela"
        style={{ ...inputStyle, marginBottom: 14 }}
      />
      <Label style={{ marginBottom: 6 }}>Por cada 100 g</Label>
      <div className="flex gap-2" style={{ marginBottom: 16 }}>
        {[
          ["kcal", kcal100, setKcal100],
          ["Prot g", protein100, setProtein100],
          ["Carbs g", carbs100, setCarbs100],
          ["Grasa g", fat100, setFat100],
        ].map(([ph, val, set]) => (
          <input
            key={ph}
            value={val}
            onChange={(e) => set(e.target.value.replace(/[^\d.]/g, ""))}
            inputMode="decimal"
            placeholder={ph}
            style={{ ...inputStyle, textAlign: "center", padding: "10px 4px" }}
          />
        ))}
      </div>
      <div className="flex gap-2">
        <Btn variant="quiet" onClick={onCancel} style={{ flex: 1 }}>
          Cancelar
        </Btn>
        <Btn
          variant="diet"
          disabled={!valid}
          onClick={() =>
            onSave({
              id: uid("food-custom"),
              source: "custom",
              name: name.trim(),
              brand: "",
              emoji: emojiForFood([], name),
              kcal100: Number(kcal100),
              protein100: Number(protein100),
              carbs100: Number(carbs100),
              fat100: Number(fat100),
            })
          }
          style={{ flex: 1 }}
        >
          Guardar
        </Btn>
      </div>
    </div>
  );
}

const hasCamera = () =>
  typeof navigator !== "undefined" && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

/* Cámara + lectura de código de barras con @zxing/browser, cargado con
   import() dinámico para no meter la librería en el bundle principal (solo
   hace falta si el usuario llega a abrir el escáner). facingMode:
   "environment" (no exact) para pedir la cámara trasera en el móvil sin
   reventar en portátiles que solo tienen webcam frontal. */
function BarcodeScanner({ onDetect, onCancel }) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState("starting"); // starting | scanning | denied | error

  useEffect(() => {
    let controls = null;
    let done = false;
    (async () => {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const reader = new BrowserMultiFormatReader();
        // El callback recibe sus propios `controls` (3er argumento) porque
        // puede dispararse antes de que esta promesa resuelva y asigne la
        // variable de fuera — usar esa closure en vez del `c` externo evita
        // un ReferenceError (TDZ) que abortaba onDetect en silencio cuando
        // la detección era casi instantánea.
        const c = await reader.decodeFromConstraints(
          { video: { facingMode: "environment" } },
          videoRef.current,
          (result, _err, ctl) => {
            if (result && !done) {
              done = true;
              ctl.stop();
              onDetect(result.getText());
            }
          }
        );
        if (done) {
          c.stop();
          return;
        }
        controls = c;
        setStatus("scanning");
      } catch (e) {
        if (!done) setStatus(e && e.name === "NotAllowedError" ? "denied" : "error");
      }
    })();
    return () => {
      done = true;
      controls?.stop();
    };
  }, [onDetect]);

  return (
    <div style={{ padding: "4px 18px 18px" }}>
      <div
        style={{
          position: "relative",
          borderRadius: 16,
          overflow: "hidden",
          background: C.panel2,
          aspectRatio: "3 / 4",
          marginBottom: 14,
        }}
      >
        <video
          ref={videoRef}
          muted
          playsInline
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        {status === "scanning" && (
          <div
            style={{
              position: "absolute",
              inset: "18% 10%",
              border: `2px solid ${C.dietAccent}`,
              borderRadius: 14,
              boxShadow: "0 0 0 999px rgba(0,0,0,0.35)",
            }}
          />
        )}
        {(status === "starting" || status === "denied" || status === "error") && (
          <div
            className="flex items-center justify-center"
            style={{ position: "absolute", inset: 0, padding: 20, textAlign: "center" }}
          >
            <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, margin: 0 }}>
              {status === "starting" && "Abriendo la cámara…"}
              {status === "denied" &&
                "Permiso de cámara denegado. Puedes activarlo en Ajustes del teléfono, o escribir el código a mano."}
              {status === "error" && "No se pudo acceder a la cámara. Puedes escribir el código a mano."}
            </p>
          </div>
        )}
      </div>
      <p style={{ color: C.muted, fontSize: 13, textAlign: "center", margin: "0 0 16px" }}>
        Apunta al código de barras del producto.
      </p>
      <Btn variant="quiet" onClick={onCancel}>
        Cancelar
      </Btn>
    </div>
  );
}

function FoodPickerSheet({ meal, recentFoods, onAdd, onSaveRecent, onClose }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // "offline" | "error" | null
  const [selectedFood, setSelectedFood] = useState(null);
  const [creating, setCreating] = useState(false);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const query = q.trim();
    if (!query) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const t = setTimeout(async () => {
      try {
        const items = looksLikeBarcode(query) ? await lookupOffBarcode(query).then((p) => (p ? [p] : [])) : await searchOffFoods(query);
        setResults(items);
      } catch (e) {
        setError(e?.message === "offline" ? "offline" : "error");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 450);
    return () => clearTimeout(t);
  }, [q]);

  const recentList = Object.values(recentFoods || {}).sort((a, b) =>
    (b.lastUsed || "").localeCompare(a.lastUsed || "")
  );

  const title = creating
    ? "Alimento propio"
    : selectedFood
    ? "Cantidad"
    : scanning
    ? "Escanear código de barras"
    : `Añadir a ${meal}`;

  const handlePick = (food) => setSelectedFood(food);
  const handleConfirmQuantity = (entry) => {
    onSaveRecent(selectedFood);
    onAdd(entry);
  };
  const handleBarcodeDetected = useCallback((code) => {
    setScanning(false);
    setQ(code);
  }, []);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(5,5,6,0.86)",
        zIndex: 60,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 520,
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          background: C.ink,
          borderRadius: "22px 22px 0 0",
          borderTop: `1px solid ${C.line2}`,
          paddingBottom: "calc(18px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div style={{ width: 40, height: 4, background: C.line2, borderRadius: 4, margin: "10px auto 4px", flexShrink: 0 }} />

        <div className="flex items-center justify-between" style={{ padding: "8px 18px 10px", flexShrink: 0 }}>
          <Label>{title}</Label>
          {(selectedFood || creating || scanning) && (
            <button
              onClick={() => {
                setSelectedFood(null);
                setCreating(false);
                setScanning(false);
              }}
              style={{
                background: "none",
                border: "none",
                color: C.dietAccent,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                padding: 0,
                fontFamily: FONT,
              }}
            >
              ← Volver
            </button>
          )}
        </div>

        {selectedFood ? (
          <FoodQuantityPicker food={selectedFood} onCancel={() => setSelectedFood(null)} onConfirm={handleConfirmQuantity} />
        ) : creating ? (
          <CustomFoodForm
            onCancel={() => setCreating(false)}
            onSave={(f) => {
              setCreating(false);
              handlePick(f);
            }}
          />
        ) : scanning ? (
          <BarcodeScanner onDetect={handleBarcodeDetected} onCancel={() => setScanning(false)} />
        ) : (
          <>
            <div style={{ padding: "0 18px 12px", flexShrink: 0 }}>
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar alimento o pegar código de barras…"
                style={{
                  width: "100%",
                  background: C.panel2,
                  border: `1px solid ${C.line}`,
                  borderRadius: 11,
                  padding: "12px 14px",
                  color: C.chalk,
                  fontSize: 16,
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: FONT,
                  marginBottom: 10,
                }}
              />
              <div className="flex gap-2" style={{ width: "100%" }}>
                {hasCamera() && (
                  <button
                    onClick={() => setScanning(true)}
                    className="flex items-center justify-center"
                    style={{
                      flex: 1,
                      background: "transparent",
                      border: `1px dashed ${C.line2}`,
                      borderRadius: 11,
                      padding: "11px 14px",
                      color: C.chalk,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: FONT,
                    }}
                  >
                    📷 Escanear
                  </button>
                )}
                <button
                  onClick={() => setCreating(true)}
                  className="flex items-center justify-center"
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: `1px dashed ${C.line2}`,
                    borderRadius: 11,
                    padding: "11px 14px",
                    color: C.chalk,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: FONT,
                  }}
                >
                  + Crear alimento propio
                </button>
              </div>
            </div>

            <div style={{ overflowY: "auto", padding: "0 18px 8px" }}>
              {!q.trim() && (
                <>
                  <Label style={{ marginBottom: 6 }}>Recientes</Label>
                  {recentList.length === 0 && (
                    <div style={{ color: C.muted, fontSize: 13, padding: "10px 0 20px" }}>
                      Aún no tienes alimentos recientes. Búscalos por nombre o código de barras.
                    </div>
                  )}
                  {recentList.map((f) => (
                    <FoodResultRow key={f.id} food={f} onClick={() => handlePick(f)} />
                  ))}
                </>
              )}

              {q.trim() && loading && (
                <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: "20px 0" }}>Buscando…</div>
              )}
              {q.trim() && !loading && error === "offline" && (
                <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, padding: "12px 0" }}>
                  Sin conexión: no se puede buscar en Open Food Facts ahora mismo. Prueba con un alimento reciente
                  (abajo, si borras la búsqueda) o crea uno propio.
                </div>
              )}
              {q.trim() && !loading && error === "error" && (
                <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, padding: "12px 0" }}>
                  No se pudo completar la búsqueda. Inténtalo de nuevo en unos segundos.
                </div>
              )}
              {q.trim() && !loading && !error && results.length === 0 && (
                <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: "20px 0" }}>
                  Sin resultados para "{q}"
                </div>
              )}
              {q.trim() &&
                !loading &&
                results.map((f) => <FoodResultRow key={f.id} food={f} onClick={() => handlePick(f)} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FoodWeekStrip({ selected, onSelect, food }) {
  const week = useMemo(() => weekOf(selected), [selected]);
  const d0 = fromISO(week[0]);
  const d6 = fromISO(week[6]);
  const monthLabel =
    d0.getMonth() === d6.getMonth()
      ? `${MONTHS[d0.getMonth()]} ${d0.getFullYear()}`
      : `${MONTHS[d0.getMonth()].slice(0, 3)} – ${MONTHS[d6.getMonth()].slice(0, 3)} ${d6.getFullYear()}`;

  const Arrow = ({ dir }) => (
    <button
      onClick={() => onSelect(addDays(selected, dir * 7))}
      style={{ background: "none", border: "none", cursor: "pointer", padding: "6px 10px", lineHeight: 0 }}
      aria-label={dir < 0 ? "Semana anterior" : "Semana siguiente"}
    >
      <svg width="13" height="21" viewBox="0 0 13 21" fill="none">
        <path
          d={dir < 0 ? "M11 2L3 10.5L11 19" : "M2 2L10 10.5L2 19"}
          stroke={C.dietAccent}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );

  return (
    <div style={{ padding: "0 0 14px" }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
        <Arrow dir={-1} />
        <div style={{ color: C.chalk, fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em" }}>{monthLabel}</div>
        <Arrow dir={1} />
      </div>
      <div className="flex" style={{ gap: 6 }}>
        {week.map((dt, i) => {
          const hasFood = MEALS.some((m) => (food[dt]?.[m] || []).length > 0);
          const isSel = dt === selected;
          const isToday = dt === todayISO();
          return (
            <button
              key={dt}
              onClick={() => onSelect(dt)}
              style={{
                flex: 1,
                minWidth: 0,
                aspectRatio: "1 / 1",
                borderRadius: "50%",
                border: `2.5px solid ${isSel ? C.dietAccent : hasFood ? C.dietAccent : C.line}`,
                background: isSel ? C.dietAccent : "transparent",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontFamily: FONT,
                padding: 0,
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 600, color: isSel ? "#fff" : C.muted, lineHeight: 1.3 }}>
                {WD[i]}
              </span>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: isSel ? "#fff" : C.chalk,
                  fontVariantNumeric: "tabular-nums",
                  lineHeight: 1.15,
                  textDecoration: isToday && !isSel ? "underline" : "none",
                  textUnderlineOffset: 2,
                }}
              >
                {fromISO(dt).getDate()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DailyFoodSummary({ consumed, target }) {
  const Bar = ({ label, value, goal }) => {
    const pct = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0;
    return (
      <div style={{ marginBottom: 10 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 5 }}>
          <Label style={{ marginBottom: 0 }}>{label}</Label>
          <span style={{ color: C.chalk, fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
            {value}g / {goal}g
          </span>
        </div>
        <div style={{ height: 6, background: C.line, borderRadius: 3 }}>
          <div style={{ width: `${pct}%`, height: "100%", background: C.dietAccent, borderRadius: 3 }} />
        </div>
      </div>
    );
  };
  return (
    <Panel style={{ padding: 16, marginBottom: 16 }}>
      <div className="flex items-end justify-between" style={{ marginBottom: 14 }}>
        <Label>Consumido</Label>
        <div style={{ color: C.chalk, fontSize: 20, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
          {consumed.kcal}
          <span style={{ fontSize: 12, fontWeight: 600, color: C.muted }}>
            {" "}
            / {target ? target.calories : "—"} kcal
          </span>
        </div>
      </div>
      {target ? (
        <>
          <Bar label="Proteína" value={consumed.protein} goal={target.protein} />
          <Bar label="Hidratos" value={consumed.carbs} goal={target.carbs} />
          <Bar label="Grasa" value={consumed.fat} goal={target.fat} />
        </>
      ) : (
        <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.5, margin: 0 }}>
          Completa la calculadora de arriba para ver tu objetivo diario junto al consumo.
        </p>
      )}
    </Panel>
  );
}

function MealCard({ meal, items, onAdd, onDeleteItem }) {
  const totals = items.reduce(
    (a, it) => ({
      kcal: a.kcal + it.kcal,
      protein: a.protein + it.protein,
      carbs: a.carbs + it.carbs,
      fat: a.fat + it.fat,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );
  return (
    <Panel style={{ padding: 16, marginBottom: 12 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: items.length ? 10 : 0 }}>
        <div>
          <div style={{ color: C.chalk, fontSize: 15, fontWeight: 700 }}>{meal}</div>
          <div style={{ color: C.dim, fontSize: 12, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>
            {Math.round(totals.kcal)} kcal · {Math.round(totals.protein)}P {Math.round(totals.carbs)}C{" "}
            {Math.round(totals.fat)}G
          </div>
        </div>
        <button
          onClick={onAdd}
          aria-label={`Añadir a ${meal}`}
          style={{
            width: 32,
            height: 32,
            flexShrink: 0,
            borderRadius: "50%",
            background: C.dietAccent,
            color: "#fff",
            border: "none",
            fontSize: 18,
            lineHeight: 1,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          +
        </button>
      </div>
      {items.map((it) => (
        <div
          key={it.id}
          className="flex items-center"
          style={{ gap: 10, padding: "9px 0", borderTop: `1px solid ${C.line}` }}
        >
          <span style={{ fontSize: 18, flexShrink: 0 }}>{it.emoji}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                color: C.chalk,
                fontSize: 13,
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {it.name}
            </div>
            <div style={{ color: C.dim, fontSize: 11, marginTop: 1 }}>
              {it.grams}g · {it.kcal} kcal
            </div>
          </div>
          <button
            onClick={() => onDeleteItem(it.id)}
            aria-label={`Quitar ${it.name}`}
            style={{ background: "none", border: "none", color: C.dim, cursor: "pointer", padding: 4, fontSize: 13 }}
          >
            ✕
          </button>
        </div>
      ))}
    </Panel>
  );
}

function FoodDiary({ food, foods, schedule, nutrition, onLogFood, onDeleteFoodItem, onSaveRecentFood }) {
  const [selected, setSelected] = useState(todayISO());
  const [addingMeal, setAddingMeal] = useState(null);

  const dayLog = food[selected] || {};
  const consumed = sumDayMacros(dayLog);
  const dayId = dayIdFor(selected, schedule);
  const targets = nutrition.profile ? computeNutritionTargets(nutrition.profile, nutrition.adjustment) : null;
  const dayTarget = targets ? (dayId ? targets.training : targets.rest) : null;

  return (
    <div>
      <FoodWeekStrip selected={selected} onSelect={setSelected} food={food} />
      <DailyFoodSummary consumed={consumed} target={dayTarget} />
      {MEALS.map((meal) => (
        <MealCard
          key={meal}
          meal={meal}
          items={dayLog[meal] || []}
          onAdd={() => setAddingMeal(meal)}
          onDeleteItem={(itemId) => onDeleteFoodItem(selected, meal, itemId)}
        />
      ))}
      {addingMeal && (
        <FoodPickerSheet
          meal={addingMeal}
          recentFoods={foods}
          onSaveRecent={onSaveRecentFood}
          onAdd={(entry) => {
            onLogFood(selected, addingMeal, entry);
            setAddingMeal(null);
          }}
          onClose={() => setAddingMeal(null)}
        />
      )}
    </div>
  );
}

function DietaView({
  nutrition,
  schedule,
  onSaveProfile,
  onLogWeight,
  onDeleteWeight,
  onApplyAdjustment,
  onSetMealCount,
  food,
  foods,
  onLogFood,
  onDeleteFoodItem,
  onSaveRecentFood,
}) {
  const [editing, setEditing] = useState(false);
  const { profile, weights, adjustment, mealCount } = nutrition;
  const targets = profile ? computeNutritionTargets(profile, adjustment) : null;
  const isTrainingToday = !!dayIdFor(todayISO(), schedule);
  const suggestion = profile ? getCalorieAdjustmentSuggestion(profile, weights, adjustment) : null;

  return (
    <div style={{ padding: "26px 18px 30px", paddingTop: "calc(26px + env(safe-area-inset-top, 0px))" }}>
      <Label>Dieta</Label>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: C.chalk, margin: "6px 0 22px", letterSpacing: "-0.03em" }}>
        Calorías y peso
      </h1>

      {!profile || editing ? (
        <Panel style={{ padding: 18, marginBottom: 16 }}>
          <Label style={{ marginBottom: 12 }}>{profile ? "Editar datos" : "Tus datos"}</Label>
          <NutritionForm
            initial={profile}
            onCancel={() => setEditing(false)}
            onSave={(data) => {
              onSaveProfile(data);
              setEditing(false);
            }}
          />
        </Panel>
      ) : (
        <>
          <Panel style={{ padding: 16, marginBottom: 16 }}>
            <div className="flex items-center justify-between">
              <div style={{ minWidth: 0 }}>
                <Label>
                  {ACTIVITY_LABELS[profile.activity]} · {GOAL_LABELS[profile.goal]}
                </Label>
                <div style={{ color: C.chalk, fontSize: 14, fontWeight: 600, marginTop: 4 }}>
                  {profile.sex === "m" ? "Hombre" : "Mujer"} · {profile.age} años · {profile.heightCm} cm ·{" "}
                  {profile.weightKg} kg
                </div>
              </div>
              <button
                onClick={() => setEditing(true)}
                style={{
                  background: "none",
                  border: "none",
                  color: C.dietAccent,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: FONT,
                  flexShrink: 0,
                }}
              >
                Editar
              </button>
            </div>
          </Panel>

          <NutritionResultCard targets={targets} isTrainingToday={isTrainingToday} />
          <SafetyLimitNotice targets={targets} />
        </>
      )}

      <Label style={{ marginBottom: 12 }}>Registro de comidas</Label>
      <FoodDiary
        food={food}
        foods={foods}
        schedule={schedule}
        nutrition={nutrition}
        onLogFood={onLogFood}
        onDeleteFoodItem={onDeleteFoodItem}
        onSaveRecentFood={onSaveRecentFood}
      />

      {profile && !editing && (
        <>
          <MealSplitCard
            targets={targets}
            isTrainingToday={isTrainingToday}
            mealCount={mealCount || 4}
            onSetMealCount={onSetMealCount}
          />
          {suggestion && <AdjustmentSuggestionCard suggestion={suggestion} onApply={onApplyAdjustment} />}
        </>
      )}

      <Label style={{ marginBottom: 12 }}>Seguimiento de peso</Label>
      <WeightLogForm onLogWeight={onLogWeight} />
      <WeightHistorySection weights={weights} onDeleteWeight={onDeleteWeight} />
    </div>
  );
}

/* ============================================================================
   19. APP
   ========================================================================== */
export default function App() {
  const [ready, setReady] = useState(false);
  const [view, setView] = useState("rutina");
  const [selected, setSelected] = useState(todayISO());
  const [log, setLog] = useState({});
  const [videos, setVideos] = useState(EXERCISE_VIDEOS);
  const [media, setMedia] = useState({});
  const [schedule, setSchedule] = useState({});
  const [session, setSession] = useState(null);
  const [training, setTraining] = useState(false);
  const [sheet, setSheet] = useState(null);
  const [swaps, setSwaps] = useState({});
  const [customExercises, setCustomExercises] = useState({});
  const [nutrition, setNutrition] = useState(NUTRITION_DEFAULT);
  const [food, setFood] = useState({});
  const [foods, setFoods] = useState({});

  useEffect(() => {
    (async () => {
      const [l, cfg, ses, md, sw, cex, nut, fd, fds] = await Promise.all([
        loadKey(K_LOG, {}),
        loadKey(K_CFG, {}),
        loadKey(K_SESSION, null),
        loadKey(K_MEDIA, {}),
        loadKey(K_SWAPS, {}),
        loadKey(K_EXERCISES, {}),
        loadKey(K_NUTRITION, NUTRITION_DEFAULT),
        loadKey(K_FOOD, {}),
        loadKey(K_FOODS, {}),
      ]);
      setLog(l || {});
      setMedia(md || {});
      if (cfg?.videos) {
        const merged = { ...EXERCISE_VIDEOS };
        Object.entries(cfg.videos).forEach(([k, v]) => {
          merged[k] = { provider: "youtube", videoId: v };
        });
        setVideos(merged);
      }
      if (cfg?.schedule) setSchedule(cfg.schedule);
      if (ses) setSession(ses);
      setSwaps(sw || {});
      setCustomExercises(cex || {});
      setNutrition(nut || NUTRITION_DEFAULT);
      setFood(fd || {});
      setFoods(fds || {});
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (ready && session) saveKey(K_SESSION, session);
  }, [session, ready]);

  const setVideo = useCallback(async (exId, videoId) => {
    setVideos((v) => ({ ...v, [exId]: { provider: "youtube", videoId } }));
    const cfg = await loadKey(K_CFG, {});
    saveKey(K_CFG, { ...cfg, videos: { ...(cfg.videos || {}), [exId]: videoId } });
  }, []);

  const setMediaFor = useCallback(async (exId, file) => {
    if (!file) {
      setMedia((m) => {
        const next = { ...m };
        delete next[exId];
        saveKey(K_MEDIA, next);
        return next;
      });
      return;
    }
    const dataUrl = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
    setMedia((m) => {
      const next = { ...m, [exId]: dataUrl };
      saveKey(K_MEDIA, next);
      return next;
    });
  }, []);

  const setDayForDate = useCallback(async (dateISO, dayId) => {
    setSchedule((sc) => {
      const next = { ...sc, [dateISO]: dayId };
      loadKey(K_CFG, {}).then((cfg) => saveKey(K_CFG, { ...cfg, schedule: next }));
      return next;
    });
  }, []);

  const setExerciseSwap = useCallback((dayId, index, exId) => {
    setSwaps((prev) => {
      const key = swapKey(dayId, index);
      const next = { ...prev };
      if (exId) next[key] = exId;
      else delete next[key];
      saveKey(K_SWAPS, next);
      return next;
    });
  }, []);

  const createExercise = useCallback((data) => {
    const id = `custom-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const ex = normalizeExercise({
      id,
      custom: true,
      name: data.name.trim(),
      short: data.name.trim(),
      muscleGroup: data.muscleGroup,
      howTo: (data.howTo || "").trim(),
    });
    setCustomExercises((prev) => {
      const next = { ...prev, [id]: ex };
      saveKey(K_EXERCISES, next);
      return next;
    });
    return id;
  }, []);

  const updateExercise = useCallback((id, data) => {
    setCustomExercises((prev) => {
      if (!prev[id]) return prev;
      const next = {
        ...prev,
        [id]: {
          ...prev[id],
          name: data.name.trim(),
          short: data.name.trim(),
          muscleGroup: data.muscleGroup,
          howTo: (data.howTo || "").trim(),
        },
      };
      saveKey(K_EXERCISES, next);
      return next;
    });
  }, []);

  const deleteExercise = useCallback((id) => {
    setCustomExercises((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      saveKey(K_EXERCISES, next);
      return next;
    });
    setSwaps((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        if (next[k] === id) {
          delete next[k];
          changed = true;
        }
      }
      if (changed) saveKey(K_SWAPS, next);
      return changed ? next : prev;
    });
  }, []);

  const logWeight = useCallback((weight, dateISO) => {
    setNutrition((prev) => {
      const next = { ...prev, weights: upsertWeightEntry(prev.weights, dateISO, weight) };
      saveKey(K_NUTRITION, next);
      return next;
    });
  }, []);

  const deleteWeight = useCallback((dateISO) => {
    setNutrition((prev) => {
      const next = { ...prev, weights: prev.weights.filter((w) => w.date !== dateISO) };
      saveKey(K_NUTRITION, next);
      return next;
    });
  }, []);

  const saveNutritionProfile = useCallback((data) => {
    setNutrition((prev) => {
      const goalChanged = prev.profile && prev.profile.goal !== data.goal;
      const profile = { ...data, updatedAt: todayISO() };
      const next = {
        ...prev,
        profile,
        weights: upsertWeightEntry(prev.weights, todayISO(), data.weightKg),
        adjustment: goalChanged ? null : prev.adjustment,
      };
      saveKey(K_NUTRITION, next);
      return next;
    });
  }, []);

  const applyNutritionAdjustment = useCallback((deltaKcal) => {
    setNutrition((prev) => {
      const next = {
        ...prev,
        adjustment: { amount: (prev.adjustment?.amount || 0) + deltaKcal, appliedAt: todayISO() },
      };
      saveKey(K_NUTRITION, next);
      return next;
    });
  }, []);

  const setMealCount = useCallback((mealCount) => {
    setNutrition((prev) => {
      const next = { ...prev, mealCount };
      saveKey(K_NUTRITION, next);
      return next;
    });
  }, []);

  const logFood = useCallback((dateISO, meal, entry) => {
    setFood((prev) => {
      const day = prev[dateISO] || {};
      const items = day[meal] || [];
      const next = {
        ...prev,
        [dateISO]: { ...day, [meal]: [...items, { ...entry, id: uid("fooditem") }] },
      };
      saveKey(K_FOOD, next);
      return next;
    });
  }, []);

  const deleteFoodItem = useCallback((dateISO, meal, itemId) => {
    setFood((prev) => {
      const day = prev[dateISO];
      if (!day || !day[meal]) return prev;
      const next = {
        ...prev,
        [dateISO]: { ...day, [meal]: day[meal].filter((it) => it.id !== itemId) },
      };
      saveKey(K_FOOD, next);
      return next;
    });
  }, []);

  const saveRecentFood = useCallback((foodItem) => {
    setFoods((prev) => {
      const next = { ...prev, [foodItem.id]: { ...foodItem, lastUsed: todayISO() } };
      saveKey(K_FOODS, next);
      return next;
    });
  }, []);

  const saveSet = useCallback((slot, sets, dateISO) => {
    const date = dateISO || todayISO();
    const clean = sets
      .filter((s) => s.saved && s.reps)
      .map((s) => ({
        weight: Number(s.weight) || 0,
        reps: Number(s.reps) || 0,
        rir: s.rir === "" ? null : Number(s.rir),
      }));
    setLog((prev) => {
      const list = prev[slot.ex] ? [...prev[slot.ex]] : [];
      const entryId = `${date}:${slot.ex}:${slot.repRange[0]}-${slot.repRange[1]}`;
      const i = list.findIndex((h) => h.id === entryId);
      const record = {
        id: entryId,
        date,
        exerciseId: slot.ex,
        repMin: slot.repRange[0],
        repMax: slot.repRange[1],
        sets: clean,
      };
      if (i >= 0) list[i] = record;
      else list.unshift(record);
      list.sort((a, b) => (a.date < b.date ? 1 : -1));
      const next = { ...prev, [slot.ex]: list };
      saveKey(K_LOG, next);
      return next;
    });
  }, []);

  const openExercise = useCallback((dayId, index, dateISO) => {
    setSession((s) => {
      if (s && s.dayId === dayId && s.date === dateISO)
        return { ...s, currentIndex: index, jumpTo: index };
      return { dayId, date: dateISO, entries: {}, currentIndex: index, jumpTo: index };
    });
    setTraining(true);
  }, []);

  const resetAll = async () => {
    setLog({});
    setSession(null);
    await saveKey(K_LOG, {});
    await saveKey(K_SESSION, null);
  };

  const openSheet = (slot, tab = "tecnica") => setSheet({ slot, tab });

  if (!ready)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: C.ink,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FONT,
        }}
      >
        <div style={{ color: C.dim, fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase" }}>
          Cargando
        </div>
      </div>
    );

  const ICONS = {
    inicio: (a) => (
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
        <path d="M3 10.5L12 3l9 7.5" stroke={a} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5.5 9.5V20h13V9.5" stroke={a} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    rutina: (a) => (
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
        <path d="M4 9v6M7 6.5v11M17 6.5v11M20 9v6M7 12h10" stroke={a} strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    ),
    dieta: (a) => (
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
        <path
          d="M6 2.5v6M8.5 2.5v6M6 8.5c0 1.5 1 2.3 2.5 2.3s2.5-.8 2.5-2.3M8.5 10.8V21.5"
          stroke={a}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16.5 2.5c-1.4 0-2.3 1.8-2.3 4.3 0 2 .8 3.6 2.3 4v10.7"
          stroke={a}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    progreso: (a) => (
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
        <path d="M4 20V14M9.3 20V9M14.7 20V11.5M20 20V4" stroke={a} strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    ),
    perfil: (a) => (
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="3.6" stroke={a} strokeWidth="2" />
        <path d="M4.5 20c1.4-3.6 4.2-5.4 7.5-5.4s6.1 1.8 7.5 5.4" stroke={a} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  };
  const nav = [
    ["inicio", "Inicio"],
    ["rutina", "Rutina"],
    ["dieta", "Dieta"],
    ["progreso", "Progreso"],
    ["perfil", "Perfil"],
  ];

  const sessionDay = session ? getEffectiveDay(session.dayId, swaps, customExercises) : null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.ink,
        fontFamily: FONT,
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <div style={{ maxWidth: 520, margin: "0 auto", paddingBottom: training ? 0 : 92 }}>
        {training && session && sessionDay ? (
          <WorkoutScreen
            day={sessionDay}
            session={session}
            setSession={setSession}
            log={log}
            saveSet={saveSet}
            videos={videos}
            media={media}
            onSetVideo={setVideo}
            onExit={() => setTraining(false)}
            openSheet={openSheet}
            customExercises={customExercises}
          />
        ) : (
          <>
            {view === "inicio" && (
              <HomeView
                log={log}
                schedule={schedule}
                swaps={swaps}
                customExercises={customExercises}
                onGo={(dateISO) => {
                  setSelected(dateISO);
                  setView("rutina");
                }}
                onStart={(dayId, dateISO) => openExercise(dayId, 0, dateISO)}
              />
            )}
            {view === "rutina" && (
              <RoutineView
                selected={selected}
                setSelected={setSelected}
                log={log}
                videos={videos}
                media={media}
                schedule={schedule}
                setDayForDate={setDayForDate}
                onOpenExercise={openExercise}
                swaps={swaps}
                onSetExerciseSwap={setExerciseSwap}
                customExercises={customExercises}
                onCreateExercise={createExercise}
                onUpdateExercise={updateExercise}
                onDeleteExercise={deleteExercise}
              />
            )}
            {view === "dieta" && (
              <DietaView
                nutrition={nutrition}
                schedule={schedule}
                onSaveProfile={saveNutritionProfile}
                onLogWeight={logWeight}
                onDeleteWeight={deleteWeight}
                onApplyAdjustment={applyNutritionAdjustment}
                onSetMealCount={setMealCount}
                food={food}
                foods={foods}
                onLogFood={logFood}
                onDeleteFoodItem={deleteFoodItem}
                onSaveRecentFood={saveRecentFood}
              />
            )}
            {view === "progreso" && (
              <HistoryView log={log} openSheet={openSheet} swaps={swaps} customExercises={customExercises} />
            )}
            {view === "perfil" && (
              <SettingsView
                videos={videos}
                media={media}
                onSetVideo={setVideo}
                onSetMedia={setMediaFor}
                onReset={resetAll}
                customExercises={customExercises}
              />
            )}
          </>
        )}
      </div>

      {!training && (
        <nav
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            zIndex: 30,
            padding: "0 12px 22px",
            paddingBottom: "calc(14px + env(safe-area-inset-bottom, 0px))",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              display: "flex",
              width: "100%",
              maxWidth: 460,
              background: "rgba(28,28,30,0.92)",
              backdropFilter: "blur(18px)",
              border: `1px solid ${C.line}`,
              borderRadius: 999,
              padding: "8px 6px",
              pointerEvents: "auto",
            }}
          >
            {nav.map(([k, l]) => {
              const active = view === k;
              const col = active ? C.signal : C.muted;
              return (
                <button
                  key={k}
                  onClick={() => setView(k)}
                  style={{
                    flex: 1,
                    background: active ? "rgba(10,132,255,0.12)" : "none",
                    border: "none",
                    borderRadius: 999,
                    padding: "7px 0 5px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 3,
                    fontFamily: FONT,
                  }}
                >
                  {ICONS[k](col)}
                  <span style={{ color: col, fontSize: 10.5, fontWeight: 600 }}>{l}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {sheet && (
        <ExerciseSheet
          slot={sheet.slot}
          initialTab={sheet.tab}
          videos={videos}
          media={media}
          onSetVideo={setVideo}
          history={log[sheet.slot.ex] || []}
          onClose={() => setSheet(null)}
          customExercises={customExercises}
        />
      )}
    </div>
  );
}
