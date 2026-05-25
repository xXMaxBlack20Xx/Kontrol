---
title: "Historias de Usuario y Requerimientos - Kontrol"
source_pdf: "IOS_Historias_Usuario_Requerimientos_Kontrol (1).pdf"
converted_date: "2026-05-11"
updated_at: "2026-05-24"
project: "Kontrol"
---

# Historias de Usuario y Requerimientos - Kontrol

> Markdown conversion generated from the uploaded PDF. Page footers/headers were removed where possible; original document wording was preserved.

> **NOTA DE IMPLEMENTACIÓN (2026-05-24):** El plan vigente no usa Microsoft Entra External ID, Azure AD B2C, tenants externos ni App Registration móvil. Kontrol implementa autenticación propia dentro de Azure Functions con JWT, argon2 y refresh tokens hasheados en Cosmos DB. Ver `docs/architecture/fase-2-backend-autenticacion.md`.

HISTORIAS DE USUARIO Y REQUERIMIENTOS
Etapa Análisis - Historias de Usuario y Requerimientos de Software bajo el estándar ISO/IEC/IEEE 29148:2018

Nombre del Equipo                    Chiapanecos

Nombre del Proyecto                  Kontrol

Integrantes del equipo                      -   Salgado Mojica Eduardo Yarek

- Trigo Gonzalez Rodrigo Maximo

Materia                              Administración de Proyectos de Software

Semestre                             2026-1

Instructora                          Dra. Julia Guadalupe Juarez Hernandez

Fecha de elaboración                 20 / 04 / 2026

Versión del documento                1.68

Actualización de alcance             21 / 05 / 2026 - Arquitectura Azure segura y local-first

---

## 1. Introducción
>
> Instrucción: Describir el propósito del documento, su relación con el SRS y el uso del estándar ISO/IEC/IEEE 29148:2018, incluyendo una visión general del sistema Endure.

El presente documento define las historias de usuario y los requerimientos del sistema Kontrol, una aplicación móvil orientada al registro y
seguimiento de hábitos personales. Su finalidad es traducir las necesidades del negocio y de los usuarios en especificaciones funcionales
y no funcionales claras, consistentes y verificables, alineadas con el estándar ISO/IEC/IEEE 29148:2018.

Kontrol busca resolver la necesidad de registrar hábitos de forma simple, rápida e intuitiva, priorizando una experiencia visual minimalista
y consistente con lineamientos de diseño para iOS. La aplicación está pensada para que el usuario capture hábitos, marque cumplimiento
diario, consulte rachas y visualice su progreso mediante gráficas simples y comprensibles, conservando un comportamiento local-first y
agregando una arquitectura cloud segura con autenticación propia en Azure Functions (JWT + argon2), Cosmos DB, Blob Storage y Notification Hubs.

## 2. Descripción general del sistema

Presentar una visión global del sistema Endure, su contexto de uso, usuarios principales y los módulos incluidos dentro del alcance definido.

Kontrol es una aplicación móvil para iPhone enfocada en el seguimiento de hábitos personales. Su contexto de uso se centra en personas
que desean llevar un control diario de actividades como estudio, ejercicio, lectura, descanso, hidratación o cualquier otro hábito que
requiere constancia.

La propuesta del sistema parte de una necesidad recurrente: muchas aplicaciones de hábitos resultan excesivamente complejas,
sobrecargadas o difíciles de adoptar para usuarios que solo necesitan registrar acciones cotidianas de manera rápida. En respuesta a
ello, Kontrol plantea una experiencia simple, visual y eficiente, donde el usuario pueda entender su progreso sin fricción operativa ni
exceso de configuraciones.

### 2.1 Usuarios principales

- Usuario final registrado: persona que utiliza la aplicación para crear, editar, eliminar y dar seguimiento a sus hábitos.
- Equipo de desarrollo: responsable de implementar, mantener y verificar el sistema conforme a los requerimientos documentados.
- Docente / evaluadora académica: stakeholder indirecto que revisa la calidad documental, consistencia y cumplimiento
metodológico del proyecto.

---

### 2.2 Módulos dentro del alcance

- Gestión de cuenta y autenticación.
- Inicio y cierre de sesión.
- Gestión de hábitos.
- Registro de cumplimiento diario.
- Visualización de rachas y progreso.
- Gestión de recordatorios locales.
- Configuración general y consulta del aviso de privacidad.
- Autenticación cloud con Azure Functions (JWT + argon2, autenticación propia).
- Sincronización local-first mediante Azure Functions.
- Almacenamiento de fotos mediante Blob Storage privado y URLs temporales.
- Registro de dispositivos para notificaciones remotas mediante Azure Notification Hubs.
- Monitoreo técnico mediante Application Insights.

### 2.3 Fuera del alcance del MVP

- Compartición de hábitos o estadísticas con otros usuarios.
- Widgets de iOS.
- Integración con Apple Watch o dispositivos externos.
- Analítica avanzada predictiva.
- Funciones sociales.
- Sincronización multi-dispositivo en tiempo real.
- Backend distinto a Azure Functions para la versión definida.
- Acceso directo desde la app móvil a Cosmos DB, Blob Storage o Notification Hubs usando llaves privadas.

## 3. Objetivo
>
> Instrucción: Definir el objetivo del documento y del sistema, enfocado en la correcta documentación y uso de los requerimientos.

El objetivo de este documento es definir de manera formal las historias de usuario y los requerimientos asociados del sistema Kontrol, de
tal forma que sirvan como base para las actividades de diseño, construcción, pruebas y validación del proyecto. Asimismo, el documento
busca asegurar que cada requerimiento documentado cumpla con atributos de calidad compatibles con el estándar ISO/IEC/IEEE
29148:2018.

### 3.1 Atributos de calidad considerados

- Necesario (Necessary): El requerimiento es esencial para satisfacer una capacidad, factor de calidad o restricción del sistema; su
eliminación dejaría una deficiencia que no puede ser cubierta por otros requerimientos.
- Adecuado (Appropriate): El nivel de detalle y la intención del requerimiento son proporcionales al nivel de abstracción del
sistema Kontrol, evitando incluir decisiones de diseño prematuras.

---

- Inequívoco (Unambiguous): Cada requerimiento está redactado de forma que solo posee una interpretación única, clara y
concisa, eliminando el uso de términos subjetivos.
- Completo (Complete): El requerimiento incluye toda la información necesaria para ser comprendido de forma independiente, sin
necesidad de explicaciones externas adicionales.
- Singular (Singular): El requerimiento expresa una única capacidad o restricción, evitando el uso de conjunciones que agrupen
múltiples funciones en una sola sentencia.
- Factible (Feasible): El requerimiento puede ser realizado dentro de las restricciones técnicas, de tiempo y de presupuesto del
equipo BienaTech, con un nivel de riesgo aceptable.
- Verificable (Verifiable): El requerimiento está redactado de manera que su cumplimiento pueda ser comprobado a través de un
método de inspección, análisis, demostración o prueba medible.

