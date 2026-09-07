# Moi Finanzas — privacidad y RGPD (diseño previo)

> Documento de diseño técnico. Antes de lanzamiento comercial debe revisarlo un profesional jurídico conforme al producto final y a la entidad responsable.

## Principios

Moi Finanzas se diseñará con:

- minimización de datos;
- privacidad por defecto;
- limitación de finalidad;
- seguridad desde el diseño;
- transparencia;
- capacidad de acceso, exportación y eliminación.

## Datos previstos

Para una cuenta en la nube se prevé tratar:

- email / identificador de cuenta;
- proyectos y nombres que el usuario introduzca;
- clientes que el usuario decida registrar;
- presupuestos;
- ingresos y gastos;
- categorías;
- notas;
- información de desplazamiento;
- fechas y horas de actividad.

No se conectará a cuentas bancarias en el MVP.

## Base jurídica

La base jurídica concreta debe definirse antes del lanzamiento. Para la prestación principal del servicio normalmente habrá tratamiento necesario para ejecutar el contrato con el usuario; otros tratamientos, como marketing, analítica opcional o comunicaciones promocionales, deberán analizarse por separado.

## Derechos del usuario

La versión comercial debe permitir:

- acceso a sus datos;
- exportación en formato interoperable;
- corrección;
- eliminación de cuenta y datos;
- información sobre conservación;
- retirada de consentimientos que sean opcionales.

## Conservación

Debe establecerse una política explícita. Recomendación de diseño:

- cuenta activa: mientras sea necesaria para prestar el servicio;
- cuenta eliminada: borrado de datos activos en plazo definido;
- copias de seguridad: retención limitada y documentada;
- logs de seguridad: solo el tiempo necesario.

## Encargados y transferencias

Antes del lanzamiento se debe documentar:

- Supabase y su región de alojamiento;
- proveedor de hosting;
- email transaccional;
- analítica, si se incorpora;
- soporte y monitorización.

Si intervienen transferencias internacionales, deberán revisarse sus mecanismos jurídicos.

## Privacidad en producto

La app debe mostrar:

- Política de Privacidad;
- Términos de Uso;
- identidad y contacto del responsable;
- mecanismo para ejercer derechos;
- configuración de privacidad;
- opción de eliminar cuenta.

No se deben utilizar datos financieros personales para publicidad comportamental.
