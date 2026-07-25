# Arquitectura de Vire - Guía para Desarrolladores y Agentes IA

Este documento detalla la estructura, decisiones de diseño y tecnologías utilizadas en el proyecto **Vire**. Sirve como punto de entrada para que cualquier desarrollador humano o agente de IA comprenda rápidamente el plano general del sistema antes de comenzar a trabajar.

## 1. Visión General del Sistema
**Vire** es una aplicación orientada a ser una red profesional y repositorio institucional para IEEE y CIMEQH. Consiste en una Single Page Application (SPA) en el Frontend que se comunica vía REST y WebSockets con una API Backend construida sobre una arquitectura de micro-servicios dockerizada.

### Stack Tecnológico Principal
- **Frontend**: React 18, Vite, React Router DOM, Vanilla CSS Modules.
- **Backend**: NestJS, TypeScript, Prisma ORM.
- **Bases de Datos y Servicios**: PostgreSQL, SeaweedFS (Almacenamiento compatible con S3), ClamAV (Antivirus), Redis (opcional para WebSockets futuros).
- **Infraestructura**: Docker y Docker Compose (entornos separados para `dev` y `prod`).

---

## 2. Arquitectura del Frontend (`/frontend`)

El frontend utiliza **Feature-Sliced Design (FSD)** adaptado, lo que significa que el código no se organiza por "tipo de archivo" (ej. todos los componentes juntos, todos los hooks juntos), sino por **Dominio o Funcionalidad**. 

### Estructura de Carpetas
```text
frontend/
├── src/
│   ├── app/           # Configuración global: App.jsx, main.jsx, Router principal.
│   ├── core/          # Lógica transversal: Api client (Axios), hooks globales de Theme, Toast, etc.
│   ├── shared/        # UI genérica: Componentes reutilizables (Botones, Navbar, Spinners), iconos, utilidades.
│   └── features/      # Módulos de negocio (¡La capa más importante!)
```

### Capa `features/`
Cada subcarpeta en `features/` representa un dominio de la aplicación (ej. `auth`, `projects`, `users`, `chat`, `admin`). Dentro de cada feature, la estructura es cohesiva:
- `/api`: Llamadas Axios específicas de ese dominio (ej. `users.api.js`).
- `/components`: Componentes UI que SOLO pertenecen a esa feature.
- `/context`: Estados globales de React específicos (ej. `ChatContext.jsx`).
- `/pages`: Las vistas ruteables completas de esa feature (ej. `Feed.jsx`, `Profile.jsx`).

### Convenciones Críticas en Frontend
1. **Estilos**: Se usa **100% Vanilla CSS Modules** (`Component.module.css`). **NO** se utiliza Tailwind CSS ni librerías de componentes (Material UI, Bootstrap). El diseño debe sentirse premium y moderno (glassmorphism, transiciones, colores HSL).
2. **Imports Absolutos**: SIEMPRE usar el alias `@/` que apunta a `src/`. No usar rutas relativas ascendentes (`../../`). *Ejemplo: `import { useAuth } from '@/features/auth/context/AuthContext'`*.
3. **Estado**: Preferir estado local (`useState`). Para estado global, usar `Context API`.

---

## 3. Arquitectura del Backend (`/backend`)

El backend está construido con **NestJS** siguiendo una arquitectura modular tradicional inspirada en Arquitectura Hexagonal.

### Estructura de Carpetas
```text
backend/
├── prisma/            # Esquema de Base de Datos y migraciones (schema.prisma).
├── src/
│   ├── auth/          # Autenticación, JWT, Guards.
│   ├── users/         # CRUD de usuarios, perfiles, lógica de membresías.
│   ├── projects/      # Gestión del repositorio, papers, upvotes, comentarios.
│   ├── chat/          # Gateways de WebSockets (Socket.io) y lógica de mensajería.
│   ├── admin/         # Rutas protegidas para administración.
│   ├── storage/       # Integración con SeaweedFS (S3) para subida de archivos.
│   └── scanner/       # Integración con ClamAV.
```

### Flujo de Datos
1. **Controllers**: Manejan las peticiones HTTP, validan los DTOs usando `class-validator` (el `ValidationPipe` global con `whitelist: true` descartará variables no declaradas).
2. **Services**: Contienen la lógica de negocio pesada y orquestan la comunicación con la base de datos.
3. **Prisma ORM**: Toda la persistencia de datos se hace a través de `PrismaService`.

### Convenciones Críticas en Backend
1. **Tipado Estricto**: Todo debe usar interfaces o DTOs.
2. **Validación**: Cualquier Input del cliente debe pasar por un DTO validado (ej. `@IsString()`, `@IsOptional()`).
3. **Seguridad**: Todas las rutas privadas deben usar `@UseGuards(JwtAuthGuard)`. Obtener el usuario activo siempre desde `@Request() req` y NUNCA confiar en IDs enviados en el Body.
4. **Almacenamiento de Archivos**: Los archivos pesados (modelos 3D, PDFs) no se guardan en el backend; se suben directamente a SeaweedFS o se manejan asíncronamente mediante el módulo `storage/`.

---

## 4. Infraestructura y Docker

El proyecto entero se levanta mediante `docker compose`.
Existen dos entornos: `docker-compose.yml` (Producción) y `docker-compose.dev.yml` (Desarrollo).

### Servicios Involucrados (`docker-compose.dev.yml`)
- `vire-postgres-dev`: Base de datos relacional (Puerto host 5433).
- `vire-seaweed-*`: Clúster de SeaweedFS emulando AWS S3 (Puertos 8333, 9333, 8888).
- `vire-clamav-dev`: Motor Antivirus (Puerto 3310).
- `vire-backend-dev`: API NestJS (Puerto 3000). *Nota: En dev, este contenedor ejecuta `npx prisma generate` automáticamente al arrancar para asegurar la sincronización de tipos.*
- `vire-frontend-dev`: Servidor Vite (Puerto 5173). Tiene configurado un proxy en `vite.config.js` que enruta `/api` al backend.

### Variables de Entorno (`.env`)
Se debe mantener UN SOLO archivo `.env` por carpeta raíz (uno en `/backend`, uno en `/frontend`). Estos NUNCA deben subirse a Git. Existe un archivo `backend/.env.example` que sirve como plantilla.

---

## Resumen de Tareas para Agentes IA
- Si vas a crear una **nueva página en frontend**: Crea el componente en `src/features/<dominio>/pages/`, añádelo en `App.jsx`, y diseña su CSS Module propio.
- Si vas a **añadir campos a la DB**: Modifica `backend/prisma/schema.prisma`, entra al contenedor del backend y corre `npx prisma db push`, luego asegúrate de actualizar el DTO correspondiente (`user.dto.ts`, etc) de lo contrario NestJS bloqueará el dato.
- **Antes de aplicar código**: Revisa cómo la base de datos estructura las relaciones. (ej. Usuarios a Perfil es 1-to-1 y las propiedades de biografía se guardan en el modelo Profile, no en User).
