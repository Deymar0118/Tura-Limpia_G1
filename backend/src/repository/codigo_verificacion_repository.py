
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.codigo_verificacion import CodigoVerificacion


class CodigoVerificacionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def invalidar_codigos_anteriores(
        self,
        usuario_id: str,
    ) -> None:
        stmt = (
            update(CodigoVerificacion)
            .where(
                CodigoVerificacion.usuario_id == usuario_id,
                CodigoVerificacion.used_at.is_(None),
            )
            .values(used_at=func.now())
        )

        await self.db.execute(stmt)
        await self.db.commit()

    async def invalidar_codigo_verificacion(
        self,
        codigo_verificacion_id: str,
    ) -> None:
        stmt = (
            update(CodigoVerificacion)
            .where(
                CodigoVerificacion.id == codigo_verificacion_id,
                CodigoVerificacion.used_at.is_(None),
            )
            .values(used_at=func.now())
        )

        await self.db.execute(stmt)
        await self.db.commit()

    async def create_codigo_verificacion(
        self,
        codigo_verificacion: CodigoVerificacion,
    ) -> CodigoVerificacion:
        self.db.add(codigo_verificacion)
        await self.db.commit()
        await self.db.refresh(codigo_verificacion)
        return codigo_verificacion

    async def find_codigo_verificacion_by_id(
        self,
        codigo_verificacion_id: str,
    ) -> CodigoVerificacion | None:
        stmt = select(CodigoVerificacion).where(
            CodigoVerificacion.id == codigo_verificacion_id
        )

        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
