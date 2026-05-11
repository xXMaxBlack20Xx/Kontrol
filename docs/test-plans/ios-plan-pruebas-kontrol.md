---
title: "Plan de Pruebas - Kontrol"
source_pdf: "IOS_Plan_Pruebas_Kontrol (2).pdf"
converted_date: "2026-05-11"
project: "Kontrol"
---

# Plan de Pruebas - Kontrol

> Markdown conversion generated from the uploaded PDF. Page footers/headers were removed where possible; original document wording was preserved.

DISEÑO DE UN PLAN DE PRUEBAS
Etapa Análisis - Diseño de un plan de pruebas

Nombre del Equipo           Chiapanecos

Nombre del Proyecto         Kontrol

Integrantes del equipo             -     Mojica Salgado Eduardo Yarek
- Trigo Gonzalez Rodrigo Maximo

Materia                     Taller de Aplicaciones IOS

Semestre                    2026-1

Instructora                 Dra. Julia Guadalupe Juarez Hernandez

Fecha de elaboración        28 / 04 / 2026

Versión del documento       1.67

---

## 1. Introducción
El presente documento tiene como propósito definir el plan de pruebas para el módulo de gestión y seguimiento de hábitos de la
aplicación Kontrol, una aplicación móvil desarrollada en React Native orientada al registro, monitoreo y visualización del progreso de
hábitos personales. Este plan busca comprobar que las funcionalidades principales del sistema operen de manera correcta, clara y
consistente con los requerimientos previamente documentados.

Kontrol tiene como objetivo ofrecer una experiencia simple, rápida e intuitiva para que el usuario pueda crear hábitos, marcar su
cumplimiento diario, consultar rachas y visualizar su progreso mediante una interfaz minimalista alineada con el enfoque de aplicaciones
iOS. Por ello, las pruebas no solo se enfocan en verificar que las funciones respondan correctamente, sino también en validar que el
comportamiento del sistema mantenga coherencia con la experiencia de usuario esperada.

El enfoque principal de este plan de pruebas es asegurar la trazabilidad entre requerimientos y casos de prueba. Cada caso será definido
con entradas, precondiciones y resultados esperados claros, de manera que sea posible comprobar si el sistema cumple con los
requerimientos funcionales y no funcionales establecidos. De esta forma, el documento permite validar que lo especificado en el análisis
se refleje correctamente en la implementación y pueda ser evaluado de forma objetiva.

Además, este plan contribuye a reducir inconsistencias entre módulos, pantallas y comportamientos del sistema, especialmente en
funciones críticas como la creación de hábitos, edición, eliminación, registro de cumplimiento diario, cálculo de rachas, visualización de
progreso y persistencia local de la información. Esto permite que la etapa de pruebas funcione como un mecanismo de control de calidad
antes de considerar el módulo como terminado.

## 2. Descripción general del sistema
Kontrol es una aplicación móvil para iPhone enfocada en el seguimiento de hábitos personales. Su contexto de uso se centra en personas
que desean llevar un control diario de actividades como estudio, ejercicio, lectura, descanso, hidratación o cualquier otro hábito que
requiere constancia. La propuesta del sistema parte de una necesidad recurrente: muchas aplicaciones de hábitos resultan
excesivamente complejas, sobrecargadas o difíciles de adoptar para usuarios que solo necesitan registrar acciones cotidianas de manera
rápida. En respuesta a ello, Kontrol plantea una experiencia simple, visual y eficiente, donde el usuario pueda entender su progreso sin
fricción operativa ni exceso de configuraciones.

---

### 2.1 Usuarios principales

- Usuario final registrado: persona que utiliza la aplicación para crear, editar, eliminar y dar seguimiento a sus hábitos.
- Equipo de desarrollo: responsable de implementar, mantener y verificar el sistema conforme a los requerimientos documentados.
- Docente / evaluadora académica: stakeholder indirecto que revisa la calidad documental, consistencia y cumplimiento
metodológico del proyecto.

### 2.2 Módulos dentro del alcance

- Gestión de cuenta local.
- Inicio y cierre de sesión.
- Gestión de hábitos.
- Registro de cumplimiento diario.
- Visualización de rachas y progreso.
- Gestión de recordatorios locales.
- Configuración general y consulta del aviso de privacidad.

### 2.3 Fuera del alcance del MVP

- Sincronización en la nube.
- Compartición de hábitos o estadísticas con otros usuarios.
- Widgets de iOS.
- Integración con Apple Watch o dispositivos externos.
- Analítica avanzada predictiva.
- Funciones sociales.

---

## 3. Objetivo
El objetivo de este documento es definir de manera estructurada el plan de pruebas del módulo de gestión y seguimiento de hábitos de la
aplicación Kontrol, con el propósito de validar que las funcionalidades desarrolladas cumplan con los requerimientos funcionales, no
funcionales y criterios de aceptación previamente establecidos.

Este plan busca asegurar que las pruebas no se realicen de forma aislada, sino que estén directamente relacionadas con los
requerimientos del sistema. Para ello, cada caso de prueba deberá contar con una entrada definida, precondiciones claras, resultado
esperado, resultado obtenido y estado de ejecución, permitiendo comprobar de manera objetiva si el comportamiento del sistema es
correcto.

Asimismo, el documento tiene como finalidad mantener la consistencia entre la etapa de análisis, diseño, construcción y validación del
proyecto. Esto significa que las funciones principales de Kontrol, como crear hábitos, editar hábitos, eliminar hábitos, registrar
cumplimiento diario, consultar rachas y visualizar progreso, deberán ser evaluadas conforme a lo que fue especificado en los
requerimientos del sistema.

Desde el punto de vista del sistema, el objetivo de Kontrol es ofrecer una aplicación móvil simple, rápida e intuitiva para el seguimiento de
hábitos personales, permitiendo que el usuario registre actividades, marque su cumplimiento diario y consulte su avance mediante una
interfaz clara y minimalista. Por lo tanto, este plan de pruebas permitirá verificar que la aplicación conserve esa experiencia esperada
durante su uso.

Finalmente, este documento servirá como evidencia de trazabilidad entre los requerimientos y los casos de prueba, permitiendo identificar
qué funcionalidades fueron verificadas, qué requerimientos fueron cubiertos y qué aspectos requieren corrección antes de considerar el
módulo como terminado.

