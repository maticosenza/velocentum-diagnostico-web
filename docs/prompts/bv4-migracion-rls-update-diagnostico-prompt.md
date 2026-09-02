# BV4 · Migración — La política RLS de UPDATE que falta en `diagnostico`

**Excepción autorizada al contrato maestro.** La sección 3 del contrato lista
como invariante de BV4: *"sin base de datos, sin migraciones de esquema"*.
Matías autorizó expresamente esta migración el 2026-09-02, con este motivo y
este alcance:

> **Motivo:** el preflight del gate de F2a (commit `805333c`) migró los tres
> server functions comerciales de `supabaseAdmin` —service role, saltea RLS— al
> cliente autenticado del usuario, sujeto a RLS. Al hacerlo quedó al
> descubierto que la tabla `diagnostico` **no tiene política de UPDATE**, así
> que ninguna escritura del usuario puede pasar. Antes no importaba porque
> service role salteaba la política ausente.
>
> **Alcance:** exclusivamente la política de UPDATE de `diagnostico`. Nada más.

Esto **no** es una fase de BV4 y **no** consume rondas de F2a.

---

## 1 · Hallazgo verificado

Verificado el 2026-09-02 en el panel Cloud de Lovable, pantalla
**Database → RLS policies**. No hace falta rediagnosticar.

| Tabla | Políticas | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|---|
| `configuracion` | 4 | `USING true` | `CHECK true` | `USING true` | `USING true` |
| `diagnostico` | **3** | `USING true` | `CHECK (auth.uid() = creado_por)` | **NO EXISTE** | `USING true` |
| `oportunidad` | 4 | `USING true` | `CHECK (auth.uid() = creado_por)` | `USING true` | `USING true` |

En RLS, lo que no está permitido explícitamente está prohibido. Sin política de
UPDATE, la escritura falla.

Los tres server functions afectados hacen todos la misma operación sobre la
misma tabla:

```ts
.from("diagnostico").update({ propuesta: aGuardar as unknown as never }).eq("id", data.diagnosticoId)
```

- `src/lib/paquetes.functions.ts`
- `src/lib/propuesta.functions.ts`
- `src/lib/seleccion-comercial-v2.functions.ts`

## 2 · Qué hay que crear

Una política de UPDATE sobre `public.diagnostico`, para el rol
`authenticated`, con **verificación de propiedad**:

- `USING (auth.uid() = creado_por)`
- `WITH CHECK (auth.uid() = creado_por)`

Las dos cláusulas, no una: `USING` decide qué filas se pueden actualizar,
`WITH CHECK` impide que la fila actualizada quede apuntando a otro dueño.

El criterio no se inventa: es **el mismo que ya usa el INSERT de esa misma
tabla**, que dice `CHECK (auth.uid() = creado_por)`.

Nombre de la política siguiendo la convención existente en español que usan
las otras: `Usuarios autenticados pueden editar diagnosticos`.

**Deliberadamente NO se usa `USING true`**, aunque sea lo que hacen
`configuracion` y `oportunidad`. Copiar `true` acá sería agregar un cuarto
punto a H-9 en el mismo momento en que se empieza a cerrarlo. La política nace
con chequeo de propiedad.

## 3 · Riesgo a verificar antes de dar por buena la migración

Todos los registros actuales tienen `creado_por` =
`2b4588ed-f734-4126-9058-840169a768b7`, que es el único usuario
(`matias@velocentum.com`). Con esa política, el usuario puede editar sus
propios diagnósticos: es lo buscado.

Pero **verificá que `creado_por` no sea nullable ni pueda venir vacío** en
filas viejas. Una fila con `creado_por` nulo quedaría inaccesible para UPDATE
con esta política. Si encontrás filas así, **frená y reportá** antes de aplicar.

## 4 · Alcance

### Se toca

- Una migración nueva en `supabase/migrations/`, siguiendo la convención de
  nombre de las cinco existentes.

### No se toca

- Las políticas de `configuracion` ni de `oportunidad`. Son H-9 y son tarea
  aparte. **No las arregles de paso.**
- Las otras tres políticas de `diagnostico` (SELECT, INSERT, DELETE). También
  H-9.
- Ninguna de las cinco migraciones existentes.
- Código de aplicación. Los tres server functions ya quedaron correctos en
  `805333c` y no necesitan cambios.
- `MOTOR_DOCUMENTAL_ACTIVO` (`"v1"`) y `TEMA_DOCUMENTAL_ACTIVO`
  (`"velocentum-light-v1"`).

## 5 · Cómo se aplica

El backend es **Lovable Cloud**. La migración se escribe en el repo, pero
**quién la aplica a la base es una pregunta abierta que tenés que responder
antes de aplicar nada**:

- Si Lovable aplica automáticamente las migraciones del repo al sincronizar
  `main`, hay un problema de secuencia: la rama de trabajo es
  `feat/bv4-rebranding` y **no se pushea**. Reportá cómo se resuelve.
- Si hay que aplicarla desde el SQL editor del panel Cloud, dejá el SQL exacto
  listo para que Matías lo ejecute, y decilo explícitamente.

**Parada de reporte obligatoria en este punto.** Escribí la migración,
verificá el punto 3, y **frená antes de aplicar**. No ejecutes SQL contra la
base sin que Matías confirme el camino.

## 6 · Correcciones pendientes de la auditoría del preflight

Aprovechá el mismo pasaje para cerrar dos correcciones de la auditoría de
`805333c` (veredicto: APROBADO CON CORRECCIONES). Son textuales, en
`docs/bv4-hallazgos-diferidos.md`:

**C-1 · Registrar H-11.** Los cinco errores `prettier/prettier` preexistentes
en `src/lib/propuesta.functions.ts` (líneas 52-66, tipado de `oportunidad`),
verificados idénticos en `6035ebf` con `git stash`. Lo reportaste en el handoff
pero no quedó con ID. Incluí por qué no se corrigieron: formatearlos habría
metido en el diff del preflight líneas que el arreglo no necesitaba.

**C-2 · Registrar H-12.** `supabaseAdmin` quedó sin un solo importador en
`src/`. `client.server.ts` sigue exportando un cliente de service role que
saltea RLS y que ya nadie usa. Es código muerto con superficie de riesgo.
Registrá la deuda; **no lo borres** — es archivo generado y la decisión es de
Matías.

**C-3 · Actualizar H-9.** Sumá la tabla de políticas de la sección 1 de este
documento, que es evidencia verificada que H-9 no tenía. Y dejá anotado que la
política de UPDATE de `diagnostico` **nace con chequeo de propiedad**, así que
H-9 queda parcialmente encaminado: el criterio correcto ya está aplicado en un
punto, y las demás políticas lo tienen pendiente.

## 7 · Invariantes

- **Ningún `git push`.** Commit candidato local y detención completa.
- **No ejecutes SQL contra la base** sin confirmación humana explícita.
- **Nada se inventa**: ni políticas, ni condiciones, ni nombres de columna.
  Faltante = parada y reporte.
- Si la migración pareciera exigir tocar algo fuera de lo listado en la
  sección 4: **frená y reportá**.
- No se toca `.env` ni se imprime el valor de ninguna variable de entorno.
- Máximo dos rondas de corrección.
- Handoff de máximo diez líneas.
