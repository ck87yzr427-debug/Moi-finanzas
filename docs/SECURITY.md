# Moi Finanzas — modelo de seguridad

## Arquitectura

Moi Finanzas utiliza un modelo **local-first + cloud backup/sync**:

1. Cada cambio se guarda inmediatamente en el dispositivo.
2. Si el usuario ha iniciado sesión y existe conexión, la app sincroniza una copia con Supabase.
3. Si no hay conexión, el usuario puede seguir trabajando localmente.
4. Al recuperar conexión, se compara la fecha de actualización local y remota y se conserva la versión más reciente.

## Autenticación

La autenticación se realiza con Supabase Auth. La aplicación cliente solo utiliza la clave pública `anon/publishable`. La clave `service_role` nunca debe estar en GitHub, JavaScript cliente, PWA ni almacenamiento del navegador.

Para producción:

- Confirmación obligatoria de email.
- Contraseñas robustas.
- CAPTCHA/rate limiting para altas e inicio de sesión.
- Recuperación de contraseña mediante flujo de Supabase.
- Lista cerrada de redirect URLs.
- MFA como mejora posterior, especialmente si se incorporan datos financieros más sensibles.

## Autorización

La tabla `app_states` usa Row Level Security (RLS).

Principio fundamental:

> Un usuario autenticado solo puede leer o modificar una fila cuyo `user_id` coincida con `auth.uid()`.

No existen políticas de acceso a datos financieros para usuarios anónimos.

## Datos y secretos

GitHub contiene únicamente código. No debe contener:

- contraseñas;
- service_role keys;
- tokens de usuario;
- copias de bases de datos reales;
- exportaciones financieras de clientes.

La URL del proyecto y la anon/publishable key de Supabase pueden formar parte del cliente porque RLS es quien aplica la autorización real.

## Registro y auditoría

Antes de producción se debe añadir:

- registro de errores sin incluir importes ni conceptos financieros completos;
- detección de sesiones sospechosas;
- historial de modificaciones para operaciones críticas;
- proceso documentado de respuesta a incidentes.

## Riesgo residual

La PWA mantiene una copia local para funcionar sin conexión. Un usuario con acceso físico y desbloqueado al dispositivo podría acceder indirectamente a esos datos. Para una versión comercial se debería estudiar cifrado local adicional o una app nativa con almacenamiento seguro.
