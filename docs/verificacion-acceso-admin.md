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



\_Sección a cargo de la otra persona de la pareja.\_



\## Parte 4. Problemas frecuentes



\_Sección a cargo de la otra persona de la pareja.\_

