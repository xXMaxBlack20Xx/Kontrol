---
title: "Ciclo de Vida del Desarrollo iOS - Kontrol"
source_pdf: "APS_Ciclo_de_vida_del_desarrollo_iOS (1).pdf"
converted_date: "2026-05-11"
updated_at: "2026-05-24"
project: "Kontrol"
---

# Ciclo de Vida del Desarrollo iOS - Kontrol

> Markdown conversion generated from the uploaded PDF. Page footers/headers were removed where possible; original document wording was preserved.

> **NOTA DE IMPLEMENTACIÓN (2026-05-24):** El plan vigente no usa Microsoft Entra External ID, Azure AD B2C, tenants externos ni App Registration móvil. La autenticación se implementa dentro de Azure Functions con JWT, argon2 y refresh tokens hasheados en Cosmos DB. Ver `docs/architecture/fase-2-backend-autenticacion.md`.

Kontrol - Ciclo de vida
del desarrollo iOS

Nombre del Equipo                   Chiapanecos

Nombre del Proyecto                 Kontrol

Versión del documento               1.1

Actualización de alcance            21/05/2026 - Arquitectura Azure segura y local-first

Integrantes del equipo                    - Rodrigo Maximo Trigo Gonzalez

- Eduardo Yarek Mojica Salgado

Materia                             Taller de Aplicaciones iOS

Semestre                            2026-1

Instructora                         Dra. Julia Guadalupe Juarez Hernandez

Fecha de elaboración                21/04/2026

---

## 1. Introducción

### 1.1 Problema

Actualmente existe una carencia de aplicaciones de seguimiento de hábitos que sean
verdaderamente accesibles, intuitivas y fáciles de usar. Muchas de las soluciones disponibles
presentan interfaces complejas o saturadas de funciones, lo que dificulta su adopción, especialmente
para usuarios que buscan una experiencia simple. Además, estas aplicaciones suelen ofrecer una
personalización limitada, restringiendo la capacidad de los usuarios para adaptar el seguimiento a
distintos tipos de hábitos según sus necesidades.

### 1.2 Descripción general del sistema

Kontrol es una aplicación móvil para iPhone enfocada en el seguimiento de hábitos personales. Su
contexto de uso se centra en personas que desean llevar un control diario de actividades como
estudio, ejercicio, lectura, descanso, hidratación o cualquier otro hábito que requiere constancia.

La propuesta del sistema parte de una necesidad recurrente: muchas aplicaciones de hábitos
resultan excesivamente complejas, sobrecargadas o difíciles de adoptar para usuarios que solo
necesitan registrar acciones cotidianas de manera rápida. En respuesta a ello, Kontrol plantea una
experiencia simple, visual y eficiente, donde el usuario pueda entender su progreso sin fricción
operativa ni exceso de configuraciones.

#### 1.2.1 Usuarios principales

- Usuario final registrado: persona que utiliza la aplicación para crear, editar, eliminar y dar
seguimiento a sus hábitos.
- Equipo de desarrollo: responsable de implementar, mantener y verificar el sistema conforme a
los requerimientos documentados.
- Docente / evaluadora académica: stakeholder indirecto que revisa la calidad documental,
consistencia y cumplimiento metodológico del proyecto.

#### 1.2.2 Módulos dentro del alcance

- Gestión de cuenta y autenticación.
- Inicio y cierre de sesión.
- Gestión de hábitos.
- Registro de cumplimiento diario.
- Visualización de rachas y progreso.
- Gestión de recordatorios locales.
- Configuración general y consulta del aviso de privacidad.
- Autenticación cloud con Azure Functions (JWT + argon2, autenticación propia).
- Sincronización local-first mediante Azure Functions y Cosmos DB.
- Fotos privadas mediante Blob Storage y URLs temporales.
- Registro de dispositivos y notificaciones push remotas mediante Azure Notification Hubs.
- Monitoreo técnico mediante Application Insights.

#### 1.2.3 Fuera del alcance del MVP

- Compartición de hábitos o estadísticas con otros usuarios.
- Widgets de iOS.
- Integración con Apple Watch o dispositivos externos.
- Analítica avanzada predictiva.
- Funciones sociales.
- Sincronización multi-dispositivo en tiempo real.
- Acceso directo desde la app móvil a Cosmos DB, Blob Storage o Notification Hubs usando llaves privadas.
- Backend distinto a Azure Functions para la arquitectura definida.