## 4. Justificación
>
> Instrucción: Explicar la problemática que motiva el desarrollo del sistema y la importancia de documentar requerimientos claros para su correcta implementación.

El desarrollo de Kontrol surge de la necesidad de contar con una herramienta de seguimiento de hábitos que combine tres elementos que
normalmente no aparecen juntos en una sola solución: simplicidad, rapidez de uso y claridad visual. Muchas aplicaciones existentes
resuelven el problema del registro, pero lo hacen mediante flujos extensos, configuraciones poco intuitivas o pantallas saturadas que
terminan reduciendo la constancia del usuario.

En ese sentido, el problema principal no es únicamente la ausencia de registro, sino la dificultad de sostener el uso diario de la
herramienta. Si registrar un hábito exige demasiados pasos, el usuario abandona el seguimiento; si el progreso no se presenta de forma
clara, el valor percibido disminuye; y si la aplicación no resulta intuitiva, el sistema deja de apoyar el hábito y se convierte en una carga.

Por ello, documentar adecuadamente los requerimientos de Kontrol es fundamental. Una mala redacción produciría ambigüedad,
inconsistencias entre módulos y decisiones de implementación desconectadas del objetivo real del producto. En cambio, un conjunto de
requerimientos claros permitirá construir una aplicación coherente con su visión: una app iOS minimalista, eficiente y fácil de adoptar para
el seguimiento cotidiano de hábitos.

---

## 5. Stakeholders importantes
>
> Instrucción: Identificar los stakeholders clave del sistema Endure, describiendo su rol e influencia en los requerimientos y uso del sistema.

- Usuario final

Es el actor principal del sistema. Busca registrar hábitos, darles seguimiento diario y comprender su avance mediante una experiencia
clara, rápida y visualmente ordenada.

- Equipo de desarrollo

Es el responsable de traducir las necesidades del usuario en una solución funcional. Su interés es contar con requerimientos claros,
consistentes y verificables que reduzcan retrabajo y ambigüedad durante la construcción.

- Docente / evaluadora

Su interés radica en verificar que el proyecto cumpla con estándares de documentación, claridad metodológica y consistencia entre
historias, requerimientos, diseño y pruebas.

## 6. Glosario
>
> Instrucción: Instrucción: Incluya aquí los términos técnicos o propios del dominio del problema que un lector externo podría no conocer. Ordene alfabéticamente.

Término                                                                            Definición en el contexto del proyecto

Categoría                                 Clasificación opcional asignada a un hábito para facilitar su organización visual.

Cumplimiento diario                       Registro que indica que un hábito fue realizado en la fecha actual.

Estado vacío                              Vista mostrada cuando no existen hábitos registrados y la aplicación debe orientar al usuario a crear su primer hábito.

Frecuencia                                Regla que define cada cuánto debe realizarse un hábito, por ejemplo diaria o ciertos días de la semana.

Hábito                                    Actividad personal definida por el usuario que será registrada y monitoreada dentro del sistema.

Historial                                 Conjunto de registros previos de cumplimiento asociados a un hábito.

---

Kontrol                                  Aplicación móvil del proyecto, enfocada en el seguimiento de hábitos personales.

Onboarding                               Flujo inicial de uso donde el usuario conoce la lógica general de la aplicación o completa información básica.

Persistencia local                       Almacenamiento de información directamente en el dispositivo para permitir uso sin conexión.

Local-first                              Enfoque donde la app puede operar con datos locales y sincronizar con la nube cuando exista conectividad.

Autenticación propia en Azure Functions    Servicio de identidad propio (JWT + argon2) para registro, inicio de sesión y emisión de tokens JWT.

Azure Functions                          Backend seguro que valida tokens, aplica reglas de autorización y accede a servicios cloud.

Azure Cosmos DB for NoSQL                Base de datos cloud para usuarios, hábitos, cumplimientos, recordatorios, dispositivos y metadatos.

Azure Blob Storage                       Servicio de almacenamiento de archivos usado para fotos de perfil o fotos asociadas a hábitos.

Azure Notification Hubs                  Servicio para registrar dispositivos y enviar notificaciones push remotas.

SAS temporal                             URL firmada con vigencia limitada para cargar o leer archivos privados en Blob Storage.

Token nativo de dispositivo              Token APNs o FCM obtenido por la app para registrar el dispositivo en Notification Hubs.

Progreso                                 Representación visual o numérica del avance del usuario respecto a sus hábitos registrados.

Racha                                    Número de periodos consecutivos válidos en los que un hábito ha sido completado.

Recordatorio                             Aviso local programado por el usuario para apoyar el cumplimiento de un hábito.

Persistencia local Expo-compatible       Mecanismo de almacenamiento local compatible con Expo para sesión, hábitos, cumplimientos y pendientes de sincronización.

Vista de detalle                         Pantalla que presenta información específica de un hábito individual, incluyendo estado, historial y racha.

## 7. Historias de usuario y Requerimientos Asociados
>
> Instrucción: En esta sección, el equipo debe transformar las necesidades del negocio en especificaciones técnicas. Cada fila debe cumplir con el "estándar de oro" de ambos recursos.

Nota de actualización 1.68 (2026-05-24): HU-01 y HU-02 quedan alineadas al nuevo plan Azure sin tenants externos. El registro, inicio de sesión, recuperación futura de cuenta y validación de credenciales se implementan mediante autenticación propia en Azure Functions (JWT + argon2).
La app puede conservar sesión y datos operativos local-first, pero no debe almacenar contraseñas en texto plano ni validar credenciales por cuenta propia.
Ver `docs/architecture/fase-2-backend-autenticacion.md`.

Requerimiento no funcional                           Criterio de aceptación
Requerimiento funcional
Historia de usuario
ID                                                                                                           El sistema debe + atributo de                     Given (Dado) + contexto
El sistema debe + acción +
(Como [rol] quiero [función] para [Beneficio])                                                       calidad + condición medible +                     When (Cuándo) + acción
condición
contexto                         Then (Entonces) + resultado esperado

HU-01   Como           quiero registrar     para acceder a              -   [RF-01] El sistema                  -   [RNF-01] (Rendimiento)                              Happy path
usuario        una cuenta           las funciones de                 deberá registrar una                     El sistema deberá
nuevo          con mi correo        Kontrol y                        cuenta mediante Azure Functions          completar el proceso de                -   Dado que el usuario se encuentra en
correo               conservar mis                    usuario capture un                       registro en un tiempo                       la pantalla de registro
electrónico y        datos dentro de                  correo electrónico con                   máximo de 3 segundos                   -   Cuando ingresa un correo válido,
contraseña           la aplicación.                   formato válido, una                      bajo condiciones normales                   una contraseña válida, acepta el
contraseña válida y                      de uso.                                    aviso de privacidad y confirma
confirme el formulario                                                          -   Entonces el sistema deberá registrar
de registro.                       -   [RNF-01.1] (Seguridad)                     la cuenta y permitir
El sistema deberá                           continuar al acceso inicial.

