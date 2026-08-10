# Ilustraciones y animaciones

La app busca los archivos por el identificador del ejercicio, en este orden,
y usa el primero que encuentre:

    animations/<id>.webp        Animación en bucle (WebP animado, fondo transparente)
    poses/<id>-start.webp
    poses/<id>-peak.webp        Dos poses: la app las alterna cada 900 ms

Si no hay ninguno, cae en la miniatura del vídeo de YouTube configurado.

## Identificadores

incline-dumbbell-curl        Curl inclinado con mancuernas
preacher-curl                Curl predicador
incline-dumbbell-press       Press inclinado con mancuernas
machine-chest-press          Press plano en máquina
cable-fly                    Aperturas en polea
lateral-raise                Elevaciones laterales
reverse-pec-deck             Reverse pec deck
overhead-triceps-extension   Extensión de tríceps por encima de la cabeza
triceps-pressdown            Pressdown en polea
unilateral-triceps-extension Extensión unilateral de tríceps
lat-pulldown                 Jalón al pecho
chest-supported-row          Remo con pecho apoyado
unilateral-cable-row         Remo unilateral en polea
cable-pullover               Pullover en polea
pullup-neutral-pulldown      Dominadas o jalón neutro
machine-row                  Remo en máquina
hip-abduction                Abducción en máquina
lying-leg-curl               Curl femoral tumbado
leg-extension                Extensión de cuádriceps
hack-squat                   Hack squat
romanian-deadlift            Peso muerto rumano
calf-raise                   Gemelos

## Si usas el tier gratuito de RepDB

Es obligatorio mostrar una atribución visible: "Exercise data by RepDB
(repdb.co)". Ponla en la pantalla de Perfil de la app o en el pie de la web.
El tier gratuito trae ilustraciones planas (poses de inicio y pico), no
animaciones en bucle: usa la carpeta `poses/` y la app las animará alternándolas.
