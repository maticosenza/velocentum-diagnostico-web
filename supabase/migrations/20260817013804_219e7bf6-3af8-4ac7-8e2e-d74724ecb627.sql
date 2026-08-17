INSERT INTO public.configuracion (clave, valor, descripcion) VALUES
('umbrales_cr_por_ticket', '[{"hasta":30000,"verde":0.025,"rojo":0.012},{"hasta":80000,"verde":0.018,"rojo":0.009},{"hasta":150000,"verde":0.012,"rojo":0.006},{"hasta":300000,"verde":0.007,"rojo":0.0035},{"hasta":null,"verde":0.005,"rojo":0.0025}]'::jsonb, 'Umbrales de conversion de tienda segun tramo de ticket promedio'),
('tope_fuga_individual', '0.25'::jsonb, 'Tope maximo de una fuga individual como fraccion de la facturacion mensual'),
('tope_fuga_total', '0.4'::jsonb, 'Tope maximo de la suma de fugas como fraccion de la facturacion mensual')
ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor, descripcion = EXCLUDED.descripcion;