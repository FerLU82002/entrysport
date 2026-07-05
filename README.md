# GrassBooking — Sistema de Reservas de Canchas

Sistema web completo para gestión y reserva de canchas deportivas para **Cancha Grass Bambino**, Huánuco, Perú.

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + TypeScript + Tailwind CSS + Vite |
| Backend | NestJS 10 + TypeScript |
| Base de datos | PostgreSQL 15 |
| ORM | TypeORM 0.3 |
| Auth | JWT + Passport.js |

---

## Requisitos previos

1. **Node.js 20 LTS** — [Descargar aquí](https://nodejs.org/)
2. **PostgreSQL 15** — [Descargar aquí](https://www.postgresql.org/download/)
3. **Git** (opcional)

---

## Instalación paso a paso

### 1. Crear la base de datos en PostgreSQL

Abre pgAdmin o psql y ejecuta:

```sql
CREATE DATABASE grassbooking;
```

### 2. Backend (NestJS)

```bash
cd grassbooking-backend

# Instalar dependencias
npm install

# Configurar variables de entorno
# Edita el archivo .env y cambia DB_PASSWORD con tu contraseña de PostgreSQL
# El archivo .env ya existe en la carpeta con valores de ejemplo

# Ejecutar en modo desarrollo (auto-sincroniza la BD con synchronize:true)
npm run start:dev
```

El servidor arranca en: http://localhost:3000/api  
Swagger/OpenAPI docs: http://localhost:3000/api/docs

### 3. Cargar datos iniciales (seed)

Con el backend corriendo:

```bash
# En otra terminal, desde grassbooking-backend/
npm run seed
```

Esto crea:
- Admin: `admin@grassbambino.com` / `Admin123!`
- Usuario demo: `usuario@demo.com` / `Demo123!`
- Cancha "Grass Bambino" con 105 horarios (15/día × 7 días)

### 4. Frontend (React + Vite)

```bash
cd grassbooking-frontend

# Instalar dependencias
npm install

# Ejecutar servidor de desarrollo
npm run dev
```

La aplicación estará en: http://localhost:5173

---

## Estructura del proyecto

```
Entrysport/
├── grassbooking-backend/          # API NestJS
│   ├── src/
│   │   ├── app.module.ts
│   │   ├── main.ts
│   │   ├── config/
│   │   ├── common/                # Guards, filtros, interceptores
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── usuarios/
│   │   │   ├── canchas/
│   │   │   ├── horarios/
│   │   │   ├── reservas/
│   │   │   ├── pagos/
│   │   │   ├── notificaciones/
│   │   │   └── reportes/
│   │   └── seed.ts
│   ├── .env
│   └── package.json
│
└── grassbooking-frontend/         # App React
    ├── src/
    │   ├── components/
    │   │   ├── common/
    │   │   ├── canchas/
    │   │   ├── reservas/
    │   │   └── reportes/
    │   ├── context/
    │   ├── hooks/
    │   ├── pages/
    │   │   ├── auth/
    │   │   ├── usuario/
    │   │   └── admin/
    │   ├── services/
    │   ├── router/
    │   └── types/
    ├── .env
    └── package.json
```

---

## Variables de entorno

### Backend (`.env`)

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=TU_PASSWORD_AQUI    # ← cambiar esto
DB_NAME=grassbooking

JWT_SECRET=grassbooking_secret_muy_seguro_32chars_minimo_2024
JWT_EXPIRES_IN=8h

FRONTEND_URL=http://localhost:5173
```

### Frontend (`.env`)

```env
VITE_API_URL=http://localhost:3000/api
```

---

## Endpoints principales de la API

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | /api/auth/register | Registrar usuario | Público |
| POST | /api/auth/login | Login → JWT | Público |
| GET | /api/auth/perfil | Perfil del usuario | JWT |
| GET | /api/canchas | Listar canchas | Público |
| GET | /api/horarios/disponibilidad | Slots disponibles | Público |
| GET | /api/reservas | Mis reservas | Usuario |
| POST | /api/reservas | Crear reserva | Usuario |
| PATCH | /api/reservas/:id/cancelar | Cancelar reserva | Usuario |
| GET | /api/reservas/todas | Todas las reservas | Admin |
| PATCH | /api/reservas/:id/estado | Cambiar estado | Admin |
| GET | /api/reportes/ocupacion | Reporte ocupación | Admin |
| GET | /api/reportes/ingresos | Reporte ingresos | Admin |

---

## Reglas de negocio

- Horario: **8:00 AM – 11:00 PM** (slots de 1 hora)
- Solo se puede cancelar con **≥ 2 horas** de anticipación
- No se pueden crear reservas en **fechas pasadas**
- El admin puede cambiar el estado de cualquier reserva en cualquier momento
- El código UUID de la reserva es inmutable una vez generado

---

## Cuentas de acceso (después del seed)

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@grassbambino.com | Admin123! |
| Usuario demo | usuario@demo.com | Demo123! |