## 4. Justificación
El desarrollo de Kontrol surge de la necesidad de contar con una aplicación de seguimiento de hábitos que sea simple, rápida e intuitiva.
Muchas aplicaciones existentes para registrar hábitos suelen presentar interfaces saturadas, flujos extensos o configuraciones poco
claras, lo cual puede dificultar que el usuario mantenga una constancia diaria. Por ello, Kontrol busca ofrecer una experiencia enfocada en
la claridad visual, la eficiencia de registro y la facilidad de uso, permitiendo que el usuario cree hábitos, marque su cumplimiento diario,
consulte rachas y visualice su progreso de manera ordenada.

---

La problemática principal no se limita únicamente a registrar hábitos, sino a asegurar que el sistema realmente apoye al usuario durante
su seguimiento diario. Si una función como crear un hábito, editarlo, eliminarlo o marcarlo como completado no responde de forma
correcta, el usuario puede perder confianza en la aplicación. De la misma manera, si las rachas o gráficas de progreso muestran
información incorrecta, duplicada o desactualizada, el sistema deja de cumplir su propósito principal.

Por esta razón, la documentación clara de requerimientos y casos de prueba es fundamental para la correcta implementación del sistema.
Los requerimientos permiten definir qué debe hacer Kontrol, bajo qué condiciones debe hacerlo y cómo se puede comprobar su
cumplimiento. A partir de ellos, el plan de pruebas permite validar si las funcionalidades desarrolladas son consistentes con lo
especificado en la etapa de análisis, evitando que las pruebas se basen únicamente en percepciones o revisiones informales.

Además, un plan de pruebas bien estructurado ayuda a mantener la trazabilidad entre requerimientos funcionales, requerimientos no
funcionales y casos de prueba. Esto permite comprobar que cada función importante del módulo de hábitos tenga una validación
asociada, incluyendo la creación de hábitos, la edición, la eliminación, el registro de cumplimiento diario, la visualización de rachas, la
consulta de progreso y la persistencia local de la información.

La importancia de este apartado también radica en reducir inconsistencias entre lo documentado y lo implementado. En Kontrol, la
consistencia es especialmente relevante porque el sistema depende de que los datos del hábito, su historial, su racha y su progreso se
mantengan relacionados correctamente. Por ejemplo, al editar un hábito no se debe perder su historial; al eliminarlo no debe seguir
apareciendo en otras vistas; y al marcarlo como completado no deben generarse registros duplicados en la misma fecha.

Finalmente, este plan de pruebas se justifica porque funciona como un mecanismo de control de calidad antes de considerar terminado el
módulo principal de la aplicación. Su correcta aplicación permitirá identificar errores, validar resultados esperados y comprobar que
Kontrol conserve su objetivo central: ser una aplicación móvil minimalista, eficiente y confiable para el seguimiento cotidiano de hábitos
personales.

---

## 5. Glosario

Término                                              Definición en el contexto del proyecto

Categoría             Clasificación opcional asignada a un hábito para facilitar su organización visual.

Cumplimiento diario   Registro que indica que un hábito fue realizado en la fecha actual.

Estado vacío          Vista mostrada cuando no existen hábitos registrados y la aplicación debe orientar al usuario a crear su primer hábito.

Frecuencia            Regla que define cada cuánto debe realizarse un hábito, por ejemplo diaria o ciertos días de la semana.

Hábito                Actividad personal definida por el usuario que será registrada y monitoreada dentro del sistema.

Historial             Conjunto de registros previos de cumplimiento asociados a un hábito.

Kontrol               Aplicación móvil del proyecto, enfocada en el seguimiento de hábitos personales.

Onboarding            Flujo inicial de uso donde el usuario conoce la lógica general de la aplicación o completa información básica.

Persistencia local    Almacenamiento de información directamente en el dispositivo, sin depender de servicios en la nube.

Progreso              Representación visual o numérica del avance del usuario respecto a sus hábitos registrados.

Racha                 Número de periodos consecutivos válidos en los que un hábito ha sido completado.

Recordatorio          Aviso local programado por el usuario para apoyar el cumplimiento de un hábito.

Postgres              Motor de base de datos local utilizado para almacenar la información del sistema en el dispositivo.

Vista de detalle      Pantalla que presenta información específica de un hábito individual, incluyendo estado, historial y racha.

---

## 6. Objetivos de pruebas por módulo

## 1. Gestión de cuenta local
Validar que el sistema permita registrar una cuenta local únicamente cuando el usuario capture un correo electrónico con formato válido, una
contraseña con longitud mínima de 8 caracteres y acepte explícitamente el aviso de privacidad antes de confirmar el registro. Asimismo, se deberá
comprobar que el sistema rechace registros cuando existan campos obligatorios vacíos, correos previamente registrados o datos que no cumplan con
las reglas de validación establecidas.

## 2. Inicio y cierre de sesión

Validar que el sistema autentique al usuario únicamente cuando las credenciales ingresadas coincidan con una cuenta previamente almacenada en la
base de datos local, permitiendo el acceso a la pantalla principal en un tiempo máximo de 2 segundos. También se deberá verificar que el cierre de
sesión invalide correctamente la sesión activa y restrinja el acceso posterior a pantallas privadas del sistema.

## 3. Gestión de hábitos

Validar que el sistema permite crear, editar y eliminar hábitos únicamente cuando el usuario proporcione un nombre no vacío y seleccione una
frecuencia válida antes de confirmar la operación. Asimismo, se deberá verificar que cualquier modificación realizada sobre un hábito se refleje en la
lista principal dentro de un tiempo máximo de 2 segundos.

## 4. Registro de cumplimiento diario

Validar que el sistema registre un único cumplimiento diario por hábito y por fecha actual cuando el usuario seleccione la acción de completar. Además,
se deberá comprobar que el estado visual del hábito y el cálculo de la racha asociada se actualicen dentro de un tiempo máximo de 1 segundo después
del registro exitoso.

## 5. Visualización de rachas y progresos

Validar que el sistema muestre información de progreso calculada exclusivamente a partir de registros almacenados localmente, incluyendo racha
actual, historial básico de cumplimiento y visualizaciones de progreso semanal y mensual cuando existan datos suficientes. Asimismo, se deberá
verificar que estas vistas se carguen en un tiempo máximo de 3 segundos.

---

## 6. Gestión de recordatorios locales

