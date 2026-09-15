Sesión grande: migración completa del branding. Ejecutá de corrido. Frená sólo si generar-propuestas-f2a.test.ts se pone en rojo. No pushees.

CONTEXTO
El contrato ya adoptó el sistema nuevo: 519ae22 y c9f7c49 enmendaron DH-3 a DH-13 y retiraron crystal. Leé el contrato y el sistema en .branding-nuevo/ antes de empezar. tokens.css manda en los valores; el docx dice cómo se usan.

CORRECCIONES DE MATÍAS sobre lo que reportaste
- Los CTA van en VIOLETA #8A3FFC con texto blanco, no en azul. El azul no llegaba a AA como texto chico (4,45:1) y el violeta da 5,00:1. Enmendá DH-5 con esto.
- El choque capítulo/estado se resuelve así: los acentos como capítulo se usan en portadas, divisores y encabezados de sección, no en el cuerpo. Los estados viven siempre sobre el fondo crema, así que el color hace su trabajo. Dejalo escrito en DH-3.
- Cuando un color se pierda por contraste en algún uso, elegí otro de los cinco acentos que sí funcione y decímelo en el reporte. No inventes colores fuera de la paleta.

QUÉ HACER

1. Los assets al repo. Hoy están en .branding-nuevo/ sin versionar y el contrato ya los cita como fuente. Llevalos a donde corresponda en src/ según la estructura que ya usa el repo para el tema y la marca, y versionalos. Las fuentes woff2 también.

2. El tema nuevo reemplaza a velocentum-crystal/v1. Los tokens de tokens.css como fuente de los valores, más navy #0F2050 que el docx pide y tokens.css no trae. El tema viejo sale, con sus tests de contraste: reemplazalos por los del tema nuevo, no los borres sin más.

3. La herramienta usa el tema nuevo. Todas las pantallas: listado, formulario y las cinco pestañas del detalle. Tipografías: Anton para display, Manrope para texto, Geist Mono para labels y datos técnicos.

4. Lo que NO se toca en esta sesión: el pipeline de PDF. motor-activo.ts sigue en "v1", Satoshi e Inter siguen en el repo porque v1 las consume, y la cadena v2 queda para F3b. Si algo del tema viejo es consumido por los documentos, dejalo y decímelo.

5. Verificá contraste automáticamente, como hacía el tema viejo. Si algún par no llega a AA, ajustá dentro de la paleta y reportalo.

AL TERMINAR, obligatorio:
- git log --oneline -3 crudo
- git status --short
- Suite completa con el conteo
- Diff crudo
- La lista de dónde tuviste que cambiar un color por contraste, y por cuál