---

## 2. Refinamiento de requerimientos

### 2.1 Enlace a el documento de Historias de Usuario y Requerimientos
<https://docs.google.com/document/d/12yAIdbnCTjFz7zfpIyq1L2PvBKRRtsp9uselEoQzOes/edit?usp=>
sharing

## 3. Diseño UX/UI mejorado

### 3.1 Enlace a el Figman con las pantalla
<https://www.figma.com/design/m49nPVFKdWGaZxob9oi7DA/Kontrol_Trigo_Mojica?node-id=0-1&t=w>
WfsDybhIzM2IDr2-1

### 3.2 Descripción del enfoque UX/UI

El diseño UX/UI de Kontrol se orienta a una experiencia minimalista, clara y consistente con patrones
de diseño de iOS. La interfaz prioriza la rapidez de uso, la jerarquía visual y la comprensión
inmediata del progreso del usuario.

Las pantallas principales del sistema se estructuran para reducir fricción operativa y facilitar la
ejecución de acciones esenciales, como crear hábitos, marcar cumplimiento diario, consultar rachas,
revisar progreso y configurar recordatorios. La navegación del sistema seguirá un esquema Tabs +
Stack, permitiendo acceso rápido a las secciones principales y navegación profunda hacia pantallas
secundarias como detalle, edición o configuración.

## 4. Arquitectura

La arquitectura de Kontrol se plantea bajo un enfoque incremental. En el MVP actual, el sistema se
concibe como una aplicación móvil centrada en el dispositivo del usuario, privilegiando rapidez,
simplicidad operativa y persistencia local. De forma paralela, se contempla una arquitectura de
evolución futura para soportar crecimiento técnico, sincronización y escalabilidad si el alcance del
proyecto llegara a ampliarse.

### 4.1 Herramientas y tecnologías del proyecto

Para el desarrollo de Kontrol se utilizarán las siguientes herramientas:

- Visual Studio Code como entorno principal de desarrollo.
- React Native con Expo SDK 54 para la construcción de la aplicación móvil.

---

- Expo Go como entorno de validación rápida para flujos que no dependan de capacidades nativas no disponibles.
- Development builds o builds nativas para validar autenticación profunda, tokens nativos y notificaciones push remotas.
- GitHub para el control de versiones, colaboración y seguimiento de cambios del proyecto.
- Postman para la validación de endpoints de Azure Functions y pruebas de integración.
- Autenticación propia en Azure Functions (JWT + argon2) para registro, inicio de sesión y emisión de tokens JWT.
- Azure Functions Runtime 4.x con Node.js 22 como backend seguro.
- Azure Cosmos DB for NoSQL en modo serverless como almacenamiento cloud principal.
- Azure Blob Storage con contenedores privados para fotos.
- Azure Notification Hubs para notificaciones push remotas mediante APNs y FCM v1.
- Application Insights para logs, monitoreo y diagnóstico del backend.

### 4.2 Arquitectura del MVP local-first

En su etapa actual, Kontrol seguirá una arquitectura cliente local-first, organizada en capas lógicas
dentro de la aplicación móvil:

- Capa de presentación: pantallas, componentes visuales y navegación.
- Capa de lógica de negocio: validaciones, reglas de cálculo de rachas, control de sesiones,
manejo de cumplimiento diario y gestión de recordatorios.
- Capa de persistencia local: almacenamiento de sesión, hábitos, registros y configuraciones
necesarias para el funcionamiento del MVP.
- Capa de sincronización: cola local de operaciones pendientes y cliente HTTP hacia Azure Functions cuando exista conectividad.

Esta estructura permitirá mantener separadas las responsabilidades principales del sistema y
facilitará la trazabilidad entre requerimientos, diseño, construcción y pruebas.

### 4.3 Arquitectura Azure objetivo

Kontrol adopta una arquitectura cliente-servidor segura para las funciones cloud, manteniendo la app móvil como cliente local-first:

- React Native + Expo funcionará como cliente móvil.
- Azure Functions implementará autenticación propia (JWT + argon2) como autoridad de autenticación.
- Azure Functions será el backend seguro para validar JWT, extraer userId, autorizar operaciones y acceder a servicios cloud.
- Azure Cosmos DB for NoSQL almacenará usuarios, hábitos, cumplimientos, recordatorios, dispositivos y metadata de fotos.
- Azure Blob Storage almacenará archivos reales, como fotos de perfil o fotos asociadas a hábitos.
- Azure Notification Hubs registrará tokens nativos APNs/FCM y enviará notificaciones push remotas.
- Application Insights registrará telemetría técnica, errores y disponibilidad.
- Postman servirá para validar endpoints y flujos de integración.

La regla central de seguridad es que la app móvil nunca deberá comunicarse directamente con Cosmos DB, Blob Storage ni Notification Hubs usando
llaves privadas. Todo acceso deberá pasar por Azure Functions.

Diagrama lógico:

```text
Kontrol Expo / React Native
        |
        | Registro, login y requests con JWT Bearer
        v
Azure Functions API (autenticación propia JWT + argon2)
        |----> Azure Cosmos DB for NoSQL
        |----> Azure Blob Storage
        |----> Azure Notification Hubs
        |----> Application Insights
```

Endpoints mínimos del backend:

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/me`
- `POST /api/sync/habits`
- `GET /api/habits`
- `POST /api/completions`
- `GET /api/progress`
- `POST /api/reminders`
- `GET /api/reminders`
- `POST /api/photos/upload-url`
- `POST /api/photos/metadata`
- `GET /api/photos/{photoId}`
- `DELETE /api/photos/{photoId}`
- `POST /api/devices/register`
- `POST /api/notifications/send-test`

Contenedores recomendados en Cosmos DB:

- `authUsers`, partition key `/emailHash`
- `users`, partition key `/userId`
- `refreshTokens`, partition key `/userId`
- `habits`, partition key `/userId`
- `habitCompletions`, partition key `/userId`
- `reminders`, partition key `/userId`
- `devices`, partition key `/userId`
- `photos`, partition key `/userId`

> **NOTA DE IMPLEMENTACIÓN:** Expo no debe configurar variables de Entra, B2C, tenants ni App Registration. La app móvil solo conoce la URL pública de Azure Functions; los secretos viven en Azure Functions Application Settings.

Variables públicas permitidas en Expo:

- `EXPO_PUBLIC_API_BASE_URL`

Variables privadas de Azure Functions Application Settings (Fase 2 - autenticación):

- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`
- `AZURE_COSMOS_ENDPOINT`
- `AZURE_COSMOS_KEY`
- `AZURE_COSMOS_DATABASE_ID=kontrol-db`

Variables privadas de Azure Functions (fases futuras):

- `AZURE_STORAGE_ACCOUNT_NAME`
- `AZURE_STORAGE_ACCOUNT_KEY`
- `AZURE_STORAGE_CONTAINER_USER_PHOTOS=user-photos`
- `AZURE_NOTIFICATION_HUB_CONNECTION_STRING`
- `AZURE_NOTIFICATION_HUB_NAME=nh-kontrol-dev`
- `APPLICATIONINSIGHTS_CONNECTION_STRING`

### 4.4 Justificación arquitectónica

El enfoque arquitectónico elegido busca equilibrar dos necesidades: por un lado, conservar un MVP
viable, simple, funcional y usable sin conexión; por otro, incorporar una base cloud segura y justificable
para autenticación, respaldo, fotos, notificaciones y monitoreo. De esta manera, Kontrol mantiene su
experiencia local-first y evita exponer secretos de infraestructura dentro de la app móvil.

---

## 5. Planeación del proyecto

La planeación del siguiente sprint se definirá con base en la priorización funcional del MVP y en la
necesidad de construir primero aquellas capacidades sin las cuales el sistema no puede operar
correctamente.

### 5.1 Must Have