- [RF-01.1] El sistema                     procesar la contraseña
deberá validar que el                    únicamente en Azure
correo electrónico no se                 Functions y guardar solo
encuentre previamente                    `passwordHash`, evitando
registrado en `authUsers`                su conservación en texto
antes de                                plano.
confirmar la creación

---

de la cuenta.                 -   [RNF-01.2] (Usabilidad)                     Alterno
El sistema deberá mostrar

- [RF-01.2] El sistema                mensajes claros cuando        -   Dado que el usuario se encuentra en
deberá validar que la               exista un campo inválido,          la pantalla de registro
contraseña cumpla con               vacío o duplicado.            -   Cuando corrige un campo inválido y
una longitud mínima                                                    vuelve a confirmar
de 8 caracteres antes                                             -   Entonces el sistema deberá permitir
de permitir el registro.                                              finalizar el registro si ya no existen
errores.
- [RF-01.3] El sistema
deberá requerir la
aceptación explícita del                                                         Fracaso
aviso de privacidad
antes de completar el                                             -   Dado que el usuario se encuentra en
registro.                                                             la pantalla de registro
- Cuando intenta registrarse con
- [RF-01.4] El sistema                                                   correo inválido, contraseña corta,
deberá almacenar la                                                    datos duplicados o sin aceptar el
cuenta registrada                                                      aviso de privacidad
localmente cuando el                                              -   Entonces el sistema no deberá
proceso finalice                                                       completar el registro y deberá
correctamente.                                                        mostrar la causa correspondiente.

HU-02   Como      quiero iniciar   para acceder de         -   [RF-02] El sistema             -   [RNF-02] (Rendimiento)                    Happy path
usuario   sesión con mi    forma segura a               deberá autenticar al                El sistema deberá
nuevo     correo           mis hábitos y                usuario cuando ingrese              completar la autenticación    -   Dado que el usuario se encuentra en
electrónico y    progreso en                  un correo electrónico               en un tiempo máximo de 2           la pantalla de inicio de sesión
contraseña       Kontrol.                     y contraseña que                    segundos bajo condiciones     -   Cuando ingresa credenciales válidas
coincidan con una                   normales de uso.                  y confirma
cuenta registrada en                                             -   Entonces el sistema deberá
Azure Functions.              -   [RNF-02.1] (Usabilidad)           autenticarlo y mostrar la pantalla
El sistema deberá mostrar          principal.

- [RF-02.1] El sistema                mensajes claros cuando el
deberá impedir el                   inicio de sesión falle.
acceso cuando las
credenciales                   -   [RNF-02.2] (Seguridad)
ingresadas no                       El sistema deberá proteger
coincidan con las                   el acceso a pantallas
credenciales hasheadas              privadas mientras no exista                  Alterno
almacenadas.
una sesión activa válida.
- [RF-02.2] El sistema                                              -   Dado que el usuario ya cuenta con
deberá mantener la                                                     una sesión vigente
sesión activa hasta que                                           -   Cuando vuelve a abrir la aplicación
el usuario cierre                                                 -   Entonces el sistema deberá
sesión manualmente o                                                   conservar la sesión y mostrar la
hasta que la sesión                                                    pantalla principal sin solicitar
expire según la

---

política definida por la                                              credenciales nuevamente.
aplicación.

- [RF-02.3] El sistema                                                            Fracaso
deberá redirigir al
usuario autenticado a la                                         -   Dado que el usuario se encuentra en
pantalla principal                                                    la pantalla de inicio de sesión
después de un inicio                                             -   Cuando ingresa credenciales
de sesión exitoso.                                                   incorrectas
- Entonces el sistema no deberá
permitir el acceso y deberá mostrar
un mensaje de error.

HU-03   Como         quiero cerrar     para proteger mi         -   [RF-03] El sistema             -   [RNF-03] (Rendimiento)                   Happy path
usuario      mi sesión         información                   deberá cerrar la sesión             El sistema deberá
registrado   activa desde la   cuando deje de                activa cuando el                    completar el cierre de       -   Dado que el usuario tiene una
configuración     usar la                       usuario seleccione la               sesión en un tiempo               sesión activa
aplicación.                   opción de cerrar                    máximo de 2 segundos         -   Cuando accede a configuración,
sesión desde la                     después de la confirmación        selecciona cerrar sesión y confirma
pantalla de                         del usuario.                -   Entonces el sistema deberá finalizar
configuración y                                                       la sesión y mostrar la pantalla de
confirme la acción.           -   [RNF-03.1] (Seguridad)           inicio de sesión.
El sistema no deberá

- [RF-03.1] El sistema                mostrar información
deberá invalidar la                 privada del usuario                          Alterno
sesión local cuando el              después de que la sesión
cierre se complete                  haya sido cerrada.           -   Dado que el usuario cerró su sesión
correctamente.                                                  -   Cuando otro usuario abre la
aplicación en el mismo dispositivo
- [RF-03.2] El sistema                                             -   Entonces el sistema deberá mostrar
deberá redirigir al                                                   la pantalla de acceso sin exponer
usuario a la pantalla de                                              información del usuario anterior.
inicio de sesión
después del cierre de
sesión.
Fracaso
- [RF-03.3] El sistema
deberá restringir el                                             -   Dado que el usuario ya no cuenta
acceso a pantallas                                                    con una sesión activa
privadas mientras no                                             -   Cuando intenta acceder a una
exista una sesión                                                     pantalla protegida
activa válida.                                                   -   Entonces el sistema deberá
redirigirlo a la pantalla de inicio de
sesión.

---

HU-04   Como          quiero crear un    para comenzar a            -   [RF-04] El sistema             -   [RNF-04] (Rendimiento)                    Happy path
usuario       nuevo hábito       registrar                       deberá registrar un                 El sistema deberá registrar
registrado    personalizado      actividades                     hábito cuando el                    el hábito en un tiempo        -   Dado que el usuario se encuentra en
importantes                     usuario capture un                  máximo de 2 segundos               la pantalla de creación de hábito
dentro de Kontrol.              nombre válido, una                  después de la confirmación    -   Cuando ingresa un nombre válido,
frecuencia válida y                 del usuario.                      selecciona una frecuencia y confirma
confirme la creación                                              -   Entonces el sistema deberá registrar
del hábito.                   -   [RNF-04.1] (Usabilidad)           el hábito y mostrarlo en la lista
El sistema deberá permitir         principal.

