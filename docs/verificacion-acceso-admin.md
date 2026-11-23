\# Verificación del acceso administrativo



Esta guía permite comprobar que el administrador puede iniciar y cerrar sesión

en Tura Limpia y que el acceso a su panel está protegido.



\## Requisitos previos



\- Git

\- Python 3 reciente (se recomienda 3.12 o superior)

\- Node.js

\- PostgreSQL en ejecución



\## Verificación rápida en la página desplegada



La aplicación está publicada en https://tura-limpia-unipacifico.vercel.app/



1\. Abrir https://tura-limpia-unipacifico.vercel.app/login

2\. Iniciar sesión con las credenciales del administrador (solicitarlas al equipo).

3\. Resultado esperado: se abre el panel en

&#x20;  https://tura-limpia-unipacifico.vercel.app/dashboard

4\. Cerrar sesión desde la barra lateral.

&#x20;  Resultado esperado: vuelve a `/login`.



Para ejecutar el proyecto en un equipo local, seguir las partes siguientes.



\## Parte 1. Preparar el entorno



1\. Clonar el repositorio:



```powershell

git clone https://github.com/Deymar0118/Tura-Limpia\_G1.git

cd Tura-Limpia\_G1

```



2\. Crear una base de datos vacía llamada `tura\_limpia` en PostgreSQL (por

&#x20;  ejemplo con pgAdmin: clic derecho en Databases → Create → Database).



3\. Preparar el backend (desde la carpeta `backend`):



```powershell

cd backend

python -m venv .venv

.venv\\Scripts\\activate

pip install -r requirements.txt

copy .env.example .env

```



&#x20;  Si PowerShell bloquea la activación del entorno, ejecutar una vez

&#x20;  `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`.



4\. Editar `backend/.env` (ver Parte 2).



5\. Iniciar el backend (desde la carpeta `backend`):



```powershell

uvicorn src.main:app --reload

```



&#x20;  El backend queda en http://localhost:8000 y su documentación en

&#x20;  http://localhost:8000/docs



6\. Iniciar el frontend (en otra terminal, desde la carpeta `frontend`):



```powershell

cd frontend

npm install

npm run dev

```





&#x20;  El frontend queda en http://localhost:5173

> El frontend necesita que el backend esté en ejecución. Si el login muestra

> "No se pudo conectar con el servidor", comprobar que el backend sigue activo

> en http://localhost:8000.



> Nota: el panel `/dashboard` está en la rama `feature/resend-email` hasta que

> se integre a `main`.



\## Parte 2. Variables de entorno y administrador inicial



Variables de `backend/.env`:



\- `DATABASE\_URL`: conexión a PostgreSQL. La plantilla usa el usuario `postgres`,

&#x20; la contraseña `turalimpia` y la base `tura\_limpia`; ajustar si son distintos.

\- `ADMIN\_NOMBRE`, `ADMIN\_EMAIL`, `ADMIN\_PASSWORD`: datos del administrador que

&#x20; se crea automáticamente al arrancar el backend, si todavía no existe.

\- `RESEND\_API\_KEY`: clave del servicio de correo. Es obligatoria para que el

&#x20; backend arranque en la rama con verificación por correo. Para solo iniciar

&#x20; sesión como administrador sirve cualquier valor de prueba; para enviar

&#x20; correos reales se necesita una clave válida de Resend.



Para comprobar que el administrador se creó:



1\. Con el backend en ejecución, abrir http://localhost:8000/docs

2\. Abrir `POST /auth/login` → Try it out y enviar el correo y la contraseña

&#x20;  definidos en `.env`.

&#x20;  Resultado esperado: respuesta 200 con `access\_token`, `refresh\_token` y

&#x20;  `token\_type`.

3\. Con una contraseña incorrecta, la respuesta esperada es 401 con el mensaje

&#x20;  "Credenciales inválidas".

4\. Pulsar Authorize, pegar el `access\_token` y ejecutar `GET /auth/me`.

&#x20;  Resultado esperado: respuesta 200 con el rol `admin`.



> Las credenciales reales no se publican en este repositorio. El archivo `.env`

> está excluido del control de versiones.



\## Parte 3. Verificar el acceso



Con el backend (http://localhost:8000) y el frontend (http://localhost:5173)
en ejecución:

1. **Inicio de sesión correcto:** abrir `/login` e ingresar el correo y la
   contraseña del administrador definidos en `backend/.env`.
   Resultado esperado: se abre `/dashboard`.
2. **Credenciales incorrectas:** ingresar una contraseña errónea.
   Resultado esperado: el mensaje "Credenciales inválidas".
3. **Límite de intentos:** realizar más de 5 intentos en un minuto.
   Resultado esperado: "Demasiadas solicitudes, intenta mas tarde".
4. **Cerrar sesión:** usar el botón de cerrar sesión de la barra lateral.
   Resultado esperado: vuelve a `/login`.
5. **Acceso sin autenticación a la API del panel:** en
   http://localhost:8000/docs, ejecutar `GET /dashboard/resumen` sin autorizar.
   Resultado esperado: respuesta 401 con "Not authenticated".
6. **Token inválido:** pulsar Authorize con un texto cualquiera y repetir la
   petición. Resultado esperado: 401 con "Token inválido o expirado".
7. **Sesión de administrador:** iniciar sesión en `POST /auth/login`, copiar el
   `access_token`, pegarlo en Authorize (solo el token) y repetir la petición.
   Resultado esperado: respuesta 200.
8. **Rol:** con el mismo token, ejecutar `GET /auth/me`.
   Resultado esperado: respuesta 200 con el rol `admin`.
9. **Usuario sin verificar:** intentar iniciar sesión con un ciudadano que aún
   no verificó su correo. Resultado esperado: 403 con "Usuario inactivo".



\## Parte 4. Problemas frecuentes



- **El login muestra "No se pudo conectar con el servidor":** el backend no
  está en ejecución. Iniciarlo con `uvicorn src.main:app --reload` desde la
  carpeta `backend` y abrir el frontend en http://localhost:5173 (no en
  127.0.0.1).
- **El backend no arranca y menciona `resend_api_key`:** falta la variable
  `RESEND_API_KEY` en `backend/.env`. Agregar cualquier valor de prueba para
  iniciar sesión como administrador.
- **El backend no arranca y dice "no existe la relación tokens_revocados":**
  faltan las tablas. Ejecutar `alembic upgrade head` desde la carpeta
  `backend` (con el entorno virtual activo) y volver a iniciar el backend.
- **El backend o `alembic upgrade head` fallan con "connection was closed in
  the middle of operation":** revisar que la contraseña de `DATABASE_URL`
  coincida con la del usuario `postgres` de PostgreSQL.
- **No inicia sesión con el administrador:** si la base de datos ya tenía un
  administrador creado con otra contraseña, el backend no la reemplaza. Usar
  una base de datos nueva o iniciar sesión con la contraseña anterior.
- **Mensaje "Demasiadas solicitudes":** esperar un minuto y reintentar.
- **El registro de un ciudadano muestra "No se pudo conectar con el
  servidor" con una clave de Resend de prueba:** el correo de verificación no
  se envía, pero la cuenta queda creada e inactiva. Para enviar correos reales
  se necesita una clave válida de Resend.
- **Error al activar el entorno virtual en PowerShell:** ejecutar
  `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` y reintentar.

