/**
 * Generado automáticamente por `scripts/generar-isotipo-reactpdf.mjs` a
 * partir de `isotipo-approved.svg`. No editar a mano.
 *
 * react-pdf no puede leer un `.svg` de archivo de forma confiable en este
 * entorno, así que el asset se transcribe a datos y `isotipo.tsx` los mapea
 * a primitivas. Los `d` son EXACTAMENTE los del SVG fuente, nunca
 * redibujados: `isotipo.test.ts` lo verifica.
 *
 * DESCARTES de esta transcripción (lo que react-pdf no puede dibujar):
 *   - <filter id="iso-glow"> con <feGaussianBlur> — @react-pdf/primitives no tiene primitiva de filtro
 *   - <path> #0 descartado entero: sólo existe para llevar url(#iso-glow)
 *
 * Consecuencia, a tener presente en toda superficie que use este componente:
 * el isotipo en PDF sale SIN el resplandor del asset. Además, react-pdf no
 * resuelve `stroke="url(#gradiente)"`, así que los filetes que usan
 * `#iso-edge` no salen con su degradado. Está documentado en
 * `PROCEDENCIA.md` (4.1 bis a) y comparado en
 * `docs/bv4-f1-assets-pdf-vs-navegador.png`. **Uso provisional hasta el
 * veredicto humano del gate DH-6.**
 */

export type ParadaGradienteIsotipo = {
  offset?: number;
  stopColor: string;
  stopOpacity?: number;
};

export type GradienteIsotipo = {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  gradientUnits: "userSpaceOnUse" | "objectBoundingBox";
  stops: ParadaGradienteIsotipo[];
};

export type NodoIsotipo =
  | { tipo: "path"; attrs: Record<string, string | number> }
  | { tipo: "g"; attrs: Record<string, string | number>; hijos: NodoIsotipo[] };

/** `viewBox` del asset. No es cuadrado: ver PROCEDENCIA.md, 4.1 bis (b). */
export const ISOTIPO_VIEWBOX = "0 0 220 210" as const;

/** Relación de aspecto del `viewBox`, para no deformar el glifo nunca. */
export const ISOTIPO_RELACION = 1.047619;

/** Encuadres cuadrados medidos en la etapa 4.1 bis (b). */
export const ISOTIPO_ENCUADRES = {
  /** Favicon y avatar cuadrado: centrado en la tinta, 8% de aire por lado. */
  cuadrado: "-4.1 -5.4 226 226",
  /** Avatar circular: el círculo inscripto contiene toda la tinta. */
  circular: "-31.1 -32.4 280 280",
} as const;

export const ISOTIPO_GRADIENTES: GradienteIsotipo[] = [
  {
    "id": "iso-left-light",
    "x1": 20,
    "y1": 18,
    "x2": 85,
    "y2": 151,
    "gradientUnits": "userSpaceOnUse",
    "stops": [
      {
        "stopColor": "#FFF1F7"
      },
      {
        "offset": 0.24,
        "stopColor": "#FFB5CE"
      },
      {
        "offset": 0.68,
        "stopColor": "#F05A91"
      },
      {
        "offset": 1,
        "stopColor": "#9D274F"
      }
    ]
  },
  {
    "id": "iso-left-hot",
    "x1": 38,
    "y1": 32,
    "x2": 112,
    "y2": 124,
    "gradientUnits": "userSpaceOnUse",
    "stops": [
      {
        "stopColor": "#FF8DB4"
      },
      {
        "offset": 0.5,
        "stopColor": "#FF5C94"
      },
      {
        "offset": 1,
        "stopColor": "#B7285A"
      }
    ]
  },
  {
    "id": "iso-right-light",
    "x1": 201,
    "y1": 28,
    "x2": 128,
    "y2": 198,
    "gradientUnits": "userSpaceOnUse",
    "stops": [
      {
        "stopColor": "#FFF3F8"
      },
      {
        "offset": 0.22,
        "stopColor": "#F6A7C4"
      },
      {
        "offset": 0.64,
        "stopColor": "#D64D7D"
      },
      {
        "offset": 1,
        "stopColor": "#8A2348"
      }
    ]
  },
  {
    "id": "iso-right-hot",
    "x1": 169,
    "y1": 55,
    "x2": 124,
    "y2": 198,
    "gradientUnits": "userSpaceOnUse",
    "stops": [
      {
        "stopColor": "#FF6CA0"
      },
      {
        "offset": 0.48,
        "stopColor": "#E73773"
      },
      {
        "offset": 1,
        "stopColor": "#A31F4E"
      }
    ]
  },
  {
    "id": "iso-deep",
    "x1": 67,
    "y1": 64,
    "x2": 135,
    "y2": 196,
    "gradientUnits": "userSpaceOnUse",
    "stops": [
      {
        "stopColor": "#463746"
      },
      {
        "offset": 0.58,
        "stopColor": "#302431"
      },
      {
        "offset": 1,
        "stopColor": "#6F1D3C"
      }
    ]
  },
  {
    "id": "iso-edge",
    "x1": 16,
    "y1": 18,
    "x2": 203,
    "y2": 198,
    "gradientUnits": "userSpaceOnUse",
    "stops": [
      {
        "stopColor": "#FFF8FB",
        "stopOpacity": 0.96
      },
      {
        "offset": 0.48,
        "stopColor": "#F3B2C9",
        "stopOpacity": 0.7
      },
      {
        "offset": 1,
        "stopColor": "#FF6D9E",
        "stopOpacity": 0.78
      }
    ]
  }
];