Validar que el sistema permite crear, editar y eliminar recordatorios locales únicamente cuando exista un hábito asociado, se seleccione una hora válida
dentro del rango de 00:00 a 23:59 y el dispositivo cuente con permisos de notificación habilitados. También se deberá comprobar que la programación
del recordatorio se almacena localmente en un tiempo máximo de 2 segundos.

## 7. Configuración general y consulta del aviso de privacidad

Validar que el usuario pueda acceder a la pantalla de configuración y consultar el aviso de privacidad almacenado localmente en formato legible dentro
de un tiempo máximo de 2 segundos. Adicionalmente, se deberá verificar que el sistema muestre un mensaje informativo cuando el contenido no se
encuentre disponible temporalmente.

## 7. Alcance de pruebas por módulo

## 1. Gestión de cuenta local

Las pruebas de este módulo abarcan la validación del formato de correo electrónico, la longitud mínima permitida para contraseñas, la verificación de
campos obligatorios, la detección de cuentas duplicadas, la aceptación obligatoria del aviso de privacidad y el almacenamiento local de la cuenta
registrada. Este módulo no contempla funcionalidades de recuperación de contraseña, autenticación mediante servicios externos ni sincronización de
cuentas con servicios en la nube.

## 2. Inicio y cierre de sesión

Las pruebas de este módulo incluyen autenticación con credenciales válidas, rechazo de credenciales inválidas, conservación de sesión activa entre
aperturas de la aplicación, cierre manual de sesión y redirección automática a la pantalla de inicio de sesión después del cierre. No forman parte del
alcance mecanismos de autenticación biométrica ni sincronización de sesiones entre múltiples dispositivos.

## 3. Gestión de hábitos

Este módulo contempla pruebas relacionadas con creación de hábitos, edición de atributos permitidos como nombre, frecuencia, categoría, meta y
recordatorio, así como eliminación de hábitos mediante confirmación explícita del usuario. También incluye validación de campos obligatorios,
actualización inmediata de la interfaz y persistencia local de datos. Quedan excluidas funcionalidades de sincronización externa y compartición de
hábitos con otros usuarios.

---

## 4. Registro de cumplimiento diario

Las pruebas de este módulo incluyen registro de cumplimiento diario, restricción de duplicidad de registros para un mismo hábito en la misma fecha,
actualización inmediata del estado visual del hábito, recálculo automático de rachas y conservación de registros tras cerrar y volver a abrir la aplicación.
No se consideran funcionalidades de modificación manual de registros históricos ni edición retroactiva de fechas anteriores.

## 5. Visualización de rachas y progresos

Este módulo incluye pruebas de visualización del detalle de hábito, cálculo de racha actual, consulta de historial de cumplimiento, representación
gráfica de progreso semanal y mensual, así como despliegue de estados vacíos cuando no existan datos suficientes para generar información
significativa. No forman parte del alcance funcionalidades de analítica predictiva, recomendaciones automáticas ni estadísticas avanzadas.

## 6. Gestión de recordatorios locales

Las pruebas abarcan creación, edición y eliminación de recordatorios, validación de horarios permitidos, verificación de permisos de notificaciones y
persistencia local de la configuración realizada por el usuario. Se excluyen del alcance notificaciones push remotas y sincronización de recordatorios
con servicios externos.

## 7. Configuración general y consulta del aviso de privacidad

Este módulo contempla acceso a configuración general, visualización del aviso de privacidad, lectura del contenido almacenado localmente y manejo
de errores relacionados con ausencia temporal del archivo correspondiente. No incluye edición del aviso de privacidad ni configuración avanzada de
cuenta.

---

## 8. Tabla de Pruebas

Resultado
ID                   Caso de Pruebas                            Entrada               Precondiciones                    Resultado esperado                               Estado
obtenido

CP-01: Crear cuenta local

Happy path - Registrar cuenta con datos válidos     Correo:                El usuario no tiene una        Happy path                               Pendiente      Pendiente
CP-01                                                        usuario@correo.com     sesión activa.                                                          de ejecución
1. El usuario abre la aplicación.                                                                        Dado que el usuario se encuentra en
2. El usuario selecciona la opción Crear cuenta.    Contraseña:            El correo ingresado no se      la pantalla de registro.
3. El sistema muestra el formulario de registro.    Kontrol123             encuentra        registrado
4. El usuario captura su correo electrónico.                              previamente        en     la   Cuando ingresa un correo válido, una
5. El usuario captura su contraseña.                Aviso de privacidad:   persistencia local.            contraseña válida, acepta el aviso de
6. El usuario acepta el aviso de privacidad.        aceptado                                              privacidad y confirma el registro.
7. El usuario presiona el botón Registrar cuenta.                          El formulario de registro se
8. El sistema procesa la solicitud de registro.                            encuentra disponible.          Entonces el sistema deberá crear la
cuenta local y permitir que el usuario
continúe hacia el acceso inicial de la
aplicación.

Alterno - Corregir datos inválidos antes de         Primer intento:        El usuario se encuentra en     Alterno
registrar cuenta                                                          la pantalla de registro.                                                Pendiente      Pendiente
Correo:                                               Dado que el usuario se encuentra en      de ejecución
1. El usuario se encuentra en el formulario de      usuariocorreo.com     La cuenta todavía no ha        la pantalla de registro.
registro.                                           Contraseña:            sido creada.
2. El usuario captura un correo con formato         Kontrol123                                            Cuando corrige los datos inválidos,
incorrecto o deja un campo incompleto.                                     El sistema permite corregir    acepta el aviso de privacidad y vuelve
3. El sistema muestra la observación                Segundo intento:      campos antes de confirmar      a confirmar el registro.
correspondiente.                                                           el registro final.
4. El usuario corrige el dato señalado.             Correo:                                               Entonces el sistema deberá crear la
5. El usuario acepta el aviso de privacidad.        usuario@correo.com                                    cuenta local si todos los datos ya
6. El usuario presiona nuevamente Registrar         Contraseña:                                           cumplen con las condiciones
cuenta.                                             Kontrol123                                            requeridas.
7. El sistema procesa la solicitud corregida.      Aviso de privacidad:
aceptado

---

