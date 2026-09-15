# Marca del tema `velocentum-web/v1` — procedencia

Material del sistema de branding que Matías aprobó el 2026-09-15 (contrato
BV4, DH-6, DH-8 y DH-12). Provisto en `.branding-nuevo/Logo/` y
`.branding-nuevo/Formas onduladas/`, y copiado **sin modificar** el
2026-09-15 (BV4 F2b). Los nombres de archivo son los originales, que son los
que cita el contrato.

`src/assets/marca/*.svg` (símbolo y wordmark violeta/blanco) **no** es esto:
son los assets de la cadena documental v1 (`renderers/pdf/marca.tsx`,
`renderers/web/document-renderer.tsx`) y quedan como están hasta F3b.

## Logo (`logo/`)

| Archivo | Uso (DH-8) | SHA-256 |
|---|---|---|
| `velocentum-logotipo-negro.png` | Wordmark sobre fondos claros. 2117×743, con margen transparente | `7f2d36230abcf2705d86876f327e757e4ce894f99ad562c1fd423e0a5cbca5ed` |
| `velocentum-logotipo-blanco-tight.png` | Wordmark sobre navy, tinta u oscuros. 1933×299, recortado a la tinta | `4d0f6a4c4f68bb54c3df5a0b19f43387cd2fc54b6f6c8c3cb90a7a419ac26118` |
| `velocentum-v-bicolor.svg` | Isotipo, encuadre cuadrado: portada, redes, exportaciones, favicon | `c18cfbe3c57ac5809e2ba3218338666704b9ef28d987c9f8bd1f8a24caf6ce61` |
| `velocentum-v-bicolor-ui.svg` | Isotipo, viewBox recortado para espacios chicos | `0b26193055895677f378e25a2ddf8066857d67c945e1ec640b450b532ad22138` |
| `velocentum-v-fondo-negro.svg` | No es variante de la herramienta (DH-8) | `c7744318ef13811abdd600fb1aaf5aafd0e64ffdb103a743cae2c97d551bd988` |
| `velocentum-v-fondo-negro.png` | Ídem, raster 1254×1254 | `ba88864417ffefbea3804ee5b5933e0a688569d5b57cff51d551e19f3b051d6a` |
| `velocentum-v-fondo-negro.jpg` | Ídem, raster 1254×1254 | `dca30d123dc37b74de0705cbcabc8800d417f3388492de948003339f1cfa2f56` |
| `Foto IG.png` | No es variante de la herramienta (DH-8). 1080×1080 | `299eab6ddfacbd991825ce3b879022dc6af0fa8f90819c16a4fea6d4ceb1ebfe` |

Los degradados de la V (`#FF512C`, `#FC4D27`, `#8139F8`, `#7432E8`) son
material interno de los SVG y no generan tokens (DH-7).

El wordmark solo existe en PNG; el SVG es dependencia de F3b y no se
vectoriza por cuenta propia (contrato, "Dependencias verificadas").

## Formas onduladas (`formas-onduladas/`)

| Archivo | Uso (DH-12) | SHA-256 |
|---|---|---|
| `borde-onda.svg` | Onda de entrada, separa secciones. Toma color por `currentColor` | `34041145f50c62503d5d48f374c47dbed81d3a8399e7e5e0f0ed0c6c77453f70` |
| `borde-onda-contorno.svg` | Con línea negra de 2.5, `non-scaling-stroke` | `7df59e06f981b2673a70a8c9467467f55dd39fdfd8c7dbdfe837d1db020890db` |
| `borde-onda-abajo.svg` | Cierre invertido. Toma color por `currentColor` | `7870a51edbcea7372df3ae3c57afbfcdb82128dc3b098df15dd7e1e681e55f1f` |
| `tarjeta-onda.svg` | Tarjeta orgánica, solo destacadas | `93397ab83aa9d3c5706619434a0f9044a93190a9b20018053a47fab1b1eaf577` |

Van en portadas, divisores de capítulo y cierre (DH-12). En F2b quedan
versionadas y sin uso en pantalla: la herramienta no tiene portada ni cierre
propios; esos lugares son de los documentos (F3b).