- [RF-04.1] El sistema                crear un hábito en un
deberá impedir la                   máximo de 5 acciones
creación del hábito                 principales, excluyendo la                   Alterno
cuando el nombre                    captura manual de texto.
obligatorio se                                                    -   Dado que el usuario se encuentra en
encuentre vacío.              -   [RNF-04.2] (Usabilidad)           la pantalla de creación de hábito
El sistema deberá mostrar     -   Cuando registra además una
- [RF-04.2] El sistema                mensajes claros cuando un          categoría, meta o recordatorio inicial
deberá permitir registrar           campo obligatorio no haya     -   Entonces el sistema deberá guardar
datos opcionales como               sido completado                    también esa información
categoría, meta o                   correctamente.                     complementaria.
recordatorio inicial
durante la creación del
hábito.                                                                         Fracaso

- [RF-04.3] El sistema                                              -   Dado que el usuario se encuentra en
deberá almacenar                                                       la pantalla de creación de hábito
localmente el hábito                                              -   Cuando intenta guardar el hábito sin
creado y mostrarlo en la                                               nombre o sin una frecuencia válida
pantalla principal                                                -   Entonces el sistema no deberá
cuando el registro sea                                                 registrar el hábito y deberá mostrar
exitoso.                                                              un mensaje indicando el error.

- [RF-04.4] El sistema
deberá mostrar un
estado vacío orientativo
cuando el usuario aún
no tenga hábitos
registrados.

HU-05   Como          quiero editar la   para mantener              -   [RF-05] El sistema             -   [RNF-05] (Rendimiento)                    Happy path
usuario del   información de     actualizado mi                  deberá permitir editar un           El sistema deberá guardar
sistema       un hábito          seguimiento                     hábito existente cuando             la edición del hábito en un   -   Dado que el usuario cuenta con un
existente          según mis                       el usuario acceda a la              tiempo máximo de 2                 hábito registrado
necesidades.                    opción de edición                   segundos después de la        -   Cuando accede a editarlo, modifica
desde la lista principal            confirmación del usuario.         datos válidos y confirma
o desde la vista de                                               -   Entonces el sistema deberá guardar
los cambios y actualizar la

---

detalle.                     -   [RNF-05.1] (Consistencia           información mostrada.
de datos)

- [RF-05.1] El sistema               El sistema deberá
deberá permitir                    mantener la relación entre                   Alterno
actualizar el nombre,              el hábito editado y su
frecuencia, categoría,             historial de registros        -   Dado que el usuario accede a la
meta y recordatorio                previos.                          edición de un hábito
asociado cuando el                                               -   Cuando modifica únicamente uno de
usuario confirme              -   [RNF-05.2] (Usabilidad)           sus campos editables
cambios válidos.                  El sistema deberá mostrar     -   Entonces el sistema deberá
la información actual del          actualizar solamente ese dato y
- [RF-05.2] El sistema               hábito antes de que el             conservar el resto de la información.
deberá conservar el                usuario realice cambios.
identificador del hábito y
su historial de                                                                Fracaso
cumplimiento cuando
únicamente se                                                    -   Dado que el usuario se encuentra
modifiquen atributos                                                  editando un hábito
editables.                                                      -   Cuando intenta guardar valores
inválidos o deja vacío un campo
- [RF-05.3] El sistema                                                  obligatorio
deberá reflejar los                                              -   Entonces el sistema no deberá
cambios confirmados en                                                guardar los cambios y deberá
la pantalla principal y                                               mostrar la causa del error.
en la vista de detalle.

HU-06   Como      quiero eliminar   para dejar de              -   [RF-06] El sistema            -   [RNF-06] (Rendimiento)                    Happy path
usuario   un hábito         mostrar o                       deberá permitir eliminar           El sistema deberá
nuevo     existente         registrar hábitos               un hábito cuando el                completar la eliminación en   -   Dado que el usuario cuenta con un
que ya no deseo                 usuario seleccione la              un tiempo máximo de 2              hábito registrado
seguir.                         opción de eliminación              segundos después de la        -   Cuando selecciona eliminar,
y confirme                         confirmación del usuario.         confirma la acción y el proceso
explícitamente la                                                     finaliza correctamente
acción.                      -   [RNF-06.1] (Usabilidad)      -   Entonces el sistema deberá retirar el
El sistema deberá                  hábito de la aplicación.

- [RF-06.1] El sistema               presentar una advertencia
deberá solicitar                   clara antes de ejecutar la
confirmación antes de              eliminación definitiva.                      Alterno
eliminar el hábito para
prevenir eliminaciones                                           -   Dado que el usuario selecciona la
accidentales.                                                        opción de eliminar
- Cuando decide cancelar antes de
- [RF-06.2] El sistema                                                  confirmar
deberá retirar el hábito                                         -   Entonces el sistema no deberá
de la lista principal                                                 eliminar el hábito ni modificar su
cuando la eliminación                                                 información.
sea confirmada

---

correctamente.                                                                 Fracaso

- [RF-06.3] El sistema                                             -   Dado que el usuario intenta eliminar
deberá impedir que un                                                 un hábito
hábito eliminado                                                 -   Cuando la operación no puede
continúe apareciendo                                                  completarse correctamente
en vistas de detalle,                                            -   Entonces el sistema no deberá
progreso o                                                            eliminar el hábito y deberá mostrar
recordatorios activos.                                               un mensaje indicando que la acción
no pudo finalizarse.

HU-07   Como          quiero marcar   para llevar un             -   [RF-07] El sistema            -   [RNF-07] (Rendimiento)                    Happy path
usuario del   un hábito       registro continuo               deberá registrar el                El sistema deberá registrar
sistema       como            de mi                           cumplimiento diario de             el cumplimiento diario en     -   Dado que el usuario cuenta con un
completado en   cumplimiento.                   un hábito cuando el                un tiempo máximo de 1              hábito visible en la pantalla principal
el día actual                                   usuario seleccione la              segundo después de la         -   Cuando selecciona la acción de
acción de completar                acción del usuario.               completar en la fecha actual
para la fecha actual.                                           -   Entonces el sistema deberá registrar

- [RNF-07.1] (Confiabilidad)        el cumplimiento, actualizar el estado
- [RF-07.1] El sistema               El sistema deberá                  del hábito y recalcular la racha.
deberá impedir más de              conservar el registro de
un registro de                     cumplimiento después de
cumplimiento válido                cerrar y reabrir la                          Alterno
para el mismo hábito               aplicación.
en la misma fecha.                                              -   Dado que el usuario ya marcó el
- [RNF-07.2] (Usabilidad)           hábito del día
- [RF-07.2] El sistema               El sistema deberá ofrecer     -   Cuando regresa a la pantalla
deberá actualizar el               retroalimentación visual           principal
estado visible del hábito          inmediata al completar el     -   Entonces el sistema deberá mostrar
en la pantalla principal           hábito.                           el hábito como completado en esa
inmediatamente                                                        fecha.
después del registro
exitoso.
Fracaso
- [RF-07.3] El sistema
deberá recalcular la                                             -   Dado que el usuario ya registró el
racha asociada cuando                                                 cumplimiento del hábito en la fecha
el cumplimiento del                                                   actual
día se registre                                                  -   Cuando intenta volver a marcarlo el
correctamente.                                                       mismo día
- Entonces el sistema no deberá
duplicar el registro y deberá
conservar un solo cumplimiento
válido.

