
from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from src.models.vehiculo import Vehiculo
from src.repository import VehiculoRepository
from src.schemas.vehiculo import (
    VehiculoCreate,
    VehiculoUpdate,
    VehiculoStatusUpdate,
    VehiculoResponse,
)


class VehiculoService:
    def __init__(self, vehiculo_repository: VehiculoRepository):
        self.vehiculo_repository = vehiculo_repository

    async def registrar_vehiculo(
        self,
        datos: VehiculoCreate,
    ) -> VehiculoResponse:
        placa_existente = (
            await self.vehiculo_repository.find_vehiculo_by_placa(
                datos.placa
            )
        )

        if placa_existente:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ya existe un vehículo registrado con esa placa",
            )

        vehiculo = Vehiculo(**datos.model_dump())

        try:
            vehiculo = await self.vehiculo_repository.create_vehiculo(
                vehiculo
            )
        except IntegrityError:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ya existe un vehículo registrado con esa placa",
            )
        except SQLAlchemyError:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error interno al registrar el vehículo",
            )

        return self._to_vehiculo_response(vehiculo)

    async def listar_vehiculos(
        self,
        offset: int = 0,
        limit: int = 50,
    ) -> dict:
        vehiculos, total = (
            await self.vehiculo_repository.get_vehiculos_paginated(
                offset=offset,
                limit=limit,
            )
        )

        return {
            "items": [
                self._to_vehiculo_response(vehiculo)
                for vehiculo in vehiculos
            ],
            "total": total,
            "offset": offset,
            "limit": limit,
        }

    async def obtener_vehiculo(
        self,
        vehiculo_id: str,
    ) -> VehiculoResponse:
        vehiculo = (
            await self.vehiculo_repository.find_vehiculo_by_id(
                vehiculo_id
            )
        )

        if not vehiculo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vehículo no encontrado",
            )

        return self._to_vehiculo_response(vehiculo)

    async def actualizar_vehiculo(
        self,
        vehiculo_id: str,
        datos: VehiculoUpdate,
    ) -> VehiculoResponse:
        vehiculo = (
            await self.vehiculo_repository.find_vehiculo_by_id(
                vehiculo_id
            )
        )

        if not vehiculo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vehículo no encontrado",
            )

        cambios = datos.model_dump(exclude_unset=True)

        if not cambios:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Debe proporcionar al menos un campo para actualizar",
            )

        if "placa" in cambios and cambios["placa"] != vehiculo.placa:
            placa_existente = (
                await self.vehiculo_repository.find_vehiculo_by_placa(
                    cambios["placa"]
                )
            )

            if placa_existente:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Ya existe otro vehículo registrado con esa placa",
                )

        for campo, valor in cambios.items():
            setattr(vehiculo, campo, valor)

        try:
            vehiculo = await self.vehiculo_repository.update_vehiculo(
                vehiculo
            )
        except IntegrityError:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="No se pudo actualizar el vehículo porque la placa ya está registrada",
            )
        except SQLAlchemyError:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error interno al actualizar el vehículo",
            )

        return self._to_vehiculo_response(vehiculo)

    async def cambiar_estado(
        self,
        vehiculo_id: str,
        datos: VehiculoStatusUpdate,
    ) -> VehiculoResponse:
        vehiculo = (
            await self.vehiculo_repository.find_vehiculo_by_id(
                vehiculo_id
            )
        )

        if not vehiculo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vehículo no encontrado",
            )

        vehiculo.is_active = datos.is_active

        try:
            vehiculo = await self.vehiculo_repository.update_vehiculo(
                vehiculo
            )
        except SQLAlchemyError:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error interno al cambiar el estado del vehículo",
            )

        return self._to_vehiculo_response(vehiculo)

    @staticmethod
    def _to_vehiculo_response(
        vehiculo: Vehiculo,
    ) -> VehiculoResponse:
        return VehiculoResponse.model_validate(vehiculo)