Fracaso - Intentar registrar cuenta con datos      Caso 1: correo           El usuario se encuentra en     Fracaso
obligatorios inválidos                             inválido.               la pantalla de registro.                                                  Pendiente      Pendiente
Dado que el usuario se encuentra en        de ejecución
1. El usuario se encuentra en el formulario de     Caso 2: contraseña       El sistema tiene disponible    la pantalla de registro.
registro.                                          inválida.               la validación de campos
2. El usuario captura un correo inválido, una                               obligatorios,        correo    Cuando intenta registrarse con correo
contraseña inválida, un correo duplicado o no      Caso 3: aviso de         duplicado y aceptación del     inválido, contraseña inválida, correo
acepta el aviso de privacidad.                     privacidad no            aviso de privacidad.           duplicado o sin aceptar el aviso de
3. El usuario presiona Registrar cuenta.           aceptado.                                              privacidad.
## 4. El sistema valida los datos antes de crear la
cuenta.                                            Caso 4: correo ya                                       Entonces el sistema no deberá crear
registrado.                                             la cuenta local y deberá mostrar la
causa correspondiente.

CP-02: Iniciar sesión

CP-02     Happy path - Iniciar sesión con credenciales       Correo:                  Existe una cuenta local        Happy path                                 Pendiente      Pendiente
válidas                                            usuario@correo.com       registrada con el correo y                                                de ejecución
la contraseña ingresados.      Dado que el usuario se encuentra en
1. El usuario abre la aplicación.                  Contraseña:                                             la pantalla de inicio de sesión.
2. El sistema muestra la pantalla de inicio de     Kontrol123@              El usuario no tiene una
sesión.                                                                     sesión activa al iniciar la    Cuando ingresa credenciales válidas
3. El usuario captura su correo electrónico.                                prueba.                        y confirma el acceso.
## 4. El usuario captura su contraseña.
5. El usuario presiona el botón Iniciar sesión.                                                            Entonces el sistema deberá autenticar
6. El sistema valida las credenciales.                                                                     al usuario y mostrar la pantalla
principal de hábitos.

Correo electrónico       El usuario ya inició sesión    Alterno                                    Pendiente      Pendiente
Alterno - Corrección de credenciales inválidas     registrado y             anteriormente.                                                            de ejecución
contraseña válida                                       Dado que el usuario se encuentra en
1. El usuario abre la aplicación.             ingresados después       El usuario dispone de          la pantalla de inicio de sesión.
2. El sistema muestra la pantalla de inicio   de una primera           credenciales válidas para
de sesión.                                 autenticación fallida.   corregir el intento fallido.   Cuando ingresa inicialmente
3. El usuario ingresa un correo electrónico                                                           credenciales incorrectas, corrige la
o contraseña incorrectos.                                                                          información y vuelve a confirmar.
## 4. El usuario presiona el botón "Iniciar
sesión".                                                                                           Entonces el sistema deberá mostrar
5. El sistema detecta que las credenciales                                                            un mensaje de error en el primer
no coinciden con una cuenta registrada                                                             intento, permitir la corrección de datos
y muestra un mensaje de error.                                                                     y autenticar al usuario exitosamente.
## 6. El usuario corrige el correo electrónico
y/o contraseña.

---

## 7. El usuario presiona nuevamente el
botón de Iniciar sesión.
## 8. El sistema valida las credenciales
corregidas y permite el acceso.

Fracaso - Intentar iniciar sesión con credenciales    Correo:                Existe una cuenta local       Fracaso                                   Pendiente      Pendiente
incorrectas                                           usuario@correo.com     registrada.                                                             de ejecución
Dado que el usuario se encuentra en
1. El usuario se encuentra en la pantalla de inicio   Contraseña:            El usuario no tiene una       la pantalla de inicio de sesión.
de sesión.                                            Incorrecta123          sesión activa.
2. El usuario captura un correo o contraseña que                                                           Cuando ingresa credenciales
no coincide con una cuenta registrada.                                                                     incorrectas y confirma el acceso.
## 3. El usuario presiona Iniciar sesión.
4. El sistema valida las credenciales.                                                                     Entonces el sistema no deberá
permitir el acceso y deberá mostrar un
mensaje indicando que las
credenciales no son válidas.

CP-03: Cerrar sesión

CP-03    Happy path - Cerrar sesión activa desde               Acción: cerrar         El usuario tiene una sesión   Happy path                                Pendiente      Pendiente
configuración                                         sesión.                activa.                                                                 de ejecución
Confirmación:                                        Dado que el usuario tiene una sesión
1. El usuario se encuentra en la pantalla             aceptada.              La        pantalla     de     activa.
principal.                                                                   configuración se encuentra
2. El usuario accede a la pantalla de                                        disponible.                   Cuando accede a configuración,
configuración.                                                                                             selecciona cerrar sesión y confirma la
3. El usuario selecciona la opción Cerrar sesión.                                                          acción.
## 4. El sistema muestra una confirmación.
5. El usuario confirma el cierre de sesión.                                                                Entonces el sistema deberá finalizar
6. El sistema procesa la solicitud.                                                                       la sesión y mostrar la pantalla de
inicio de sesión.

Alterno - Cancelar cierre de sesión antes de          Acción: cerrar         El usuario tiene una sesión   Alterno                                   Pendiente      Pendiente
confirmar                                             sesión.                activa.                                                                 de ejecución
Confirmación:                                        Dado que el usuario tiene una sesión
1. El usuario accede a configuración.                 cancelada.                                           activa y selecciona la opción de cerrar
2. El usuario selecciona Cerrar sesión.                                                                    sesión.
## 3. El sistema muestra una confirmación.
4. El usuario selecciona Cancelar.                                                                         Cuando cancela la confirmación.
## 5. El sistema conserva la sesión activa.
Entonces el sistema deberá conservar
la sesión activa y mantener al usuario

---

dentro de la aplicación.

Fracaso - Intentar acceder a pantallas privadas       Sesión: inactiva.       No existe una       sesión    Fracaso                                Pendiente      Pendiente
sin sesión activa                                     Pantalla solicitada:    activa válida.                                                       de ejecución
principal, detalle o                                  Dado que el usuario no cuenta con
1. El usuario cierra sesión correctamente.            progreso.                                             una sesión activa.
## 2. El usuario intenta regresar a una pantalla
privada.                                                                                                    Cuando intenta acceder a una
3. El sistema valida el estado de sesión.                                                                  pantalla privada.

