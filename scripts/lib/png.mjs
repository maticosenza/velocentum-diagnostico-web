/**
 * Utilidades de PNG sin dependencias (BV4 F1, etapa 4). Decodifica PNG de 8
 * bits RGB/RGBA, mide la caja de tinta por canal alfa y recorta el blanco
 * sobrante al pie de una captura.
 *
 * Sin dependencias a propósito: estas láminas son artefactos de auditoría y
 * no deben sumar paquetes al proyecto.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { deflateSync, inflateSync } from "node:zlib";

const FIRMA = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function crcTabla() {
  const t = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
}
const TABLA = crcTabla();
function crc(b) {
  let c = 0xffffffff;
  for (const v of b) c = TABLA[(c ^ v) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(tipo, datos) {
  const b = Buffer.alloc(12 + datos.length);
  b.writeUInt32BE(datos.length, 0);
  b.write(tipo, 4, "ascii");
  datos.copy(b, 8);
  b.writeInt32BE(crc(Buffer.concat([Buffer.from(tipo, "ascii"), datos])) | 0, 8 + datos.length);
  return b;
}
const paeth = (a, b, c) => {
  const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
};

/** Decodifica un PNG de 8 bits (RGB o RGBA) a píxeles crudos. */
export function decodificar(ruta) {
  const buf = readFileSync(ruta);
  let off = 8, w = 0, h = 0, bd = 0, ct = 0;
  const idat = [], otros = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const tipo = buf.toString("ascii", off + 4, off + 8);
    const d = buf.subarray(off + 8, off + 8 + len);
    if (tipo === "IHDR") { w = d.readUInt32BE(0); h = d.readUInt32BE(4); bd = d[8]; ct = d[9]; }
    else if (tipo === "IDAT") idat.push(d);
    else if (tipo !== "IEND") otros.push([tipo, d]);
    if (tipo === "IEND") break;
    off += 12 + len;
  }
  const canales = ct === 6 ? 4 : ct === 2 ? 3 : null;
  if (bd !== 8 || !canales) throw new Error(`PNG no soportado: bitDepth=${bd} colorType=${ct} (${ruta})`);
  const raw = inflateSync(Buffer.concat(idat));
  const stride = w * canales;
  const img = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    const l = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= canales ? img[y * stride + x - canales] : 0;
      const b = y > 0 ? img[(y - 1) * stride + x] : 0;
      const c = x >= canales && y > 0 ? img[(y - 1) * stride + x - canales] : 0;
      let v = l[x];
      if (f === 1) v += a; else if (f === 2) v += b;
      else if (f === 3) v += (a + b) >> 1; else if (f === 4) v += paeth(a, b, c);
      img[y * stride + x] = v & 0xff;
    }
  }
  return { w, h, bd, ct, canales, stride, img, otros };
}

/**
 * Caja de tinta por canal alfa, más el radio máximo desde el centro de esa
 * caja: el dato que decide si un recorte circular corta o no corta el glifo.
 */
export function cajaDeTinta(ruta, { umbralAlfa = 8, escala = 1 } = {}) {
  const { w, h, canales, stride, img } = decodificar(ruta);
  if (canales !== 4) throw new Error("cajaDeTinta necesita un PNG con canal alfa");
  let x0 = w, y0 = h, x1 = -1, y1 = -1, pintados = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (img[y * stride + x * 4 + 3] > umbralAlfa) {
      pintados++;
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  }
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  let rmax = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (img[y * stride + x * 4 + 3] > umbralAlfa) {
      const r = Math.hypot(x - cx, y - cy);
      if (r > rmax) rmax = r;
    }
  }
  const u = (v) => +(v / escala).toFixed(2);
  return {
    lienzo: [u(w), u(h)], pixelesPintados: pintados,
    caja: { x0: u(x0), y0: u(y0), x1: u(x1), y1: u(y1), ancho: u(x1 - x0 + 1), alto: u(y1 - y0 + 1) },
    margenes: { izq: u(x0), der: u(w - 1 - x1), sup: u(y0), inf: u(h - 1 - y1) },
    centroTinta: [u(cx), u(cy)], radioMaximo: u(rmax),
  };
}

/** Recorta el blanco sobrante al pie de una captura y reescribe el archivo. */
export function recortarBlancoInferior(ruta, { colchon = 40 } = {}) {
  const { w, h, bd, ct, canales, stride, img, otros } = decodificar(ruta);
  let ultima = 0;
  for (let y = 0; y < h; y++) {
    let blanca = true;
    for (let x = 0; x < stride; x++) if (img[y * stride + x] !== 255) { blanca = false; break; }
    if (!blanca) ultima = y;
  }
  const alto = Math.min(h, ultima + colchon);
  if (alto === h) return { w, h, recortado: false };
  const salida = Buffer.alloc(alto * (stride + 1));
  for (let y = 0; y < alto; y++) {
    salida[y * (stride + 1)] = 0;
    img.copy(salida, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(alto, 4); ihdr[8] = bd; ihdr[9] = ct;
  writeFileSync(ruta, Buffer.concat([
    FIRMA, chunk("IHDR", ihdr), ...otros.map(([t, d]) => chunk(t, d)),
    chunk("IDAT", deflateSync(salida, { level: 9 })), chunk("IEND", Buffer.alloc(0)),
  ]));
  return { w, h: alto, previo: h, recortado: true, canales };
}
