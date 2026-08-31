# BV4 · F2a — Pasos exactos para reproducir el gate en el navegador

El flujo en navegador lo ejecuta Matías. Este documento deja escritos los
pasos, en orden, y qué hay que comparar al final.

> **Gate de F2a:** diagnóstico → proyección → selección comercial confirmada
> + configuración fiscal confirmada → propuesta → PDF descargado desde la
> interfaz en pantalla y A4 → SHA-256 del descargado = SHA-256 del pipeline,
> para Snake Store y Titan Web B1.

---

## 0 · Antes de empezar: conmutar el motor a v2 (F-3, registrado)

El bloque `commercial-selection` y los dos perfiles de PDF viven en la cadena
**v2**. El commit candidato tiene `MOTOR_DOCUMENTAL_ACTIVO = "v1"`, que es
como debe quedar. Para el gate hay que conmutarlo **en local y sin
commitear**:

```bash
# 1. Conmutar
sed -i '' 's/MotorDocumental = "v1"/MotorDocumental = "v2"/' src/documents/motor-activo.ts
grep -n 'MOTOR_DOCUMENTAL_ACTIVO' src/documents/motor-activo.ts   # debe decir "v2"

# 2. Levantar
npm run dev        # http://localhost:8080

# … flujo del navegador (secciones 1 a 4) …

# 3. Revertir SIEMPRE al terminar
git checkout -- src/documents/motor-activo.ts
git status --short          # debe salir vacío
```

`TEMA_DOCUMENTAL_ACTIVO` **no se toca**: sigue en `velocentum-light-v1`. El
panel consume tokens del tema activo, cualquiera sea, así que no hace falta
activar crystal para nada de esto.

## 1 · Cargar el diagnóstico

1. Entrar y crear un diagnóstico nuevo con los datos de **Snake Store**
   (`src/lib/fixtures-casos.ts`, `casoSnakeStore`).
2. Guardar y abrir el detalle: `/diagnosticos/<id>`.
3. Verificar que el número principal, el semáforo y las fugas se ven.

## 2 · Proyección

4. Abrir **Proyección 90 días** desde la lista de documentos del diagnóstico y
   verificar que renderiza. (Semana 0, si aparece, es de **este** documento;
   en la propuesta no existe y no puede existir — invariante en la suite.)

## 3 · Selección comercial y configuración fiscal

5. En el detalle del diagnóstico, bajar a **"Selección comercial"** (está
   arriba de "Paquetes propuestos (escalera v1)", que es otra cosa y no se
   toca).
6. Comprobar que aparecen las **diez líneas**, con las sugeridas por el
   diagnóstico marcadas y el resto desmarcadas.
7. Elegir **nivel TRACCIÓN**. Verificar que las cantidades sugeridas se
   ajustan (audiovisual 15, estático 18, campañas 5 en cada plataforma) y que
   **Diseño web NO queda marcado** por cambiar de nivel.
8. Elegir **moneda ARS**.
9. Cargar precios en las líneas marcadas. Verificar que el total de cada línea
   se calcula solo y que **no hay ningún campo editable de total**.
10. En **Configuración fiscal**: dejar "Aplica impuesto" tildado con 21 % y
    tildar **"Configuración fiscal confirmada"**. El aviso rojo de exportación
    bloqueada tiene que desaparecer.
11. Verificar los **dos grupos de totales** en vivo: "Inversión mensual" e
    "Inversión inicial / pago único", cada uno con subtotal neto, impuesto y
    total. **No debe existir ningún total que los sume.**
12. Apretar **"Confirmar selección comercial"** y esperar el mensaje de
    guardado.
13. **Recargar la página.** La selección tiene que seguir ahí: vive en base,
    no en estado de React. Es condición del chequeo SHA.

### 3.1 · Comprobación del candado (Q9)

14. Destildar "Configuración fiscal confirmada", confirmar de nuevo, ir a la
    propuesta e intentar descargar el PDF: tiene que **fallar** con
    "Selección comercial pendiente: falta confirmar la selección de líneas y
    la configuración fiscal de la propuesta."
15. Volver a tildarla y confirmar. La descarga vuelve a funcionar.

## 4 · Propuesta y descarga en los dos perfiles

16. Abrir el documento **Propuesta**.
17. Verificar en pantalla: las líneas seleccionadas con su **texto verbatim**
    (descripción + entregables), la exclusión de Diseño web si corresponde, la
    nota al pie en las líneas de contenido, los agregados con el alcance del
    nivel, y los dos grupos de totales.
18. Descargar con **"Descargar PDF" → "Pantalla (16:9)"**.
19. Descargar con **"Descargar PDF" → "Impresión (A4)"**.

## 5 · Repetir con Titan Web B1

20. Repetir los pasos 1 a 19 con `casoTitanWebB1`, esta vez en **nivel
    ESCALA** y **moneda USD**, marcando **Diseño web con ruta "B2C y B2B"** y
    **Desarrollo web custom**. Verificar que **CRO** queda habilitado (sólo
    existe en ESCALA) y que el alcance de Email marketing dice "segmentación
    y recompra".

## 6 · Comparar SHA-256 contra el pipeline

Los cuatro PDFs de referencia del pipeline salen de un worktree limpio del
commit candidato:

```bash
VELOCENTUM_F2A_QA_DIR=/tmp/f2a-pdfs \
  npx vitest run src/documents/renderers/pdf-v2/generar-propuestas-f2a.test.ts
cat /tmp/f2a-pdfs/sha256.txt
```

Y de lo descargado en el navegador:

```bash
shasum -a 256 ~/Downloads/*propuesta*.pdf
```

**Los hashes tienen que coincidir** para los cuatro (dos casos × dos
perfiles). La razón por la que pueden coincidir es que el navegador y el
pipeline llaman a la **misma** `renderPdfV2ConDosPasadas`
(`renderers/pdf-v2/paginacion.ts`): `export-client.ts` la usa para la
descarga y `exportacion.ts` para los artefactos. El determinismo del render ya
está probado por doble corrida en
`generar-propuestas-f2a.test.ts`.

### Si no coinciden

Lo más probable es que la selección cargada a mano no sea idéntica a la de la
fixture de QA (`SOBRE_SNAKE` / `SOBRE_TITAN` en ese archivo): cantidades,
precios, nivel, moneda, porcentaje fiscal, ruta y agregados tienen que ser los
mismos, y la fecha del diagnóstico también. La comparación honesta es contra
una selección idéntica; si difiere en un peso, difiere el PDF. **No es un
defecto del pipeline: es la prueba de que el PDF refleja la selección.**

## 7 · Al terminar

```bash
git checkout -- src/documents/motor-activo.ts
git status --short          # vacío
grep -n 'MOTOR_DOCUMENTAL_ACTIVO' src/documents/motor-activo.ts   # "v1"
```
