
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.services.dashboard_service import DashboardService

from src.repository import UsuarioRepository

from src.core.database import get_db

from src.security import requiere_rol

from src.schemas import (
    RolEnum,
    DashboardResumenResponse,
)


def get_dashboard_service(
    db: AsyncSession = Depends(get_db),
) -> DashboardService:
    usuario_repo = UsuarioRepository(db)

    return DashboardService(
        usuario_repository=usuario_repo
    )


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get(
    "/resumen",
    response_model=DashboardResumenResponse,
    summary="Obtener resumen del Dashboard",
    description="Retorna las métricas generales de usuarios del sistema.",
    responses={
        200: {"description": "Resumen obtenido correctamente"},
        401: {"description": "Token inválido o expirado"},
        403: {"description": "No tiene permisos para acceder al Dashboard"},
    },
)
async def obtener_resumen_dashboard(
    dashboard_service: DashboardService = Depends(
        get_dashboard_service
    ),
    usuario=Depends(
        requiere_rol(RolEnum.ADMIN, RolEnum.GERENTE)
    ),
):
    return await dashboard_service.obtener_resumen()
