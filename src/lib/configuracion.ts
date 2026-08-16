import { supabase } from "@/integrations/supabase/client";
import { armarConfiguracion, type ConfiguracionCalculo } from "./calculo-diagnostico";

/** Lee todos los parámetros del sistema desde la tabla `configuracion`. */
export async function cargarConfiguracion(): Promise<ConfiguracionCalculo> {
  const { data, error } = await supabase.from("configuracion").select("clave, valor");
  if (error) throw error;
  return armarConfiguracion((data ?? []) as { clave: string; valor: unknown }[]);
}