---

HU-08   Como          quiero             para entender            -   [RF-08] El sistema            -   [RNF-08] (Rendimiento)                    Happy path
usuario del   consultar el       cómo va mi                    deberá mostrar la vista            El sistema deberá cargar la
sistema       detalle de un      constancia                    de detalle de un hábito            vista de detalle en un        -   Dado que el usuario tiene hábitos
hábito, su         individual.                   cuando el usuario                  tiempo máximo de 2                 registrados
racha y su                                       seleccione uno de los              segundos cuando el            -   Cuando selecciona uno de ellos
historial básico                                 hábitos registrados                usuario seleccione un              desde la pantalla principal
desde la pantalla                  hábito.                      -   Entonces el sistema deberá mostrar
principal.                                                           su detalle, estado del día, racha

- [RNF-08.1] (Usabilidad)           actual e historial disponible.
- [RF-08.1] El sistema               El sistema deberá
deberá mostrar en la               presentar la información
vista de detalle el                del hábito de forma clara,                   Alterno
nombre del hábito, su              ordenada y visualmente
frecuencia, el estado              consistente con el resto de   -   Dado que el usuario accede al
del día y la racha                 la interfaz.                      detalle de un hábito con pocos
actual.                                                              registros
- Cuando aún no existe suficiente
- [RF-08.2] El sistema                                                  información histórica
deberá mostrar el                                                -   Entonces el sistema deberá mostrar
historial básico de                                                   la información básica y un mensaje
cumplimiento cuando                                                   explicando que todavía no hay
existan registros                                                     historial suficiente.
previos asociados al
hábito.
Fracaso
- [RF-08.3] El sistema
deberá mostrar un                                                -   Dado que el usuario intenta abrir el
mensaje orientativo                                                   detalle de un hábito inexistente o
cuando el hábito aún                                                  eliminado
no cuente con                                                    -   Cuando la información ya no se
suficientes registros                                                 encuentra disponible
para presentar                                                   -   Entonces el sistema no deberá
historial significativo.                                             mostrar datos inválidos y deberá
regresar a una vista consistente.

HU-09   Como          quiero             para visualizar          -   [RF-09] El sistema            -   [RNF-09] (Rendimiento)                    Happy path
usuario del   consultar mi       mis avances de                deberá mostrar una                 El sistema deberá cargar la
sistema       progreso           forma rápida e                vista de progreso                  vista de progreso en un       -   Dado que el usuario cuenta con
general            intuitiva.                    general cuando el                  tiempo máximo de 3                 registros de cumplimiento
mediante                                         usuario acceda a la                segundos bajo condiciones     -   Cuando accede a la sección de
gráficas e                                       sección                            normales de uso.                  progreso
indicadores                                      correspondiente                                                  -   Entonces el sistema deberá mostrar
desde la navegación           -   [RNF-09.1] (Usabilidad)           sus indicadores y visualizaciones
principal.                        El sistema deberá                  con base en los datos disponibles.
representar el progreso

- [RF-09.1] El sistema               con visualizaciones
deberá mostrar                     simples, legibles y

---

indicadores visuales del           consistentes con el                          Alterno
avance general del                 enfoque minimalista de la
usuario con base en                aplicación.                  -   Dado que el usuario se encuentra en
los registros                                                         la sección de progreso
almacenados                   -   [RNF-09.2] (Consistencia      -   Cuando cambia el periodo de
localmente.                       de datos)                         consulta entre semanal y mensual
Las gráficas deberán          -   Entonces el sistema deberá

- [RF-09.2] El sistema               calcularse únicamente a            actualizar la visualización sin alterar
deberá permitir                    partir de información              los datos almacenados.
consultar el progreso              persistida en la base de
por periodos                       datos local.
predefinidos, al menos                                                          Fracaso
semanal y mensual,
cuando existan datos                                             -   Dado que el usuario no cuenta con
suficientes.                                                         datos suficientes
- Cuando accede a la sección de
- [RF-09.3] El sistema                                                  progreso
deberá mostrar una                                               -   Entonces el sistema no deberá
gráfica o indicador vacío                                             mostrar gráficas engañosas o vacías
orientativo cuando no                                                 sin contexto y deberá indicar que
existan registros                                                     aún no existen datos suficientes.
suficientes para
generar visualización
significativa.

HU-10   Como          quiero          para recibir           -   [RF-10] El sistema            -   [RNF-10] (Rendimiento)                    Happy path
usuario del   configurar      avisos que me               deberá permitir crear un           El sistema deberá guardar
sistema       recordatorios   ayuden a                    recordatorio local                 la creación, edición o        -   Dado que el usuario cuenta con un
locales para    mantener mi                 cuando el usuario                  eliminación de un                  hábito registrado y permisos de
mis hábitos     constancia.                 seleccione un hábito,              recordatorio en un tiempo          notificación habilitados
una hora válida y                  máximo de 2 segundos          -   Cuando selecciona una hora válida y
confirme la                        después de la confirmación         confirma la creación del recordatorio
programación del                   del usuario.                 -   Entonces el sistema deberá guardar
recordatorio.                                                        el recordatorio y programar la

- [RNF-10.1] (Usabilidad)           notificación local.
- [RF-10.1] El sistema               El sistema deberá informar
deberá permitir editar un          claramente cuando los
recordatorio existente             permisos de notificación no                  Alterno
cuando el usuario                  se encuentren habilitados.
seleccione uno                                                   -   Dado que el usuario ya tiene un
previamente creado y          -   [RNF-10.2] (Confiabilidad)         recordatorio configurado
confirme cambios                   El sistema deberá             -   Cuando edita su hora o elimina el
válidos.                          conservar los recordatorios        recordatorio existente
configurados después de       -   Entonces el sistema deberá
- [RF-10.2] El sistema               cerrar y volver a abrir la         actualizar o retirar la programación
deberá permitir eliminar           aplicación.                       correspondiente
un recordatorio

---

existente cuando el                                                            Fracaso
usuario confirme la
acción                                                           -   Dado que el usuario intenta crear un
correspondiente.                                                     recordatorio

- Cuando no selecciona un hábito, no
- [RF-10.3] El sistema                                                  define una hora válida o no cuenta
deberá emitir la                                                      con permisos de notificación
notificación local en la                                              habilitados
fecha y hora                                                     -   Entonces el sistema no deberá
programadas cuando el                                                 completar la programación y deberá
dispositivo cuente con                                                mostrar la causa correspondiente.
permisos de
notificación
habilitados.

- [RF-10.4] El sistema
deberá impedir la
creación del
recordatorio cuando no
exista un hábito
asociado o una hora
válida seleccionada.