Entonces el sistema deberá impedir el
acceso y redirigirlo a la pantalla de
inicio de sesión.

CP-04: Crear hábito

CP-04    Happy path - Crear hábito con datos obligatorios      Nombre: "Leer"          El usuario tiene una sesión   Happy path                              Pendiente      Pendiente
válidos                                               Frecuencia: diaria      activa.                                                               de ejecución
Dado que el usuario se encuentra en
1. El usuario se encuentra en la pantalla principal                           El usuario se encuentra en    la pantalla de creación de hábito.
de hábitos.                                                                   la pantalla principal de
2. El usuario presiona Crear hábito o Agregar                                 hábitos.                      Cuando ingresa el nombre "Leer",
hábito.                                                                                                     selecciona la frecuencia diaria y
3. El sistema muestra el formulario de creación                               El formulario de creación     confirma la creación del hábito.
de hábito.                                                                    está disponible.
4. El usuario captura el nombre del hábito.                                                                 Entonces el sistema deberá registrar
5. El usuario selecciona la frecuencia del hábito.                                                          el hábito, almacenarlo localmente y
6. El usuario presiona Guardar o Crear hábito.                                                              mostrarlo en la lista principal.
## 7. El sistema procesa la solicitud de creación.

Alterno - Crear hábito agregando información          Nombre: "Leer"          El usuario tiene una sesión   Alterno                                 Pendiente      Pendiente
opcional                                              Frecuencia: diaria      activa.                                                               de ejecución
Categoría: estudio                                    Dado que el usuario se encuentra en
1. El usuario presiona Crear hábito.                  Meta: leer 10           Los campos obligatorios       la pantalla de creación de hábito.
2. El sistema muestra el formulario.                  páginas                 están completos.
3. El usuario captura el nombre.                                                                            Cuando registra el nombre, la
4. El usuario selecciona la frecuencia.                                       Los campos opcionales se      frecuencia y además captura
5. El usuario agrega una categoría, meta o                                    encuentran disponibles en     información opcional.
recordatorio inicial.                                                         el formulario.
6. El usuario presiona Guardar.                                                                             Entonces el sistema deberá guardar
7. El sistema procesa la solicitud con datos                                                                el hábito junto con la información
obligatorios y opcionales.                                                                                 complementaria capturada
.

---

Fracaso - Intentar crear hábito con datos             Caso 1:                El usuario tiene una sesión     Fracaso                                  Pendiente      Pendiente
obligatorios incompletos                              Nombre: vacío          activa.                                                                  de ejecución
Frecuencia: diaria                                     Dado que el usuario se encuentra en
1. El usuario presiona Crear hábito.                                         El usuario se encuentra en      la pantalla de creación de hábito.
2. El sistema muestra el formulario.                  Caso 2:                el formulario de creación
3. El usuario deja vacío el nombre o no               Nombre: "Leer"         de hábito.                      Cuando intenta guardar el hábito sin
selecciona una frecuencia.                            Frecuencia: no                                         nombre o sin una frecuencia válida.
4. El usuario presiona Guardar.                       seleccionada
5. El sistema valida los campos antes de                                                                     Entonces el sistema no deberá
registrar el hábito.                                                                                        registrar el hábito y deberá mostrar un
mensaje indicando la causa del error.

CP-05: Editar hábito

CP-05    Happy path - Editar hábito existente con datos        Nombre anterior:       El usuario tiene una sesión     Happy path                                Pendiente      Pendiente
válidos                                               "Leer"                 activa.                                                                   de ejecución
Nombre nuevo:                                          Dado que el usuario cuenta con un
1. El usuario se encuentra en la pantalla principal   "Leer 30 minutos"      Existe un hábito registrado     hábito registrado.
de hábitos.                                           Frecuencia: diaria     llamado "Leer".
2. El usuario selecciona el hábito "Leer".                                                                   Cuando accede a editarlo, modifica
3. El sistema muestra el detalle del hábito.                                 El hábito    no   ha     sido   datos válidos y confirma los cambios.
4. El usuario presiona Editar hábito.                                        eliminado.
5. El sistema muestra el formulario con la                                                                   Entonces el sistema deberá guardar
información actual.                                                                                          la edición y actualizar la información
6. El usuario modifica el nombre o la frecuencia.                                                            mostrada en la lista principal y en la
7. El usuario presiona Guardar cambios.                                                                      vista de detalle.
## 8. El sistema procesa la edición.

Alterno - Editar solamente un campo del hábito        Nombre: "Leer"         Existe un hábito registrado     Alterno                                   Pendiente      Pendiente
Frecuencia: diaria     con nombre, frecuencia y                                                  de ejecución
1. El usuario abre el detalle del hábito.             Categoría anterior:    categoría.                      Dado que el usuario accede a la
2. El usuario selecciona Editar hábito.               estudio                                                edición de un hábito.
3. El usuario modifica únicamente la categoría.       Categoría nueva:       El usuario se encuentra en
4. El usuario conserva sin cambios el nombre y        personal               el formulario de edición.       Cuando modifica únicamente uno de
la frecuencia.                                                                                               sus campos editables y confirma los
5. El usuario presiona Guardar cambios.                                                                     cambios.

Entonces el sistema deberá actualizar
solamente ese campo y conservar el
resto de la información del hábito.

---

Fracaso - Intentar editar hábito con datos            Nombre: vacío          Existe      un        hábito    Fracaso                                Pendiente      Pendiente
inválidos                                             Frecuencia: diaria     registrado.                                                            de ejecución
Dado que el usuario se encuentra
1. El usuario abre el formulario de edición.          o                      El usuario se encuentra en      editando un hábito.
2. El usuario borra el nombre del hábito o                                   el formulario de edición.
selecciona una frecuencia inválida.                   Nombre: "Leer"                                         Cuando intenta guardar valores
3. El usuario presiona Guardar cambios.               Frecuencia: no                                         inválidos o deja vacío un campo
4. El sistema valida los datos antes de guardar.     seleccionada                                          obligatorio.

Entonces el sistema no deberá
guardar los cambios y deberá mostrar
la causa del error.

CP-06: Eliminar hábito