- Consolidar la trazabilidad entre historias de usuario, requerimientos funcionales,
requerimientos no funcionales y casos de prueba.
- Implementar el registro de cuenta mediante autenticación propia en Azure Functions (JWT + argon2).
- Implementar el inicio y cierre de sesión.
- Implementar la gestión de hábitos: crear, editar y eliminar.
- Implementar el registro de cumplimiento diario.
- Implementar el cálculo y actualización de rachas.
- Implementar la persistencia local del sistema.
- Construir la navegación principal del sistema.
- Implementar la pantalla principal de hábitos y la vista de detalle.
- Implementar la consulta del aviso de privacidad.
- Validar formularios, mensajes de error y estados vacíos principales.
- Implementar autenticación propia en Azure Functions (JWT + argon2, 3 contenedores en Cosmos DB).
- Implementar Azure Functions como backend seguro y único punto de acceso cloud.
- Configurar Cosmos DB serverless con partición por `/userId`.
- Configurar Blob Storage privado para fotos y generación de URLs temporales desde backend.
- Configurar Notification Hubs para tokens nativos APNs/FCM v1.
- Configurar Application Insights para monitoreo básico.

### 5.2 Should Have

- Implementar la vista de progreso con indicadores y gráficas simples.
- Implementar recordatorios locales.
- Refinar la consistencia visual de la interfaz con lineamientos iOS.
- Desarrollar pruebas unitarias para validaciones clave y cálculo de rachas.
- Desarrollar pruebas de integración para navegación, sesión y persistencia.
- Implementar sincronización local-first de hábitos y cumplimientos.
- Validar endpoints protegidos y de integración: `GET /api/health`, `GET /api/me`, `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `POST /api/sync/habits` y `GET /api/habits`.

### 5.3 Could Have

- Mejorar microinteracciones visuales y retroalimentación al usuario.
- Optimizar componentes reutilizables para facilitar el mantenimiento.
- Incorporar mejoras menores de experiencia de usuario derivadas de pruebas internas.
- Mejorar seguridad con Managed Identity y Key Vault después de la primera versión funcional.
- Incorporar flujos sociales o analítica avanzada solo si el alcance académico cambia.

### 5.4 Criterio general de priorización

La priorización del sprint se realizará considerando:

- Dependencia funcional entre módulos.
- Valor directo para el usuario final.
- Riesgo técnico de implementación.
- Impacto en la demostración funcional del MVP.
- Consistencia con el documento de requerimientos vigente.

---

## 6. Estrategia de Pruebas

La estrategia de pruebas propuesta para Kontrol será la estrategia por niveles. El sistema será probado
mediante una estrategia que incluye fases como pruebas unitarias, de integración, de sistema y de aceptación.
Las pruebas se basarán principalmente en los requerimientos funcionales definidos, asegurando que cada uno
sea verificable mediante pruebas basadas en los criterios de aceptación. Se priorizará pruebas funcionales
para validar operaciones importantes (ej: CRUD de hábitos, autenticación), pruebas de rendimiento para
verificar tiempos de respuesta que se definieron, pruebas de usabilidad alineadas con el enfoque minimalista
del sistema, pruebas de persistencia para garantizar integración de datos locales, pruebas de regresión para
mantener estabilidad ante cambios.

### 6.1 Pruebas unitarias

Se enfocarán en validar componentes y funciones individuales del sistema, especialmente:

- Validación de campos obligatorios,
- Validación de sesión y tokens,
- Lógica de creación y edición de hábitos,
- Cálculo de rachas,
- Control de duplicidad de cumplimiento diario,
- Validación de configuración de recordatorios.

### 6.2 Pruebas de integración

Se utilizarán para verificar la interacción correcta entre módulos, por ejemplo:

- Registro e inicio de sesión con persistencia local,
- Relación entre creación de hábito y visualización en pantalla principal,
- Actualización del cumplimiento diario y recálculo de racha,
- Edición o eliminación de hábitos con impacto en vistas de detalle y progreso,
- Integración entre hábitos y recordatorios locales.
- Validación de login con autenticación propia en Azure Functions (JWT + argon2) y consumo de `GET /api/me`.
- Sincronización de hábitos con Azure Functions y Cosmos DB.
- Subida de fotos mediante URL temporal generada por Azure Functions.
- Registro de dispositivos en Notification Hubs.

### 6.3 Pruebas de sistema

Se aplicarán sobre el sistema completo para comprobar que Kontrol funcione como una solución integral,
evaluando:

- Navegación entre pantallas,
- Flujo completo de autenticación,
- Flujo completo de gestión de hábitos,
- Consulta de progreso,
- Funcionamiento de configuración y aviso de privacidad,
- Autenticación, autorización y separación de datos por usuario,
- Sincronización con comportamiento local-first,
- Privacidad del contenedor de fotos,
- Notificación remota de prueba,
- Health check y logs en Application Insights,
- Comportamiento general de la aplicación bajo condiciones normales de uso.

### 6.4 Pruebas de aceptación

Las pruebas de aceptación se basarán en los criterios Happy path, Alterno y Fracaso definidos en el
documento de Historias de Usuario y Requerimientos. Su propósito será comprobar que cada funcionalidad
implementada responde a lo esperado por el usuario y cumple con los requerimientos documentados.

---

### 6.5 Criterios generales de calidad

Las pruebas buscarán verificar:

- Cumplimiento funcional de los requerimientos,
- Tiempos de respuesta definidos en los RNF,
- Claridad de mensajes y retroalimentación visual,
- Consistencia de datos,
- Persistencia correcta después de cerrar y reabrir la aplicación,
- Rechazo de requests no autorizados en Azure Functions,
- Ausencia de secretos privados en la app Expo,
- Separación de datos por userId en servicios cloud,
- Experiencia de uso simple, intuitiva y alineada con el enfoque minimalista del proyecto.

## 7. Despliegue y Mantenimiento

### 7.1 Estrategia de despliegue

El desarrollo de Kontrol se realizará de forma iterativa bajo un enfoque ágil. Durante la etapa de construcción
del MVP, las versiones de trabajo se valorarán de manera incremental conforme se completen los módulos
priorizados del sistema.

El despliegue de desarrollo se enfocará en:

- validación continua de funcionalidades implementadas,
- revisión frecuente de errores e inconsistencias,
- integración progresiva de módulos terminados,
- demostraciones parciales por sprint,
- control de versiones en GitHub para mantener historial, respaldo y trazabilidad de cambios.

El despliegue cloud de desarrollo se organizará en fases:

- Fase 1: crear Resource Group, Azure Functions, Cosmos DB, Storage Account, Notification Hubs y Application Insights, sin crear tenants externos ni App Registration móvil.
- Fase 2: implementar backend mínimo de autenticación con `GET /api/health`, `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout` y `GET /api/me`.
- Fase 3: conectar Expo con API client, login, sesión segura en SecureStore y endpoints protegidos.
- Fase 4: implementar sincronización local-first de hábitos y cumplimientos con Azure Functions y Cosmos DB.
- Fase 5: agregar fotos privadas con SAS temporal y registro de dispositivos/notificaciones con token nativo.

### 7.2 Estrategia de mantenimiento

El mantenimiento del sistema se realizará por iteraciones, considerando tanto correcciones como mejoras
evolutivas. Este mantenimiento incluirá:

- Corrección de defectos detectados durante pruebas,
- Ajustes derivados de validaciones académicas y funcionales,
- Refactorización de componentes reutilizables,
- Mejora incremental del rendimiento y la usabilidad,
- Actualización controlada de módulos como progreso, recordatorios y gestión de hábitos.

### 7.3 Mantenimiento preventivo, correctivo y evolutivo

- Preventivo: reorganización del código, revisión de convenciones, separación de responsabilidades y
limpieza de componentes.
- Correctivo: solución de errores funcionales, visuales o de persistencia detectados durante el desarrollo
y prueba.
- Evolutivo: incorporación controlada de Managed Identity, Key Vault, mejoras de sincronización,
ampliación de módulos o nuevas capacidades si el alcance del proyecto crece.

---

## 8. Conclusión

El presente documento permite definir de manera estructurada el ciclo de vida del desarrollo de Kontrol,
estableciendo cómo se organizan las etapas de planeación, análisis, diseño, construcción, pruebas, despliegue
y mantenimiento del sistema.

A través de este documento, el equipo acuerda una ruta de trabajo clara para desarrollar una aplicación iOS
orientada al seguimiento de hábitos personales, manteniendo consistencia con los requerimientos actuales del
proyecto y con la arquitectura Azure definida para autenticación, backend seguro, datos cloud, fotos privadas,
notificaciones remotas y monitoreo.

Asimismo, el documento funciona como una guía para asegurar que el desarrollo del MVP se lleve a cabo de
forma ordenada, verificable y escalable, priorizando las funcionalidades esenciales del sistema, conservando
el enfoque local-first y evitando que secretos de infraestructura queden expuestos en la app móvil.

---
