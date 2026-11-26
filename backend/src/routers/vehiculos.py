
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.repository import VehiculoRepository
from src.schemas import RolEnum
from src.schemas.vehiculo import (
    VehiculoCreate,
    VehiculoUpdate,
    VehiculoStatusUpdate,
    VehiculoResponse,
)
from src.security import requiere_rol
from src.services.vehiculo_service import VehiculoService


def get_vehiculo_service(
    db: AsyncSession = Depends(get_db),
) -> VehiculoService:
    vehiculo_repo = VehiculoRepository(db)

    return VehiculoService(
        vehiculo_repository=vehiculo_repo
    )


router = APIRouter(
    prefix="/vehiculos",
    tags=["Vehículos"],
    dependencies=[
        Depends(requiere_rol(RolEnum.ADMIN, RolEnum.GERENTE))
    ],
)


@router.post(
    "/",
    response_model=VehiculoResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar vehículo",
)
async def registrar_vehiculo(
    datos: VehiculoCreate,
    vehiculo_service: VehiculoService = Depends(get_vehiculo_service),
):
    return await vehiculo_service.registrar_vehiculo(datos)


@router.get(
    "/",
    summary="Listar vehículos",
)
async def listar_vehiculos(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    vehiculo_service: VehiculoService = Depends(get_vehiculo_service),
):
    return await vehiculo_service.listar_vehiculos(
        offset=offset,
        limit=limit,
    )


@router.get(
    "/{vehiculo_id}",
    response_model=VehiculoResponse,
    summary="Consultar vehículo",
)
async def obtener_vehiculo(
    vehiculo_id: str,
    vehiculo_service: VehiculoService = Depends(get_vehiculo_service),
):
    return await vehiculo_service.obtener_vehiculo(vehiculo_id)


@router.put(
    "/{vehiculo_id}",
    response_model=VehiculoResponse,
    summary="Actualizar vehículo",
)
async def actualizar_vehiculo(
    vehiculo_id: str,
    datos: VehiculoUpdate,
    vehiculo_service: VehiculoService = Depends(get_vehiculo_service),
):
    return await vehiculo_service.actualizar_vehiculo(
        vehiculo_id,
        datos,
    )


@router.patch(
    "/{vehiculo_id}/estado",
    response_model=VehiculoResponse,
    summary="Activar o desactivar vehículo",
)
async def cambiar_estado_vehiculo(
    vehiculo_id: str,
    datos: VehiculoStatusUpdate,
    vehiculo_service: VehiculoService = Depends(get_vehiculo_service),
):
    return await vehiculo_service.cambiar_estado(
        vehiculo_id,
        datos,
    )
