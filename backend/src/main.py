
import logging
from contextlib import asynccontextmanager
from datetime import date, datetime, timezone

from fastapi import (
    Depends,
    FastAPI,
    HTTPException,
    Request,
    Response,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from sqlalchemy import delete, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import get_settings
from src.core.database import AsyncSessionLocal, crear_tablas, get_db
from src.models.perfil import Perfil
from src.models.rol import Rol
from src.models.token_revocado import TokenRevocado
from src.models.usuario import Usuario
from src.routers.auth import router as auth_router
from src.schemas.auth import RolEnum
from src.security import hashear_password, limiter


logger = logging.getLogger("turalimpia.main")
settings = get_settings()


def separar_nombre(nombre_completo: str) -> tuple[str, str]:
    partes = nombre_completo.strip().split()

    if len(partes) == 1:
        return partes[0], "No especificado"

    return partes[0], " ".join(partes[1:])


async def purgar_tokens_expirados() -> int:
    """Elimina los tokens revocados cuya fecha de expiración ya pasó."""

    async with AsyncSessionLocal() as session:
        resultado = await session.execute(
            delete(TokenRevocado).where(
                TokenRevocado.expira_en < datetime.now(timezone.utc)
            )
        )

        await session.commit()

        return resultado.rowcount or 0


async def inicializar_roles() -> None:
    """Crea los roles base que todavía no existen."""

    async with AsyncSessionLocal() as session:
        async with session.begin():

            for rol_enum in RolEnum:
                stmt = select(Rol).where(
                    Rol.nombre_rol == rol_enum.value
                )

                result = await session.execute(stmt)
                rol_existente = result.scalar_one_or_none()

                if not rol_existente:
                    nuevo_rol = Rol(
                        nombre_rol=rol_enum.value,
                        estado="activo",
                    )

                    session.add(nuevo_rol)

                    logger.info(
                        "Rol creado automáticamente: %s",
                        rol_enum.value,
                    )


async def crear_admin_inicial() -> None:
    """Crea el administrador inicial si está configurado."""

    if not all(
        [
            settings.admin_email,
            settings.admin_password,
            settings.admin_nombre,
        ]
    ):
        logger.info(
            "No se configuraron credenciales de administrador inicial."
        )
        return

    email = settings.admin_email.strip().lower()
    nombre_completo = settings.admin_nombre.strip()

    nombres, apellidos = separar_nombre(nombre_completo)

    async with AsyncSessionLocal() as session:
        async with session.begin():

            usuario_existente = (
                await session.execute(
                    select(Usuario.id_usuario).where(
                        Usuario.correo == email
                    )
                )
            ).scalar_one_or_none()

            if usuario_existente:
                logger.info(
                    "El administrador inicial ya existe: %s",
                    email,
                )
                return

            rol_admin = (
                await session.execute(
                    select(Rol).where(
                        Rol.nombre_rol == RolEnum.ADMIN.value
                    )
                )
            ).scalar_one_or_none()

            if not rol_admin:
                rol_admin = Rol(
                    nombre_rol=RolEnum.ADMIN.value,
                    estado="activo",
                )

                session.add(rol_admin)
                await session.flush()

            admin = Usuario(
                nombres=nombres,
                apellidos=apellidos,
                nombre_completo=nombre_completo,
                nombre_usuario=email.split("@")[0],
                correo=email,
                password_hash=hashear_password(
                    settings.admin_password
                ),
                estado="activo",
                es_superadministrador=True,
            )

            session.add(admin)
            await session.flush()

            perfil_admin = Perfil(
                id_usuario=admin.id_usuario,
                id_rol=rol_admin.id_rol,
                estado="activo",
                fecha_inicio=date.today(),
            )

            session.add(perfil_admin)

            logger.info(
                "Administrador inicial y perfil creados: %s",
                email,
            )


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestiona la inicialización y el cierre de la aplicación."""

    log = logging.getLogger("turalimpia.startup")

    try:
        if settings.es_produccion:
            log.info("Validando configuración de producción...")
            settings.validar_produccion()

        log.info("Inicializando esquema de tablas...")
        await crear_tablas()

        log.info("Base de datos inicializada correctamente.")

        eliminados = await purgar_tokens_expirados()

        if eliminados:
            log.info(
                "Tokens expirados eliminados: %d",
                eliminados,
            )

        await inicializar_roles()
        await crear_admin_inicial()

        log.info("Inicio de Tura Limpia completado.")

    except Exception:
        log.exception(
            "Error crítico durante el inicio del servidor."
        )
        raise

    yield

    log.info("Apagando servidor Tura Limpia API...")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "API REST para el Sistema de Gestión y Optimización "
        "de la Recolección y Transporte de Residuos Sólidos "
        "en Buenaventura (Tura Limpia)."
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
            "detail": "Demasiadas solicitudes, intenta más tarde."
        },
    )


origins = [
    origin.strip()
    for origin in settings.allowed_origins.split(",")
    if origin.strip()
]

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


@app.middleware("http")
async def security_headers(
    request: Request,
    call_next,
):
    """Agrega cabeceras de seguridad a las respuestas HTTP."""

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


app.include_router(auth_router)


@app.get("/", tags=["Root"])
async def root():
    """Devuelve información básica de la API."""

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
    """Comprueba la conectividad con PostgreSQL."""

    try:
        await db.execute(text("SELECT 1"))

        return {
            "status": "ok",
            "database": "connected",
            "app": settings.app_name,
            "version": settings.app_version,
        }

    except Exception as error:
        logger.exception(
            "Error al comprobar la conexión con PostgreSQL."
        )

        raise HTTPException(
            status_code=500,
            detail="Error de conexión con PostgreSQL.",
        ) from error