HU-11   Como          quiero          para conocer             -   [RF-11] El sistema            -   [RNF-11] (Rendimiento)                   Happy path
usuario del   consultar el    cómo se                       deberá mostrar el aviso            El sistema deberá cargar el
sistema       aviso de        gestionan mis                 de privacidad cuando el            aviso de privacidad en un     -   Dado que el usuario se encuentra en
privacidad      datos dentro de               usuario acceda a la                tiempo máximo de 2                 la pantalla de configuración
desde la        la aplicación.                opción                             segundos al abrir la opción   -   Cuando selecciona la opción de
configuración                                 correspondiente                    correspondiente.                  aviso de privacidad
desde la pantalla de                                             -   Entonces el sistema deberá mostrar
configuración.               -   [RNF-11.1] (Usabilidad)           el contenido correspondiente en
El sistema deberá                  formato legible.

- [RF-11.1] El sistema               presentar el aviso con
deberá mostrar la                  formato legible,
versión vigente del aviso          desplazamiento adecuado                      Alterno
de privacidad junto con            y estructura clara.
su fecha de                                                      -   Dado que el aviso de privacidad está
actualización cuando                                                  almacenado localmente
dicha información se                                             -   Cuando el usuario lo consulta desde
encuentre disponible.                                                configuración
- Entonces el sistema deberá mostrar
- [RF-11.2] El sistema                                                  la versión disponible en el
deberá permitir                                                       dispositivo.
consultar la versión local
del aviso de privacidad
cuando ésta se
encuentre almacenada

---

en el dispositivo.                                                   Fracaso

- [RF-11.3] El sistema                                    -   Dado que el usuario intenta
deberá mostrar un                                            consultar el aviso de privacidad
mensaje informativo                                     -   Cuando el contenido no se
cuando el aviso no se                                        encuentra disponible
encuentre disponible                                    -   Entonces el sistema deberá mostrar
temporalmente.                                              un mensaje informando que el aviso
no puede visualizarse
temporalmente.

---

### 7.1 Historias de usuario y requerimientos asociados a la arquitectura Azure

Esta sección actualiza el alcance técnico de Kontrol para incorporar servicios cloud sin romper el principio local-first. La app móvil no debe
conectarse directamente a Cosmos DB, Blob Storage ni Notification Hubs con llaves privadas; todo acceso a servicios Azure debe pasar por Azure
Functions y por validación de tokens emitidos por el backend de autenticación propio.

> **NOTA DE IMPLEMENTACIÓN:** El plan vigente usa autenticación propia dentro de Azure Functions (JWT + argon2), sin Microsoft Entra External ID, Azure AD B2C, tenants externos ni App Registration móvil. Ver `docs/architecture/fase-2-backend-autenticacion.md`.

HU-12 Como usuario quiero registrarme e iniciar sesión mediante el backend de autenticación de Kontrol para acceder de forma segura a mis datos.

- [RF-12] El sistema deberá exponer endpoints REST en Azure Functions para registro, login, refresh y logout de usuarios.
- [RF-12.1] El sistema deberá emitir un access token JWT válido después de un inicio de sesión exitoso.
- [RF-12.2] Azure Functions deberá validar el JWT, su firma y su expiración antes de responder endpoints protegidos.
- [RF-12.3] Azure Functions deberá extraer un userId estable desde el token y usarlo para autorizar operaciones por usuario.
- [RNF-12] (Seguridad) La app móvil no deberá almacenar contraseñas ni secretos de Azure.
- Criterio de aceptación: dado que el usuario inicia sesión con credenciales válidas, cuando la app llama `GET /api/me`, entonces Azure Functions deberá devolver el userId del token y rechazar solicitudes sin token o con token inválido.

HU-13 Como usuario quiero sincronizar mis hábitos y cumplimientos con Azure para conservar respaldo cloud sin perder uso sin conexión.

- [RF-13] El sistema deberá exponer `POST /api/sync/habits`, `GET /api/habits`, `POST /api/completions` y `GET /api/progress` desde Azure Functions.
- [RF-13.1] El sistema deberá guardar hábitos, cumplimientos y progreso en Cosmos DB usando `/userId` como partition key.
- [RF-13.2] El sistema deberá conservar pendientes locales cuando no exista conectividad y sincronizarlos al recuperar conexión.
- [RF-13.3] El sistema deberá impedir que un usuario consulte o modifique datos asociados a otro userId.
- [RNF-13] (Confiabilidad) La pérdida temporal de internet no deberá bloquear la creación, edición, eliminación o marcado local de hábitos.
- Criterio de aceptación: dado que el usuario tiene hábitos locales pendientes, cuando recupera conexión y se ejecuta la sincronización, entonces Cosmos DB deberá reflejar los cambios autorizados y la app deberá mantener una vista consistente.

HU-14 Como usuario quiero subir fotos de perfil o fotos asociadas a hábitos para personalizar mi experiencia sin exponer archivos públicamente.

- [RF-14] El sistema deberá exponer `POST /api/photos/upload-url`, `POST /api/photos/metadata`, `GET /api/photos/{photoId}` y `DELETE /api/photos/{photoId}` desde Azure Functions.
- [RF-14.1] Azure Functions deberá generar URLs SAS temporales para cargar o leer archivos en Blob Storage privado.
- [RF-14.2] El sistema deberá guardar en Cosmos DB solamente la metadata de la foto, incluyendo userId, blobPath, contentType, sizeBytes y createdAt.
- [RF-14.3] El sistema deberá impedir que una URL o metadata permita acceso a fotos de otro usuario.
- [RNF-14] (Seguridad) El contenedor de Blob Storage deberá permanecer privado y no deberá exponerse mediante acceso público anónimo.
- Criterio de aceptación: dado que el usuario solicita subir una foto válida, cuando obtiene una URL temporal y completa la carga, entonces la metadata deberá quedar registrada y el archivo deberá seguir privado fuera de la URL temporal.

HU-15 Como usuario quiero recibir notificaciones push remotas para reforzar mis recordatorios cuando la app tenga integración cloud habilitada.

- [RF-15] El sistema deberá solicitar permisos de notificaciones y obtener el token nativo del dispositivo mediante `getDevicePushTokenAsync`.
- [RF-15.1] El sistema deberá enviar platform, pushProvider y nativePushToken a `POST /api/devices/register`.
- [RF-15.2] Azure Functions deberá registrar la instalación en Azure Notification Hubs y guardar metadata del dispositivo en Cosmos DB.
- [RF-15.3] Azure Functions deberá exponer `POST /api/notifications/send-test` para validar el envío controlado de una notificación de prueba.
- [RNF-15] (Compatibilidad) Las notificaciones push remotas deberán validarse en development build o build nativa, no en Expo Go.
- Criterio de aceptación: dado que el usuario concedió permisos y la app obtuvo un token APNs o FCM, cuando se registra el dispositivo, entonces Notification Hubs deberá tener una instalación asociada al userId.

HU-16 Como equipo de desarrollo quiero monitorear el backend de Kontrol para diagnosticar fallas de autenticación, sincronización, fotos y notificaciones.

