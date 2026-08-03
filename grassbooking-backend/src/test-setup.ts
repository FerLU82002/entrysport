// Variables de entorno mínimas para que las suites unitarias no dependan de un .env real.
process.env.ENCRYPTION_KEY ??= 'clave-de-pruebas-no-usar-en-produccion';