CP-06    Happy path - Eliminar hábito con confirmación         Hábito seleccionado:   El usuario tiene una sesión     Happy path                              Pendiente      Pendiente
explícita                                             "Leer"                 activa.                                                                 de ejecución
Confirmación:                                          Dado que el usuario cuenta con un
1. El usuario se encuentra en la pantalla principal   aceptada               Existe un hábito registrado     hábito registrado.
de hábitos.                                                                  llamado "Leer".
2. El usuario selecciona el hábito que desea                                                                 Cuando selecciona eliminar y
eliminar.                                                                                                    confirma explícitamente la acción.
## 3. El sistema muestra el detalle del hábito.
4. El usuario presiona Eliminar hábito.                                                                      Entonces el sistema deberá retirar el
5. El sistema muestra una confirmación.                                                                      hábito de la aplicación.
## 6. El usuario confirma la eliminación.
## 7. El sistema procesa la solicitud.

Alterno -       Cancelar   eliminación   antes   de   Hábito seleccionado:   Existe      un        hábito    Alterno                                 Pendiente      Pendiente
confirmar                                             "Leer"                 registrado.                                                             de ejecución
Confirmación:                                          Dado que el usuario selecciona la
1. El usuario abre el detalle del hábito.             cancelada              El usuario se encuentra en      opción de eliminar.
2. El usuario presiona Eliminar hábito.                                      la vista de detalle o edición
3. El sistema muestra una confirmación.                                      del hábito.                     Cuando decide cancelar antes de
4. El usuario selecciona Cancelar.                                                                           confirmar.
## 5. El sistema regresa al detalle del hábito.
Entonces el sistema no deberá
eliminar el hábito ni modificar su
información.

---

Fracaso - Intentar eliminar un hábito cuando la     Hábito seleccionado:   El usuario tiene sesión       Fracaso                                    Pendiente      Pendiente
operación no puede completarse                      inexistente, no        activa.                                                                  de ejecución
disponible o ya                                      Dado que el usuario intenta eliminar
1. El usuario intenta eliminar un hábito.           eliminado.             El sistema recibe una         un hábito.
2. El sistema intenta procesar la operación.                               solicitud de eliminación
3. La información del hábito no se encuentra                               sobre un hábito que no        Cuando la operación no puede
disponible o la operación falla.                                           puede           validarse     completarse correctamente.
4. El sistema detiene la eliminación                                      correctamente.
Entonces el sistema no deberá
eliminar información adicional y
deberá mostrar un mensaje indicando
que la acción no pudo finalizarse.

CP-07: Marcar hábito como completado

CP-07    Happy path - Marcar hábito como completado          Hábito: "Leer"         El usuario tiene una sesión   Happy path                                 Pendiente      Pendiente
en la fecha actual                                  Fecha: actual          activa.                                                                  de ejecución
Acción: completar                                    Dado que el usuario cuenta con un
1. El usuario se encuentra en la pantalla                                  Existe el hábito "Leer".      hábito visible en la pantalla principal.
principal.
2. El usuario localiza el hábito "Leer".                                   El hábito no ha sido          Cuando selecciona la acción de
3. El usuario presiona el botón o indicador de                             marcado como completado       completar para la fecha actual.
Completar.                                                                 en la fecha actual.
4. El sistema registra el cumplimiento del hábito                                                        Entonces el sistema deberá registrar
para la fecha actual.                                                                                    el cumplimiento diario, actualizar el
5. El sistema actualiza el estado visible del                                                            estado del hábito y recalcular la racha
hábito.                                                                                                 asociada.

Alterno - Visualizar hábito ya completado al        Hábito: "Leer"         El    hábito   ya    fue      Alterno                                    Pendiente      Pendiente
regresar a la pantalla principal                    Fecha: actual          completado una vez en la                                                 de ejecución
Estado esperado:       fecha actual.                 Dado que el usuario ya marcó el
1. El usuario marca el hábito como completado.      completado                                           hábito del día.
## 2. El usuario navega a otra pantalla.
3. El usuario regresa a la pantalla principal.                                                           Cuando regresa a la pantalla
4. El sistema consulta el estado del hábito para                                                         principal.
la fecha actual.
Entonces el sistema deberá mostrar el
hábito como completado en esa
fecha.

---

Fracaso - Intentar registrar dos cumplimientos        Hábito: "Leer"         El hábito "Leer" ya tiene un   Fracaso                                   Pendiente      Pendiente
del mismo hábito en la misma fecha                    Fecha: actual          cumplimiento registrado en                                              de ejecución
Acción: completar      la fecha actual.               Dado que el usuario ya registró el
1. El usuario marca el hábito "Leer" como             por segunda vez                                       cumplimiento del hábito en la fecha
completado.                                                                                                 actual.
## 2. El sistema registra el cumplimiento.
3. El usuario intenta marcar nuevamente el                                                                  Cuando intenta volver a marcarlo el
mismo hábito en la misma fecha.                                                                             mismo día.
## 4. El sistema valida si ya existe un cumplimiento
registrado para ese hábito y fecha.                                                                        Entonces el sistema no deberá
duplicar el registro y deberá conservar
un solo cumplimiento válido.

CP-08: Consultar detalle de hábito

CP-08     Happy path - Consultar detalle de hábito con          Hábito seleccionado:   El usuario tiene una sesión    Happy path                                Pendiente      Pendiente
información disponible                                "Leer"                 activa.                                                                  de ejecución
Dado que el usuario tiene hábitos
1. El usuario se encuentra en la pantalla                                    Existe al menos un hábito      registrados.
principal.                                                                   registrado.
2. El usuario selecciona el hábito "Leer".                                                                  Cuando selecciona uno de ellos
3. El sistema abre la vista de detalle.                                      El hábito seleccionado no      desde la pantalla principal.
4. El sistema muestra la información asociada al                             ha sido eliminado.
hábito.                                                                                                    Entonces el sistema deberá mostrar
su nombre, frecuencia, estado del día,
racha actual e historial disponible.

Alterno - Consultar detalle de hábito sin historial   Hábito seleccionado:   Existe      un       hábito    Alterno                                   Pendiente      Pendiente
suficiente                                            "Meditación"           registrado.                                                              de ejecución
Historial: sin                                        Dado que el usuario accede al detalle
1. El usuario crea un hábito nuevo.                   registros previos o    El hábito seleccionado no      de un hábito con pocos registros.
2. El usuario regresa a la pantalla principal.        insuficientes.         cuenta      con    historial
3. El usuario selecciona el hábito recién creado.                            suficiente de cumplimiento.    Cuando aún no existe suficiente
4. El sistema abre la vista de detalle.                                                                    información histórica.