- [RF-16] Azure Functions deberá registrar eventos relevantes y errores en Application Insights.
- [RF-16.1] El sistema deberá exponer `GET /api/health` para validar disponibilidad básica del backend.
- [RF-16.2] Los logs no deberán incluir contraseñas, llaves privadas, connection strings ni tokens completos.
- [RNF-16] (Observabilidad) El backend deberá permitir identificar errores por endpoint, código de estado y correlación temporal.
- Criterio de aceptación: dado que se ejecuta una solicitud válida o inválida contra el backend, cuando ocurre una respuesta, entonces deberá existir evidencia de operación o error en Application Insights sin secretos expuestos.

---

## 8. Requerimientos Interfaz de Usuario (interfaz gráfica)
>
> Instrucción: Documente aquí los diagramas de casos de uso, actividades, secuencia de componentes y de arquitectura.

La interfaz de usuario de Kontrol deberá priorizar una experiencia minimalista, clara y consistente con patrones de diseño móvil
orientados a iOS. La interfaz deberá reducir fricción de uso y permitir que las acciones principales del sistema se realicen eficazmente.

### 8.1 Requerimientos generales de interfaz

- La navegación principal deberá organizarse mediante un esquema Tabs + Stack.
- La pantalla principal deberá mostrar los hábitos registrados con su estado del día visible.
- Las acciones primarias, como crear hábito, marcar cumplimiento o abrir detalle, deberán ser fácilmente identificables.
- La interfaz deberá usar jerarquía visual clara, espaciado consistente y etiquetas comprensibles.
- Los mensajes de error, confirmación y estados vacíos deberán ser visibles, breves y orientados a la acción.
- El sistema deberá evitar pantallas saturadas de elementos secundarios o configuraciones innecesarias en el MVP.

### 8.2 Pantallas mínimas del sistema

- Pantalla de registro.
- Pantalla de inicio de sesión.
- Pantalla principal de hábitos.
- Pantalla de creación de hábitos.
- Pantalla de edición de hábito.
- Pantalla de detalle del hábito.
- Pantalla de progreso.
- Pantalla de recordatorios.
- Pantalla de configuración.
- Vista del aviso de privacidad.

### 8.3 Requerimientos visuales específicos

- La pantalla principal deberá mostrar hábitos en formato de lista o tarjetas simples.
- La pantalla de detalle deberá enfatizar racha, estado actual e historial básico del hábito.
- La sección de progreso deberá utilizar gráficas sencillas y de fácil lectura.
- Las pantallas de formularios deberán resaltar los campos obligatorios y mostrar validación inmediata cuando sea necesario.
- La configuración deberá concentrar acciones globales, como cerrar sesión, permisos y consulta del aviso de privacidad.

---

## 9. Requerimientos Interfaz Externas
>
> Instrucción: Documente aquí los diagramas de casos de uso, actividades, secuencia de componentes y de arquitectura.

Kontrol opera bajo un enfoque local-first, pero interactúa con servicios externos del dispositivo y con una arquitectura Azure segura para
autenticación, sincronización, fotos, notificaciones remotas y monitoreo.

### 9.1 Interfaz con base de datos local

- El sistema deberá utilizar persistencia local compatible con Expo para sesión, hábitos, registros de cumplimiento, recordatorios y cola de sincronización.
- El sistema deberá mantener estructuras equivalentes para hábitos, registros de cumplimiento, recordatorios, preferencias y pendientes de sincronización.

### 9.2 Interfaz con notificaciones del dispositivo

- El sistema deberá interactuar con el servicio de notificaciones locales del sistema operativo para programar recordatorios.
- El sistema deberá solicitar permiso de notificaciones antes de activar recordatorios locales.

### 9.3 Interfaz con almacenamiento local del dispositivo

- El sistema deberá conservar sesión, preferencias básicas y datos de hábitos dentro del almacenamiento local definido por la
arquitectura.
- El sistema deberá conservar datos pendientes cuando no exista conectividad y sincronizarlos posteriormente con Azure Functions.

### 9.4 Interfaz con capacidades del sistema operativo

- El sistema deberá adaptarse a las dimensiones de pantalla del iPhone.
- El sistema deberá conservar consistencia de navegación y comportamiento con el entorno móvil del dispositivo.

### 9.5 Interfaz con Azure Functions (autenticación propia)

- El sistema deberá usar autenticación propia dentro de Azure Functions (JWT + argon2) para registro, inicio de sesión y emisión de tokens JWT.
- La app Expo deberá configurar únicamente `EXPO_PUBLIC_API_BASE_URL` para comunicarse con el backend.
- Los tokens JWT se almacenarán de forma segura en el dispositivo (SecureStore de Expo).
- Ver `docs/architecture/fase-2-backend-autenticacion.md` para los detalles de implementación.

### 9.6 Interfaz con Azure Functions

- La app móvil deberá consumir los endpoints de Azure Functions mediante `EXPO_PUBLIC_API_BASE_URL`.
- Azure Functions deberá validar cada token antes de acceder a datos privados.
- Azure Functions deberá ser la única capa con acceso a llaves o connection strings de Cosmos DB, Blob Storage y Notification Hubs.

### 9.7 Interfaz con Cosmos DB, Blob Storage y Notification Hubs

- Cosmos DB deberá almacenar datos de aplicación en contenedores separados para users, habits, habitCompletions, reminders, devices y photos, todos con partition key `/userId`.
- Blob Storage deberá mantener el contenedor `user-photos` en modo privado y solo aceptar operaciones mediante URLs temporales generadas por Azure Functions.
- Notification Hubs deberá registrar tokens nativos APNs o FCM v1 obtenidos por la app; no se deberá usar ExpoPushToken como token principal para este flujo.

---

## 10. Eficiencia
>
> Instrucción: Documente aquí los diagramas de casos de uso, actividades, secuencia de componentes y de arquitectura.

Los requerimientos de eficiencia del sistema están orientados a asegurar rapidez de respuesta y fluidez operativa en las funciones
principales del MVP.

### 10.1 Requerimientos de eficiencia

- El inicio de sesión deberá completarse en un máximo de 2 segundos bajo condiciones normales de uso.
- El registro de un nuevo hábito deberá completarse en un máximo de 2 segundos después de la confirmación.
- El registro de cumplimiento diario deberá reflejarse en un máximo de 1 segundo.
- La vista de detalle del hábito deberá cargarse en un máximo de 2 segundos.
- La vista de progreso deberá cargarse en un máximo de 3 segundos.
- Las operaciones de recordatorios deberán guardarse en un máximo de 2 segundos.
- Las llamadas a Azure Functions deberán rechazar solicitudes no autorizadas sin consultar servicios de datos internos.
- La sincronización cloud deberá ejecutarse de forma no bloqueante para no impedir el uso local de la app.

### 10.2 Consideraciones de eficiencia de interacción