export const ISOTIPO_NODOS: NodoIsotipo[] = [
  {
    "tipo": "g",
    "attrs": {
      "strokeLinejoin": "round"
    },
    "hijos": [
      {
        "tipo": "path",
        "attrs": {
          "d": "M16 18L66 27L92 66L114 121L151 50L203 29L170 142L129 198L59 142Z",
          "fill": "url(#iso-deep)",
          "stroke": "url(#iso-edge)",
          "strokeWidth": 1.35
        }
      },
      {
        "tipo": "path",
        "attrs": {
          "d": "M16 18L34 31L59 142Z",
          "fill": "url(#iso-left-light)"
        }
      },
      {
        "tipo": "path",
        "attrs": {
          "d": "M16 18L66 27L92 66Z",
          "fill": "#3A303D"
        }
      },
      {
        "tipo": "path",
        "attrs": {
          "d": "M16 18L92 66L34 31Z",
          "fill": "#6B5366",
          "fillOpacity": 0.74
        }
      },
      {
        "tipo": "path",
        "attrs": {
          "d": "M34 31L80 73L59 142Z",
          "fill": "url(#iso-left-hot)"
        }
      },
      {
        "tipo": "path",
        "attrs": {
          "d": "M34 31L92 66L80 73Z",
          "fill": "#F78FB2",
          "fillOpacity": 0.88
        }
      },
      {
        "tipo": "path",
        "attrs": {
          "d": "M80 73L72 111L59 142Z",
          "fill": "#C92D62"
        }
      },
      {
        "tipo": "path",
        "attrs": {
          "d": "M80 73L92 66L114 121L72 111Z",
          "fill": "#3A303D"
        }
      },
      {
        "tipo": "path",
        "attrs": {
          "d": "M59 142L72 111L114 121Z",
          "fill": "#4B3447"
        }
      },
      {
        "tipo": "path",
        "attrs": {
          "d": "M59 142L114 121L129 198Z",
          "fill": "#6E2647"
        }
      },
      {
        "tipo": "path",
        "attrs": {
          "d": "M59 142L96 136L129 198Z",
          "fill": "#8E2D54",
          "fillOpacity": 0.7
        }
      },
      {
        "tipo": "path",
        "attrs": {
          "d": "M203 29L151 50L173 72Z",
          "fill": "#685265"
        }
      },
      {
        "tipo": "path",
        "attrs": {
          "d": "M203 29L173 72L170 142Z",
          "fill": "url(#iso-right-light)"
        }
      },
      {
        "tipo": "path",
        "attrs": {
          "d": "M151 50L173 72L137 94Z",
          "fill": "#332A37"
        }
      },
      {
        "tipo": "path",
        "attrs": {
          "d": "M151 50L137 94L114 121Z",
          "fill": "#B42A59"
        }
      },
      {
        "tipo": "path",
        "attrs": {
          "d": "M173 72L145 111L137 94Z",
          "fill": "#E13B73"
        }
      },
      {
        "tipo": "path",
        "attrs": {
          "d": "M173 72L170 142L145 111Z",
          "fill": "#C3547B"
        }
      },
      {
        "tipo": "path",
        "attrs": {
          "d": "M137 94L145 111L114 121Z",
          "fill": "url(#iso-right-hot)"
        }
      },
      {
        "tipo": "path",
        "attrs": {
          "d": "M145 111L170 142L129 198Z",
          "fill": "#8E3155"
        }
      },
      {
        "tipo": "path",
        "attrs": {
          "d": "M114 121L145 111L129 198Z",
          "fill": "url(#iso-right-hot)"
        }
      },
      {
        "tipo": "path",
        "attrs": {
          "d": "M114 121L125 139L129 198Z",
          "fill": "#FF4D89",
          "fillOpacity": 0.74
        }
      },
      {
        "tipo": "g",
        "attrs": {
          "fill": "none",
          "stroke": "url(#iso-edge)",
          "strokeWidth": 0.9,
          "strokeOpacity": 0.76
        },
        "hijos": [
          {
            "tipo": "path",
            "attrs": {
              "d": "M16 18L92 66L114 121L151 50L203 29"
            }
          },
          {
            "tipo": "path",
            "attrs": {
              "d": "M34 31L80 73L72 111L59 142L129 198L170 142L173 72"
            }
          },
          {
            "tipo": "path",
            "attrs": {
              "d": "M59 142L114 121L129 198"
            }
          },
          {
            "tipo": "path",
            "attrs": {
              "d": "M151 50L137 94L145 111L114 121"
            }
          },
          {
            "tipo": "path",
            "attrs": {
              "d": "M92 66L72 111L96 136"
            }
          },
          {
            "tipo": "path",
            "attrs": {
              "d": "M173 72L137 94"
            }
          }
        ]
      },
      {
        "tipo": "g",
        "attrs": {
          "fill": "none",
          "stroke": "#FFF8FB",
          "strokeWidth": 0.48,
          "strokeOpacity": 0.34
        },
        "hijos": [
          {
            "tipo": "path",
            "attrs": {
              "d": "M19 20L65 29L89 66"
            }
          },
          {
            "tipo": "path",
            "attrs": {
              "d": "M201 31L153 52L116 121"
            }
          },
          {
            "tipo": "path",
            "attrs": {
              "d": "M61 141L128 195L168 141"
            }
          }
        ]
      }
    ]
  }
];

/** Lo que la transcripción descartó, expuesto para que el test lo fije. */
export const ISOTIPO_DESCARTES: readonly string[] = [
  "<filter id=\"iso-glow\"> con <feGaussianBlur> — @react-pdf/primitives no tiene primitiva de filtro",
  "<path> #0 descartado entero: sólo existe para llevar url(#iso-glow)"
];
