
import logging
from datetime import date, datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from src.models.perfil import Perfil
from src.models.token_revocado import TokenRevocado
from src.models.usuario import Usuario
from src.repository import (
    PerfilRepository,
    RolRepository,
    TokenRevocadoRepository,
    UsuarioRepository,
)
from src.schemas import (
    CambioPasswordRequest,
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    RegistroRequest,
    RolEnum,
    TokenResponse,
    UsuarioResponse,
)
from src.security import (
    crear_access_token,
    crear_refresh_token,
    hashear_password,
    verificar_password,
    verificar_token,
)

logger = logging.getLogger("turalimpia.auth_service")


class AuthService:

    def __init__(
        self,
        usuario_repository: UsuarioRepository,
        perfil_repository: PerfilRepository,
        rol_repository: RolRepository,
        token_revocado_repository: TokenRevocadoRepository,
    ):
        self.usuario_repository = usuario_repository
        self.perfil_repository = perfil_repository
        self.rol_repository = rol_repository
        self.token_revocado_repository = token_revocado_repository

    @staticmethod
    def _separar_nombre(nombre_completo: str) -> tuple[str, str]:
        partes = nombre_completo.strip().split()

        if len(partes) == 1:
            return partes[0], "No especificado"

        return partes[0], " ".join(partes[1:])

    @staticmethod
    def _crear_token_data(usuario: Usuario, roles: list[str]) -> dict:
        return {
            "sub": str(usuario.id_usuario),
            "roles": roles,
        }

    # -------------------------------------------------
    # REGISTRO
    # -------------------------------------------------

    async def registrar_usuario(
        self,
        registro_request: RegistroRequest,
    ) -> TokenResponse:

        email = str(registro_request.email).lower()

        existe = await self.usuario_repository.find_usuario_by_email(
            email
        )

        if existe:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ya existe un usuario con ese email",
            )

        rol = await self.rol_repository.find_rol_by_nombre(
            RolEnum.CIUDADANO.value
        )

        if not rol:
            logger.error("No existe el rol CIUDADANO en la base de datos")

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No se encuentra configurado el rol ciudadano",
            )

        nombres, apellidos = self._separar_nombre(
            registro_request.nombre
        )

        usuario = Usuario(
            nombres=nombres,
            apellidos=apellidos,
            nombre_completo=registro_request.nombre.strip(),
            nombre_usuario=email.split("@")[0],
            correo=email,
            password_hash=hashear_password(
                registro_request.password
            ),
            estado="activo",
            es_superadministrador=False,
        )

        try:
            usuario = await self.usuario_repository.create_usuario(
                usuario
            )

            perfil = Perfil(
                id_usuario=usuario.id_usuario,
                id_rol=rol.id_rol,
                estado="activo",
                fecha_inicio=date.today(),
            )

            await self.perfil_repository.create_perfil(perfil)

        except IntegrityError as e:
            logger.error(
                "Error de integridad al registrar usuario: %s",
                e,
            )

            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Uno de los datos ingresados ya se encuentra registrado",
            )

        except SQLAlchemyError as e:
            logger.exception(
                "Error al registrar usuario: %s",
                e,
            )

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error interno al registrar el usuario",
            )

        token_data = self._crear_token_data(
            usuario,
            [rol.nombre_rol],
        )

        return TokenResponse(
            access_token=crear_access_token(token_data),
            refresh_token=crear_refresh_token(token_data),
        )

    # -------------------------------------------------
    # LOGIN
    # -------------------------------------------------

    async def login(
        self,
        login_request: LoginRequest,
    ) -> TokenResponse:

        email = str(login_request.email).lower()

        usuario = await self.usuario_repository.find_usuario_by_email(
            email
        )

        if not usuario or not verificar_password(
            login_request.password,
            usuario.password_hash,
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales inválidas",
            )

        if usuario.estado != "activo":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuario inactivo",
            )

        roles_activos = (
            await self.rol_repository.get_active_roles_by_user(
                usuario.id_usuario
            )
        )

        if not roles_activos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuario sin roles activos",
            )

        lista_roles = [
            rol.nombre_rol for rol in roles_activos
        ]

        token_data = self._crear_token_data(
            usuario,
            lista_roles,
        )

        return TokenResponse(
            access_token=crear_access_token(token_data),
            refresh_token=crear_refresh_token(token_data),
        )

    # -------------------------------------------------
    # RENOVAR TOKEN
    # -------------------------------------------------

    async def refresh_token(
        self,
        refresh_request: RefreshRequest,
    ) -> TokenResponse:

        payload = verificar_token(
            refresh_request.refresh_token
        )

        if not payload or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token inválido o expirado",
            )

        jti = payload.get("jti")
        usuario_id = payload.get("sub")

        if not jti or not usuario_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token inválido",
            )

        token_revocado = (
            await self.token_revocado_repository.find_by_jti(jti)
        )

        if token_revocado:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token ya fue utilizado o revocado",
            )

        usuario = await self.usuario_repository.find_usuario_by_id(
            usuario_id
        )

        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado",
            )

        if usuario.estado != "activo":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuario inactivo",
            )

        roles_activos = (
            await self.rol_repository.get_active_roles_by_user(
                usuario.id_usuario
            )
        )

        if not roles_activos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuario sin roles activos",
            )

        lista_roles = [
            rol.nombre_rol for rol in roles_activos
        ]

        try:
            await self.token_revocado_repository.create(
                TokenRevocado(
                    jti=jti,
                    expira_en=datetime.fromtimestamp(
                        payload["exp"],
                        tz=timezone.utc,
                    ),
                )
            )

        except IntegrityError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="El token ya fue utilizado o revocado",
            )

        token_data = self._crear_token_data(
            usuario,
            lista_roles,
        )

        return TokenResponse(
            access_token=crear_access_token(token_data),
            refresh_token=crear_refresh_token(token_data),
        )

    # -------------------------------------------------
    # LOGOUT
    # -------------------------------------------------

    async def logout(
        self,
        logout_request: LogoutRequest,
    ) -> dict:

        payload = verificar_token(
            logout_request.refresh_token
        )

        if not payload or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token inválido o expirado",
            )

        jti = payload.get("jti")

        if not jti:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token inválido",
            )

        existe = await self.token_revocado_repository.find_by_jti(
            jti
        )

        if not existe:
            try:
                await self.token_revocado_repository.create(
                    TokenRevocado(
                        jti=jti,
                        expira_en=datetime.fromtimestamp(
                            payload["exp"],
                            tz=timezone.utc,
                        ),
                    )
                )

            except IntegrityError:
                logger.warning(
                    "Intento de revocar un token previamente registrado"
                )

        return {"detail": "Sesión cerrada"}

    # -------------------------------------------------
    # OBTENER USUARIO
    # -------------------------------------------------

    async def obtener_usuario(
        self,
        usuario_id: str,
    ) -> UsuarioResponse:

        usuario = await self.usuario_repository.find_usuario_by_id(
            usuario_id
        )

        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado",
            )

        roles_activos = (
            await self.rol_repository.get_active_roles_by_user(
                usuario.id_usuario
            )
        )

        lista_roles = [
            rol.nombre_rol for rol in roles_activos
        ]

        return self._to_usuario_response(
            usuario,
            lista_roles,
        )

    # -------------------------------------------------
    # CAMBIAR CONTRASEÑA
    # -------------------------------------------------

    async def cambiar_password(
        self,
        usuario_id: str,
        datos: CambioPasswordRequest,
    ) -> dict:

        usuario = await self.usuario_repository.find_usuario_by_id(
            usuario_id
        )

        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado",
            )

        if not verificar_password(
            datos.password_actual,
            usuario.password_hash,
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="La contraseña actual es incorrecta",
            )

        usuario.password_hash = hashear_password(
            datos.password_nueva
        )

        await self.usuario_repository.update_usuario(usuario)

        return {"detail": "Contraseña actualizada"}

    # -------------------------------------------------
    # CONVERTIR USUARIO A RESPUESTA
    # -------------------------------------------------

    def _to_usuario_response(
        self,
        usuario: Usuario,
        lista_roles: list[str],
    ) -> UsuarioResponse:

        return UsuarioResponse(
            id=str(usuario.id_usuario),
            nombre=usuario.nombre_completo or (
                f"{usuario.nombres} {usuario.apellidos}"
            ),
            email=usuario.correo,
            roles=lista_roles,
            is_activo=usuario.estado == "activo",
            created_at=usuario.fecha_registro,
            last_login=None,
        )
