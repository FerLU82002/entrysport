# GrassBooking — Sistema de Reservas de Canchas

Sistema web para gestión y reserva de canchas deportivas.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + TypeScript + Tailwind CSS + Vite |
| Backend | NestJS 10 + TypeScript |
| Base de datos | PostgreSQL 16 |
| ORM | TypeORM 0.3 |
| Auth | JWT + Passport.js |

---

## Requisitos

- Node.js 20+
- Docker + Docker Compose (recomendado)

---

## Levantar con Docker

```bash
cp .env.example .env
# Edita .env con tus valores
docker compose up --build -d
```

- Frontend → http://localhost
- Backend API → http://localhost:3000/api
- Swagger docs → http://localhost:3000/api/docs

---

## Desarrollo local (sin Docker)

### Backend

```bash
cd grassbooking-backend
cp .env.example .env   # configura tus variables
npm install
npm run start:dev
```

### Frontend

```bash
cd grassbooking-frontend
npm install
npm run dev
```

### Datos iniciales

```bash
cd grassbooking-backend
npm run seed
```

---

## Variables de entorno

Copia `.env.example` a `.env` y rellena los valores. Nunca subas `.env` al repositorio.

### Backend

```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=           # tu contraseña
DB_NAME=grassbooking
JWT_SECRET=            # mínimo 32 caracteres aleatorios
JWT_EXPIRES_IN=8h
FRONTEND_URL=http://localhost:5173
```

### Frontend

```env
VITE_API_URL=http://localhost:3000/api
```

---

## Endpoints principales

| Método | Ruta | Auth |
|--------|------|------|
| POST | /api/auth/register | Público |
| POST | /api/auth/login | Público |
| GET | /api/canchas | Público |
| GET | /api/horarios/disponibilidad | Público |
| GET | /api/reservas | Usuario |
| POST | /api/reservas | Usuario |
| PATCH | /api/reservas/:id/cancelar | Usuario |
| GET | /api/reservas/todas | Admin |
| GET | /api/reportes/ocupacion | Admin |
| GET | /api/reportes/ingresos | Admin |

---

## Reglas de negocio

- Horario operativo: 8:00 AM – 11:00 PM (slots de 1 hora)
- Cancelación permitida con ≥ 2 horas de anticipación
- No se permiten reservas en fechas pasadas
