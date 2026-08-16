-- Enums
CREATE TYPE public.vertical_enum AS ENUM ('indumentaria','cosmetica','deco_hogar','electronica','deportes','alimentos','otro');
CREATE TYPE public.plataforma_enum AS ENUM ('tiendanube','shopify','empretienda','woocommerce','vtex','desarrollo_propio','otro');
CREATE TYPE public.estado_oportunidad_enum AS ENUM ('en_curso','propuesta_enviada','cerrado','perdido','en_seguimiento');
CREATE TYPE public.motivo_perdida_enum AS ENUM ('precio','timing','no_era_decisor','se_fue_con_otro','no_respondio','otro');

-- Función de updated_at
CREATE OR REPLACE FUNCTION public.set_actualizado_en()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.actualizado_en = now();
  RETURN NEW;
END;
$$;

-- Tabla oportunidad
CREATE TABLE public.oportunidad (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creado_por uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_tienda text NOT NULL,
  contacto_nombre text,
  contacto_email text,
  contacto_telefono text,
  vertical public.vertical_enum,
  plataforma public.plataforma_enum,
  plan_plataforma text,
  origen_lead text,
  estado public.estado_oportunidad_enum NOT NULL DEFAULT 'en_curso',
  motivo_perdida public.motivo_perdida_enum,
  monto_propuesto numeric,
  monto_cerrado numeric,
  servicios_contratados text[] NOT NULL DEFAULT '{}',
  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.oportunidad TO authenticated;
GRANT ALL ON public.oportunidad TO service_role;

ALTER TABLE public.oportunidad ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados pueden ver oportunidades"
  ON public.oportunidad FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden crear oportunidades"
  ON public.oportunidad FOR INSERT TO authenticated WITH CHECK (auth.uid() = creado_por);
CREATE POLICY "Usuarios autenticados pueden editar oportunidades"
  ON public.oportunidad FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Usuarios autenticados pueden borrar oportunidades"
  ON public.oportunidad FOR DELETE TO authenticated USING (true);

CREATE TRIGGER trg_oportunidad_actualizado_en
  BEFORE UPDATE ON public.oportunidad
  FOR EACH ROW EXECUTE FUNCTION public.set_actualizado_en();

CREATE INDEX idx_oportunidad_creado_por ON public.oportunidad(creado_por);
CREATE INDEX idx_oportunidad_estado ON public.oportunidad(estado);

-- Tabla diagnostico
CREATE TABLE public.diagnostico (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  oportunidad_id uuid NOT NULL REFERENCES public.oportunidad(id) ON DELETE CASCADE,
  creado_por uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fecha date NOT NULL DEFAULT current_date,
  datos jsonb NOT NULL DEFAULT '{}'::jsonb,
  derivados jsonb NOT NULL DEFAULT '{}'::jsonb,
  estados_bloque jsonb NOT NULL DEFAULT '{}'::jsonb,
  fugas jsonb NOT NULL DEFAULT '[]'::jsonb,
  oportunidad_total numeric NOT NULL DEFAULT 0,
  notas jsonb NOT NULL DEFAULT '{}'::jsonb,
  creado_en timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.diagnostico TO authenticated;
GRANT ALL ON public.diagnostico TO service_role;

ALTER TABLE public.diagnostico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados pueden ver diagnosticos"
  ON public.diagnostico FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden crear diagnosticos"
  ON public.diagnostico FOR INSERT TO authenticated WITH CHECK (auth.uid() = creado_por);
CREATE POLICY "Usuarios autenticados pueden borrar diagnosticos"
  ON public.diagnostico FOR DELETE TO authenticated USING (true);

CREATE INDEX idx_diagnostico_oportunidad ON public.diagnostico(oportunidad_id);
CREATE INDEX idx_diagnostico_fecha ON public.diagnostico(fecha DESC);

-- Tabla configuracion
CREATE TABLE public.configuracion (
  clave text NOT NULL PRIMARY KEY,
  valor jsonb NOT NULL,
  descripcion text,
  actualizado_en timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.configuracion TO authenticated;
GRANT ALL ON public.configuracion TO service_role;

ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados pueden ver configuracion"
  ON public.configuracion FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden crear configuracion"
  ON public.configuracion FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuarios autenticados pueden editar configuracion"
  ON public.configuracion FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Usuarios autenticados pueden borrar configuracion"
  ON public.configuracion FOR DELETE TO authenticated USING (true);

CREATE TRIGGER trg_configuracion_actualizado_en
  BEFORE UPDATE ON public.configuracion
  FOR EACH ROW EXECUTE FUNCTION public.set_actualizado_en();

-- Valores iniciales
INSERT INTO public.configuracion (clave, valor, descripcion) VALUES
('reserva_default', '0.35'::jsonb, 'Reserva por defecto sobre el margen de contribución'),
('costo_producto_por_vertical', '{"indumentaria":0.45,"cosmetica":0.35,"deco_hogar":0.50,"electronica":0.75,"deportes":0.55,"alimentos":0.60,"otro":0.50}'::jsonb, 'Costo de producto estimado como porcentaje del precio, por vertical'),
('comision_plataforma', '{"tiendanube_inicial":0.02,"tiendanube_esencial":0.01,"tiendanube_impulso":0.007,"shopify_basic":0.02,"shopify_grow":0.01,"shopify_advanced":0.005,"shopify_plus":0.002,"empretienda":0,"woocommerce":0,"desarrollo_propio":0,"otro":0}'::jsonb, 'Comisión de la plataforma de e-commerce según el plan'),
('comision_pasarela', '{"mercado_pago":0.05,"pago_nube":0.04,"mobbex":0.045,"talo":0.04,"otra":0.05}'::jsonb, 'Comisión de la pasarela de pago'),
('umbrales_funnel_web', '{"cr_tienda":{"verde":0.018,"rojo":0.010},"carrito_a_checkout":{"verde":0.50,"rojo":0.35},"checkout_a_compra":{"verde":0.60,"rojo":0.40},"lcp_mobile":{"verde":2.5,"rojo":4}}'::jsonb, 'Umbrales verde/rojo del funnel web'),
('umbrales_creativos', '{"creativos_nuevos_mes":{"verde":8,"rojo":4},"gasto_creativo_top":{"verde":0.40,"rojo":0.60},"antiguedad_creativo_top_dias":{"verde":30,"rojo":60},"hook_rate":{"verde":0.30,"rojo":0.20},"outbound_ctr":{"verde":0.015,"rojo":0.008}}'::jsonb, 'Umbrales verde/rojo del bloque creativos'),
('factor_fatiga', '[{"hasta":2.5,"factor":0},{"hasta":4,"factor":0.15},{"hasta":null,"factor":0.30}]'::jsonb, 'Factor de fatiga según frecuencia'),
('delta_medicion', '{"verde":0.05,"rojo":0.15}'::jsonb, 'Umbrales de desvío aceptable entre plataformas y tienda');