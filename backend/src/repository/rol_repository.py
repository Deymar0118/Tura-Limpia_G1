
from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.perfil import Perfil
from src.models.rol import Rol


class RolRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_rol(self, role: Rol) -> Rol:
        self.db.add(role)
        await self.db.commit()
        await self.db.refresh(role)
        return role

    async def find_rol_by_nombre(
        self,
        nombre: str,
    ) -> Optional[Rol]:

        stmt = select(Rol).where(
            Rol.nombre_rol == nombre
        )

        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_all_roles(self) -> list[Rol]:
        stmt = select(Rol).order_by(
            Rol.nombre_rol.asc()
        )

        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def get_active_roles_by_user(
        self,
        user_id: UUID | str,
    ) -> list[Rol]:

        if isinstance(user_id, str):
            user_id = UUID(user_id)

        stmt = (
            select(Rol)
            .join(Rol.perfiles)
            .where(
                Perfil.id_usuario == user_id,
                Perfil.estado == "activo",
                Rol.estado == "activo",
            )
            .order_by(Rol.nombre_rol.asc())
        )

        result = await self.db.execute(stmt)
        return result.scalars().all()
