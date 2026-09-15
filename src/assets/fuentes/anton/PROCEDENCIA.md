# Anton — procedencia

Tipografía de display del tema `velocentum-web/v1` (DH-9): títulos grandes,
portadas, números de sección y frases de impacto, preferentemente en
mayúsculas. Solo la usa la interfaz; el pipeline de PDF sigue en v1 con
Satoshi e Inter hasta F3b.

## Archivos

Provistos por Matías en `.branding-nuevo/fonts/` (el docx del sistema de
diseño los ubica en `public/fonts` del sitio `web-oficial-velocentum`), y
copiados sin modificar el 2026-09-15 (BV4 F2b). Son los subsets `latin` y
`latin-ext` de Google Fonts, en woff2, peso 400 estático.

| Archivo | Bytes | SHA-256 |
|---|---|---|
| `woff2/anton-latin.woff2` | 12004 | `23aab0b2692a0c89eb7997d3c7cf5bda41276d6cd4ab6cc0edc3edfcece32b09` |
| `woff2/anton-latin-ext.woff2` | 21296 | `ae1a8ac1c2899a66eed47a851201bb78a56664bf8da6d34a9ee226582d15ac19` |

Nombre interno: familia `Anton`, subfamilia `Regular`, sin ejes de variación.
Copyright embebido: "Copyright 2020 The Anton Project Authors
(https://github.com/googlefonts/AntonFont.git)".

## Licencia

SIL Open Font License 1.1. El paquete no traía archivo de licencia (ver
"Dependencias verificadas" del contrato). `LICENSE.txt` es el `OFL.txt`
oficial del repositorio de Google Fonts, bajado el 2026-09-15:

- `https://raw.githubusercontent.com/google/fonts/1ac2012c34919f5fa2675aacf723fa98edb30b5f/ofl/anton/OFL.txt`
- commit `1ac2012c34919f5fa2675aacf723fa98edb30b5f` de `google/fonts` (main, 2026-09-15T10:00:07Z)
- SHA-256 de `LICENSE.txt`: `ee67e6ee22790b7929f1a3769ca2801d565c64b5a9096942c1adf5596de9c9e4`

El copyright del `OFL.txt` coincide con el embebido en las fuentes.

## Verificación

Con `fontkit`, el 2026-09-15: entre los dos subsets están los quince glyphs
exigidos (`á é í ó ú ü ñ ¿ ¡ · — † × % $`) y los diez dígitos. `†` (U+2020)
vive en `latin-ext`, como corresponde al rango de ese subset. Anton **no**
declara `tnum` y sus cifras son proporcionales: no va en columnas de cifras.