Entonces el sistema deberá mostrar la
información básica del hábito y un
mensaje indicando que todavía no
hay historial suficiente.

---

Fracaso - Intentar abrir detalle de hábito            Hábito seleccionado:   El hábito no existe en la     Fracaso                                  Pendiente      Pendiente
inexistente o eliminado                               eliminado o            persistencia local o fue                                               de ejecución
inexistente.           eliminado previamente.        Dado que el usuario intenta abrir el
1. El usuario intenta abrir el detalle de un hábito                                                        detalle de un hábito inexistente o
que ya fue eliminado o no existe.                                                                          eliminado.
## 2. El sistema intenta cargar la información del
hábito.                                                                                                    Cuando la información ya no se
3. El sistema valida que el hábito no está                                                                 encuentra disponible.
disponible.
Entonces el sistema no deberá
mostrar datos inválidos y deberá
regresar a una vista consistente.

CP-09: Consultar progreso general

CP-09    Happy path - Consultar progreso con registros         Sección                El usuario tiene sesión       Happy path                               Pendiente      Pendiente
disponibles                                           seleccionada:          activa.                                                                de ejecución
Progreso.                                            Dado que el usuario cuenta con
1. El usuario se encuentra en la pantalla             Periodo:               Existen     registros de      registros de cumplimiento.
principal.                                            predeterminado.        cumplimiento asociados a
2. El usuario accede a la sección Progreso desde                             sus hábitos.                  Cuando accede a la sección de
la navegación principal.                                                                                   progreso.
## 3. El sistema consulta los registros de
cumplimiento almacenados.                                                                                  Entonces el sistema deberá mostrar
4. El sistema muestra los indicadores o                                                                    indicadores o visualizaciones con
visualizaciones disponibles.                                                                              base en los datos disponibles.

Alterno - Cambiar periodo de consulta de              Periodo 1: semanal.    El usuario tiene sesión       Alterno                                  Pendiente      Pendiente
progreso                                              Periodo 2: mensual.    activa.                                                                de ejecución
Dado que el usuario se encuentra en
1. El usuario accede a la sección de progreso.                               Existen           registros   la sección de progreso.
2. El sistema muestra la información del periodo                             suficientes para consultar
predeterminado.                                                              progreso por periodo.         Cuando cambia el periodo de consulta
3. El usuario selecciona el periodo semanal.                                                               entre semanal y mensual.
## 4. El usuario selecciona el periodo mensual.
5. El sistema actualiza la visualización según el                                                          Entonces el sistema deberá actualizar
periodo seleccionado.                                                                                     la visualización sin alterar los datos
almacenados.

---

Fracaso -     Consultar      progreso   sin   datos   Sección                 El usuario tiene sesión         Fracaso                                  Pendiente      Pendiente
suficientes                                           seleccionada:           activa.                                                                  de ejecución
Progreso.                                               Dado que el usuario no cuenta con
1. El usuario accede a la sección de progreso.        Registros               No      existen     registros   datos suficientes.
2. El sistema consulta los registros de               disponibles:            suficientes para generar
cumplimiento.                                         insuficientes o         una             visualización   Cuando accede a la sección de
3. El sistema identifica que no existen datos         inexistentes.           significativa.                  progreso.
suficientes.
4. El sistema evita mostrar una gráfica sin                                                                   Entonces el sistema no deberá
contexto.                                                                                                    mostrar gráficas engañosas o vacías
sin contexto y deberá indicar que aún
no existen datos suficientes.

CP-10: Configurar recordatorio local

CP-10     Happy path - Crear recordatorio local para un         Hábito: "Leer"          El usuario tiene sesión         Happy path                               Pendiente      Pendiente
hábito                                                Hora: 08:00             activa.                                                                  de ejecución
Acción: crear                                           Dado que el usuario cuenta con un
1. El usuario abre el detalle o edición de un         recordatorio            Existe      un        hábito    hábito registrado y permisos de
hábito.                                                                       registrado.                     notificación habilitados.
## 2. El usuario selecciona la opción de
recordatorio.                                                                 El dispositivo cuenta con       Cuando selecciona una hora válida y
3. El usuario elige una hora válida.                                          permisos de notificación        confirma la creación del recordatorio.
4. El usuario confirma la creación del                                        habilitados.
recordatorio.                                                                                                 Entonces el sistema deberá guardar
5. El sistema programa el recordatorio local                                                                  el recordatorio y programar la
asociado al hábito.                                                                                          notificación local.

Alterno - Editar o eliminar un recordatorio           Opción 1: nueva         Existe un hábito registrado     Alterno                                  Pendiente      Pendiente
existente                                             hora 09:00.             con     un     recordatorio                                              de ejecución
Opción 2: eliminar      previamente configurado.        Dado que el usuario ya tiene un
1. El usuario abre un hábito con recordatorio         recordatorio.                                           recordatorio configurado.
configurado.
2. El usuario selecciona editar o eliminar                                                                    Cuando edita su hora o elimina el
recordatorios.                                                                                                recordatorio existente.
## 3. Si edita, selecciona una nueva hora válida.
4. Si elimina, confirma la eliminación.                                                                       Entonces el sistema deberá actualizar
5. El sistema actualiza la programación                                                                       o retirar la programación
correspondiente.                                                                                             correspondiente.

---

Fracaso - Intentar crear recordatorio sin datos      Caso 1: sin hábito     El usuario tiene sesión       Fracaso                                  Pendiente      Pendiente
válidos o sin permisos                               asociado.              activa.                                                                de ejecución
Caso 2: hora no                                      Dado que el usuario intenta crear un
1. El usuario abre la configuración de               seleccionada.          La pantalla de recordatorio   recordatorio.
recordatorio.                                        Caso 3: permisos de    está disponible.
2. El usuario no selecciona un hábito, no define     notificación                                         Cuando no selecciona un hábito, no
una hora válida o no cuenta con permisos de          deshabilitados.                                      define una hora válida o no cuenta
notificación.                                                                                             con permisos de notificación
3. El usuario intenta confirmar el recordatorio.                                                          habilitados.
## 4. El sistema valida la solicitud antes de
programarla.                                                                                             Entonces el sistema no deberá
completar la programación y deberá
mostrar la causa correspondiente.

