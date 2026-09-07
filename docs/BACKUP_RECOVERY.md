# Moi Finanzas — copias de seguridad y recuperación

## Capas de protección

Moi Finanzas debe conservar cuatro mecanismos complementarios:

1. **Copia local inmediata** para poder trabajar sin red.
2. **Sincronización con Supabase** para recuperar datos en otro dispositivo.
3. **Exportación manual JSON/CSV** controlada por el usuario.
4. **Copias de seguridad del backend** según el plan de Supabase utilizado.

## Estrategia inicial

Durante MVP:

- cada modificación actualiza el estado local;
- si existe sesión, se sincroniza a `app_states`;
- al iniciar sesión en otro dispositivo, se recupera la versión más reciente;
- el usuario puede exportar una copia manual desde Datos.

## Producción

Antes de vender la aplicación:

- definir RPO objetivo (máxima cantidad de datos asumible de perder);
- definir RTO objetivo (tiempo máximo para restaurar servicio);
- contratar/configurar el nivel de backup adecuado del proveedor;
- ejecutar pruebas periódicas de restauración;
- mantener copias cifradas separadas del entorno principal;
- documentar recuperación ante borrado accidental y corrupción.

Una copia de seguridad que nunca se ha restaurado en una prueba no debe considerarse una copia verificada.
