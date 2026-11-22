from datetime import datetime, timedelta, timezone
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from fastapi import HTTPException, status
from src.models.token_revocado import TokenRevocado
from src.models.usuario import Usuario
from src.models.perfil import Perfil
from src.models.rol import Rol
from src.models.codigo_verificacion import CodigoVerificacion
from src.services.email_service import get_email_service
from src.security import (
    crear_access_token,
    crear_refresh_token,
    crear_email_token,
    hashear_password,
    verificar_password,
    verificar_token,
)
from src.schemas import (
    CambioPasswordRequest,
    AsignarRolRequest,
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    RegistroRequest,
    RolEnum,
    TokenResponse,
    UsuarioResponse,
    TokenEmail,
)
from src.repository import (
    UsuarioRepository,
    RolRepository,
    TokenRevocadoRepository,
    PerfilRepository,
    CodigoVerificacionRepository,
)
import secrets
import logging

logger = logging.getLogger("mediflow.auth_service")

class AuthService:
    def __init__(self, usuario_repository: UsuarioRepository,
                  perfil_repository: PerfilRepository,
                  rol_repository: RolRepository,
                  token_revocado_repository: TokenRevocadoRepository,
                  codigo_verificacion_repository: CodigoVerificacionRepository):
        self.usuario_repository = usuario_repository
        self.perfil_repository = perfil_repository
        self.rol_repository = rol_repository
        self.token_revocado_repository = token_revocado_repository
        self.codigo_verificacion_repository = codigo_verificacion_repository


    async def registrar_usuario(self, registro_request: RegistroRequest) -> TokenEmail:
       
        existe = await self.usuario_repository.find_usuario_by_email(registro_request.email)
        usuario = None
        if existe:
            if existe.email_verified:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Ya existe una cuenta con ese email",
                )
            existe.nombre=registro_request.nombre
            existe.password_hash=hashear_password(registro_request.password)
            usuario = await self.usuario_repository.update_usuario(existe)


        if usuario == None: 
            usuario = Usuario(
                    nombre=registro_request.nombre,
                    email=registro_request.email,
                    password_hash=hashear_password(registro_request.password),
                )

            try:
                usuario = await self.usuario_repository.create_usuario(usuario)
            except IntegrityError as e:

                logger.error(f"Error al registrar usuario: {e}")
        
                raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Uno de los datos ingresados ya se encuentra registrado y debe ser único.",
                    )
            except SQLAlchemyError as e:
                logger.error(f"Error interno al registrar usuario: {e}")
                raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Error interno al registrar el usuario.",
                )
            
        codigo_verificacion_id = await self._enviar_codigo_verficacion(
                email=usuario.email,
                nombre=usuario.nombre,
                usuario_id=usuario.id
            )

        token_data = {"sub": codigo_verificacion_id}

        return TokenEmail(
                email_token=crear_email_token(token_data)
            )
    

    async def login(self, login_request: LoginRequest) -> TokenResponse:
        usuario = await self.usuario_repository.find_usuario_by_email(login_request.email)
        if not usuario or not verificar_password(login_request.password, usuario.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales inválidas",
            )

        if not usuario.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuario inactivo",
            )

        if not usuario.email_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="este email no ha finalizado el proceso de registro",
            )

        roles_activos = await self.rol_repository.get_active_roles_by_user(usuario.id)
 
        if not roles_activos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuario sin roles activos",
            )

        lista_roles = [r.nombre for r in roles_activos]

        fecha_actual = datetime.now(timezone.utc)
        usuario.last_login = fecha_actual
        usuario = await self.usuario_repository.update_usuario(usuario)
        token_data = {"sub": usuario.id, "roles": lista_roles}
        return TokenResponse(
            access_token=crear_access_token(token_data),
            refresh_token=crear_refresh_token(token_data),
        )

    async def verificar_email(self, email_token: str, codigo: str) -> TokenResponse:
        payload = verificar_token(email_token)
        if not payload or not payload.get("sub"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token de verificación inválido o expirado",
            )

        codigo_verificacion = await self.codigo_verificacion_repository.find_codigo_verificacion_by_id(
            payload["sub"]
        )
        ahora = datetime.now(timezone.utc)

        if not codigo_verificacion:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Código de verificación no encontrado",
            )

        if codigo_verificacion.used_at is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este código ya fue utilizado",
            )

        expires_at = codigo_verificacion.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if expires_at <= ahora:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El código de verificación ha expirado",
            )

        if not verificar_password(codigo, codigo_verificacion.code_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Código de verificación incorrecto",
            )

        usuario = await self.usuario_repository.find_usuario_by_id(codigo_verificacion.usuario_id)
        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado",
            )

        rol_ciudadano = await self.rol_repository.find_rol_by_nombre(RolEnum.CIUDADANO.value)
        if not rol_ciudadano:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Rol ciudadano no configurado",
            )

        codigo_verificacion.used_at = ahora
        await self.codigo_verificacion_repository.db.commit()
        await self.codigo_verificacion_repository.db.refresh(codigo_verificacion)

        usuario.email_verified = True
        usuario.email_verified_at = ahora
        usuario.is_active = True
        usuario = await self.usuario_repository.update_usuario(usuario)

        perfil = Perfil(
            usuario_id=usuario.id,
            rol_id=rol_ciudadano.id,
            is_active=True,
        )
        await self.perfil_repository.create_perfil(perfil)

        roles_activos = await self.rol_repository.get_active_roles_by_user(usuario.id)
        lista_roles = [r.nombre for r in roles_activos] if roles_activos else [rol_ciudadano.nombre]

        token_data = {"sub": usuario.id, "roles": lista_roles}
        return TokenResponse(
            access_token=crear_access_token(token_data),
            refresh_token=crear_refresh_token(token_data),
        )


    async def refresh_token(self, refresh_request: RefreshRequest) -> TokenResponse:
    
        payload = verificar_token(refresh_request.refresh_token) 
    
        if not payload or payload.get("type") != "refresh":
                raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token invalido o expirado",
            )
    
        jti = payload.get("jti")
        if jti:
            token_revocado = await self.token_revocado_repository.find_by_jti(jti)
            if token_revocado:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token ya fue utilizado",
                )
    
    
        usuario = await self.usuario_repository.find_user_by_id(payload.get("sub"))
            
        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado",
            )
        await self.token_revocado_repository.create(TokenRevocado(
            jti=jti,    
            expira_en=datetime.fromtimestamp(payload["exp"], tz=timezone.utc),
         ))

        if not usuario.activo:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuario inactivo",
            )
        
        roles_activos = await self.rol_repository.get_active_roles_by_user(usuario.id)

        if not roles_activos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuario sin roles activos",
            )

        lista_roles = [r.nombre for r in roles_activos]
    
        token_data = {"sub": usuario.id, "roles": lista_roles}
        return TokenResponse(
            access_token=crear_access_token(token_data),
            refresh_token=crear_refresh_token(token_data),
        )
    

    async def logout(self, logout_request: LogoutRequest)-> dict:
        payload = verificar_token(logout_request.refresh_token)

        if not payload or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token invalido",
            )

        jti = payload.get("jti")
        if jti:
            existe = await self.token_revocado_repository.find_by_jti(jti)
            if not existe:
                await self.token_revocado_repository.create(TokenRevocado(
                    jti=jti,
                    expira_en=datetime.fromtimestamp(payload["exp"], tz=timezone.utc),
                ))

        return {"detail": "Sesion cerrada"}

    
    async def obtener_usuario(self, usuario_id: str) -> UsuarioResponse:
        usuario = await self.usuario_repository.find_usuario_by_id(usuario_id)
        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado",
            )
        roles_activos = await self.rol_repository.get_active_roles_by_user(usuario.id)
        if not roles_activos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuario sin roles activos",  
            )
        lista_roles = [r.nombre for r in roles_activos]
        return self._to_usuario_response(usuario, lista_roles)



    async def cambiar_password(self, usuario_id: str, datos: CambioPasswordRequest) -> dict:
        usuario = await self.user_repository.find_usuario_by_id(usuario_id)
        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado",
            )

        if not verificar_password(datos.password_actual, usuario.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="La contraseña actual es incorrecta",
            )

        nuevo_hash = hashear_password(datos.password_nueva)
        usuario.password_hash = nuevo_hash
        await self.usuario_repository.update_usuario(usuario)
        return {"detail": "Contraseña actualizada"}


    def _to_usuario_response(self, usuario: Usuario, lista_roles : list[str]) -> UsuarioResponse:
        return UsuarioResponse(
            id=usuario.id,
            nombre=usuario.nombre,
            email=usuario.email,
            roles=lista_roles,
            activo=usuario.is_active,
            created_at=usuario.created_at,
            last_login=usuario.last_login,
        )

    @staticmethod
    def _generar_codigo_verificacion() -> str:
        return f"{secrets.randbelow(1_000_000):06d}"

    async def _enviar_codigo_verficacion(self, email: str, nombre: str, usuario_id:str) -> str:
        codigo = self._generar_codigo_verificacion()
        codigo_verifacion = CodigoVerificacion(
            usuario_id=usuario_id,
            code_hash=hashear_password(codigo),
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=10)
        )

        codigo_verifacion = await self.codigo_verificacion_repository.create_codigo_verificacion(codigo_verifacion)

        await get_email_service().enviar_codigo_verificacion(
            email_destino=email,
            nombre=nombre,
            codigo=codigo
        )

        return codigo_verifacion.id
