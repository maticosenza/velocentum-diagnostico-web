# Manrope — procedencia

Tipografía de texto del tema `velocentum-web/v1` (DH-9): cuerpo, tablas,
conclusiones, botones y explicaciones, pesos 400–800. Solo la usa la
interfaz; el pipeline de PDF sigue en v1 con Satoshi e Inter hasta F3b.

## Archivos

Provistos por Matías en `.branding-nuevo/fonts/` (el docx del sistema de
diseño los ubica en `public/fonts` del sitio `web-oficial-velocentum`), y
copiados sin modificar el 2026-09-15 (BV4 F2b). Son los subsets `latin` y
`latin-ext` de Google Fonts, en woff2 **variable** (eje `wght` 200–800).

| Archivo | Bytes | SHA-256 |
|---|---|---|
| `woff2/manrope-latin.woff2` | 24576 | `e310b55a7fd9677f5e3555e6c6c4d064fa1f1d24393f0ddbe217cea12a8c432f` |
| `woff2/manrope-latin-ext.woff2` | 15240 | `ce093b341d9c10658ee1eaa85c5f8042ff3307bc6ccfc5f405616eb437f0009e` |

Nombre interno: `Manrope ExtraLight` (es el nombre de la instancia por
defecto del archivo variable; el CSS declara la familia como `Manrope`).
Copyright embebido: "Copyright 2019 The Manrope Project Authors
(https://github.com/sharanda/manrope)".

## Licencia

SIL Open Font License 1.1. El paquete no traía archivo de licencia (ver
"Dependencias verificadas" del contrato). `LICENSE.txt` es el `OFL.txt`
oficial del repositorio de Google Fonts, bajado el 2026-09-15:

- `https://raw.githubusercontent.com/google/fonts/1ac2012c34919f5fa2675aacf723fa98edb30b5f/ofl/manrope/OFL.txt`
- commit `1ac2012c34919f5fa2675aacf723fa98edb30b5f` de `google/fonts` (main, 2026-09-15T10:00:07Z)
- SHA-256 de `LICENSE.txt`: `e01b637272e0cbdfb240184dd98ea5cc671556d9894dae2668d92ab2c906787c`

Diferencia registrada, sin inventar nada: el `OFL.txt` dice "Copyright 2018"
y el archivo de fuente dice "Copyright 2019"; mismo titular y mismo
repositorio. Se conserva el `OFL.txt` tal como lo publica Google Fonts.

## Verificación

Con `fontkit`, el 2026-09-15: entre los dos subsets están los quince glyphs
exigidos (`á é í ó ú ü ñ ¿ ¡ · — † × % $`) y los diez dígitos; `†` vive en
`latin-ext`. Manrope **sí** declara `tnum`: las cifras de tablas y métricas
(`tabular-nums`) quedan alineadas en columna.
