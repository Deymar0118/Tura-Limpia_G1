
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import (
    FastAPI,
    Request,
    Response,
    Depends,
    HTTPException,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from sqlalchemy import text, delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.middleware.audit import AuditMiddleware
from src.schemas.auth import RolEnum
from src.core.config import get_settings
from src.core.database import AsyncSessionLocal, get_db

from src.security import (
    limiter,
    hashear_password,
)

from src.models.usuario import Usuario
from src.models.token_revocado import TokenRevocado
from src.models.rol import Rol
from src.models.perfil import Perfil

from src.routers.auth import router as auth_router
from src.routers.dashboard import router as dashboard_router
from src.routers.vehiculos import router as vehiculos_router


logger = logging.getLogger("turalimpia.main")
settings = get_settings()


async def purgar_tokens_expirados():
    async with AsyncSessionLocal() as session:
        resultado = await session.execute(
            delete(TokenRevocado).where(
                TokenRevocado.expira_en < datetime.now(timezone.utc)
            )
        )
        await session.commit()
        return resultado.rowcount


async def inicializar_roles() -> None:
    """Verifica e inserta los roles base del sistema si aún no existen en la BD."""
    async with AsyncSessionLocal() as session:
        async with session.begin():
            for rol_enum in RolEnum:
                stmt = select(Rol).where(
                    Rol.nombre == rol_enum.value
                )
                result = await session.execute(stmt)
                rol_existente = result.scalar_one_or_none()

                if not rol_existente:
                    nuevo_rol = Rol(nombre=rol_enum.value)
                    session.add(nuevo_rol)
                    print(
                        f"-> Rol creado automáticamente: {rol_enum.value}"
                    )


async def crear_admin_inicial():
    if not all([
        settings.admin_email,
        settings.admin_password,
        settings.admin_nombre,
    ]):
        return

    async with AsyncSessionLocal() as session:
        async with session.begin():
            usuario_existente = (
                await session.execute(
                    select(Usuario.id).where(
                        Usuario.email == settings.admin_email
                    )
                )
            ).scalar_one_or_none()

            if usuario_existente:
                return

            rol_admin = (
                await session.execute(
                    select(Rol).where(
                        Rol.nombre == RolEnum.ADMIN.value
                    )
                )
            ).scalar_one_or_none()

            if not rol_admin:
                rol_admin = Rol(nombre=RolEnum.ADMIN.value)
                session.add(rol_admin)
                await session.flush()

            admin = Usuario(
                nombre=settings.admin_nombre,
                email=settings.admin_email,
                password_hash=hashear_password(
                    settings.admin_password
                ),
                is_active=True,
                email_verified=True,
                email_verified_at=datetime.now(timezone.utc),
            )

            session.add(admin)
            await session.flush()

            session.add(
                Perfil(
                    usuario_id=admin.id,
                    rol_id=rol_admin.id,
                )
            )

            logging.getLogger("tura_limpia").info(
                "Admin inicial y perfil creados con éxito: %s",
                settings.admin_email,
            )


@asynccontextmanager
async def lifespan(app: FastAPI):
    log = logging.getLogger("turalimpia.startup")

    try:
        if settings.es_produccion:
            log.info(
                "Validando credenciales de entorno de producción..."
            )
            settings.validar_produccion()

        log.info(
            "Verificando conexión con la base de datos..."
        )

        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))

        log.info("Conexión con la base de datos establecida.")

        eliminados = await purgar_tokens_expirados()

        if eliminados:
            log.info(
                "Tokens expirados purgados: %d",
                eliminados,
            )

        await inicializar_roles()
        await crear_admin_inicial()

        log.info("Startup completo.")

    except Exception as e:
        logger.error(
            "Error crítico en el arranque del servidor: %s",
            e,
            exc_info=True,
        )
        raise

    yield

    logger.info("Apagando servidor TuraLimpia API...")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "API REST para el Sistema de Gestión y Optimización de la Recolección "
        "y Transporte de Residuos Sólidos en Buenaventura (TuraLimpia)."
    ),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(
    request: Request,
    exc: RateLimitExceeded,
):
    return JSONResponse(
        status_code=429,
        content={
            "detail": "Demasiadas solicitudes, intenta más tarde"
        },
    )


# Configuración de políticas de origen cruzado (CORS)
origins = [
    origin.strip()
    for origin in settings.allowed_origins.split(",")
    if origin.strip()
]

# Orígenes permitidos para desarrollo local.
# No se agregan automáticamente en producción.
if not settings.es_produccion:
    origins.extend([
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ])

# Eliminar posibles orígenes duplicados.
origins = list(dict.fromkeys(origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=[
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
    ],
    allow_headers=[
        "Authorization",
        "Content-Type",
    ],
)

app.add_middleware(AuditMiddleware)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    """Inyecta cabeceras de seguridad HTTP a todas las respuestas."""
    response: Response = await call_next(request)

    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "0"
    response.headers["Referrer-Policy"] = (
        "strict-origin-when-cross-origin"
    )

    if settings.es_produccion:
        response.headers["Strict-Transport-Security"] = (
            "max-age=63072000; includeSubDomains"
        )

    return response


# Registro de routers
app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(vehiculos_router)


@app.get("/", tags=["Root"])
async def root():
    """Ruta raíz de confirmación de estado de la API."""
    return {
        "app": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
        "status": "active",
    }


@app.get("/healthcheck", tags=["Health"])
async def healthcheck(
    db: AsyncSession = Depends(get_db),
):
    """Evalúa la conectividad en tiempo real con PostgreSQL."""
    try:
        await db.execute(text("SELECT 1"))

        return {
            "status": "ok",
            "database": "connected",
            "app": settings.app_name,
            "version": settings.app_version,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=(
                f"Error de conexión con PostgreSQL: {str(e)}"
            ),
        )
