from datetime import datetime
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from src.models.codigo_verificacion import CodigoVerificacion

class CodigoVerificacionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_codigo_verificacion(self, 
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