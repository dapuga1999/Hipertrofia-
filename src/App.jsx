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
};

/* Catálogo agrupado por grupo muscular, en el mismo orden que WARMUP.
   Lo usa el selector de sustitución de ejercicios. */
const EXERCISES_BY_GROUP = Object.keys(WARMUP).map((group) => ({
  group,
  items: Object.values(EXERCISES).filter((e) => e.muscleGroup === group),
}));

/* ============================================================================
   4. ALMACENAMIENTO
   ========================================================================== */
const K_LOG = "hipertrofia:log:v1";
const K_CFG = "hipertrofia:config:v1";
const K_SESSION = "hipertrofia:session:v1";
const K_MEDIA = "hipertrofia:media:v1";
const K_SWAPS = "hipertrofia:swaps:v1";

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
function getEffectiveDay(dayId, swaps) {
  const day = getDay(dayId);
  if (!day || !swaps) return day;
  let changed = false;
  const slots = day.slots.map((slot, i) => {
    const exId = swaps[swapKey(dayId, i)];
    if (exId && exId !== slot.ex && EXERCISES[exId]) {
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
function ExerciseSheet({ slot, videos, media, onSetVideo, history, onClose, initialTab = "tecnica" }) {
  const ex = EXERCISES[slot.ex];
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
        <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.55, margin: "0 0 18px" }}>{ex.howTo}</p>

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
            <Section title="Músculos principales">
              <List items={ex.primary} marker="●" />
              {ex.secondary.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <Label style={{ marginBottom: 8 }}>Secundarios</Label>
                  <List items={ex.secondary} marker="○" />
                </div>
              )}
            </Section>
            <Section title="Posición inicial">
              <List items={ex.setup} />
            </Section>
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
            <Section title="Si no puedes hacerlo">
              <List items={ex.alternatives} marker="↳" />
            </Section>
          </>
        )}

        {tab === "errores" && (
          <Section title="Errores frecuentes">
            {ex.mistakes.map((m, i) => (
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
            ))}
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
function Chart({ data, metric }) {
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
      <path d={area} fill={C.signal} opacity="0.08" />
      <path d={path} fill="none" stroke={C.signal} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="3" fill={C.ink} stroke={C.signal} strokeWidth="2" />
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
function WorkoutScreen({ day, session, setSession, log, saveSet, videos, media, onSetVideo, onExit, openSheet }) {
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
  const ex = EXERCISES[slot.ex];
  const key = `${idx}:${slot.ex}`;
  const entry = session.entries[key] || { sets: [], warmup: null };
  const history = log[slot.ex] || [];
  const prog = getProgression(history, slot.repRange);

  const prevGroup = idx > 0 ? EXERCISES[day.slots[idx - 1].ex].muscleGroup : null;
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
function HomeView({ log, schedule, swaps, onGo, onStart }) {
  const today = todayISO();
  const week = weekOf(today);
  const dayId = dayIdFor(today, schedule);
  const day = getEffectiveDay(dayId, swaps);
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
function WeekStrip({ selected, onSelect, log, schedule, swaps }) {
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
          const day = getEffectiveDay(dayId, swaps);
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

function ExerciseRow({ slot, index, videos, media, log, dateISO, isSwapped, onOpen, onToggle, onSwap }) {
  const ex = EXERCISES[slot.ex];
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
function ExerciseSwapSheet({ currentExId, originalExId, onPick, onRestore, onClose }) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const groups = query
    ? EXERCISES_BY_GROUP.map((g) => ({
        ...g,
        items: g.items.filter(
          (e) => e.name.toLowerCase().includes(query) || e.muscleGroup.toLowerCase().includes(query)
        ),
      })).filter((g) => g.items.length)
    : EXERCISES_BY_GROUP;

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

        <div style={{ padding: "8px 18px 14px", flexShrink: 0 }}>
          <Label style={{ marginBottom: 10 }}>Sustituir ejercicio</Label>
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
              marginBottom: originalExId && currentExId !== originalExId ? 10 : 0,
            }}
          />
          {originalExId && currentExId !== originalExId && (
            <button
              onClick={onRestore}
              className="w-full"
              style={{
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
              ↺ Restaurar {EXERCISES[originalExId]?.short || "original"}
            </button>
          )}
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
                      <button
                        key={e.id}
                        onClick={() => onPick(e.id)}
                        className="flex items-center justify-between w-full"
                        style={{
                          background: active ? C.panel2 : "transparent",
                          border: `1px solid ${active ? C.signal : C.line}`,
                          borderRadius: 12,
                          padding: "13px 14px",
                          marginBottom: 7,
                          cursor: "pointer",
                          fontFamily: FONT,
                          textAlign: "left",
                        }}
                      >
                        <span style={{ color: C.chalk, fontSize: 14, fontWeight: 600 }}>{e.name}</span>
                        {active && <span style={{ color: C.signal, fontSize: 13 }}>●</span>}
                      </button>
                    );
                  })}
                </div>
              )
          )}
        </div>
      </div>
    </div>
  );
}

