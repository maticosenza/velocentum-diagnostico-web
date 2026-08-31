# Geist Mono — procedencia

Origen: **repositorio oficial de Vercel**, `github.com/vercel/geist-font`.
No se usó ningún CDN, espejo, paquete npm ni conversor intermedio.

- Release: **v1.7.2**, publicada 2026-06-01T14:49:59Z
- Artefacto: `geist-font-v1.7.2.zip`, 8 207 303 bytes
- URL:
  `https://github.com/vercel/geist-font/releases/download/v1.7.2/geist-font-v1.7.2.zip`
- SHA-256 del ZIP:
  `7fc800d2ac6b92844895196e5041aca55d814c15db70c44f79b3b83ab82b04e2`
- Descargado el 2026-08-31 (BV4 F1, etapa 3)

## Qué se commiteó y qué no

Del ZIP se toman **cuatro archivos estáticos OTF** de `GeistMono/otf/`
—Regular, Medium, SemiBold, Bold, todos romanos— y `OFL.txt`, que se
commitea como `LICENSE.txt` junto a las fuentes.

Los cuatro pesos son los que el rol del token mono necesita (labels, estados,
identificadores, microcopy técnico) y siguen el mismo criterio con el que ya
se registró Inter: pesos romanos, sin itálicas. Sumar un peso es agregar una
línea en `registrar-fuentes.ts` y regenerar el archivo de datos — pero hay
que hacerlo explícitamente: `@react-pdf/renderer` **no degrada** al peso más
cercano, lanza `"Could not resolve font for …"` en tiempo de ejecución.

No entran al repositorio, y están disponibles en la misma release si F2/F3
los necesita: las variantes itálicas, los TTF estáticos, los `webfonts/`
(woff2), los archivos variables `GeistMono[wght].ttf`, y las familias `Geist`
y `GeistPixel`.

## Licencia

SIL Open Font License 1.1 — "Copyright 2024 The Geist Project Authors
(https://github.com/vercel/geist-font)". Permite embeber y redistribuir con
software libremente. Es la misma licencia bajo la que ya está Inter en este
repositorio.

## Verificación de los archivos commiteados

| Archivo | Bytes | SHA-256 |
|---|---|---|
| `GeistMono-Regular.otf` | 171952 | `1901cc38fc520e53a6ab4f19528f32cf7228dfcac676466377ca0816de03b49c` |
| `GeistMono-Medium.otf` | 174136 | `24c946d8665495a8eb00bdfc666de2abea785dab3633be628a927f188a055b01` |
| `GeistMono-SemiBold.otf` | 177224 | `d56bfbe7b7f9f7611d6b6b2e36be4badd7a6d2b6521ea826ec5bc734b25ec8d4` |
| `GeistMono-Bold.otf` | 179720 | `7338b63c209b5d01cba6beb6f0ac3cae48ec92d09abd1e909ec3f3ad9057c376` |

Verificado con `fontkit` el 2026-08-31, sobre los cuatro archivos:

- Los **quince glyphs** exigidos (`á é í ó ú ü ñ ¿ ¡ · — † × % $`) están
  presentes en los cuatro. 1 159 glyphs por archivo, `unitsPerEm` 1000.
- Los diez dígitos están presentes en los cuatro.
- **Dígitos tabulares: garantizados por construcción.** Geist Mono es
  monoespaciada real — el avance es 600/1000 para todos los caracteres
  medidos (`0-9`, `abc`, `XYZ`, `.,:-`), un único valor. Por eso **no
  declara la feature OpenType `tnum`** y no la necesita: en una
  monoespaciada las cifras ya están alineadas en columna. Es la diferencia
  con Satoshi e Inter, que sí declaran `tnum` porque son proporcionales.
