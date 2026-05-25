# Fase 2 — Backend de Autenticación (Azure Functions + Cosmos DB)

> **Fecha:** 2026-05-24
> **Estado:** Documentación de referencia para implementación
> **Contexto:** Plan vigente sin Microsoft Entra External ID, Azure AD B2C, tenants externos ni App Registration móvil. La autenticación es propia dentro de Azure Functions.

---

## Índice

1. [Arquitectura general](#1-arquitectura-general)
2. [Decisión vigente de autenticación](#2-decisión-vigente-de-autenticación)
3. [Stack tecnológico](#3-stack-tecnológico)
4. [Servicios Azure utilizados](#4-servicios-azure-utilizados)
5. [Endpoints de la Fase 2](#5-endpoints-de-la-fase-2)
6. [Modelo de datos en Cosmos DB](#6-modelo-de-datos-en-cosmos-db)
7. [Flujo de registro](#7-flujo-de-registro)
8. [Flujo de login](#8-flujo-de-login)
9. [Flujo de refresh token](#9-flujo-de-refresh-token)
10. [Flujo de logout](#10-flujo-de-logout)
11. [Flujo de /api/me](#11-flujo-de-apime)
12. [Seguridad de contraseñas y tokens](#12-seguridad-de-contraseñas-y-tokens)
13. [Variables de entorno](#13-variables-de-entorno)
14. [Estructura del proyecto backend](#14-estructura-del-proyecto-backend)
15. [Plan de acción técnico](#15-plan-de-acción-técnico)
16. [Criterios de éxito](#16-criterios-de-éxito)
17. [Trazabilidad HU/RF/CP](#17-trazabilidad-hurfcp)

---

## 1. Arquitectura general

```
Kontrol Expo / React Native (cliente móvil)
        |
        | HTTPS con JWT Bearer en Authorization header
        | Registro, login, refresh, logout, GET /api/me
        v
Azure Functions API (backend y capa de seguridad)
        |
        | SDK de Cosmos DB (solo desde Azure Functions)
        v
Azure Cosmos DB for NoSQL
  ├── authUsers       (credenciales hasheadas con argon2)
  ├── users           (perfiles públicos)
  └── refreshTokens   (refresh tokens hasheados con SHA-256)
```

**Regla central:** La app móvil nunca se conecta directamente a Cosmos DB, Blob Storage ni Notification Hubs. Todo pasa por Azure Functions.

---

## 2. Decisión vigente de autenticación

### 2.1 ¿Qué cambia?

Kontrol no usará autenticación administrada por Microsoft para esta fase. La cuenta estudiante de Azure no permite crear o utilizar los servicios necesarios y el plan evita depender de tenants externos.

No se usará:

- Microsoft Entra External ID.
- Azure AD B2C.
- Tenant externo.
- App Registration móvil.
- Variables públicas de Azure para clientId, tenantId o authority en Expo.
- Validación JWT contra JWKS de Microsoft.

Por esta razón, la autenticación es **propia** e implementada dentro de Azure Functions usando:

- **argon2** para hash de contraseñas.
- **JWT** firmados con secreto propio para access y refresh tokens.
- **SHA-256** para hash de refresh tokens en base de datos.

### 2.2 ¿Qué se conserva?

| Aspecto | Plan vigente |
|---|---|
| La app no guarda contraseñas | Sí |
| El backend valida tokens antes de responder | Sí |
| Se usa JWT como access token | Sí |
| Se usa refresh token para renovar sesión | Sí |
| Cosmos DB como almacenamiento | Sí |
| Azure Functions como punto único de entrada | Sí |
| Separación de datos por userId | Sí |

### 2.3 Impacto en HU/RF existentes

- **HU-01, HU-02, HU-03** — Los flujos de registro, login y logout usan credenciales propias validadas en Azure Functions.
- **HU-12** — Define autenticación propia en Azure Functions que emite y valida JWT. La funcionalidad esperada incluye registro, login, refresh, logout y endpoints protegidos.

---

## 3. Stack tecnológico

| Capa | Tecnología |
|---|---|
| Runtime | Azure Functions Runtime 4.x |
| Lenguaje | Node.js 22 LTS |
| Lenguaje (código) | TypeScript 5.x |
| Base de datos | Azure Cosmos DB for NoSQL (modo serverless) |
| Hash de contraseñas | argon2 (salt automático, costo configurable) |
| JWT | jsonwebtoken (biblioteca npm) |
| Hash de tokens | crypto.createHash('sha256') (nativo de Node.js) |
| Validación de inputs | zod (schemas de validación) |
| UUID | uuid (v4) |
| Monitoreo | Application Insights (integrado en Azure Functions) |

---

## 4. Servicios Azure utilizados

### 4.1 En esta fase

| Servicio | Uso |
|---|---|
| **Azure Functions** | Backend principal: endpoints REST, validación de tokens, lógica de autenticación |
| **Azure Cosmos DB for NoSQL** | 3 contenedores: `authUsers`, `users`, `refreshTokens` |
| **Application Insights** | Logs y monitoreo del backend (integrado por defecto en Azure Functions) |

### 4.2 Fuera de esta fase (futuras fases)

| Servicio | Uso futuro |
|---|---|
| Azure Blob Storage | Fotos de perfil y fotos asociadas a hábitos |
| Azure Notification Hubs | Notificaciones push remotas |

> La app Expo se comunica exclusivamente con Azure Functions. Nunca directamente con Cosmos DB, Blob Storage ni Notification Hubs.

---

## 5. Endpoints de la Fase 2

| Método | Ruta | Auth requerido | Descripción |
|---|---|---|---|
| `GET` | `/api/health` | No | Health check básico del backend |
| `POST` | `/api/auth/register` | No | Registrar nuevo usuario |
| `POST` | `/api/auth/login` | No | Iniciar sesión |
| `POST` | `/api/auth/refresh` | No | Renovar access token mediante refresh token |
| `POST` | `/api/auth/logout` | No (usa refresh token) | Revocar refresh token activo sin filtrar información |
| `GET` | `/api/me` | Sí | Obtener perfil del usuario autenticado |

---

## 6. Modelo de datos en Cosmos DB

### 6.1 Contenedor `authUsers`

**Partition key:** `/emailHash`

Almacena credenciales de forma aislada del perfil público. Nunca se devuelve al cliente.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `string` | Mismo valor que `emailHash`, con formato `emailhash_<sha256>` |
| `emailHash` | `string` | SHA-256 del email normalizado con prefijo `emailhash_` (partition key) |
| `userId` | `string` | Identificador con formato `usr_<uuid>`, referencia al perfil en `users` |
| `normalizedEmail` | `string` | Email en minúsculas (original, no hasheado), para logs |
| `passwordHash` | `string` | Hash de argon2 de la contraseña |
| `status` | `"active" \| "disabled"` | Estado de la cuenta |
| `createdAt` | `string` | ISO 8601 |
| `updatedAt` | `string` | ISO 8601 |

### 6.2 Contenedor `users`

**Partition key:** `/userId`

Perfil público del usuario, devuelto en `/api/me`.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `string` | Mismo valor que `userId` |
| `userId` | `string` | Identificador con formato `usr_<uuid>` (partition key), mismo valor que en `authUsers` |
| `email` | `string` | Email original (se devuelve al cliente) |
| `displayName` | `string` | Nombre para mostrar |
| `profilePhotoId` | `string \| null` | Reservado para fase de fotos |
| `createdAt` | `string` | ISO 8601 |
| `updatedAt` | `string` | ISO 8601 |

### 6.3 Contenedor `refreshTokens`

**Partition key:** `/userId`

Almacena hashes de refresh tokens para permitir revocación y rotación.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `string` | Identificador con formato `rt_<uuid>` y `jti` del refresh token |
| `userId` | `string` | Identificador con formato `usr_<uuid>` (partition key) |
| `tokenHash` | `string` | SHA-256 del refresh token JWT |
| `createdAt` | `string` | ISO 8601 |
| `expiresAt` | `string` | ISO 8601, debe coincidir con la exp del JWT |
| `revokedAt` | `string \| null` | `null` si activo; ISO 8601 si fue revocado o usado |

### 6.4 ¿Por qué separar `authUsers` de `users`?

1. **Seguridad por capas:** si un ataque accede a `users`, no expone credenciales.
2. **Partición independiente:** `authUsers` se particiona por `emailHash` (búsqueda por email), mientras `users` se particiona por `userId` (búsqueda por ID).
3. **Auditoría:** el contenedor de credenciales puede tener políticas de acceso más restrictivas en el futuro.

---

## 7. Flujo de registro

```
Cliente                          Azure Functions                     Cosmos DB
  |                                    |                                |
  |  POST /api/auth/register           |                                |
  |  { email, password, displayName }  |                                |
  |----------------------------------->|                                |
  |                                    |                                |
  |                              1. Validar payload (Zod)               |
  |                              2. Normalizar email (trim, lowercase)  |
  |                              3. Calcular emailHash (SHA-256)        |
  |                              4. Buscar authUsers por emailHash      |
  |                                    |------------------------------->|
  |                                    |<-------------------------------| (existente → 409)
  |                              5. Generar userId (UUID v4)            |
  |                              6. Hashear password con argon2          |
  |                              7. Crear documento en authUsers         |
  |                                    |------------------------------->|
  |                              8. Crear documento en users             |
  |                                    |------------------------------->|
  |                              9. Generar accessToken (JWT, 15 min)   |
  |                             10. Generar refreshToken (JWT, 30 días) |
  |                             11. Hashear refreshToken (SHA-256)       |
  |                             12. Guardar en refreshTokens             |
  |                                    |------------------------------->|
  |  201 { accessToken, refreshToken, user }                            |
  |<-----------------------------------|                                |
```

Puntos críticos:
- El email normalizado (minúsculas + trim) evita duplicados como `User@Correo.com` vs `user@correo.com`.
- `emailHash` se usa como partition key para búsqueda eficiente por email.
- La contraseña **nunca** se guarda en texto plano.
- El refresh token **nunca** se guarda en texto plano; solo su hash SHA-256.

---

## 8. Flujo de login

```
Cliente                          Azure Functions                     Cosmos DB
  |                                    |                                |
  |  POST /api/auth/login               |                                |
  |  { email, password }                |                                |
  |----------------------------------->|                                |
  |                              1. Validar payload                     |
  |                              2. Normalizar email, calcular hash     |
  |                              3. Buscar authUsers por emailHash      |
  |                                    |------------------------------->|
  |                                    |<-------------------------------| (no existe → 401)
  |                              4. Verificar status === "active"       |
  |                              5. argon2.verify(passwordHash, pass)   |
  |                                    | (falla → 401)                  |
  |                              6. Buscar users por userId             |
  |                                    |------------------------------->|
  |                                    |<-------------------------------|
  |                              7. Generar nuevos tokens               |
  |                              8. Guardar refreshToken hasheado       |
  |                                    |------------------------------->|
  |  200 { accessToken, refreshToken, user }                            |
  |<-----------------------------------|                                |
```

---

## 9. Flujo de refresh token

```
Cliente                          Azure Functions                     Cosmos DB
  |                                    |                                |
  |  POST /api/auth/refresh             |                                |
  |  { refreshToken }                   |                                |
  |----------------------------------->|                                |
  |                              1. Verificar JWT del refreshToken      |
  |                                 - Firma (JWT_REFRESH_SECRET)        |
  |                                 - Expiración                        |
  |                                 - sub=userId y jti=refreshTokenId   |
  |                                    | (inválido → 401)               |
  |                              2. Extraer userId y refreshTokenId     |
  |                              3. Buscar refreshTokens por id + userId|
  |                                    |------------------------------->|
  |                                    |<-------------------------------| (no existe → 401)
  |                              4. Validar revokedAt y expiresAt       |
  |                              5. Comparar SHA-256(refreshToken)      |
  |                              6. Generar NUEVO accessToken           |
  |  200 { accessToken }                                                |
  |<-----------------------------------|                                |
```

**Rotación de refresh tokens:** Para esta fase no es obligatoria. El refresh token se mantiene hasta expirar o hasta que `POST /api/auth/logout` lo revoque. La implementación debe guardar solo el hash del refresh token y rechazar tokens revocados o expirados.

---

## 10. Flujo de logout

```
Cliente                          Azure Functions                     Cosmos DB
  |                                    |                                |
  |  POST /api/auth/logout              |                                |
  |  { refreshToken }                   |                                |
  |----------------------------------->|                                |
  |                              1. Validar refreshToken si es posible  |
  |                              2. Extraer userId y jti                |
  |                              3. Buscar documento por id + userId    |
  |                              4. Si existe, set revokedAt=now        |
  |                                    |------------------------------->|
  |  200 { success: true }                                               |
  |<-----------------------------------|                                |
```

**Requerimiento:** Si el refresh token no existe o es inválido, el endpoint también responde `200 { success: true }` para evitar filtrar información sobre sesiones existentes.

---

## 11. Flujo de /api/me

```
Cliente                          Azure Functions                     Cosmos DB
  |                                    |                                |
  |  GET /api/me                        |                                |
  |  Authorization: Bearer <access>     |                                |
  |----------------------------------->|                                |
  |                              1. Extraer token del header            |
  |                              2. Verificar JWT:                      |
  |                                 - Firma (JWT_ACCESS_SECRET)         |
  |                                 - Expiración                        |
  |                                 - Payload contiene sub (userId)     |
  |                                    | (inválido/expirado → 401)      |
  |                              3. Buscar users por userId             |
  |                                    |------------------------------->|
  |                                    |<-------------------------------| (no existe → 404)
  |  200 { id, userId, email, displayName,                              |
  |         profilePhotoId, createdAt }                                 |
  |<-----------------------------------|                                |
```

---

## 12. Seguridad de contraseñas y tokens

### 12.1 Hash de contraseñas (argon2)

```typescript
import * as argon2 from 'argon2';

// Hash al registrar
const passwordHash = await argon2.hash(password, {
  type: argon2.argon2id, // recomendado: resistente a side-channel y GPU
  memoryCost: 19456,     // 19 MB
  timeCost: 2,           // 2 iteraciones
  parallelism: 1
});

// Verificar al login
const isValid = await argon2.verify(passwordHash, password);
```

### 12.2 Hash de refresh tokens (SHA-256)

Los refresh tokens JWT se hashean con SHA-256 antes de guardarse. Nunca se almacena el token original.

```typescript
import { createHash } from 'node:crypto';

const tokenHash = createHash('sha256')
  .update(refreshToken)
  .digest('hex');
```

### 12.3 JWT access token

```typescript
import jwt from 'jsonwebtoken';

const accessToken = jwt.sign(
  { sub: userId, email: normalizedEmail },
  process.env.JWT_ACCESS_SECRET,
  { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
);
```

### 12.4 JWT refresh token

```typescript
const refreshToken = jwt.sign(
  { sub: userId, jti: refreshTokenId },
  process.env.JWT_REFRESH_SECRET,
  { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
);
```

Se usan **dos secretos diferentes** para access y refresh tokens.

---

## 13. Variables de entorno

### 13.1 Azure Functions Application Settings (privadas)

| Variable | Valor ejemplo | Propósito |
|---|---|---|
| `JWT_ACCESS_SECRET` | (secreto de 64+ caracteres) | Firmar access tokens JWT |
| `JWT_REFRESH_SECRET` | (secreto diferente al anterior) | Firmar refresh tokens JWT |
| `JWT_ACCESS_EXPIRES_IN` | `15m` | Duración del access token |
| `JWT_REFRESH_EXPIRES_IN` | `30d` | Duración del refresh token |
| `AZURE_COSMOS_ENDPOINT` | `https://kontrol-cosmos.documents.azure.com:443/` | URL del Cosmos DB account |
| `AZURE_COSMOS_KEY` | (primary key de Cosmos DB) | Clave de acceso a Cosmos DB |
| `AZURE_COSMOS_DATABASE_ID` | `kontrol-db` | Nombre de la base de datos |

### 13.2 Expo .env (solo públicas)

| Variable | Valor ejemplo | Propósito |
|---|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | `https://func-kontrol-dev.azurewebsites.net/api` | Base URL de Azure Functions |

**Regla:** Ninguna variable de Azure Functions aparece en Expo. `EXPO_PUBLIC_API_BASE_URL` es la única URL que conoce la app.

---

## 14. Estructura del proyecto backend

El backend de Azure Functions vivirá en un directorio separado (por ejemplo, `backend/azure-functions/` o en su propio repo). Estructura recomendada:

```
backend/
├── .funcignore
├── .gitignore
├── host.json
├── local.settings.json          # secretos para desarrollo local (no comitear)
├── package.json
├── tsconfig.json
├── src/
│   ├── functions/
│   │   ├── health.ts             # GET /api/health
│   │   ├── register.ts           # POST /api/auth/register
│   │   ├── login.ts              # POST /api/auth/login
│   │   ├── refresh.ts            # POST /api/auth/refresh
│   │   ├── logout.ts             # POST /api/auth/logout
│   │   └── me.ts                 # GET /api/me
│   ├── lib/
│   │   ├── cosmos.ts             # Inicializar cliente Cosmos DB
│   │   ├── auth.ts               # Email, argon2, JWT, SHA-256 y Bearer token
│   │   ├── schemas.ts            # Schemas Zod para request bodies
│   │   └── http.ts               # Helpers para respuestas HTTP unificadas
```

---

## 15. Plan de acción técnico

| # | Paso | Descripción |
|---|---|---|
| 1 | Revisar estructura actual | Verificar que el directorio del backend no entre en conflicto con el frontend Expo |
| 2 | Inicializar proyecto Azure Functions | `func init` con Node.js 22 + TypeScript |
| 3 | Instalar dependencias | `@azure/cosmos`, `argon2`, `jsonwebtoken`, `uuid`, `zod`, `@types/*` |
| 4 | Configurar `local.settings.json` | JWT secrets, Cosmos endpoint+key, database ID para desarrollo local |
| 5 | Crear `src/lib/cosmos.ts` | Inicializar CosmosClient y exportar acceso a contenedores |
| 6 | Crear `src/lib/auth.ts` | Funciones `normalizeEmail`, `hashEmail`, `hashPassword`, `verifyPassword`, `createAccessToken`, `createRefreshToken`, `verifyAccessToken`, `verifyRefreshToken`, `hashToken`, `getBearerToken` |
| 7 | Crear `src/lib/schemas.ts` | Schemas Zod: `registerSchema`, `loginSchema`, `refreshSchema`, `logoutSchema` |
| 8 | Crear `src/lib/http.ts` | Helpers: `ok`, `created`, `unauthorized`, `conflict`, `badRequest`, `notFound`, `serverError` |
| 9 | Implementar auth guard en `src/lib/auth.ts` | Extraer `Authorization: Bearer <token>`, verificar el JWT y obtener `userId` desde `sub` |
| 10 | Implementar `GET /api/health` | Respuesta simple `{ status: "ok", service: "kontrol-api", timestamp }` |
| 11 | Implementar `POST /api/auth/register` | Validación → hash email → check duplicado → hash password → crear authUsers → crear users → generar tokens → guardar refresh token → responder |
| 12 | Implementar `POST /api/auth/login` | Validación → buscar authUsers → verify password → buscar users → generar tokens → guardar refresh token → responder |
| 13 | Implementar `POST /api/auth/refresh` | Validar JWT refresh → extraer `sub` y `jti` → buscar token → validar hash/revocación/expiración → generar nuevo accessToken |
| 14 | Implementar `POST /api/auth/logout` | Validar refreshToken si es posible → buscar por `jti` + `userId` → `revokedAt = now` → responder siempre `{ success: true }` |
| 15 | Implementar `GET /api/me` | Auth guard → buscar users por userId → responder |
| 16 | Probar localmente con curl | `func start` + curl para cada endpoint |
| 17 | Verificar documentos en Cosmos DB | Confirmar datos en los 3 contenedores |

---

## 16. Criterios de éxito

| # | Criterio | Verificación |
|---|---|---|
| 1 | `/api/health` responde 200 | `curl -X GET http://localhost:7071/api/health` |
| 2 | `/api/auth/register` crea usuario | `curl -X POST ...` con datos válidos → `201` con tokens |
| 3 | No se puede registrar el mismo correo dos veces | Segundo intento → `409 Conflict` |
| 4 | Contraseña guardada hasheada | `authUsers.passwordHash` empieza con `$argon2id$` |
| 5 | Login con credenciales válidas devuelve tokens | `curl -X POST ...` → `200` con `accessToken` y `refreshToken` |
| 6 | Login con credenciales inválidas devuelve 401 | Password incorrecto → `401 Unauthorized` |
| 7 | `/api/me` sin token devuelve 401 | Sin `Authorization` header → `401` |
| 8 | `/api/me` con token válido devuelve usuario | Con accessToken válido → `200` con datos del perfil |
| 9 | Refresh genera nuevo accessToken | Con refreshToken válido → `200` con nuevo `accessToken` |
| 10 | Logout revoca el refreshToken | Después de logout, usar ese refreshToken → `401` |
| 11 | RefreshToken revocado ya no funciona | Intentar refresh con token revocado → `401` |
| 12 | No hay secretos hardcodeados | JWT secrets, Cosmos keys, etc. están en variables de entorno |
| 13 | No hay secretos en Expo | Expo solo tiene `EXPO_PUBLIC_API_BASE_URL` |

---

## 17. Trazabilidad HU/RF/CP

| HU | RF | Descripción |
|---|---|---|
| HU-01 | RF-01, RF-01.1, RF-01.2 | Registro de cuenta con Azure Functions |
| HU-02 | RF-02, RF-02.1 | Inicio de sesión con JWT propio |
| HU-03 | RF-03 | Cierre de sesión con revocación de tokens |
| HU-12 | RF-12, RF-12.1, RF-12.2, RF-12.3 | Autenticación propia en Azure Functions |
| HU-16 | RF-16.1 | `GET /api/health` |

| CP | Descripción | Estado |
|---|---|---|
| CP-01 | Crear cuenta | Pendiente de ejecución |
| CP-02 | Iniciar sesión | Pendiente de ejecución |
| CP-03 | Cerrar sesión | Pendiente de ejecución |
| CP-12 | Autenticación Azure Functions (JWT + argon2) | Pendiente de ejecución |

> **Nota:** CP-01, CP-02, CP-03 y CP-12 validan el flujo vigente de autenticación propia: registro, login, refresh, logout, protección de `/api/me`, credenciales hasheadas y refresh tokens hasheados.

---

## Referencias

- `docs/user-stories/ios-historias-usuario-requerimientos-kontrol.md` — HU-01, HU-02, HU-03, HU-12, HU-16
- `docs/project/aps-ciclo-de-vida-del-desarrollo-ios.md` — Arquitectura objetivo, Fase 2
- `docs/test-plans/ios-plan-pruebas-kontrol.md` — CP-01, CP-02, CP-03, CP-12
- `docs/agent-output/dry-run-analysis-001.md` — Análisis inicial de alcance
