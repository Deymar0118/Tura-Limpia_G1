
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.vehiculo import Vehiculo


class VehiculoRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_vehiculo(self, vehiculo: Vehiculo) -> Vehiculo:
        self.db.add(vehiculo)
        await self.db.commit()
        await self.db.refresh(vehiculo)
        return vehiculo

    async def get_all_vehiculos(self) -> list[Vehiculo]:
        stmt = (
            select(Vehiculo)
            .order_by(Vehiculo.placa.asc())
        )

        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def get_vehiculos_paginated(
        self,
        offset: int = 0,
        limit: int = 50,
    ) -> tuple[list[Vehiculo], int]:
        total_result = await self.db.execute(
            select(func.count()).select_from(Vehiculo)
        )
        total = total_result.scalar_one()

        stmt = (
            select(Vehiculo)
            .order_by(Vehiculo.placa.asc())
            .offset(offset)
            .limit(limit)
        )

        result = await self.db.execute(stmt)

        return result.scalars().all(), total

    async def find_vehiculo_by_id(
        self,
        vehiculo_id: str,
    ) -> Vehiculo | None:
        stmt = select(Vehiculo).where(
            Vehiculo.id_vehiculo == vehiculo_id
        )

        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def find_vehiculo_by_placa(
        self,
        placa: str,
    ) -> Vehiculo | None:
        stmt = select(Vehiculo).where(
            Vehiculo.placa == placa
        )

        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def update_vehiculo(
        self,
        vehiculo: Vehiculo,
    ) -> Vehiculo:
        await self.db.commit()
        await self.db.refresh(vehiculo)
        return vehiculo

    async def get_vehiculos_count_by_estado(self) -> dict[str, int]:
        stmt = select(
            func.count(Vehiculo.id_vehiculo).label("total"),
            func.count(Vehiculo.id_vehiculo)
            .filter(Vehiculo.is_active.is_(True))
            .label("activos"),
            func.count(Vehiculo.id_vehiculo)
            .filter(Vehiculo.is_active.is_(False))
            .label("inactivos"),
        )

        result = await self.db.execute(stmt)
        row = result.one()

        return {
            "total": row.total,
            "activos": row.activos,
            "inactivos": row.inactivos,
        }
