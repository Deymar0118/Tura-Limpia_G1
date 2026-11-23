from fastapi import APIRouter, Query, Request, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.services.auth_service import AuthService

from src.repository import (
    UsuarioRepository,
    RolRepository,
    TokenRevocadoRepository,
    PerfilRepository,
    CodigoVerificacionRepository
)

from src.core.database import get_db
from src.security import (
    obtener_usuario_actual,
    requiere_rol,
    limiter,
    obtener_email_token_actual,
)
from src.schemas import (
    LoginRequest,
    RegistroRequest,
    RefreshRequest,
    LogoutRequest,
    CambioPasswordRequest,
    AsignarRolRequest,
    TokenResponse,
    TokenPayload,
    UsuarioResponse,
    VerificarCodigoRequest,
    RolEnum,
    TokenEmail,
)

def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    usuario_repo = UsuarioRepository(db)
    rol_repo = RolRepository(db)
    perfil_repo = PerfilRepository(db)
    token_revocado_repo = TokenRevocadoRepository(db)
    codigo_Verificacion_repo = CodigoVerificacionRepository(db)

    return AuthService(
        usuario_repository=usuario_repo,
        rol_repository=rol_repo,
        perfil_repository=perfil_repo,
        token_revocado_repository=token_revocado_repo,
        codigo_verificacion_repository=codigo_Verificacion_repo
    )

router = APIRouter(prefix="/auth", tags=["Autenticacion"])


@router.post(
    "/registro",
    response_model=TokenEmail,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar nuevo usuario",
    description="Crea una cuenta con rol CIUDADANO por defecto y retorna los tokens de acceso.",
    responses={
        201: {"description": "Usuario creado exitosamente"},
        400: {"description": "Email ya registrado o datos invalidos"},
        429: {"description": "Limite de solicitudes excedido (3/min)"},
    },
)
@limiter.limit("3/minute")
async def registrar_usuario(request: Request, datos: RegistroRequest, auth_service: AuthService = Depends(get_auth_service)):
    return await auth_service.registrar_usuario(datos)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Iniciar sesion",
    description="Autentica al usuario con email y password, retorna access y refresh token.",
    responses={
        200: {"description": "Login exitoso"},
        401: {"description": "Credenciales invalidas"},
        429: {"description": "Limite de solicitudes excedido (5/min)"},
    },
)
@limiter.limit("5/minute")
async def login(request: Request, datos: LoginRequest, auth_service: AuthService = Depends(get_auth_service)):
    return await auth_service.login(datos)


@router.post(
    "/verificar-codigo",
    response_model=TokenResponse,
    summary="Verificar codigo de correo",
    description="Valida el codigo enviado al correo usando el token temporal y retorna access y refresh token.",
    responses={
        200: {"description": "Correo verificado y sesion iniciada"},
        400: {"description": "Codigo o token invalido, expirado o ya utilizado"},
        404: {"description": "Usuario no encontrado"},
        429: {"description": "Limite de solicitudes excedido"},
    },
)
@limiter.limit("5/minute")
async def verificar_codigo(
    request: Request,
    datos: VerificarCodigoRequest,
    email_token: str = Depends(obtener_email_token_actual),
    auth_service: AuthService = Depends(get_auth_service),):
    return await auth_service.verificar_email(
        email_token=email_token,
        codigo=datos.codigo,
    )


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="Cerrar sesion",
    description="Revoca el refresh token para invalidar la sesion activa.",
    responses={
        200: {"description": "Sesion cerrada correctamente"},
        401: {"description": "Token invalido"},
    },
)
async def logout(datos: LogoutRequest, auth_service: AuthService = Depends(get_auth_service)):
    return await auth_service.logout(datos)

@router.get(
    "/me",
    response_model=UsuarioResponse,
    summary="Perfil del usuario autenticado",
    description="Retorna los datos del usuario asociado al access token actual.",
    responses={
        200: {"description": "Datos del usuario"},
        401: {"description": "Token invalido o expirado"},
    },
)
async def perfil_actual(
    usuario: TokenPayload = Depends(obtener_usuario_actual),
    auth_service: AuthService = Depends(get_auth_service),
):
    return await auth_service.obtener_usuario(usuario.sub)