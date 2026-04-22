# 🌹 62 Rosas Tattoo — Aplicación Web de Gestión de Citas

## 📌 Descripción del proyecto

**62 Rosas Tattoo** es una aplicación web diseñada para la gestión integral de un estudio de tatuajes. Combina una parte pública orientada a clientes con un sistema interno de administración que permite gestionar citas, disponibilidad, profesionales y contenido del estudio.

El objetivo principal es digitalizar el flujo de trabajo del estudio, facilitando tanto la experiencia del cliente como la organización interna.

---

## 🎯 Funcionalidades principales

### 👤 Usuarios (Clientes)

* Registro e inicio de sesión con autenticación JWT
* Reserva de citas en función de disponibilidad real
* Selección de tipo de cita (tattoo o consulta)
* Gestión de citas:

  * Visualización
  * Cancelación
  * Reprogramación
* Subida de imágenes de referencia para tatuajes
* Edición de datos personales

---

### 🧑‍🎨 Parte pública

* Página de inicio con información del estudio
* Visualización de tatuadores y sus perfiles
* Showroom con:

  * Trabajos realizados
  * Diseños disponibles
* Filtros por estilo, color, cover, profesional, etc.
* Integración de reseñas reales desde Google
* Página informativa del servicio de eliminación láser

---

### 🛠️ Administración (Admin)

* Panel de control interno
* Gestión completa de citas:

  * Filtrado avanzado
  * Confirmación de depósito
  * Cancelación
  * Reprogramación
  * Marcar como completadas o no-show
* Gestión de disponibilidad:

  * Ventanas de trabajo
  * Bloqueos (vacaciones, eventos, etc.)
* Gestión de profesionales:

  * Crear, editar y eliminar
* Gestión del showroom:

  * Publicar tatuajes realizados
  * Subir y gestionar diseños disponibles
* Subida de imágenes mediante Cloudinary

---

## 🧱 Tecnologías utilizadas

### 🔙 Backend

* Java 21
* Spring Boot
* Spring Security (JWT)
* JPA / Hibernate
* MariaDB
* Maven

### 🔜 Frontend

* React
* TypeScript
* Vite
* CSS personalizado

### ☁️ Otros

* Cloudinary (gestión de imágenes)
* Google Places API (reseñas)
* Docker (entorno de desarrollo y despliegue)

---

## 🏗️ Arquitectura

El backend sigue una arquitectura en capas:

* `controller` → exposición de endpoints REST
* `service` → lógica de negocio
* `repository` → acceso a datos
* `domain` → entidades
* `dto` → transferencia de datos

El frontend está estructurado en:

* `pages` → vistas principales
* `components` → componentes reutilizables
* `api` → comunicación con backend
* `context` → gestión de autenticación

---

## 📅 Sistema de citas

El sistema de reservas está basado en lógica real de disponibilidad:

* Horario configurable por profesional
* Bloqueos manuales (vacaciones, eventos…)
* Evita solapamientos automáticamente
* Duración calculada según tipo o tamaño del tatuaje
* Generación dinámica de huecos disponibles

---

## 🔐 Seguridad

* Autenticación basada en JWT
* Roles diferenciados:

  * `CLIENT`
  * `ADMIN`
* Protección de rutas tanto en backend como en frontend
* Control de acceso a recursos privados (como imágenes de referencia)

---

## 🖼️ Gestión de imágenes

* Imágenes públicas:

  * Tatuajes
  * Diseños
  * Profesionales
* Imágenes privadas:

  * Referencias de citas (acceso restringido)

---

## ⚙️ Instalación y ejecución

### 🔧 Backend

```bash
mvn spring-boot:run
```

### 💻 Frontend

```bash
npm install
npm run dev
```

---

## 🐳 Docker (opcional)

El proyecto incluye configuración con Docker para levantar la base de datos y la API en entorno local o de pruebas.

---

## 🚀 Estado del proyecto

Aplicación funcional con:

* Sistema completo de citas
* Panel de administración operativo
* Showroom dinámico
* Autenticación y roles implementados

---
