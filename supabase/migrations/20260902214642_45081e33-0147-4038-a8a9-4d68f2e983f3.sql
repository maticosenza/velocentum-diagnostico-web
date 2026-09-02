-- BV4 · La política de UPDATE que le falta a `diagnostico`.
--
-- Excepción autorizada por Matías el 2026-09-02 al invariante del contrato
-- maestro "sin base de datos, sin migraciones de esquema" (sección 3). El
-- alcance es exclusivamente esta política: nada más.
--
-- Por qué hace falta: el preflight del gate de F2a (commit 805333c) migró los
-- tres server functions comerciales de `supabaseAdmin` —service role, saltea
-- RLS— al cliente autenticado del usuario. Ahí quedó al descubierto que
-- `diagnostico` tiene políticas de SELECT, INSERT y DELETE pero **ninguna de
-- UPDATE**, y en RLS lo que no está permitido explícitamente está prohibido:
-- ninguna escritura del usuario puede pasar. Antes no importaba porque el
-- service role salteaba la política ausente.
--
-- El criterio no se inventa: es el mismo que ya usa el INSERT de esta misma
-- tabla, `auth.uid() = creado_por`. Van las dos cláusulas, no una: USING
-- decide qué filas se pueden actualizar y WITH CHECK impide que la fila
-- actualizada quede apuntando a otro dueño.
--
-- Deliberadamente NO usa `USING true`, aunque sea lo que hacen hoy las
-- políticas de UPDATE de `configuracion` y `oportunidad`. Copiar `true` acá
-- sería sumarle un cuarto punto a H-9 (`docs/bv4-hallazgos-diferidos.md`) en
-- el mismo momento en que se lo empieza a cerrar. Esas dos tablas no se tocan
-- en esta migración.
--
-- `creado_por` es `uuid NOT NULL` desde la migración de creación de la tabla y
-- ninguna migración posterior la alteró, así que no hay filas viejas que esta
-- política pueda dejar inaccesibles. El `GRANT ... UPDATE ... TO authenticated`
-- también viene de esa migración: lo único que faltaba era la política.
--
-- El DROP previo la hace re-aplicable sin romper: si Lovable llegara a generar
-- su propia migración por el mismo cambio, la segunda corrida no falla con
-- "policy already exists".

DROP POLICY IF EXISTS "Usuarios autenticados pueden editar diagnosticos" ON public.diagnostico;

CREATE POLICY "Usuarios autenticados pueden editar diagnosticos"
  ON public.diagnostico FOR UPDATE TO authenticated
  USING (auth.uid() = creado_por)
  WITH CHECK (auth.uid() = creado_por);