- El usuario deberá poder registrar un hábito sin recorrer flujos extensos.
- Las pantallas principales no deberán presentar bloqueos perceptibles durante el uso normal.
- Las visualizaciones de progreso deberán generarse a partir de datos locales para reducir la latencia operativa.
- La app deberá priorizar datos locales durante la interacción y sincronizar con Azure en segundo plano cuando sea posible.

## 11. Mantenimiento
>
> Instrucción: Documente aquí los diagramas de casos de uso, actividades, secuencia de componentes y de arquitectura.

Kontrol deberá construirse de forma que facilite corrección de errores, evolución funcional y reutilización de componentes.

---

### 11.1 Requerimientos de mantenibilidad

- El código deberá organizarse por módulos funcionales claramente definidos.
- La interfaz deberá componerse mediante componentes reutilizables para reducir duplicidad.
- Los nombres de archivos, componentes, funciones y estructuras de datos deberán seguir una convención uniforme.
- Las reglas de negocio relevantes, como cálculo de rachas y validación de hábitos, deberán mantenerse separadas de la capa visual.
- Los cambios en la interfaz no deberán requerir modificaciones innecesarias en la lógica de persistencia.

### 11.2 Evidencia de mantenimiento esperado

- El sistema deberá poder incorporar nuevos tipos de hábitos o nuevas categorías sin rediseñar por completo el flujo principal.
- El sistema deberá permitir mantenimiento incremental del módulo de recordatorios y del módulo de progreso.

## 12. Portabilidad
>
> Instrucción: Documente aquí los diagramas de casos de uso, actividades, secuencia de componentes y de arquitectura.

Aunque Kontrol está orientada principalmente a iPhone, el proyecto deberá contemplar principios básicos de portabilidad dentro del alcance definido.

### 12.1 Requerimientos de portabilidad

- La aplicación deberá ejecutarse correctamente en las versiones recientes de iOS definidas por el equipo del proyecto.
- La interfaz deberá adaptarse a distintos tamaños de pantalla de iPhone sin pérdida de información principal.
- El sistema deberá conservar funcionamiento en orientación vertical, que será la orientación prioritaria del MVP.
- La arquitectura del proyecto deberá favorecer una futura adaptación controlada a otras plataformas si el alcance llegará a ampliarse.

## 13. Restricciones de diseño y construcción
>
> Instrucción: Documente aquí los diagramas de casos de uso, actividades, secuencia de componentes y de arquitectura.

El desarrollo de Kontrol estará sujeto a las siguientes restricciones:

---

- La aplicación deberá implementarse con React Native como framework principal del proyecto.
- La persistencia local deberá implementarse mediante mecanismos compatibles con Expo y deberá permitir operación sin conexión.
- La arquitectura cloud deberá implementarse con Azure Functions como backend seguro.
- La app móvil no deberá contener `AZURE_COSMOS_KEY`, `AZURE_STORAGE_CONNECTION_STRING`, `AZURE_NOTIFICATION_HUB_CONNECTION_STRING` ni otros secretos privados.
- La app móvil no deberá conectarse directamente a Cosmos DB, Blob Storage ni Notification Hubs.
- Los secretos deberán configurarse en Azure Functions Application Settings y, en una etapa posterior, podrán migrarse a Managed Identity y Key Vault.
- El MVP no deberá incluir widgets de iOS.
- El MVP no deberá incluir funciones sociales ni compartición externa de estadísticas.
- La interfaz deberá conservar un enfoque visual minimalista y consistente con buenas prácticas de aplicaciones iOS.
- El sistema deberá orientarse a un flujo de uso simple, evitando complejidad innecesaria en el registro de hábitos.

## 14. Requerimientos legales y reglamentarios
>
> Instrucción: Documente aquí los diagramas de casos de uso, actividades, secuencia de componentes y de arquitectura.

El sistema deberá contemplar requerimientos básicos relacionados con privacidad, consentimiento y tratamiento de información del usuario.

### 14.1 Privacidad y consentimiento

- El sistema deberá presentar un aviso de privacidad accesible desde la configuración.
- El sistema deberá solicitar la aceptación del aviso de privacidad antes del registro de la cuenta.
- El sistema deberá limitar la recopilación de datos personales a los estrictamente necesarios para autenticación, hábitos, fotos, recordatorios, sincronización y notificaciones.
- El aviso de privacidad deberá informar que la autenticación se realiza mediante el backend propio de Kontrol en Azure Functions y que ciertos datos de aplicación pueden almacenarse en Azure.

### 14.2 Protección de datos

- El sistema deberá evitar el almacenamiento inseguro de credenciales.
- El sistema deberá restringir el acceso a la información privada mientras no exista una sesión activa válida.
- El sistema no deberá guardar contraseñas en texto plano en Cosmos DB ni en la persistencia local de la app; Cosmos DB solo podrá almacenar `passwordHash` generado con argon2.
- El backend deberá autorizar el acceso a datos por userId extraído del token validado.
- El sistema deberá manejar la información del usuario conforme a las reglas de privacidad definidas para el proyecto académico y la normativa
aplicable.

---

## 15. Análisis de Consistencia y Conclusiones
>
> Instrucción: Documente la resolución de conflictos entre requerimientos y valide la consistencia del conjunto final para asegurar el cumplimiento de las metas del proyecto.

---

## 17. Referencias bibliográficas
>
> Instrucción: Documente la resolución de conflictos entre requerimientos y valide la consistencia del conjunto final para asegurar el cumplimiento de las metas del proyecto.

- Sara. (2022, March 15). Qué es el entrenamiento funcional, beneficios y ejemplos de ejercicios. Instituto Europeo De Nutrición Y
Salud. <https://ienutricion.com/entrenamiento-funcional-tipos-beneficos/>

- Barquera, S., Hernández-Barrera, L., Oviedo-Solís, C., Rodríguez-Ramírez, S., Monterrubio-Flores, E., Trejo-Valdivia, B.,
Martínez-Tapia, B., Aguilar-Salinas, C., Galván-Valencia, O., Chávez-Manzanera, E., Rivera-Dommarco, J., & Campos-Nonato, I.
(2024). Obesidad en adultos. Salud Pública de México, 66(4), 414-424.
<https://ensanut.insp.mx/encuestas/ensanutcontinua2023/doctos/analiticos/15863-Texto%20del%20art%C3%ADculo-82493-2-10-20>
240821.pdf

- Colín. (2023, August 21). Requirements Quality attributes. AlcanceMaster.
<https://www.scopemaster.com/es/blog/requisitos-atributos-de-calidad/>

- ISO/IEC/IEEE 29148:2018(en), Ingeniería de sistemas y software - Procesos del ciclo de vida - Ingeniería de requisitos. (n.d.).
<https://www.iso.org/obp/ui/en/#iso:std:iso-iec-ieee:29148:ed-2:v1:en>

- Cohn, M. (2004). User stories applied: For agile software development. Addison-Wesley Professional.

---