function RoutineView({ selected, setSelected, log, videos, media, schedule, setDayForDate, onOpenExercise, swaps, onSetExerciseSwap }) {
  const [picking, setPicking] = useState(false);
  const [swapIndex, setSwapIndex] = useState(null);
  const dayId = dayIdFor(selected, schedule);
  const rawDay = getDay(dayId);
  const day = getEffectiveDay(dayId, swaps);
  const p = dayProgress(log, day, selected);
  const d = fromISO(selected);
  const dateLabel = `${WD[(d.getDay() + 6) % 7]}. ${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1
  ).padStart(2, "0")}`;

  return (
    <div>
      <div style={{ position: "sticky", top: 0, zIndex: 20, background: C.ink }}>
        <WeekStrip selected={selected} onSelect={setSelected} log={log} schedule={schedule} swaps={swaps} />
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
          onPick={(exId) => {
            onSetExerciseSwap(dayId, swapIndex, exId);
            setSwapIndex(null);
          }}
          onRestore={() => {
            onSetExerciseSwap(dayId, swapIndex, null);
            setSwapIndex(null);
          }}
          onClose={() => setSwapIndex(null)}
        />
      )}
    </div>
  );
}

/* ============================================================================
   17. HISTORIAL GLOBAL
   ========================================================================== */
function HistoryView({ log, openSheet }) {
  const entries = Object.keys(EXERCISES)
    .map((id) => ({ id, history: log[id] || [] }))
    .filter((e) => e.history.length)
    .sort((a, b) => (a.history[0].date < b.history[0].date ? 1 : -1));

  const slotFor = (exId) => {
    for (const d of DAYS) {
      const s = d.slots.find((x) => x.ex === exId);
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
        const slot = slotFor(id);
        const prog = getProgression(history, slot.repRange);
        const last = history[0];
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
                <div style={{ color: C.chalk, fontSize: 14, fontWeight: 700 }}>{EXERCISES[id].name}</div>
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
function SettingsView({ videos, media, onSetVideo, onSetMedia, onReset }) {
  const [confirm, setConfirm] = useState(false);
  const missing = Object.keys(EXERCISES).filter((id) => !(videos[id] && videos[id].videoId)).length;
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
          {Object.keys(media).length} / {Object.keys(EXERCISES).length}
        </div>
        <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.55, margin: "0 0 4px" }}>
          Guarda un GIF o imagen para cada ejercicio desde el carrete del móvil. Ocupado: {mediaKB} KB
          de unos 4.500 disponibles.
        </p>
      </Panel>

      <Panel style={{ padding: 17, marginBottom: 18 }}>
        <Label>Vídeos pendientes</Label>
        <div style={{ color: C.chalk, fontSize: 26, fontWeight: 800, margin: "6px 0 6px", fontVariantNumeric: "tabular-nums" }}>
          {missing} / {Object.keys(EXERCISES).length}
        </div>
        <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.55, margin: 0 }}>
          Pega el enlace de YouTube de cada ejercicio. Se guarda en el dispositivo y sustituye al valor del
          archivo de configuración.
        </p>
      </Panel>

      {Object.values(EXERCISES).map((ex) => {
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

  useEffect(() => {
    (async () => {
      const [l, cfg, ses, md, sw] = await Promise.all([
        loadKey(K_LOG, {}),
        loadKey(K_CFG, {}),
        loadKey(K_SESSION, null),
        loadKey(K_MEDIA, {}),
        loadKey(K_SWAPS, {}),
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
    ["progreso", "Progreso"],
    ["perfil", "Perfil"],
  ];

  const sessionDay = session ? getEffectiveDay(session.dayId, swaps) : null;

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
          />
        ) : (
          <>
            {view === "inicio" && (
              <HomeView
                log={log}
                schedule={schedule}
                swaps={swaps}
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
              />
            )}
            {view === "progreso" && <HistoryView log={log} openSheet={openSheet} />}
            {view === "perfil" && (
              <SettingsView
                videos={videos}
                media={media}
                onSetVideo={setVideo}
                onSetMedia={setMediaFor}
                onReset={resetAll}
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
        />
      )}
    </div>
  );
}