CP-11: Consultar aviso de privacidad

CP-11    Happy path - Consultar aviso de privacidad           Opción                 El usuario tiene sesión       Happy path                               Pendiente      Pendiente
desde configuración                                  seleccionada: Aviso    activa.                                                                de ejecución
de privacidad.                                       Dado que el usuario se encuentra en
1. El usuario se encuentra dentro de la                                     El aviso de privacidad se     la pantalla de configuración.
aplicación.                                                                 encuentra       disponible
2. El usuario accede a la pantalla de                                       localmente.                   Cuando selecciona la opción de aviso
configuración.                                                                                            de privacidad.
## 3. El usuario selecciona la opción Aviso de
privacidad.                                                                                               Entonces el sistema deberá mostrar el
4. El sistema carga el contenido correspondiente.                                                        contenido correspondiente en formato
legible.

Alterno - Consultar versión local del aviso de       Aviso de privacidad:   El aviso de privacidad se     Alterno                                  Pendiente      Pendiente
privacidad                                           versión local          encuentra    almacenado                                                de ejecución
disponible.            localmente      en     el     Dado que el aviso de privacidad está
1. El usuario entra a configuración.                                        dispositivo.                  almacenado localmente.
## 2. El usuario selecciona Aviso de privacidad.
3. El sistema consulta la versión almacenada                                                              Cuando el usuario lo consulta desde
localmente.                                                                                               configuración.
## 4. El sistema muestra la versión disponible.
Entonces el sistema deberá mostrar la
versión disponible en el dispositivo.

---

Fracaso - Consultar aviso de privacidad no       Aviso de privacidad:     El usuario tiene sesión     Fracaso                                  Pendiente      Pendiente
disponible                                       no está disponible.      activa.                                                              de ejecución
Dado que el usuario intenta consultar
1. El usuario entra a configuración.                                      El contenido del aviso no   el aviso de privacidad.
2. El usuario selecciona Aviso de privacidad.                             se encuentra disponible
3. El sistema intenta cargar el contenido.                                temporalmente.              Cuando el contenido no se encuentra
4. El sistema detecta que el contenido no está                                                        disponible.
disponible.
Entonces el sistema deberá mostrar
un mensaje informando que el aviso
no puede visualizarse temporalmente.

## 9. Matriz de trazabilidad CP/Requerimiento

CP / Requerimiento    RF-01        RF-02        RF-03        RF-04         RF-05         RF-06        RF-07         RF-08         RF-09         RF-10        RF-11

CP-01: Crear
cuenta local          ✓
CP-02: Iniciar
sesión                             ✓
CP-03: Cerrar
sesión                                          ✓
CP-04: Crear hábito
✓
CP-05: Editar
hábito                                                                     ✓                                        ✓
CP-06: Eliminar
hábito                                                                                   ✓                          ✓             ✓             ✓
CP-07: Marcar
hábito como                                                                                           ✓             ✓             ✓
completado

CP-08: Consultar
detalle de hábito                                                                                                   ✓

---

CP-09: Consultar
progreso general                                                                                   ✓             ✓      ✓
CP-10: Configurar
recordatorio local                                                                                                                  ✓
CP-11: Consultar
aviso de privacidad                                                                                                                             ✓

### 9.1 Justificación breve de la matriz

La matriz demuestra que cada caso de prueba está vinculado directamente con al menos un requerimiento funcional del sistema. Esto permite verificar
que las pruebas no fueron definidas de forma aislada, sino a partir de las funciones documentadas para Kontrol.

Los casos CP-05, CP-06, CP-07 y CP-09 cubren más de un requerimiento porque sus flujos afectan información relacionada. Por ejemplo, al eliminar
un hábito no solo se valida la eliminación, también se debe comprobar que el hábito eliminado no continúe apareciendo en detalle, progreso o
recordatorios. Esto es consistente con el requerimiento RF-06, que indica que un hábito eliminado no debe seguir apareciendo en vistas relacionadas.

De igual forma, marcar un hábito como completado se relaciona con el registro del cumplimiento diario, la actualización del estado del hábito, el
recálculo de la racha y la información mostrada en progreso. El documento de requerimientos establece que al completar un hábito el sistema debe
registrar el cumplimiento, actualizar el estado y recalcular la racha.

---

## 10. Análisis de Consistencia y Conclusiones
El plan de pruebas de Kontrol mantiene consistencia con los requerimientos funcionales definidos para el sistema, ya que cada caso de
prueba fue construido a partir de una funcionalidad específica y posteriormente relacionado en la matriz de trazabilidad
CP/Requerimiento.

La tabla de pruebas organiza cada caso en tres escenarios: Happy path, Alterno y Fracaso. Esta estructura permite validar el flujo
principal, una variación válida que guía al usuario hacia el resultado correcto y una condición inválida donde el sistema debe impedir la
acción. Con ello, los casos de prueba resultan más claros, verificables e inequívocos.

También se verificó que el alcance del documento se mantenga alineado con el MVP de Kontrol. Las pruebas cubren gestión de cuenta,
inicio y cierre de sesión, gestión de hábitos, cumplimiento diario, rachas, progreso, recordatorios locales y aviso de privacidad, sin incluir
funciones fuera de alcance como sincronización en la nube, widgets, funciones sociales o analítica avanzada.

La matriz de trazabilidad confirma que todos los casos de prueba están vinculados con al menos un requerimiento funcional. Algunos
casos cubren más de un RF porque ciertas acciones afectan varias partes del sistema; por ejemplo, marcar un hábito como completado
impacta el cumplimiento diario, la racha y el progreso general.

En conclusión, el documento presenta un plan de pruebas coherente, verificable y alineado con los objetivos de Kontrol. Su aplicación
permitirá comprobar si las funcionalidades implementadas cumplen con lo definido en los requerimientos y facilitará la identificación de
correcciones antes de considerar terminado el módulo evaluado.

---

## 11. Referencias bibliográficas
- Atlassian. (2026, 22 enero). Las pruebas de software en la entrega continua
https://www.atlassian.com/es/continuous-delivery/software-testing

- IBM. (2025, 27 noviemb). ¿Qué son las pruebas de software?
https://www.ibm.com/mx-es/topics/software-testing

- Apple Inc. (s. f.). Human Interface Guidelines. Apple Developer.
https://developer.apple.com/design/human-interface-guidelines/

---
